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

  var loadedSrc = new Set();
  var observedSections = new Set();
  var observer;

  function loadScript(src, isModule) {
    if (!src || loadedSrc.has(src)) return;
    loadedSrc.add(src);
    var script = document.createElement('script');
    script.src = src;
    if (isModule) {
      script.type = 'module';
    } else {
      script.defer = true;
    }
    document.body.appendChild(script);
  }

  function loadSection(section) {
    var markers = section.querySelectorAll('script[data-lazy-src]');
    markers.forEach(function (marker) {
      loadScript(marker.getAttribute('data-lazy-src'), marker.getAttribute('data-lazy-module') === 'true');
      marker.setAttribute('data-lazy-loaded', 'true');
    });
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
