var querystring = require('querystring');
var Bacon = require('baconjs').Bacon;

var nav = require('./nav');
var browserUtil = require('./util');

function postRenderer(isHomepage) {
  var postsSoFar = 0;

  return function renderPost(post) {
    post = browserUtil.normalizePostAndThumbnail(post);
    post.isWide = isHomepage ? (++postsSoFar <= 2) : false;
    return $(nunjucks.render('post.html', post)).first();
  };
}

function setupPlayer(player) {
  var mp3player = audiojs.create($('.mp3player', player)[0]);
  var currentID = PODCASTS[0].id;

  player.find('.title').text(PODCASTS[0].title);
  mp3player.load('/api/audio/' + PODCASTS[0].id);

  $('body').on('click', '[role="play-podcast"]', function(e) {
    e.preventDefault();
    var info = JSON.parse($(this).attr('data-podcast-info'));

    $('.title', player).html(info.title);
    $('.subtitle', player).text(new Date(info.pubdate).toDateString());

    currentID = info.id;
    mp3player.load('/api/audio/' + info.id);
    mp3player.play();
    $.scrollTo('0px', 250);
  });

  player.on('click', '[role="show-playlist"]', function() {
    var playlist = $('.playlist', this);

    if (playlist.is(':visible')) {
      playlist.hide();
    } else {
      playlist.remove();
      playlist = $(nunjucks.render('playlist.html', {
        currentID: currentID,
        podcasts: PODCASTS.map(browserUtil.normalizePost)
      })).first();
      playlist.appendTo(this);
    }
  });
}

function createPostScroller(holder) {
  var resultsTemplate = holder.children().remove();

  return function(qs) {
    var isHomepage = !qs;
    qs = qs || {};

    if ($('.results', holder).length) {
      $('.results', holder).masonry('destroy');
      holder.empty();
    }

    resultsTemplate.clone().appendTo(holder);
    $('.results', holder).append('<div class="grid-sizer"></div>' +
                                 '<div class="gutter-sizer"></div>');

    var startPage = qs.page || 1;
    var results = $('.results', holder);
    var more = $('.more', holder);
    var spinner = $('.spinner', holder);
    var renderPost = postRenderer(isHomepage);
    var fetchMore = more.asEventStream('click')
      .scan(startPage, function increment(page) { return page + 1; });
    var fetchedResults = fetchMore.flatMap(function(page) {
      var url = '/api/posts?' + $.param($.extend({}, qs, {page: page}));
      return Bacon.fromPromise($.getJSON(url));
    });
    var eachResult = browserUtil.resultsToPosts(fetchedResults, isHomepage);
    var morePagesLeft = fetchedResults.map(function(info) {
      return info.page < info.pages;
    }).toProperty(false);
    var waiting = fetchMore.awaiting(fetchedResults);

    results.masonry({
      columnWidth: '.grid-sizer',
      gutter: '.gutter-sizer',
      itemSelector: '.post'
    });

    eachResult.onValue(function(post) {
      results.masonry('appended', renderPost(post).appendTo(results)[0]);
      results.masonry();
    });

    waiting.assign(spinner, 'toggle');
    waiting.not().and(morePagesLeft).assign(more, 'toggle');

    // TODO: Handle ajax errors somehow, e.g. via fetchedResults.onError().
  };
}

function setupPostDetail(contentArea, postDetails) {
  var holder = $('.post-detail-holder', contentArea);
  var detail = $('.post-detail', contentArea);
  var loadingPostDetail = detail.children().remove();

  function showPostDetail(slug) {
    var rendered = $('<div></div>').append(loadingPostDetail.clone());
    var onPost = function(info) {
      var post = browserUtil.normalizePost(JSON.parse(JSON.stringify(info)));
      holder.css({height: 'auto'});
      rendered.html(nunjucks.render('post-detail.html', post));
      nav.setCurrentURL('/' + info.slug + '/', undefined, {post: info});
    };

    detail.empty().append(rendered);
    holder.css({height: contentArea.height() + 'px'});
    contentArea.addClass('show-post-detail');
    if (typeof(slug) == 'string')
      $.getJSON('/api/post/' + slug, onPost);
    else
      onPost(slug);
    $.scrollTo('0px', 250);
  }

  contentArea.on('click', '.post-detail-holder', function(event) {
    if (event.target != this) return;
    postDetails.push(null);
    nav.setCurrentURL('/');
  });

  $('body').on('click', '[role="show-post-detail"]', function(event) {
    event.preventDefault();
    postDetails.push($(this).attr('data-post-slug'));
  });

  postDetails.onValue(function(val) {
    if (!val) {
      contentArea.removeClass('show-post-detail');
    } else {
      showPostDetail(val);
    }
  });
}

$(function() {
  var scrollify = createPostScroller($('#content-area .results-holder'));
  var queries = new Bacon.Bus();
  var searchQueries = new Bacon.Bus();
  var postDetails = new Bacon.Bus();

  nunjucks.configure({autoescape: true});
  setupPlayer($('.player').first());
  require('./search').setup($('#search'), searchQueries, TAGS);
  setupPostDetail($('#content-area'), postDetails);
  queries.skipDuplicates().onValue(function(q) {
    $('#search').typeahead('val', q || '');
    if (q == 'podcast') return scrollify({category_name: q});
    if (q in TAGS)
      return scrollify({tag_id: TAGS[q]});
    scrollify();
  });

  searchQueries.onValue(function(q) {
    postDetails.push(null);
    queries.push(q);
    nav.setCurrentURL('/', q);
  });
  queries.plug(searchQueries);
  queries.push(nav.getCurrentSearch());
  postDetails.push(window.POST || null);

  $(window).on('popstate', function(event) {
    var state = event.originalEvent.state;

    queries.push(nav.getCurrentSearch());
    postDetails.push(state && state.post);
  });

  $('body').on('click', '[href^="/"]', function(e) {
    if ($(this).attr('role')) return;

    var href = $(this).attr('href');
    var search = querystring.parse(href.slice(2)).s || null;
    e.preventDefault();
    searchQueries.push(search);
  });
});
