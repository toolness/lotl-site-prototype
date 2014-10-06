var Bacon = require('baconjs').Bacon;

var MAX_WIDTH = 440;

function createImageIndex(attachments) {
  var index = {};

  attachments.forEach(function(attachment, i) {
    var entry = {best: null, available: []};
    Object.keys(attachment.images || []).forEach(function(name) {
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
        var things = content.find('h3, p');
        var currentRole = null;
        var currentRoleCount = 0;

        eachResult.push({excerpt: about.html()});
        things.each(function() {
          if (this.nodeName == 'H3') {
            currentRole = $.trim($(this).text());
            currentRoleCount = 0;
            return;
          }
          var headshot = $('img', this).first();
          var nameAndTitle = $.trim($('strong', this).first().text());
          var post = {
            nameAndTitle: nameAndTitle,
            name: nameAndTitle.split(',')[0],
            role: currentRole
          };

          if (!(post.name && post.role)) return;

          if (currentRoleCount++ == 0 && currentRole != 'Staff') {
            eachResult.push({
              type: 'header',
              text: currentRole
            });
          }

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
      if (post.type == 'header') {
        return $('<h3 class="post"></h3>').text(post.text);
      }
      return $(nunjucks.render('person.html', post)).first();
    }
  };
};
