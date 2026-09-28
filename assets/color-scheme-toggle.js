;(function () {
  const COLOR_MODE_PRELOADER_APPLY_DELAY = 500;
  const COLOR_MODE_PRELOADER_HIDE_DELAY = 500;
  let colorModePreloaderApplyTimeout = null;
  let colorModePreloaderHideTimeout = null;

  function clearColorModePreloaderTimers() {
    if (colorModePreloaderApplyTimeout) {
      clearTimeout(colorModePreloaderApplyTimeout);
      colorModePreloaderApplyTimeout = null;
    }

    if (colorModePreloaderHideTimeout) {
      clearTimeout(colorModePreloaderHideTimeout);
      colorModePreloaderHideTimeout = null;
    }
  }

  function runColorModePreloader(preloader, scheme, onCovered) {
    if (!preloader) return;

    clearColorModePreloaderTimers();

    preloader.classList.remove(
      'preloader-slide-in',
      'preloader-slide-out',
      'color-mode-preloader--dark-mode',
      'color-mode-preloader--light-mode'
    );
    preloader.classList.add('color-mode-preloader--' + scheme);
    void preloader.offsetWidth;
    preloader.classList.add('preloader-slide-in');

    colorModePreloaderApplyTimeout = window.setTimeout(function () {
      if (typeof onCovered === 'function') {
        onCovered();
      }
      colorModePreloaderApplyTimeout = null;
    }, COLOR_MODE_PRELOADER_APPLY_DELAY);

    colorModePreloaderHideTimeout = window.setTimeout(function () {
      preloader.classList.remove('preloader-slide-in');
      preloader.classList.add('preloader-slide-out');
      colorModePreloaderHideTimeout = null;
    }, COLOR_MODE_PRELOADER_HIDE_DELAY);
  }

  class ColorModeToggle extends HTMLElement {
    constructor() {
      super();
      this.onInputChange = this.onInputChange.bind(this);
      this.onClick = this.onClick.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.inputEl = null;
    }

    connectedCallback() {
      this.setAttribute('role', 'switch');
      if (!this.hasAttribute('tabindex')) {
        this.setAttribute('tabindex', '0');
      }
      this.inputEl = this.querySelector('input[type="checkbox"]');
      if (this.inputEl) {
        this.inputEl.addEventListener('change', this.onInputChange);
      }
      this.addEventListener('click', this.onClick);
      this.addEventListener('keydown', this.onKeyDown);
      this.syncFromDocument();
    }

    disconnectedCallback() {
      if (this.inputEl) {
        this.inputEl.removeEventListener('change', this.onInputChange);
      }
      this.removeEventListener('click', this.onClick);
      this.removeEventListener('keydown', this.onKeyDown);
    }

    syncFromDocument() {
      const currentScheme = document.documentElement.getAttribute('data-color-mode') || 'light-mode';
      const isDark = currentScheme === 'dark-mode';
      if (this.inputEl) {
        this.inputEl.checked = isDark;
      }
      this.setAttribute('aria-checked', String(isDark));
    }

    onClick(event) {
      if (this.inputEl && event.target === this.inputEl) return;
      if (!this.inputEl) {
        this.toggle();
      }
    }

    onKeyDown(event) {
      if (event.key !== ' ' && event.key !== 'Spacebar' && event.key !== 'Enter') return;
      event.preventDefault();
      this.toggle();
    }

    onInputChange() {
      const newScheme = this.inputEl && this.inputEl.checked ? 'dark-mode' : 'light-mode';
      this.applyScheme(newScheme);
    }

    toggle() {
      const currentScheme = document.documentElement.getAttribute('data-color-mode') || 'light-mode';
      const nextScheme = currentScheme === 'light-mode' ? 'dark-mode' : 'light-mode';
      if (this.inputEl) {
        this.inputEl.checked = nextScheme === 'dark-mode';
      }
      this.applyScheme(nextScheme);
    }

    applyScheme(scheme) {
      const preloader = document.querySelector('.color-mode-preloader');

      if (preloader) {
        runColorModePreloader(preloader, scheme, () => {
          this.commitScheme(scheme);
        });
        return;
      }

      clearColorModePreloaderTimers();
      this.commitScheme(scheme);
    }

    commitScheme(scheme) {
      document.documentElement.setAttribute('data-color-mode', scheme);
      try {
        localStorage.setItem('_color_mode', scheme);
      } catch (e) {}
      this.setAttribute('aria-checked', String(scheme === 'dark-mode'));
      this.dispatchEvent(
        new CustomEvent('color-mode:change', { detail: { scheme }, bubbles: true })
      );
    }
  }

  if (!customElements.get('color-mode-toggle')) {
    customElements.define('color-mode-toggle', ColorModeToggle);
  }

  document.addEventListener('shopify:section:load', function () {
    document.querySelectorAll('color-mode-toggle').forEach(function (el) {
      if (typeof el.syncFromDocument === 'function') {
        el.syncFromDocument();
      }
    });
  });
})();