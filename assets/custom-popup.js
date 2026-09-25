(function () {
  'use strict';

  var STORAGE_KEY = 'ts_geo_popup_dismissed';
  var DISMISS_DAYS = 30;

  function isDismissed() {

    try {

      var raw =
        localStorage.getItem(STORAGE_KEY);

      if (!raw) return false;

      return Date.now() <
        parseInt(raw, 10);

    } catch (e) {

      return false;

    }
  }


  function setDismissed() {

    try {

      var expires =
        Date.now() +
        DISMISS_DAYS *
        24 *
        60 *
        60 *
        1000;

      localStorage.setItem(
        STORAGE_KEY,
        String(expires)
      );

    } catch (e) {}
  }


  function showPopup() {

    var popup =
      document.getElementById(
        'us-redirect-popup'
      );

    if (!popup) return;

    popup.style.display = 'block';

    document.body.style.overflow =
      'hidden';
  }


  function hidePopup() {

    var popup =
      document.getElementById(
        'us-redirect-popup'
      );

    if (!popup) return;

    popup.style.display = 'none';

    document.body.style.overflow =
      '';
  }


  function initEvents() {

    var close =
      document.getElementById(
        'us-redirect-close'
      );

    var stay =
      document.getElementById(
        'us-redirect-stay'
      );

    var overlay =
      document.getElementById(
        'us-redirect-overlay'
      );

    var continueButton =
      document.getElementById(
        'us-redirect-continue'
      );


    if (close) {
      close.addEventListener(
        'click',
        function () {
          setDismissed();
          hidePopup();
        }
      );
    }


    if (stay) {
      stay.addEventListener(
        'click',
        function () {
          setDismissed();
          hidePopup();
        }
      );
    }


    if (overlay) {
      overlay.addEventListener(
        'click',
        function () {
          setDismissed();
          hidePopup();
        }
      );
    }


    if (continueButton) {
      continueButton.addEventListener(
        'click',
        function () {
          setDismissed();
        }
      );
    }

  }


  function detectCountry() {

    if (isDismissed()) return;

    fetch(
      '/browsing_context_suggestions.json',
      {
        credentials: 'same-origin'
      }
    )
      .then(function (response) {

        return response.ok
          ? response.json()
          : null;

      })
      .then(function (data) {

        if (
          !data ||
          !data.detected_values
        ) {
          return;
        }

        var values =
          data.detected_values;

        var country =
          values.country;

        var code =
          (
            country &&
            (
              country.handle ||
              country.iso_code
            )
          ) ||
          values.country_code ||
          null;

        var name =
          (
            country &&
            country.name
          ) ||
          values.country_name ||
          null;

        var isCanada =
          code === 'CA' ||
          name === 'Canada';

        if (
          (code || name) &&
          !isCanada
        ) {
          showPopup();
        }

      })
      .catch(function () {
        // Fail silently.
      });
  }


  function init() {

    initEvents();

    /*
     * Delay geolocation until the page has
     * had time to render critical content.
     */
    setTimeout(
      detectCountry,
      2500
    );

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