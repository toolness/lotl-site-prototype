var browserUtil = require('./util');
var nav = require('./nav');

function renderPostDetail(contentArea, post, nunjucks) {
  post = browserUtil.normalizePost(browserUtil.deepCopy(post));

  var html = nunjucks.render('post-detail.html', post);

  contentArea.addClass('show-post-detail');
  contentArea.find('.post-detail').html(html);
}

function setupPostDetail(contentArea, postDetails) {
  var holder = contentArea.find('.post-detail-holder');
  var detail = contentArea.find('.post-detail');

  function showPostDetail(slug) {
    var onPost = function(info) {
      holder.css({height: 'auto'});
      renderPostDetail(contentArea, info, nunjucks);
      nav.setCurrentURL('/' + info.slug + '/', undefined, {post: info});
    };

    detail.html(nunjucks.render('post-detail-loading.html'));
    holder.css({height: contentArea.height() + 'px'});
    contentArea.addClass('show-post-detail');
    if (typeof(slug) == 'string')
      $.getJSON('/api/post/' + slug, onPost);
    else
      onPost(slug);
    $.scrollTo('0px', 250);
  }

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
exports.render = renderPostDetail;
