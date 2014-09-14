var postList = require('./post-list');

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

exports.createResultBuilder = function createHomepageResultBuilder() {
  var batchesSoFar = 0;

  return {
    resultsForPage: postList.createResultsForPage({}),
    resultsToPosts: function(fetchedResults) {
      return postList.resultsToPosts(fetchedResults.map(function(info) {
        if (++batchesSoFar == 1)
          return $.extend({}, info, {
            posts: exports.reorderPostsForHomepage(info.posts)
          });
        return info;
      }));
    },
    renderPost: postList.renderFirstPostsWide(2)
  };
};
