(function () {
  'use strict';

  function initFrenchContent() {

    if (
      !window.location.pathname.startsWith('/fr')
    ) {
      return;
    }

    var bookingText =
      document.querySelector(
        '.salon-booking-button .text'
      );

    if (
      bookingText &&
      bookingText.textContent.trim() ===
      'Book a Salon Service'
    ) {
      bookingText.textContent =
        'Réserver un service de salon';
    }

    var bookingButton =
      document.querySelector(
        '.salon-booking-button'
      );

    if (bookingButton) {
      bookingButton.setAttribute(
        'title',
        'Réserver un service de salon'
      );
    }

  }


  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      initFrenchContent,
      { once: true }
    );
  } else {
    initFrenchContent();
  }

})();