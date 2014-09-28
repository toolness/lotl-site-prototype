var fs = require('fs');
var cheerio = require('cheerio');
var nunjucks = require('nunjucks');

var postDetail = require('./browser/post-detail');

exports.detailRenderer = function(debug) {
  var html;

  return function render(blogpost) {
    if (debug || !html) {
      html = fs.readFileSync(__dirname + '/../static/index.html', 'utf-8');
    }

    var $ = cheerio.load(html);
    $('title').before($('<script></script>').text(
      'var POST = ' + JSON.stringify(blogpost) + ';'
    ));
    postDetail.render($('#content-area'), blogpost, nunjucks);

    return $.html();
  };
};
