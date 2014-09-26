var browserUtil = require('./util');

exports.setup = function setupPlayer(player, podcasts) {
  var mp3player = audiojs.create($('.mp3player', player)[0]);
  var current = podcasts[0];

  player.find('.title').text(podcasts[0].title);
  mp3player.load('/api/audio/' + podcasts[0].id);

  $('body').on('click', '[role="play-podcast"]', function(e) {
    e.preventDefault();
    var info = JSON.parse($(this).attr('data-podcast-info'));

    $('.title', player).html(info.title);
    $('.subtitle', player).text(new Date(info.pubdate).toDateString());

    current = info;
    mp3player.load('/api/audio/' + info.id);
    mp3player.play();
    $.scrollTo('0px', 250);
  });

  player.on('click', '[role="show-playlist"]', function() {
    var playlist = $('.playlist', this);

    if (playlist.is(':visible')) {
      playlist.hide();
    } else {
      playlist.remove();
      playlist = $(nunjucks.render('playlist.html', {
        current: current,
        podcasts: podcasts.map(browserUtil.normalizePost)
      })).first();
      playlist.appendTo(this);
    }
  });
};
