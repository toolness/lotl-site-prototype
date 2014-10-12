var urlParse = require('url').parse;
var _ = require('underscore');
var LRU = require('lru-cache');
var request = require('request');
var cache = LRU({
  max: 16 * 1024 * 1024,
  length: function(n) { return n.length; },
});

function getLastModified(url, cb) {
  request({
    method: 'HEAD',
    url: url
  }, function(err, res) {
    if (err) return cb(err);
    cb(null, res.headers['last-modified']);
  });
}

module.exports = function(options, cb) {
  if (typeof(options) == 'string')
    options = {url: options};
  options.qs = options.qs || {};

  var parsed = urlParse(options.url);
  var origin = parsed.protocol + '//' + parsed.host;

  getLastModified(origin + '/feed/', function(err, lastMod) {
    if (err) return cb(err);

    var query = Object.keys(options.qs);
    query.sort();

    var key = lastMod + '|' + options.url + '|' + query.map(function(k) {
      return k + '=' + options.qs[k]
    }).join('|');

    if (cache.has(key) && !options.bypassCache)
      return cb(null, cache.get(key));

    request(options, function(err, res, body) {
      if (err) return cb(err);
      if (res.statusCode < 200 || res.statusCode >= 300)
        return cb(new Error('got HTTP ' + res.statusCode) + ' from ' +
                  parsed.host);

      cache.set(key, body);
      cb(null, body);
    });
  });
};

module.exports.getStats = function() {
  return {
    cache: _.pick(cache, 'length', 'itemCount', 'max')
  };
};
