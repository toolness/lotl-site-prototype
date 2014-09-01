var express = require('express');
var request = require('request');

var PORT = process.env.PORT || 3000;
var BASE_API_URL = 'http://lifeofthelaw.org/api';

var app = express();

app.get('/posts.json', function(req, res, next) {
  var page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;

  request({
    url: BASE_API_URL + '/get_recent_posts/',
    qs: {page: page}
  }, function(err, apiRes, body) {
    if (err) return next(err);

    body = JSON.parse(body);
    var posts = body.posts.map(function(rawPost) {
      return {
        tags: rawPost.tags.map(function(tag) { return tag.title; }),
        title: rawPost.title,
        link: rawPost.url,
        pubdate: new Date(rawPost.date).toISOString(),
        author: rawPost.custom_fields.author
                ? rawPost.custom_fields.author[0]
                : rawPost.author.name,
        excerpt: rawPost.excerpt,
        enclosure: rawPost.custom_fields.enclosure
                   ? rawPost.custom_fields.enclosure[0].split('\n')[0]
                   : null,
        thumbnail: rawPost.thumbnail_images &&
                   rawPost.thumbnail_images['home-thumbnail']
      };
    });
    return res.send({
      page: page,
      pages: body.pages,
      posts: posts
    });
  });
});

app.use(express.static(__dirname + '/static'));

app.listen(PORT, function() {
  console.log('listening on port', PORT);
});