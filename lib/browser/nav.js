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

function setup(initialState, queries, postDetails) {
  function restoreCurrentState(state) {
    queries.push(getCurrentSearch());
    postDetails.push((state && state.post) ||
                     postSlugFromPathname(window.location.pathname));
  }

  function triggerURL(url) {
    var parsed = urlParse(url, true);
    var search = searchFromQuery(parsed.query);

    queries.push(search);
    postDetails.push(postSlugFromPathname(parsed.pathname));
    setCurrentURL(parsed.pathname, search);
  }

  restoreCurrentState(initialState);

  $(window).on('popstate', function(event) {
    restoreCurrentState(event.originalEvent.state);
  });

  $('body').on('click', '[href^="/"]', function(e) {
    e.preventDefault();
    triggerURL($(this).attr('href'));
  });
}

exports.setCurrentURL = setCurrentURL;
exports.setup = setup;
