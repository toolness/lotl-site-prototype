var _ = require('underscore');
var Bacon = require('baconjs').Bacon;

var BASE_URL = 'https://www.googleapis.com/youtube/v3/';
var API_KEY = 'AIzaSyA9OPY5EzI9YjRWrvXrQwjVoEiAHkNy7ao';
var CHANNEL_ID = 'UCoiT74LRtNm13hK9d0eUvgQ';

exports.createResultBuilder = function createYouTubeResultBuilder(q) {
  var nextPageToken = '';

  return {
    resultsForPage: function(page) {
      return Bacon.fromCallback(function(cb) {
        $.getJSON(BASE_URL + 'search', {
          key: API_KEY,
          channelId: CHANNEL_ID,
          part: 'snippet',
          order: 'date',
          type: 'video',
          maxResults: 10,
          pageToken: nextPageToken,
          q: q
        }, function(results) {
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
