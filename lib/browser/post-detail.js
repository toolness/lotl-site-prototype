var browserUtil = require('./util');
var nav = require('./nav');

function setupPostDetail(contentArea, postDetails, $, nunjucks) {
  var holder = contentArea.find('.post-detail-holder');
  var detail = contentArea.find('.post-detail');

  if (!$) $ = window.jQuery;
  if (!nunjucks) nunjucks = window.nunjucks;

  function showPostDetail(slug) {
    var rendered = $('<div></div>')
      .html(nunjucks.render('post-detail-loading.html'));
    var onPost = function(info) {
      var post = browserUtil.normalizePost(JSON.parse(JSON.stringify(info)));
      holder.css({height: 'auto'});
      rendered.html(nunjucks.render('post-detail.html', post));
      nav.setCurrentURL('/' + info.slug + '/', undefined, {post: info});
    };

    detail.empty().append(rendered);
    if (contentArea.height)
      holder.css({height: contentArea.height() + 'px'});
    contentArea.addClass('show-post-detail');
    if (typeof(slug) == 'string')
      $.getJSON('/api/post/' + slug, onPost);
    else
      onPost(slug);
    if ($.scrollTo)
      $.scrollTo('0px', 250);
  }

  if (contentArea.on)
    contentArea.on('click', '.post-detail-holder', function(event) {
      if (event.target != this) return;
      postDetails.push(null);
      nav.setCurrentURL('/');
    });

  postDetails.onValue(function(val) {
    if (!val) {
      contentArea.removeClass('show-post-detail');
    } else {
      showPostDetail(val);
    }
  });
}

exports.setup = setupPostDetail;
