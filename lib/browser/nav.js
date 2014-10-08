var urlParse = require('url').parse;
var querystring = require('querystring');

var oldSite = require('./old-site');

function postSlugFromPathname(pathname) {
  return pathname.slice(1, -1) || null;
}

function searchFromQuery(query, defaultValue) {
  var s = query.s;

  if (typeof(s) == 'undefined')
    s = defaultValue;

  if (s && typeof(s) == 'object' && s.length) s = s[0];
  return s || null;
}

function getCurrentSearch() {
  return searchFromQuery(querystring.parse(window.location.search.slice(1)));
}

function setPageTitle(state) {
  if (state && state.post && state.post.title_plain)
    return document.title = state.post.title_plain;

  var search = getCurrentSearch();
  document.title = "Life of The Law" + (search ? ": " + search : "");
}

function setCurrentURL(pathname, search, state) {
  if (typeof(search) == 'undefined')
    search = getCurrentSearch();

  var url = pathname + (search ? '?s=' + encodeURIComponent(search) : '');

  if (window.location.pathname + window.location.search != url) {
    if (window.history.pushState)
      window.history.pushState(state || {}, '', url);
    else
      window.location = url;
  } else {
    if (window.history.replaceState)
      window.history.replaceState(state || {}, '', url);
  }
  setPageTitle(state);
  if (typeof(window.ga) == 'function') window.ga('send', 'pageview');
}

function setup(initialState, queries, postDetails) {
  function restoreCurrentState(state) {
    queries.push(getCurrentSearch());
    postDetails.push((state && state.post) ||
                     postSlugFromPathname(window.location.pathname));
    setPageTitle(state);
  }

  function triggerURL(url) {
    var parsed = urlParse(url, true);
    var search = searchFromQuery(parsed.query, getCurrentSearch());

    queries.push(search);
    postDetails.push(postSlugFromPathname(parsed.pathname));
    setCurrentURL(parsed.pathname, search);
  }

  restoreCurrentState(initialState);

  $(window).on('popstate', function(event) {
    restoreCurrentState(event.originalEvent.state);
  });

  $('body').on('click', '[href^="/"]', function(e) {
    var href = $(this).attr('href');

    if (href.indexOf('/feed/') != -1) return;

    e.preventDefault();
    triggerURL(oldSite.normalize(href));
  });
}

exports.setCurrentURL = setCurrentURL;
exports.setup = setup;
