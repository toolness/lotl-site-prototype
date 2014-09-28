var should = require('should');

var deepCopy = require('../lib/browser/util').deepCopy;
var build = require('../lib/build');
var post = require('../lib/post');

var POST = {
  authorName: 'Nancy Mullane',
  pubdate: new Date().toISOString(),
  title: 'Cats <em>and</em> Law',
  content: 'Cats are <strong>important</strong>.',
  thumbnail_images: {
    full: {
      url: 'http://example.org/thumbnail.jpg'
    }
  }
};

describe('post.detailRenderer', function() {
  var render = post.detailRenderer();

  it('should work', function() {
    build.configure();
    render(deepCopy(POST)).should.match(/cats/i);
  });
});
