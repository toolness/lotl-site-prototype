var fs = require('fs');
var cheerio = require('cheerio');

var page = require('../../lib/browser/page');

describe('page', function() {
  it('should instantiate without throwing any errors', function() {
    var html = fs.readFileSync(__dirname + '/../../static/index.html',
                               'utf-8');
    var $ = cheerio.load(html);
    page($);
  });
});
