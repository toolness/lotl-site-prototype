var Bacon = require('baconjs').Bacon;

var postList = require('./post-list');

exports.createResultBuilder = function createHomepageResultBuilder() {
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
            post.thumbnail = {
              url: headshot.attr('src'),
              heightPercentage: 100
            };
            headshot.remove();
          }

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
