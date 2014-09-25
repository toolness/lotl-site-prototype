var Bacon = require('baconjs').Bacon;

var youtube = require('./youtube');
var postList = require('./post-list');
var browserUtil = require('./util');

function blankResults() {
  return Bacon.once({
    morePagesLeft: false,
    page: 1,
    pages: 1,
    posts: []
  });
}

function combinePosts(first, second) {
  return first.concat(second).sort(function(a, b) {
    return browserUtil.ensureDate(b.pubdate) -
           browserUtil.ensureDate(a.pubdate);
  });
}

// This combines the results from a blog post search and a youtube
// search, but only retrieves and sorts on a page-by-page basis, so
// results will have wonky ordering. Still, better than nothing.
exports.createResultBuilder = function(q, qs) {
  var ytBuilder = youtube.createResultBuilder(q);
  var blogResultsForPage = postList.createResultsForPage(qs);
  var moreYtPages = true;
  var moreBlogPages = true;

  return {
    resultsForPage: function(page) {
      var ytResults = moreYtPages ? ytBuilder.resultsForPage(page)
                                  : blankResults();
      var blogResults = moreBlogPages ? blogResultsForPage(page)
                                      : blankResults();
      return ytResults.zip(blogResults, function(yt, blog) {
        moreYtPages = yt.morePagesLeft;
        moreBlogPages = blog.page < blog.pages;
        return {
          morePagesLeft: moreYtPages || moreBlogPages,
          posts: combinePosts(yt.posts, blog.posts)
        };
      });
    }
  };
};
