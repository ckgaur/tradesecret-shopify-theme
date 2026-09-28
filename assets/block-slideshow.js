'use strict';

(function () {
  if (!customElements.get('block-slideshow')) {
    class BlockSlideshow extends HTMLElement {
      constructor() {
        super();
        this.swiper = null;
        this.slider = this.querySelector('.swiper');
        this.pagination = this.querySelector('.swiper-pagination');
        this.nextBtn = this.querySelector('.swiper-button-next');
        this.prevBtn = this.querySelector('.swiper-button-prev');
        this.scrollbar = this.querySelector('.swiper-scrollbar');
      }

      connectedCallback() {
        this.initSwiper();
        this.setupExternalNavigation();
      }
    }

    BlockSlideshow.prototype.initSwiper = function () {
      if (!this.slider) return;

      const {
        slidesPerView,
        slidesPerViewTablet,
        slidesPerViewMobile,
        spaceBetween,
        spaceBetweenTablet,
        spaceBetweenMobile,
        autoplay,
        autoplayPause,
        autoplayDelay,
        scrollSpeed,
        autoSlidesWidth,
      } = this.slider.dataset;

      const slides = this.slider.querySelectorAll('.swiper-slide');
      if (slides.length <= 1) {
        if (this.nextBtn) this.nextBtn.style.display = 'none';
        if (this.prevBtn) this.prevBtn.style.display = 'none';
      }

      const swiperOptions = {
        loop: false,
        slidesPerView: 1,
        spaceBetween: spaceBetweenMobile,
        grabCursor: true,
        longSwipesRatio: 0.3,
        speed: scrollSpeed,
        mousewheel: {
          forceToAxis: true,
          releaseOnEdges: true,
        },
        breakpoints: {
          350: {
            slidesPerView: slidesPerViewMobile,
            spaceBetween: spaceBetweenMobile,
          },
          750: {
            slidesPerView: slidesPerViewTablet,
            spaceBetween: spaceBetweenTablet,
          },
          1025: {
            slidesPerView: slidesPerView,
            spaceBetween: spaceBetween,
          },
        },
      };

      if (autoSlidesWidth == 'true') {
        swiperOptions.slidesPerView = 'auto';
        swiperOptions.breakpoints = {
          350: {
            slidesPerView: 'auto',
            spaceBetween: spaceBetweenMobile
          },
          750: {
            slidesPerView: 'auto',
            spaceBetween: spaceBetweenTablet
          },
          1025: {
            slidesPerView: 'auto',
            spaceBetween: spaceBetween,
          }
        };
      }

      if (this.pagination) {
        swiperOptions.pagination = {
          el: this.pagination,
          clickable: true,
        };
      }

      if (this.scrollbar) {
        swiperOptions.scrollbar = {
          el: this.scrollbar,
          draggable: true,
        };
      }

      if (autoplay == 'true') {
        swiperOptions.autoplay = {
          delay: Number(autoplayDelay),
          pauseOnMouseEnter: autoplayPause === 'true',
          disableOnInteraction: false,
        };
      }

      this.swiper = new Swiper(this.slider, swiperOptions);
      this.updateNavigationButtons();

      this.swiper.on('slideChange', this.updateNavigationButtons.bind(this));
    };

    BlockSlideshow.prototype.setupExternalNavigation = function () {
      if (!this.nextBtn || !this.prevBtn || !this.swiper) return;

      this.nextBtn.addEventListener('click', () => {
        this.swiper.slideNext();
      });
      this.prevBtn.addEventListener('click', () => {
        this.swiper.slidePrev();
      });
    };

    BlockSlideshow.prototype.toggleButtonState = function (button, shouldDisable) {
      if (shouldDisable) {
        button.classList.add('disabled');
        button.setAttribute('aria-disabled', 'true');
      } else {
        button.classList.remove('disabled');
        button.removeAttribute('aria-disabled');
      }
    };

    BlockSlideshow.prototype.updateNavigationButtons = function () {
      if (!this.swiper || !this.nextBtn || !this.prevBtn) return;

      this.toggleButtonState(this.prevBtn, this.swiper.isBeginning);
      this.toggleButtonState(this.nextBtn, this.swiper.isEnd);
    };

    customElements.define('block-slideshow', BlockSlideshow);
  }
})();