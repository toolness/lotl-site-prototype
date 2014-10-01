module.exports = function($) {
  function ensureSingleton(sel) {
    var singleton = $(sel);
    if (singleton.length != 1)
      throw new Error('not a singleton element: ' + sel);
    return singleton;
  }

  return {
    $: $,
    $contentArea: ensureSingleton('#content-area'),
    $body: ensureSingleton('body')
  };
};
