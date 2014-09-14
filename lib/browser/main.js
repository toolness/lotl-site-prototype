var Bacon = require('baconjs').Bacon;

var nav = require('./nav');

function selectNavbarItem(q) {
  var items = $('.nav ul li a');

  items.removeClass('selected');
  $(items).filter('[data-query]').each(function() {
    if ($(this).attr('data-query') == q) {
      $(this).addClass('selected');
    }
  });
}

$(function() {
  var scrollify = require('./post-list').createScroller(
    $('#content-area .results-holder'),
    TAGS
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
    selectNavbarItem(q);
    scrollify(q);
  });
  nav.setup({post: window.POST}, queries, postDetails);

  searchQueries.onValue(function(q) {
    postDetails.push(null);
    nav.setCurrentURL('/', q);
  });
  queries.plug(searchQueries);
});
