var Bacon = require('baconjs').Bacon;

exports.normalizePost = function(post) {
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
