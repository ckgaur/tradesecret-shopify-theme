/**
 * Global deferred-script loader.
 *
 * Every theme script is marked up as:
 *   <script data-lazy-src="{{ 'foo.js' | asset_url }}" data-lazy-module="true"></script>
 * instead of a normal <script src>, so nothing downloads or executes on
 * initial page load. The very first user interaction (scroll, touch, key
 * press, mouse move/click) — or a timeout fallback for users who never
 * interact — injects every deferred <script> in document order.
 *
 * In the theme editor (Shopify.designMode) scripts load immediately so
 * merchants get a working preview without needing to interact first.
 */
(function () {
  'use strict';

  var scriptPromises = new Map();
  var loadedStyles = new Set();
  var triggered = false;

  function loadStyle(href) {
    href = href && href.trim();
    if (!href || loadedStyles.has(href)) return;
    loadedStyles.add(href);
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src, isModule) {
    if (!src) return Promise.resolve();
    if (scriptPromises.has(src)) return scriptPromises.get(src);
    var promise = new Promise(function (resolve) {
      var script = document.createElement('script');
      script.src = src;
      if (isModule) {
        script.type = 'module';
      }
      script.onload = resolve;
      script.onerror = resolve;
      document.body.appendChild(script);
    });
    scriptPromises.set(src, promise);
    return promise;
  }

  function loadDeps(depsAttr) {
    var urls = (depsAttr || '')
      .split(',')
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    return urls.reduce(function (chain, url) {
      return chain.then(function () { return loadScript(url, false); });
    }, Promise.resolve());
  }

  function loadMarker(marker) {
    if (marker.hasAttribute('data-lazy-loaded')) return;
    marker.setAttribute('data-lazy-loaded', 'true');

    var cssAttr = marker.getAttribute('data-lazy-css');
    if (cssAttr) {
      cssAttr.split(',').forEach(function (href) { loadStyle(href); });
    }

    var src = marker.getAttribute('data-lazy-src');
    var isModule = marker.getAttribute('data-lazy-module') === 'true';

    loadDeps(marker.getAttribute('data-lazy-deps')).then(function () {
      loadScript(src, isModule);
    });
  }

  function scan(root) {
    var markers = (root || document).querySelectorAll('script[data-lazy-src]:not([data-lazy-loaded])');
    markers.forEach(loadMarker);
  }

  var INTERACTION_EVENTS = ['scroll', 'wheel', 'touchstart', 'keydown', 'mousedown', 'mousemove'];
  var FALLBACK_DELAY = 5000;
  var fallbackTimer;

  function triggerAll() {
    if (triggered) return;
    triggered = true;

    clearTimeout(fallbackTimer);
    INTERACTION_EVENTS.forEach(function (evt) {
      window.removeEventListener(evt, triggerAll, { passive: true });
      document.removeEventListener(evt, triggerAll, { passive: true });
    });

    scan(document);
  }

  function init() {
    if (window.Shopify && window.Shopify.designMode) {
      triggerAll();
      return;
    }

    INTERACTION_EVENTS.forEach(function (evt) {
      window.addEventListener(evt, triggerAll, { passive: true, once: true });
      document.addEventListener(evt, triggerAll, { passive: true, once: true });
    });
    fallbackTimer = setTimeout(triggerAll, FALLBACK_DELAY);
  }

  init();

  // Re-scan when the theme editor swaps a section's markup so newly added
  // scripts still load (immediately, since designMode already triggered).
  document.addEventListener('shopify:section:load', function (event) {
    if (triggered) scan(event.target);
  });
})();
