var Bacon = require('baconjs').Bacon;

var SCRIPTS = [
  '/vendor/dat.gui.js',
  '/vendor/less.js'
];

var COLOR_VARS = {
  nav: '#639ED2',
  navText: '#FFFFFF',
  secondary: '#639ED2'
};

exports.setup = function() {
  $('<link rel="stylesheet/less" href="/less/styles.less">')
    .prependTo('head');
  window.less = {
    strictMath: true
  };
  Bacon.fromArray(SCRIPTS).flatMap(function(script) {
    return Bacon.fromPromise($.getScript(script));
  }).onEnd(function() {
    $('link[href$="styles.css"]').remove();

    // Undo our default border-box sizing for dat.gui, as it expects
    // the W3C-defined default (content-box).
    $('<style>body > div.dg * {' +
      'box-sizing: content-box; -moz-box-sizing: content-box; ' +
      '-webkit-box-sizing: content-box; }</style>').appendTo('head');

    var gui = new dat.GUI();
    var obj = {};

    Object.keys(COLOR_VARS).forEach(function(varName) {
      obj[varName] = COLOR_VARS[varName];
      gui.addColor(obj, varName).onChange(function(value) {
        var vars = {};
        vars[varName] = value;
        less.modifyVars(vars);
      });
    });
  });
};
