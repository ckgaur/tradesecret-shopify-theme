(function () {
  let scrollToTopWrp = null;
  let scrollToTopBtn = null;
  let scrollAnimation = null;
  let wheelHandler = null;
  let scrollHandler = null;

  function showScrollToTop() {
    if (document.body.scrollTop > window.innerHeight / 2 || document.documentElement.scrollTop > window.innerHeight / 2) {
      scrollToTopWrp?.classList.add('active');
    } else {
      scrollToTopWrp?.classList.remove('active');
    }
  }

  function scrollToTop() {
    const position = document.body.scrollTop || document.documentElement.scrollTop;

    if (scrollAnimation) {
      clearTimeout(scrollAnimation);
      scrollAnimation = null;
    }

    if (wheelHandler) {
      window.removeEventListener('wheel', wheelHandler);
      wheelHandler = null;
    }

    if (position) {
      window.scrollBy(0, -Math.max(1, Math.floor(position / 10)));
      scrollAnimation = setTimeout(scrollToTop, 30);

      wheelHandler = () => {
        if (scrollAnimation) {
          clearTimeout(scrollAnimation);
          scrollAnimation = null;
        }
        window.removeEventListener('wheel', wheelHandler);
        wheelHandler = null;
      };

      window.addEventListener('wheel', wheelHandler);
    }
  }

  function cleanupScrollToTop() {
    if (scrollAnimation) {
      clearTimeout(scrollAnimation);
      scrollAnimation = null;
    }
    if (wheelHandler) {
      window.removeEventListener('wheel', wheelHandler);
      wheelHandler = null;
    }
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler);
      scrollHandler = null;
    }
    if (scrollToTopBtn) {
      scrollToTopBtn.removeEventListener('click', onScrollToTopClick);
    }
    scrollToTopWrp = null;
    scrollToTopBtn = null;
  }

  function onScrollToTopClick() {
    scrollToTop();
  }

  function initScrollToTop() {
    cleanupScrollToTop();

    scrollToTopWrp = document.querySelector('.scroll-to-top');
    scrollToTopBtn = scrollToTopWrp?.querySelector('.scrollToTop');

    if (!scrollToTopWrp) return;

    scrollHandler = () => {
      showScrollToTop();
    };

    window.addEventListener('scroll', scrollHandler);
    showScrollToTop();

    if (scrollToTopBtn) {
      scrollToTopBtn.addEventListener('click', onScrollToTopClick);
    }
  }

  window.cleanupScrollToTop = cleanupScrollToTop;

  document.addEventListener('DOMContentLoaded', initScrollToTop);
  document.addEventListener('shopify:section:load', initScrollToTop);
  document.addEventListener('shopify:section:unload', (event) => {
    if (event.target.classList.contains('scroll-to-top')) {
      cleanupScrollToTop();
    }
  });
})();