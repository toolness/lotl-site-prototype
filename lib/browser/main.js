var querystring = require('querystring');
var Bacon = require('baconjs').Bacon;

var nav = require('./nav');
var browserUtil = require('./util');

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
  var scrollify = require('./post-list').createScroller(
    $('#content-area .results-holder')
  );
  var queries = new Bacon.Bus();
  var searchQueries = new Bacon.Bus();
  var postDetails = new Bacon.Bus();

  nunjucks.configure({autoescape: true});
  require('./player').setup($('.player').first(), PODCASTS);
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
