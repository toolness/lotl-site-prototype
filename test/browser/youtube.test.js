var urlParse = require('url').parse;
var should = require('should');

var youtube = require('../../lib/browser/youtube.js');

describe('youtube.getSearchURL', function() {
  it('should point to googleapis.com on the server-side', function() {
    urlParse(youtube.getSearchURL({})).host.should.eql('www.googleapis.com');
  });
});