var express = require('express');
var request = require('request');

var PORT = process.env.PORT || 3000;
var BASE_API_URL = 'http://lifeofthelaw.org/api';

var app = express();

app.get('/tags.js', function(req, res, next) {
  request({
    url: BASE_API_URL + '/get_tag_index/'
  }, function(err, apiRes, body) {
    if (err) return next(err);

    var tags = {};
    JSON.parse(body).tags.forEach(function(info) {
      tags[info.title] = info.id;
    });

    return res.type('application/javascript')
      .send('var TAGS = ' + JSON.stringify(tags) + ';');
  });
});

app.get('/api/posts', function(req, res, next) {
  var page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
  var tag_id = !isNaN(parseInt(req.query.tag_id)) && req.query.tag_id;
  var category_name = req.query.category_name;
  var qs = {page: page, count: 10};
  var url = BASE_API_URL;

  if (tag_id || category_name) {
    url += '/get_posts/';
    qs.tag_id = tag_id;
    qs.category_name = category_name;
  } else {
    url += '/get_recent_posts/';
  }

  request({url: url, qs: qs}, function(err, apiRes, body) {
    if (err) return next(err);

    body = JSON.parse(body);
    var posts = body.posts.map(function(rawPost) {
      return {
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