var fs = require('fs');
var _ = require('underscore');
var express = require('express');
var request = require('request');
var replaceStream = require('replacestream');

var wpRequest = require('./wp-request');

var PORT = process.env.PORT || 3000;
var BASE_API_URL = 'http://lifeofthelaw.org/api';
var META_CHARSET = '<meta charset="utf-8">';

var app = express();

function enclosureURL(enclosure) {
  return enclosure[0].split('\n')[0].trim();
}

function commonPostInfo(rawPost) {
  var info = {
    authorName: '',
    pubdate: new Date(rawPost.date).toISOString(),
    enclosure: rawPost.custom_fields.enclosure
               ? enclosureURL(rawPost.custom_fields.enclosure)
               : null
  };
  if (rawPost.custom_fields && rawPost.custom_fields.author &&
      rawPost.custom_fields.author.length) {
    info.authorName = rawPost.custom_fields.author[0];
  } else if (rawPost.author && rawPost.author.name) {
    info.authorName = rawPost.author.name;
  }

  return info;
}

function basicPostInfo(rawPost) {
  return _.extend({
    id: rawPost.id,
    title: rawPost.title,
    link: '/' + rawPost.slug + '/',
    slug: rawPost.slug,
  }, commonPostInfo(rawPost));
}

function getBlogpostFromURL(url, req, res, next) {
  wpRequest(url, function(err, body) {
    if (err) return next(err);

    body = JSON.parse(body);
    if (!body.post) return res.send(404);

    req.blogpost = _.extend(body.post, commonPostInfo(body.post));
    next();
  });
}

app.get('/api/tags.js', function(req, res, next) {
  wpRequest({
    url: BASE_API_URL + '/get_tag_index/'
  }, function(err, body) {
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
  wpRequest(url, function(err, body) {
    if (err) return next(err);
    var podcasts = JSON.parse(body).posts.map(basicPostInfo);
    return res.type('application/javascript')
      .send('var PODCASTS = ' + JSON.stringify(podcasts) + ';');
  });
});

app.param('slug', function(req, res, next, slug) {
  var url = BASE_API_URL + '/get_post/?slug=' + slug;

  if (!/^[a-z0-9\-]+$/.test(slug)) return next('route');
  getBlogpostFromURL(url, req, res, next);
});

app.param('id', function(req, res, next, id) {
  var id = parseInt(req.param('id'));
  var url = BASE_API_URL + '/get_post/?id=' + id;

  if (isNaN(id) || id < 0) return next('route');
  getBlogpostFromURL(url, req, res, next);
});

app.get('/api/post/:slug', function(req, res, next) {
  return res.send(req.blogpost);
});

app.get('/api/audio/:id', function(req, res, next) {
  if (!(req.blogpost.custom_fields.enclosure))
    return res.send(404);

  var url = enclosureURL(req.blogpost.custom_fields.enclosure);

  req.pipe(request(url)).pipe(res);
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

  wpRequest({url: url, qs: qs}, function(err, body) {
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

app.get('/:slug/', function(req, res, next) {
  return fs.createReadStream(__dirname + '/static/index.html')
    .pipe(replaceStream(META_CHARSET,
                        META_CHARSET + '\n<script>var POST = ' +
                        JSON.stringify(req.blogpost) + ';</script>', {
                          limit: 1
                        }))
    .pipe(res.type('text/html'));
});

app.use(express.static(__dirname + '/static'));

app.listen(PORT, function() {
  console.log('listening on port', PORT);
});