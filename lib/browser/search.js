// https://gist.github.com/jharding/9458744#file-the-basics-js
var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substrRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        // the typeahead jQuery plugin expects suggestions to a
        // JavaScript object, refer to typeahead docs for more info
        matches.push({ value: str });
      }
    });

    cb(matches);
  };
};

exports.setup = function setupSearch($el, queries, tags) {
  var matcher = substringMatcher(Object.keys(tags));

  $el.typeahead({
    hint: true,
    highlight: true,
    minLength: 1
  }, {
    name: 'tags',
    displayKey: 'value',
    source: matcher
  }).on('keyup', function(event) {
    var val = $(this).val();
    if (event.which == 27)
      return $(this).typeahead('val', '').trigger('keyup');
    if (val == 'podcast') {
      queries.push('podcast');
    } else if (val in tags) {
      queries.push(tags[val]);
    } else {
      if (event.which == 13 && val) {
        matcher(val, function(matches) {
          if (matches.length) {
            val = matches[0].value;
            $(this).typeahead('val', val).trigger('keyup');
          }
        }.bind(this));
      } else {
        queries.push(null);
      }
    }
  });
};
