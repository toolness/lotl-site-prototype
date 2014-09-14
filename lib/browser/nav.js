var querystring = require('querystring');

function getCurrentSearch() {
  var s = querystring.parse(window.location.search.slice(1)).s;
  if ($.isArray(s)) s = s[0];
  return s || null;
}

function setCurrentURL(pathname, search, state) {
  if (typeof(search) == 'undefined')
    search = getCurrentSearch();

  var url = pathname + (search ? '?s=' + encodeURIComponent(search) : '');

  if (window.location.pathname + window.location.search != url) {
    window.history.pushState(state || {}, '', url);
  } else {
    window.history.replaceState(state || {}, '', url);
  }
}

exports.getCurrentSearch = getCurrentSearch;
exports.setCurrentURL = setCurrentURL;
