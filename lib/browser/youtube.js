var querystring = require('querystring');
var _ = require('underscore');
var Bacon = require('baconjs').Bacon;

var SUPPORTS_XHR_CORS = process.browser &&
                        'withCredentials' in new XMLHttpRequest();
var BASE_URL = process.browser && !SUPPORTS_XHR_CORS
               ? '/api/youtube-proxy/'
               : 'https://www.googleapis.com/youtube/v3/';
var API_KEY = 'AIzaSyA9OPY5EzI9YjRWrvXrQwjVoEiAHkNy7ao';
var CHANNEL_ID = 'UCoiT74LRtNm13hK9d0eUvgQ';

exports.getSearchURL = function(options) {
  var qs = querystring.stringify({
    key: API_KEY,
    channelId: CHANNEL_ID,
    part: 'snippet',
    order: 'date',
    type: 'video',
    maxResults: 10,
    pageToken: options.nextPageToken,
    q: options.q
  });
  return BASE_URL + 'search' + '?' + qs;
};

exports.createResultBuilder = function createYouTubeResultBuilder(q) {
  var nextPageToken = '';

  return {
    resultsForPage: function(page) {
      // We're basically ignoring 'page' and assuming it's increasing
      // by 1 every time we're called, which violates our abstraction
      // but is actually consistent with the way we're using the interface.
      return Bacon.fromCallback(function(cb) {
        $.getJSON(exports.getSearchURL({
          pageToken: nextPageToken,
          q: q
        }), function(results) {
          nextPageToken = results.nextPageToken;
          cb({
            morePagesLeft: !!results.nextPageToken,
            posts: results.items.map(function(result) {
              return {
                title: _.escape(result.snippet.title),
                excerpt: _.escape(result.snippet.description),
                pubdate: new Date(result.snippet.publishedAt),
                thumbnail: {
                  url: result.snippet.thumbnails.medium.url,
                  width: 320,
                  height: 180
                },
                isVideo: true,
                link: 'http://youtube.com/watch?v=' + result.id.videoId
              };
            })
          });
        });
      });
    }
  };
};
