// Attempt to always make the first post be a blog post, and
// the second a podcast.
exports.reorderPostsForHomepage = function reorderPosts(posts) {
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
