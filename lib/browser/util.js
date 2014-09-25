var Bacon = require('baconjs').Bacon;

exports.normalizePost = function(post) {
  if (post.authorName == 'lifeofthelaw') post.authorName = '';
  if (post.enclosure)
    post.enclosurePodcastInfo = JSON.stringify({
      id: post.id,
      title: post.title,
      pubdate: post.pubdate
    });
  post.pubdate = exports.ensureDate(post.pubdate);
  return post;
};

exports.ensureDate = function(date) {
  if (date instanceof Date) return date;
  return new Date(date);
};
