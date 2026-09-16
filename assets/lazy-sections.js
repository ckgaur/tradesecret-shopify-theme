/**
 * Viewport-based progressive section loader.
 *
 * Every theme script is marked up as:
 *   <script data-lazy-src="{{ 'foo.js' | asset_url }}" data-lazy-module="true"></script>
 * instead of a normal <script src>, so nothing downloads or executes until
 * needed. A single shared IntersectionObserver watches each marker's
 * enclosing .shopify-section wrapper and injects that section's real
 * <script> tags only once the section approaches the viewport — sections
 * already on screen at load time load immediately, below-the-fold sections
 * load one by one as the user scrolls toward them.
 *
 * In the theme editor (Shopify.designMode) scripts load immediately so
 * merchants get a working preview without needing to scroll first.
 */
(function () {
  'use strict';

  var scriptPromises = new Map();
  var loadedStyles = new Set();
  var observedSections = new Set();
  var observer;
  var designMode = !!(window.Shopify && window.Shopify.designMode);

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

  function loadSection(section) {
    var markers = section.querySelectorAll('script[data-lazy-src]:not([data-lazy-loaded])');
    markers.forEach(loadMarker);
  }

  function observeSection(section) {
    if (observedSections.has(section)) return;
    observedSections.add(section);
    observer.observe(section);
  }

  function scan(root) {
    var markers = (root || document).querySelectorAll('script[data-lazy-src]:not([data-lazy-loaded])');
    if (!markers.length) return;

    markers.forEach(function (marker) {
      var section = marker.closest('.shopify-section');

      // Markers outside a section wrapper (head/body-level scripts like
      // global.js, pubsub.js, predictive-search.js) are core infrastructure
      // used by every section, so they load immediately rather than waiting
      // on a viewport that doesn't exist for an unrendered <head> element.
      if (!section || designMode || !('IntersectionObserver' in window)) {
        loadMarker(marker);
        return;
      }

      observeSection(section);
    });
  }

  if (!designMode && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            loadSection(entry.target);
            obs.unobserve(entry.target);
            observedSections.delete(entry.target);
          }
        });
      },
      // Load a section's JS a little before it reaches the viewport so it's
      // ready to interact with the moment it scrolls into view.
      { rootMargin: '400px 0px', threshold: 0 }
    );
  }

  scan(document);

  // Re-scan when the theme editor swaps a section's markup so lazy sections
  // still initialize while merchants are editing.
  document.addEventListener('shopify:section:load', function (event) {
    scan(event.target);
  });
})();
