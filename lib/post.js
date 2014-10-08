var fs = require('fs');
var cheerio = require('cheerio');
var nunjucks = require('nunjucks');

var postDetail = require('./browser/post-detail');
var nav = require('./browser/nav');

exports.detailRenderer = function(debug) {
  var html;

  return function render(blogpost) {
    if (debug || !html) {
      html = fs.readFileSync(__dirname + '/../static/index.html', 'utf-8');
    }

    var $ = cheerio.load(html);
    var page = require('./browser/page')($);
    page.$body.append($('<script></script>').text(
      'var POST = ' + JSON.stringify(blogpost) + ';'
    ));
    nav.setPageTitleFromPost(blogpost, $);
    postDetail.render(page.$contentArea, blogpost, nunjucks);

    return $.html();
  };
};
