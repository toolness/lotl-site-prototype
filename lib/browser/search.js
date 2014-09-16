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
  }).on('keyup', function(event, forceSubmit) {
    var val = $.trim($(this).val()) || null;
    var submit = forceSubmit;
    if (event.which == 27) {
      $(this).typeahead('val', '');
      val = null;
      submit = true;
    } else if (event.which == 13) {
      submit = true;
    }
    if (submit) {
      if (val && !(val in tags)) {
        // This callback will be called instantly, before the next line
        // of code executes.
        matcher(val, function(matches) {
          val = matches.length ? matches[0].value : null;
          $(this).typeahead('val', val || '');
        }.bind(this));
      }
      $(this).typeahead('close');
      queries.push(val);
    }
  }).on('typeahead:selected', function() {
    $(this).trigger('keyup', true);
  });
};
