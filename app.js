var _ = require('underscore');
var express = require('express');
var request = require('request');

var PORT = process.env.PORT || 3000;
var BASE_API_URL = 'http://lifeofthelaw.org/api';

var app = express();

function enclosureURL(enclosure) {
  return enclosure[0].split('\n')[0].trim();
}

function basicPostInfo(rawPost) {
  return {
    id: rawPost.id,
    title: rawPost.title,
    link: rawPost.url,
    pubdate: new Date(rawPost.date).toISOString(),
    enclosure: rawPost.custom_fields.enclosure
               ? enclosureURL(rawPost.custom_fields.enclosure)
               : null,
  };
}

app.get('/api/tags.js', function(req, res, next) {
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

app.get('/api/podcasts.js', function(req, res, next) {
  var url = BASE_API_URL + '/get_posts/?category_name=podcast'
  request(url, function(err, apiRes, body) {
    if (err) return next(err);
    var podcasts = JSON.parse(body).posts.map(basicPostInfo);
    return res.type('application/javascript')
      .send('var PODCASTS = ' + JSON.stringify(podcasts) + ';');
  });
});

app.get('/api/audio/:id', function(req, res, next) {
  var id = parseInt(req.param('id'));

  if (isNaN(id) || id < 0) return res.send(404);
  request(BASE_API_URL + '/get_post/?id=' + id, function(err, apiRes, body) {
    if (err) return next(err);

    body = JSON.parse(body);
    if (!(body.post && body.post.custom_fields.enclosure))
      return res.send(404);

    var url = enclosureURL(body.post.custom_fields.enclosure);

    return request(url).pipe(res.type('audio/mp3'));
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
      return _.extend(basicPostInfo(rawPost), {
        author: rawPost.custom_fields.author
                ? rawPost.custom_fields.author[0]
                : rawPost.author.name,
        excerpt: rawPost.excerpt,
        thumbnail: rawPost.thumbnail_images &&
                   rawPost.thumbnail_images['home-thumbnail']
      });
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