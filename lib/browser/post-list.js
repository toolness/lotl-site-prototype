var Bacon = require('baconjs').Bacon;

var browserUtil = require('./util');
var homepage = require('./homepage');

function resultsToPosts(fetchedResults) {
  var eachResult = new Bacon.Bus();

  fetchedResults.onValue(function(info) {
    info.posts.forEach(function(post) { eachResult.push(post); });
  });

  return eachResult;
}

function renderPost(post) {
  return $(nunjucks.render('post.html', post)).first();
}

function normalizePostAndThumbnail(post) {
  if (post.thumbnail && !post.thumbnail.width) post.thumbnail = null;
  if (post.thumbnail) {
    post.thumbnail.heightPercentage = post.thumbnail.height /
                                      post.thumbnail.width * 100;
  }
  return browserUtil.normalizePost(post);
}

function createResultsForPage(qs) {
  return function resultsForPage(page) {
    var url = '/api/posts?' + $.param($.extend({}, qs, {page: page}));
    return Bacon.fromPromise($.getJSON(url));
  };
}

function createGenericResultBuilder(searchCriteria) {
  return {
    resultsForPage: createResultsForPage(searchCriteria)
  };
}

function createResultBuilder(q, tags) {
  if (q == 'podcast') {
    return createGenericResultBuilder({category_name: q});
  } else if (q in tags) {
    return createGenericResultBuilder({tag_id: tags[q]});
  }
  return homepage.createResultBuilder();
}

exports.createResultsForPage = createResultsForPage;
exports.resultsToPosts = resultsToPosts;
exports.renderPost = renderPost;
exports.createScroller = function createScroller(holder, tags) {
  var resultsTemplate = holder.children().remove();

  function scrollify(rb) {
    if ($('.results', holder).length) {
      $('.results', holder).masonry('destroy');
      holder.empty();
    }

    resultsTemplate.clone().appendTo(holder);
    $('.results', holder).append('<div class="grid-sizer"></div>' +
                                 '<div class="gutter-sizer"></div>');

    var results = $('.results', holder);
    var more = $('.more', holder);
    var spinner = $('.spinner', holder);
    var fetchMore = more.asEventStream('click')
      .scan(rb.startPage || 1, function inc(page) { return page + 1; });
    var fetchedResults = fetchMore.flatMap(rb.resultsForPage);
    var eachResult = (rb.resultsToPosts || resultsToPosts)(fetchedResults);
    var morePagesLeft = fetchedResults.map(function(info) {
      return info.page < info.pages;
    }).toProperty(false);
    var waiting = fetchMore.awaiting(fetchedResults);

    results.masonry({
      columnWidth: '.grid-sizer',
      gutter: '.gutter-sizer',
      itemSelector: '.post'
    });

    eachResult
      .map(normalizePostAndThumbnail)
      .map(rb.renderPost || renderPost)
      .onValue(function($el) {
        results.masonry('appended', $el.appendTo(results)[0]);
        results.masonry();
      });

    waiting.assign(spinner, 'toggle');
    waiting.not().and(morePagesLeft).assign(more, 'toggle');

    // TODO: Handle ajax errors somehow, e.g. via fetchedResults.onError().
  };

  return function(q) {
    return scrollify(createResultBuilder(q, tags));
  };
};
