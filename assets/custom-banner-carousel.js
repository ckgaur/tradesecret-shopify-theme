'use strict';

(function () {
  function init() {
    var carousels = document.querySelectorAll('[id^="customBannerCarousel"]');

    carousels.forEach(function (carousel) {
      var suffix = carousel.id.replace('customBannerCarousel', '');
      var arrowLeft = document.getElementById('customArrowLeft' + suffix);
      var arrowRight = document.getElementById('customArrowRight' + suffix);
      var slideSelector = suffix ? '.carousel-slide-' + suffix : '.carousel-slide';

      function getScrollAmount() {
        var slide = carousel.querySelector(slideSelector);
        return slide ? slide.offsetWidth + 10 : 320;
      }

      if (arrowLeft) {
        arrowLeft.addEventListener('click', function () {
          carousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });
      }

      if (arrowRight) {
        arrowRight.addEventListener('click', function () {
          carousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        });
      }

      function updateArrowVisibility() {
        if (!arrowLeft || !arrowRight) return;

        var scrollLeft = carousel.scrollLeft;
        var maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
        var buffer = 5;

        arrowLeft.classList.toggle('show', scrollLeft > buffer);
        arrowRight.classList.toggle('show', scrollLeft < maxScrollLeft - buffer);
      }

      updateArrowVisibility();
      carousel.addEventListener('scroll', updateArrowVisibility, { passive: true });
      window.addEventListener('resize', updateArrowVisibility);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
