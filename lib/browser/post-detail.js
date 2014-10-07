var browserUtil = require('./util');
var notFound = require('./not-found');
var nav = require('./nav');

function renderPostDetail(contentArea, post, nunjucks) {
  var html;

  if (post.error == 404) {
    html = nunjucks.render('post-detail-404.html', post);
  } else {
    post = browserUtil.normalizePost(browserUtil.deepCopy(post));
    html = nunjucks.render('post-detail.html', post);
  }

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
      if (info.slug)
        nav.setCurrentURL('/' + info.slug + '/', undefined, {post: info});
    };

    detail.html(nunjucks.render('post-detail-loading.html'));
    holder.css({height: contentArea.height() + 'px'});
    contentArea.addClass('show-post-detail');
    if (typeof(slug) == 'string')
      $.ajax({
        dataType: 'json',
        url: '/api/post/' + slug,
        success: onPost,
        error: function(jqXHR, textStatus, errorThrown) {
          if (jqXHR.status == 404)
            return onPost(notFound.postDetail());
        }
      });
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
