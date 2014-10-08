var REDIRECTS = {
  '/podcast/': '/?s=podcast',
  '/about/': '/?s=about',
  '/blog/': '/?s=magazine',
  '/livelaw/tags/': '/?s=live%20law'
};

exports.normalize = function(url) {
  return REDIRECTS[url] || url;
};

exports.forEachRedirect = function(cb) {
  Object.keys(REDIRECTS).forEach(function(url) {
    cb(url, REDIRECTS[url]);
  });
};
