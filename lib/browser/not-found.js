exports.postDetail = function(url) {
  if (!url && process.browser)
    url = window.location.pathname + window.location.search;

  return {
    error: 404,
    title_plain: 'Page Not Found',
    url: url
  };
};
