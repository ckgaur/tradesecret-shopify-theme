(function () {

  'use strict';

  var loaded = false;

  function loadButterly() {

    if (loaded) return;

    loaded = true;

    var today = new Date();

    var stamp =
      today.getFullYear() +
      '-' +
      (today.getMonth() + 1) +
      '-' +
      today.getDate() +
      '-' +
      today.getHours();

    var script =
      document.createElement('script');

    script.src =
      'https://butterly.com/richmedia/socialfeed/socialEmbed.js?stamp=' +
      stamp;

    script.async = true;

    document.body.appendChild(script);

    removeListeners();
  }


  function removeListeners() {

    window.removeEventListener(
      'scroll',
      loadButterly
    );

    window.removeEventListener(
      'click',
      loadButterly
    );

    window.removeEventListener(
      'touchstart',
      loadButterly
    );

  }


  window.addEventListener(
    'scroll',
    loadButterly,
    { once: true, passive: true }
  );

  window.addEventListener(
    'click',
    loadButterly,
    { once: true, passive: true }
  );

  window.addEventListener(
    'touchstart',
    loadButterly,
    { once: true, passive: true }
  );

})();