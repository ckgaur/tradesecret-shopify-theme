'use strict';

(function () {
  class BlockColorSlideshowNavigation {
    constructor(container, colorNavigation) {
      this.container = container;
      this.colorNavigation = colorNavigation;
      this.colorNavigationLabel = colorNavigation.querySelector('.color-navigation-label');
      this.colorNavigationList = colorNavigation.querySelector('.color-navigation-list');
      this.colorNavigationButtons = [];
      this.variantWrappers = [];
      this.hasMultipleVariants = false;
      this.observer = null;
      this.upperHalfObserver = null;
      this.inViewClass = 'is-in-view';
      this.unstickClass = 'unstick-elements';
    }

    init() {
      if (!this.colorNavigation || !this.colorNavigationList) return;

      this.variantWrappers = Array.from(
        this.container.querySelectorAll('.block-color-slideshow-image-wrapper[data-variant-label][data-variant-color]')
      ).filter((wrapper) => {
        return wrapper.dataset.variantLabel?.trim() && wrapper.dataset.variantColor?.trim();
      });

      if (!this.variantWrappers.length) {
        this.colorNavigation.classList.remove(this.inViewClass);

        if (this.colorNavigationLabel) {
          this.colorNavigationLabel.textContent = '';
        }

        return;
      }

      const variants = [];
      const seenVariants = new Set();

      this.variantWrappers.forEach((wrapper) => {
        const label = wrapper.dataset.variantLabel.trim();
        const color = wrapper.dataset.variantColor.trim();
        const key = this.getVariantKey(label, color);

        wrapper.dataset.variantKey = key;

        if (seenVariants.has(key)) return;

        seenVariants.add(key);
        variants.push({ label, color, key });
      });

      this.colorNavigationList.innerHTML = '';
      this.colorNavigationButtons = variants.map((variant) => {
        const button = document.createElement('button');

        button.type = 'button';
        button.className = 'color-navigation-item';
        button.dataset.variantKey = variant.key;
        button.dataset.variantLabel = variant.label;
        button.dataset.variantColor = variant.color;
        button.setAttribute('aria-label', variant.label);
        button.setAttribute('aria-pressed', 'false');
        button.style.setProperty('--color-navigation-swatch', variant.color);

        button.addEventListener('click', () => {
          this.setActiveVariant(variant.key);
        });

        this.colorNavigationList.appendChild(button);

        return button;
      });

      this.hasMultipleVariants = variants.length > 1;
      this.container.classList.add('color-navigation-initialized');
      this.setActiveVariant(variants[0]?.key);
      this.observeViewport();
    }

    getVariantKey(label, color) {
      return `${label.trim()}::${color.trim().toLowerCase()}`;
    }

    setActiveVariant(activeVariantKey) {
      if (!activeVariantKey) return;

      let activeLabel = '';

      this.variantWrappers.forEach((wrapper) => {
        const isActive = wrapper.dataset.variantKey === activeVariantKey;

        wrapper.classList.toggle('is-active', isActive);
        wrapper.setAttribute('aria-hidden', `${!isActive}`);

        if (isActive && !activeLabel) {
          activeLabel = wrapper.dataset.variantLabel || '';
        }
      });

      this.colorNavigationButtons.forEach((button) => {
        const isActive = button.dataset.variantKey === activeVariantKey;

        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', `${isActive}`);
      });

      if (this.colorNavigationLabel) {
        this.colorNavigationLabel.textContent = activeLabel;
      }
    }

    observeViewport() {
      if (this.observer) return;

      if (!('IntersectionObserver' in window)) {
        this.colorNavigation.classList.add(this.inViewClass);
        return;
      }

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          this.colorNavigation.classList.toggle(this.inViewClass, entry.isIntersecting);
        });
      });

      this.observer.observe(this.colorNavigation);

      this.upperHalfObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          this.colorNavigation.classList.toggle(this.unstickClass, entry.isIntersecting);
        });
      }, {
        rootMargin: '0px 0px -33% 0px'
      });

      this.upperHalfObserver.observe(this.colorNavigation);
    }
  }

  const findColorNavigation = (slideshow) => {
    const id = slideshow.id;

    if (id) {
      const matched = document.querySelector(`.color-navigation[data-color-navigation-for="${id}"]`);
      if (matched) return matched;
    }

    const next = slideshow.nextElementSibling;
    if (next && next.classList.contains('color-navigation')) return next;

    return null;
  };

  const initBlockColorSlideshowNavigation = () => {
    document.querySelectorAll('block-slideshow[data-color-color-navigation="true"]').forEach((container) => {
      if (container.dataset.colorColorNavigationInitialized === 'true') return;

      const colorNavigation = findColorNavigation(container);
      if (!colorNavigation) return;

      container.dataset.colorColorNavigationInitialized = 'true';

      const navigation = new BlockColorSlideshowNavigation(container, colorNavigation);
      navigation.init();
    });
  };

  initBlockColorSlideshowNavigation();
  document.addEventListener('shopify:section:load', initBlockColorSlideshowNavigation);
  document.addEventListener('shopify:block:select', initBlockColorSlideshowNavigation);
})();
