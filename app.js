if ('NEWRELIC' in process.env) require('newrelic');
var fs = require('fs');
var urlParse = require('url').parse;
var _ = require('underscore');
var express = require('express');
var request = require('request');

var build = require('./lib/build');
var post = require('./lib/post');
var notFound = require('./lib/browser/not-found');
var wpRequest = require('./lib/wp-request');
var getYoutubeSearchURL = require('./lib/browser/youtube').getSearchURL;

var PORT = process.env.PORT || 3000;
var DEBUG = 'DEBUG' in process.env;
var BASE_API_URL = 'http://wordpress.lifeofthelaw.org/api';

var app = express();
var renderPostDetail = post.detailRenderer(DEBUG);

function getEnclosureURL(rawPost) {
  if (rawPost.custom_fields.enclosure)
    return rawPost.custom_fields.enclosure[0].split('\n')[0].trim();
  if (rawPost.custom_fields.apm_download)
    return rawPost.custom_fields.apm_download[0];
  return null;
}

function commonPostInfo(rawPost) {
  var info = {
    authorName: '',
    pubdate: new Date(rawPost.date).toISOString(),
    enclosure: getEnclosureURL(rawPost)
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
    if (!body.post) return next(404);

    req.blogpost = _.extend(body.post, commonPostInfo(body.post));
    next();
  });
}

build.configure(DEBUG);

app.get('/views.js', build.nunjucks(DEBUG));
app.get('/main.js', build.browserify(DEBUG));
app.get('/styles.css', build.less(DEBUG));

app.get('/wp-content/*', function(req, res, next) {
  return res.redirect(301, 'http://wordpress.lifeofthelaw.org' + req.url);
});

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

app.param('pageslug', function(req, res, next, slug) {
  var url = BASE_API_URL + '/get_page/?slug=' + slug;

  if (!/^[a-z0-9\-]+$/.test(slug)) return next('route');
  wpRequest(url, function(err, body) {
    if (err) return next(err);

    body = JSON.parse(body);
    if (!body.page) return next(404);

    req.blogpage = body.page;
    next();
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

app.get('/api/page/:pageslug', function(req, res, next) {
  return res.send(req.blogpage);
});

app.get('/api/post/:slug', function(req, res, next) {
  return res.send(req.blogpost);
});

app.get('/api/audio/:id', function(req, res, next) {
  var enclosureURL = getEnclosureURL(req.blogpost);

  if (!enclosureURL)
    return next(404);

  // Dropbox-hosted files don't have CORS headers, so pipe the audio.
  if (/dropbox/.test(urlParse(enclosureURL).hostname))
    return req.pipe(request(enclosureURL)).pipe(res);

  // Assume the audio has CORS headers and just redirect to it.
  return res.redirect(enclosureURL);
});

app.get('/api/youtube-proxy/search', function(req, res, next) {
  request({
    url: getYoutubeSearchURL(req.query),
    headers: {
      'Referer': 'http://localhost:3000/'
    }
  }).pipe(res);
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

app.get('/:slug/', function(req, res) {
  return res.type('text/html').send(renderPostDetail(req.blogpost));
});

app.use(express.static(__dirname + '/static'));
app.use('/vendor/nunjucks',
        express.static(__dirname + '/node_modules/nunjucks/browser'));

if (DEBUG)
  app.use('/less', express.static(__dirname + '/less'));

app.use(function(req, res, next) { return next(404); });

app.use(function(err, req, res, next) {
  if (err === 404)
    return res.status(404).type('text/html')
      .send(renderPostDetail(notFound.postDetail(req.url)));
  if (typeof(err) == 'number')
    return res.type('text/plain').send(err);
  if (typeof(err.status) == 'number')
    return res.type('text/plain').send(err.status, err.message);
  var stack = err.stack || err.toString();
  process.stderr.write(stack);
  res.type('text')
    .send(500, DEBUG ? stack : 'Sorry, something exploded!');
});

app.listen(PORT, function() {
  console.log('listening on port', PORT);
});
