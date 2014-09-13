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

exports.normalizePostAndThumbnail = function(post) {
  if (post.thumbnail && !post.thumbnail.width) post.thumbnail = null;
  if (post.thumbnail) {
    post.thumbnail.heightPercentage = post.thumbnail.height /
                                      post.thumbnail.width * 100;
  }
  return exports.normalizePost(post);
};

exports.normalizePost = function normalizePost(post) {
  if (post.authorName == 'lifeofthelaw') post.authorName = '';
  if (post.enclosure)
    post.enclosurePodcastInfo = JSON.stringify({
      id: post.id,
      title: post.title,
      pubdate: post.pubdate
    });
  if (!(post.pubdate instanceof Date))
    post.pubdate = new Date(post.pubdate);
  return post;
};
