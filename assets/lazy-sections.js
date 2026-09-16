/**
 * Section-level lazy loader.
 * Section files mark their below-the-fold JS with:
 *   <script data-lazy-src="{{ 'foo.js' | asset_url }}" data-lazy-module="true"></script>
 * instead of a normal <script src>. This controller watches the enclosing
 * .shopify-section wrapper with a single shared IntersectionObserver and
 * injects the real <script> tag only once the section approaches the viewport.
 */
(function () {
  'use strict';

  var scriptPromises = new Map();
  var loadedStyles = new Set();
  var observedSections = new Set();
  var observer;

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

  function getSection(marker) {
    return marker.closest('.shopify-section') || marker.parentElement || document.body;
  }

  function observeSection(section) {
    if (!section || observedSections.has(section)) return;
    observedSections.add(section);
    observer.observe(section);
  }

  function scan(root) {
    var markers = (root || document).querySelectorAll('script[data-lazy-src]:not([data-lazy-loaded])');
    if (!markers.length) return;

    if (!('IntersectionObserver' in window)) {
      markers.forEach(function (marker) {
        loadSection(getSection(marker));
      });
      return;
    }

    markers.forEach(function (marker) {
      observeSection(getSection(marker));
    });
  }

  if ('IntersectionObserver' in window) {
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
      { rootMargin: '600px 0px', threshold: 0 }
    );
  }

  scan(document);

  // Re-scan when the theme editor swaps a section's markup so lazy sections
  // still initialize while merchants are editing.
  document.addEventListener('shopify:section:load', function (event) {
    scan(event.target);
  });
})();
