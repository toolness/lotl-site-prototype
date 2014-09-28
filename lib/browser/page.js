module.exports = function($) {
  function getSingleton(sel) {
    var singleton = $(sel);
    if (singleton.length != 1)
      throw new Error('not a singleton element: ' + sel);
    return singleton;
  }

  return {
    $: $,
    $contentArea: getSingleton('#content-area'),
    $body: getSingleton('body')
  };
};
