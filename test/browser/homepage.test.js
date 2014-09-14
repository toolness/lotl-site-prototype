var should = require('should');

var homepage = require('../../lib/browser/homepage');

describe('reorderPostsForHomepage', function() {
  var reorder = homepage.reorderPostsForHomepage;

  it('should be non-destructive', function() {
    var posts = ['a', 'b', 'c'];
    reorder(posts).should.not.equal(posts);
  });

  it('should put blog post in first index', function() {
    reorder([{title: 'podcast', enclosure: 'mp3'}, {title: 'blog'}])
      .should.eql([{title: 'blog'}, {title: 'podcast', enclosure: 'mp3'}]);
  });

  it('should keep blog post in first index', function() {
    var posts = [{title: 'blog'}, {title: 'podcast', enclosure: 'mp3'}];
    reorder(posts).should.eql(posts);
  });
});
