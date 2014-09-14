var browserUtil = require('./util');
var nav = require('./nav');

function setupPostDetail(contentArea, postDetails) {
  var holder = $('.post-detail-holder', contentArea);
  var detail = $('.post-detail', contentArea);
  var loadingPostDetail = detail.children().remove();

  function showPostDetail(slug) {
    var rendered = $('<div></div>').append(loadingPostDetail.clone());
    var onPost = function(info) {
      var post = browserUtil.normalizePost(JSON.parse(JSON.stringify(info)));
      holder.css({height: 'auto'});
      rendered.html(nunjucks.render('post-detail.html', post));
      nav.setCurrentURL('/' + info.slug + '/', undefined, {post: info});
    };

    detail.empty().append(rendered);
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

  $('body').on('click', '[role="show-post-detail"]', function(event) {
    event.preventDefault();
    postDetails.push($(this).attr('data-post-slug'));
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
