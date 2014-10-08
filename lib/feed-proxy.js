var wpRequest = require('./wp-request');

module.exports = function feedProxy(url) {
  return function(req, res, next) {
    wpRequest({
      url: 'http://wordpress.lifeofthelaw.org' + url
    }, function(err, body) {
      if (err) return next(err);
      res.status(200).type('text/xml')
        .send(body.replace(/\/\/wordpress\.lifeofthelaw\.org/g,
                           '//www.lifeofthelaw.org'));
    });
  };
};
