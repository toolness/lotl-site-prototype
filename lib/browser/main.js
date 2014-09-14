var querystring = require('querystring');
var Bacon = require('baconjs').Bacon;

var nav = require('./nav');

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
  require('./post-detail').setup($('#content-area'), postDetails);
  queries.skipDuplicates().onValue(function(q) {
    $('#search').typeahead('val', q || '');
    if (q == 'podcast') return scrollify({category_name: q});
    if (q in TAGS)
      return scrollify({tag_id: TAGS[q]});
    scrollify();
  });

  searchQueries.onValue(function(q) {
    postDetails.push(null);
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
