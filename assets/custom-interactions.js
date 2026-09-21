(function () {
  'use strict';

  function initMegaMenu() {
    document
      .querySelectorAll('details.mega-menu > summary')
      .forEach(function (summary) {

        if (summary.dataset.customMegaMenu === 'true') return;

        summary.dataset.customMegaMenu = 'true';

        summary.addEventListener('click', function (event) {

          var details = this.parentElement;
          var url = this.getAttribute('data-url');

          if (!details.hasAttribute('data-opened')) {

            event.preventDefault();

            details.setAttribute('open', 'true');
            details.setAttribute('data-opened', 'true');

          } else if (url) {

            window.location.href = url;

          }

        });
      });
  }


  function initFooterLinks() {
    document
      .querySelectorAll('footer a')
      .forEach(function (link) {

        if (
          link.textContent.trim() === 'About Us' &&
          !link.hasAttribute('target')
        ) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener');
        }

      });
  }


  function initCollectionSorting() {

    var sortContainer = document.querySelector('#SortBy');

    if (!sortContainer) return;

    sortContainer.addEventListener('change', function (event) {

      var target = event.target;

      if (
        target.name !== 'sort_by' ||
        !target.checked
      ) {
        return;
      }

      var url = new URL(window.location.href);

      url.searchParams.set(
        'sort_by',
        target.value
      );

      document.body.classList.add('loading');

      window.location.href = url.toString();

    });


    var urlParams = new URLSearchParams(
      window.location.search
    );

    var sortByParam =
      urlParams.get('sort_by');

    if (sortByParam) {

      var radio =
        sortContainer.querySelector(
          'input[name="sort_by"][value="' +
          CSS.escape(sortByParam) +
          '"]'
        );

      if (radio) {
        radio.checked = true;
      }
    }


    if (
      typeof window.resetInfiniteScroll ===
      'function'
    ) {
      window.resetInfiniteScroll();
    }
  }


  function init() {

    initMegaMenu();

    initFooterLinks();

    initCollectionSorting();

  }


  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      init,
      { once: true }
    );
  } else {
    init();
  }

})();