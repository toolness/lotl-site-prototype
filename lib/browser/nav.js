var urlParse = require('url').parse;
var querystring = require('querystring');

function postSlugFromPathname(pathname) {
  return pathname.slice(1, -1) || null;
}

function searchFromQuery(query) {
  var s = query.s;

  if (s && typeof(s) == 'object' && s.length) s = s[0];
  return s || null;
}

function getCurrentSearch() {
  return searchFromQuery(querystring.parse(window.location.search.slice(1)));
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

function restoreCurrentState(state, streams) {
  streams.queries.push(getCurrentSearch());
  streams.postDetails.push((state && state.post) ||
                           postSlugFromPathname(window.location.pathname));
}

function triggerURL(url, streams) {
  var parsed = urlParse(url, true);
  var search = searchFromQuery(parsed.query);

  streams.queries.push(search);
  streams.postDetails.push(postSlugFromPathname(parsed.pathname));
  setCurrentURL(parsed.pathname, search);
}

exports.setCurrentURL = setCurrentURL;
exports.restoreCurrentState = restoreCurrentState;
exports.triggerURL = triggerURL;
