var Bacon = require('baconjs').Bacon;

var browserUtil = require('./util');

function postRenderer(isHomepage) {
  var postsSoFar = 0;

  return function renderPost(post) {
    post = browserUtil.normalizePostAndThumbnail(post);
    post.isWide = isHomepage ? (++postsSoFar <= 2) : false;
    return $(nunjucks.render('post.html', post)).first();
  };
}

exports.createScroller = function createScroller(holder) {
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
};
