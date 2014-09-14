var Bacon = require('baconjs').Bacon;

var postList = require('./post-list');

var MAX_WIDTH = 440;

function createImageIndex(attachments) {
  var index = {};

  attachments.forEach(function(attachment, i) {
    var entry = {best: null, available: []};
    Object.keys(attachment.images).forEach(function(name) {
      var image = attachment.images[name];
      index[image.url] = entry;
      if (image.width != image.height || image.width > MAX_WIDTH) return;
      if (!entry.best) entry.best = image;
      if (image.width > entry.best.width) entry.best = image;
      entry.available.push(image);
    });
  });

  return index;
}

function getThumbnail(headshot, imageIndex) {
  var src = headshot.attr('src');
  var entry = imageIndex[src];

  if (entry && entry.best)
    return entry.best;
  return {
    url: src,
    height: headshot.attr('height'),
    width: headshot.attr('width')
  };
}

exports.createResultBuilder = function createHomepageResultBuilder(tags) {
  return {
    resultsForPage: function(page) {
      return Bacon.fromCallback(function(cb) {
        $.getJSON('/api/page/about', function(info) {
          cb({
            page: 1,
            pages: 1,
            pageInfo: info
          });
        });
      });
    },
    resultsToPosts: function(fetchedResults) {
      var eachResult = new Bacon.Bus();
      fetchedResults.onValue(function(info) {
        var imageIndex = createImageIndex(info.pageInfo.attachments);
        var content = $('<div></div>').html(info.pageInfo.content);
        var about = $('<div><h2>About Us</h2></div')
          .append(content.find('p').slice(0, 2));
        var producers = content.find('#producers > p');

        eachResult.push({excerpt: about.html()});
        producers.each(function() {
          var headshot = $('img', this).first();
          var post = {
            name: $.trim($('strong', this).first().text())
          };

          if (!post.name) return;

          if (headshot.length) {
            post.thumbnail = getThumbnail(headshot, imageIndex);
            headshot.remove();
          }

          [post.name, post.name.toLowerCase()].forEach(function(tag) {
            if (tag in tags)
              post.search = '/?s=' + encodeURIComponent(tag);
          });
          post.excerpt = $(this).html();
          eachResult.push(post);
        });
      });

      return eachResult;
    },
    renderPost: function(post) {
      return $(nunjucks.render('person.html', post)).first();
    }
  };
};
