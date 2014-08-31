var express = require('express');
var request = require('request');

var PORT = process.env.PORT || 3000;
var BASE_API_URL = 'http://lifeofthelaw.org/api';

var app = express();

app.get('/posts.js', function(req, res, next) {
  request(BASE_API_URL + '/get_recent_posts/', function(err, apiRes, body) {
    if (err) return next(err);
    body = JSON.parse(body);
    body = body.posts.map(function(rawPost) {
      var post = {
        tags: rawPost.tags.map(function(tag) { return tag.title; }),
        title: rawPost.title,
        link: rawPost.url,
        pubdate: new Date(rawPost.date).toISOString(),
        author: rawPost.custom_fields.author
                ? rawPost.custom_fields.author[0]
                : rawPost.author.name,
        excerpt: rawPost.excerpt,
        enclosure: null,
        thumbnail: rawPost.thumbnail_images &&
                   rawPost.thumbnail_images['home-thumbnail']
      };
      return post;
    });
    return res
      .type('application/javascript')
      .send('POSTS = ' + JSON.stringify(body) + ';');
  });
});

app.use(express.static(__dirname + '/static'));

app.listen(PORT, function() {
  console.log('listening on port', PORT);
});