var _ = require('underscore');
var fs = require('fs');
var nunjucks = require('nunjucks');
var browserify = require('browserify');
var less = require('less');

var VIEWS_DIR = __dirname + '/../views';
var LESS_DIR = __dirname + '/../less';

exports.configure = function(debug) {
  nunjucks.configure(VIEWS_DIR, _.extend({
    watch: debug
  }, require('./browser/nunjucks-options')));
};

exports.nunjucks = function(debug) {
  var templates = null;

  return function(req, res, next) {
    if (!templates || debug) {
      templates = [];
      fs.readdirSync(VIEWS_DIR).forEach(function(file) {
        templates.push(nunjucks.precompileString(
          fs.readFileSync(VIEWS_DIR + '/' + file, 'utf-8').trim(),
          {name: file}
        ));
      });
    }
    return res.type('application/javascript')
      .send(templates.join('\n\n'));
  };
};

exports.less = function(debug) {
  var css = null;

  return function(req, res, next) {
    var sendCss = function() { res.type('text/css').send(css); };

    if (!css || debug) {
      var filename = 'styles.less';
      var abspath = LESS_DIR + '/' + filename;
      var parser = new less.Parser({
        filename: 'styles.less'
      });
      var source = fs.readFileSync(abspath, 'utf-8');

      parser.parse(source, function(err, tree) {
        try {
          if (err) throw err;
          css = tree.toCSS({
            strictMath: true
          });
        } catch (err) {
          return next(Error(filename + " line " + err.line +
                      " compile error: " + err.message));
        }
        sendCss();
      });
    } else
      sendCss();
  };
};

exports.browserify = function(debug) {
  var code = null;

  return function(req, res, next) {
    var sendCode = function() {
      res.type('application/javascript').send(code);
    };

    if (!code || debug) {
      browserify({debug: debug})
        .add('./lib/browser/main.js')
        .bundle(function(err, buf) {
          if (err) return next(err);
          code = buf;
          sendCode();
        });
    } else
      sendCode();
  };
};
