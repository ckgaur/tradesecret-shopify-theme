(function () {

  'use strict';

  var GTM_ID = 'GTM-M27MMJCW';
  var gtmLoaded = false;

  function loadGTM() {
    if (gtmLoaded) return;
    gtmLoaded = true;

    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    var firstScript = document.getElementsByTagName('script')[0];
    var gtmScript = document.createElement('script');

    gtmScript.async = true;
    gtmScript.src =
      'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;

    firstScript.parentNode.insertBefore(gtmScript, firstScript);

    removeGtmListeners();
  }

  var gtmInteractionOptions = {
    passive: true,
    once: true
  };

  function removeGtmListeners() {
    window.removeEventListener('scroll', loadGTM, gtmInteractionOptions);
    window.removeEventListener('click', loadGTM, gtmInteractionOptions);
    window.removeEventListener('touchstart', loadGTM, gtmInteractionOptions);
    window.removeEventListener('mousemove', loadGTM, gtmInteractionOptions);
    window.removeEventListener('keydown', loadGTM, gtmInteractionOptions);
  }

  /*
   * Load GTM when the customer actually interacts.
   * This is the preferred trigger because GTM is then
   * unlikely to compete with LCP resources.
   */
  window.addEventListener('scroll', loadGTM, gtmInteractionOptions);
  window.addEventListener('click', loadGTM, gtmInteractionOptions);
  window.addEventListener('touchstart', loadGTM, gtmInteractionOptions);
  window.addEventListener('mousemove', loadGTM, gtmInteractionOptions);
  window.addEventListener('keydown', loadGTM, gtmInteractionOptions);

  /*
   * Fallback:
   * If the visitor doesn't interact, load GTM after
   * the page has finished loading and the browser is idle.
   */
  window.addEventListener('load', function () {

    var delayLoad = function () {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadGTM, {
          timeout: 3000
        });
      } else {
        setTimeout(loadGTM, 2000);
      }
    };

    /*
     * Give critical page resources some breathing room.
     */
    setTimeout(delayLoad, 1500);

  }, { once: true });

})();


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