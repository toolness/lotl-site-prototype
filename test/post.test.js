var should = require('should');
var cheerio = require('cheerio');

var deepCopy = require('../lib/browser/util').deepCopy;
var build = require('../lib/build');
var post = require('../lib/post');

var POST = {
  authorName: 'Nancy Mullane',
  pubdate: new Date().toISOString(),
  title: 'Cats <em>and</em> Law',
  title_plain: 'Cats and Law',
  content: 'Cats are <strong>important</strong>.',
  thumbnail_images: {
    full: {
      url: 'http://example.org/thumbnail.jpg'
    }
  }
};

describe('post.detailRenderer', function() {
  var render = post.detailRenderer();

  it('should set page title', function() {
    build.configure();
    var $ = cheerio.load(render(deepCopy(POST)));
    $('title').text().should.eql('Cats and Law : Life of The Law');
  });
});
