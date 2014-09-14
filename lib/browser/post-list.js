var Bacon = require('baconjs').Bacon;

var browserUtil = require('./util');

function resultsToPosts(fetchedResults) {
  var eachResult = new Bacon.Bus();

  fetchedResults.onValue(function(info) {
    info.posts.forEach(function(post) { eachResult.push(post); });
  });

  return eachResult;
};

function normalizePostAndThumbnail(post) {
  if (post.thumbnail && !post.thumbnail.width) post.thumbnail = null;
  if (post.thumbnail) {
    post.thumbnail.heightPercentage = post.thumbnail.height /
                                      post.thumbnail.width * 100;
  }
  return browserUtil.normalizePost(post);
}

// Attempt to always make the first post be a blog post, and
// the second a podcast.
exports.reorderPostsForHomepage = function(posts) {
  var post, i;

  posts = posts.slice();

  for (i = 0; i < posts.length; i++) {
    post = posts[i];
    if (!post.enclosure) {
      posts.splice(i, 1);
      posts.splice(0, 0, post);
      break;
    }
  }

  for (i = 0; i < posts.length; i++) {
    post = posts[i];
    if (post.enclosure) {
      posts.splice(i, 1);
      posts.splice(1, 0, post);
      break;
    }
  }

  return posts;
};

function createResultsForPage(qs) {
  return function resultsForPage(page) {
    var url = '/api/posts?' + $.param($.extend({}, qs, {page: page}));
    return Bacon.fromPromise($.getJSON(url));
  };
}

function GenericResultBuilder(searchCriteria) {
  this.resultsForPage = createResultsForPage(searchCriteria);
  this.resultsToPosts = resultsToPosts;
  this.renderPost = function(post) {
    return $(nunjucks.render('post.html', post)).first();
  };
}

function HomepageResultBuilder() {
  var batchesSoFar = 0;
  var postsSoFar = 0;

  this.resultsForPage = createResultsForPage({});
  this.resultsToPosts = function(fetchedResults) {
    return resultsToPosts(fetchedResults.map(function(info) {
      if (++batchesSoFar == 1)
        return $.extend({}, info, {
          posts: exports.reorderPostsForHomepage(info.posts)
        });
      return info;
    }));
  };
  this.renderPost = function(post) {
    post = $.extend({}, post, {isWide: (++postsSoFar <= 2)});
    return $(nunjucks.render('post.html', post)).first();    
  };
}

exports.createScroller = function createScroller(holder, tags) {
  var resultsTemplate = holder.children().remove();

  function createResultBuilder(q) {
    if (q == 'podcast')
      return new GenericResultBuilder({category_name: q});
    if (q in tags)
      return new GenericResultBuilder({tag_id: tags[q]});
    return new HomepageResultBuilder();
  }

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
    var eachResult = rb.resultsToPosts(fetchedResults);
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
      post = normalizePostAndThumbnail(post);
      results.masonry('appended', rb.renderPost(post).appendTo(results)[0]);
      results.masonry();
    });

    waiting.assign(spinner, 'toggle');
    waiting.not().and(morePagesLeft).assign(more, 'toggle');

    // TODO: Handle ajax errors somehow, e.g. via fetchedResults.onError().
  };

  return function(q) {
    return scrollify(createResultBuilder(q));
  };
};
