var resultsTemplate = $('#results-holder').children().remove();
var loadingPostDetailTemplate = $('#post-detail').children().remove();

// https://gist.github.com/jharding/9458744#file-the-basics-js
var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substrRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        // the typeahead jQuery plugin expects suggestions to a
        // JavaScript object, refer to typeahead docs for more info
        matches.push({ value: str });
      }
    });

    cb(matches);
  };
};

function setupSearch(queries) {
  var matcher = substringMatcher(Object.keys(TAGS));

  $('#search').typeahead({
    hint: true,
    highlight: true,
    minLength: 1
  }, {
    name: 'tags',
    displayKey: 'value',
    source: matcher
  }).on('keyup', function(event) {
    var val = $(this).val();
    if (event.which == 27)
      return $(this).typeahead('val', '').trigger('keyup');
    if (val == 'podcast') {
      queries.push('podcast');
    } else if (val in TAGS) {
      queries.push(TAGS[val]);
    } else {
      if (event.which == 13 && val) {
        matcher(val, function(matches) {
          if (matches.length) {
            val = matches[0].value;
            $(this).typeahead('val', val).trigger('keyup');
          }
        }.bind(this));
      } else {
        queries.push(null);
      }
    }
  });
}

function normalizePostThumbnail(post) {
  if (post.thumbnail && !post.thumbnail.width) post.thumbnail = null;
  if (post.thumbnail) {
    post.thumbnail.height = post.thumbnail.height * COLUMN_WIDTH /
                            post.thumbnail.width;
    post.thumbnail.width = COLUMN_WIDTH;
  }
  return post;
}

function normalizePost(post) {
  if (post.authorName == 'lifeofthelaw') post.authorName = '';
  if (post.enclosure)
    post.enclosurePodcastInfo = JSON.stringify({
      id: post.id,
      title: post.title,
      pubdate: post.pubdate
    });
  post.pubdate = new Date(post.pubdate);
  return post;
}

function postRenderer() {
  var postsSoFar = 0;

  return function renderPost(post) {
    post = normalizePostThumbnail(normalizePost(post));
    post.isWide = (++postsSoFar == 1);
    return $(nunjucks.render('post.html', post)).first();
  };
}

function setupPlayer() {
  var mp3player = audiojs.create($('#mp3player')[0]);
  var player = $('.player');
  var currentID = PODCASTS[0].id;

  player.find('.title').text(PODCASTS[0].title);
  mp3player.load('/api/audio/' + PODCASTS[0].id);

  $('body').on('click', '[role="play-podcast"]', function(e) {
    e.preventDefault();
    var info = JSON.parse($(this).attr('data-podcast-info'));
    var player = $('.player');

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
        podcasts: PODCASTS.map(normalizePost)
      })).first();
      playlist.appendTo(this);
    }
  });

  player.on('click', '[role="show-all-episodes"]', function() {
    $('#search').typeahead('val', 'podcast').trigger('keyup');
  });
}

function scrollifyPosts(qs) {
  qs = qs || {};

  var holder = $('#results-holder');

  if ($('#results').length) {
    $('#results').masonry('destroy');
    holder.empty();
  }

  resultsTemplate.clone().appendTo(holder);

  var startPage = qs.page || 1;
  var results = $('#results');
  var more = $('.more', holder);
  var spinner = $('.spinner', holder);
  var renderPost = postRenderer();
  var fetchMore = more.asEventStream('click')
    .scan(startPage, function increment(page) { return page + 1; });
  var fetchedResults = fetchMore.flatMap(function(page) {
    var url = '/api/posts?' + $.param($.extend({}, qs, {page: page}));
    return Bacon.fromPromise($.getJSON(url));
  });
  var morePagesLeft = fetchedResults.map(function(info) {
    return info.page < info.pages;
  }).toProperty(false);
  var waiting = fetchMore.awaiting(fetchedResults);

  results.masonry({
    columnWidth: COLUMN_WIDTH,
    gutter: GUTTER_WIDTH,
    itemSelector: '.post'
  });

  fetchedResults.onValue(function(info) {
    info.posts.forEach(function(post) {
      results.masonry('appended', renderPost(post).appendTo(results)[0]);
      results.masonry();
    });
  });

  waiting.assign(spinner, 'toggle');
  waiting.not().and(morePagesLeft).assign(more, 'toggle');

  // TODO: Handle ajax errors somehow, e.g. via fetchedResults.onError().
}

function showPostDetail(slug) {
  var contentArea = $('#content-area');
  var holder = $('#post-detail-holder');
  var detail = $('#post-detail');
  var rendered = $('<div></div>').append(loadingPostDetailTemplate.clone());
  var onPost = function(info) {
    var url = '/' + info.slug + '/';
    var post = normalizePost(JSON.parse(JSON.stringify(info)));
    holder.css({height: 'auto'});
    rendered.html(nunjucks.render('post-detail.html', post));
    if (window.location.pathname != url) {
      window.history.pushState({
        post: info
      }, '', url);
    }
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

function hidePostDetail() {
  $('#content-area').removeClass('show-post-detail');
  if (window.location.pathname != '/')
    window.history.pushState({}, '', '/');
}

function setupPostDetail() {
  $('body').on('click', '#post-detail-holder', function(event) {
    if (event.target != this) return;
    hidePostDetail();
  });

  $('body').on('click', '[role="show-post-detail"]', function(event) {
    event.preventDefault();
    showPostDetail($(this).attr('data-post-slug'));
  });
}

$(function() {
  var queries = new Bacon.Bus();

  nunjucks.configure({autoescape: true});
  setupPlayer();
  setupSearch(queries);
  setupPostDetail();
  queries.debounce(300).skipDuplicates().onValue(function(q) {
    if (q === null) return scrollifyPosts();
    if (typeof(q) == 'number')
      scrollifyPosts({tag_id: q});
    else
      scrollifyPosts({category_name: q});
  });
  queries.onValue(hidePostDetail);
  queries.push(null);

  $(window).on('popstate', function(event) {
    var state = event.originalEvent.state;

    if (state && state.post) {
      showPostDetail(state.post);
    } else {
      hidePostDetail();
    }
  });

  if (typeof(POST) != 'undefined')
    showPostDetail(POST);

  $('body').on('click', '[role="home"]', function(e) {
    e.preventDefault();
    hidePostDetail();
    queries.push(null);
  });
});
