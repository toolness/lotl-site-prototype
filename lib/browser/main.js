var Bacon = require('baconjs').Bacon;

var nav = require('./nav');

$(function() {
  var scrollify = require('./post-list').createScroller(
    $('#content-area .results-holder')
  );
  var queries = new Bacon.Bus();
  var searchQueries = new Bacon.Bus();
  var postDetails = new Bacon.Bus();
  var streams = {queries: queries, postDetails: postDetails};

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
  nav.restoreCurrentState({post: window.POST}, streams);

  $(window).on('popstate', function(event) {
    nav.restoreCurrentState(event.originalEvent.state, streams);
  });

  $('body').on('click', '[href^="/"]', function(e) {
    e.preventDefault();
    nav.triggerURL($(this).attr('href'), streams);
  });
});
