'use strict';

(function () {
  if (!customElements.get('accordion-panel')) {
    class AccordionPanel extends HTMLElement {
      constructor() {
        super();
        this.toggleButton = null;
        this.dropdownContent = null;
        this.mobileBreakpoint = 750;
        this.isMobile = window.innerWidth < this.mobileBreakpoint;

        this.toggleAccordion = this.toggleAccordion.bind(this);
        this.handleResize = this.handleResize.bind(this);
      }

      connectedCallback() {
        if (this.isMobile) {
          if (this.setupElements()) {
            this.setupEventListeners();
            this.initializeState();
          }
        }

        const initFn = () => {
          window.addEventListener('resize', this.handleResize);
        };

        if ('requestIdleCallback' in window) {
          this._idleId = requestIdleCallback(initFn);
        } else {
          this._idleId = setTimeout(initFn, 100);
        }
      }

      setupElements() {
        this.toggleButton = this.querySelector('[data-component="toggle"]');
        this.dropdownContent = this.querySelector('[data-component="dropdown"]');

        if (!this.toggleButton || !this.dropdownContent) {
          return false;
        }

        this.toggleButton.setAttribute('aria-expanded', 'false');
        this.dropdownContent.setAttribute('aria-hidden', 'true');
        this.dropdownContent.hidden = true;
        return true;
      }

      setupEventListeners() {
        if (this.toggleButton) {
          this.toggleButton.addEventListener('click', this.toggleAccordion);
        }
      }

      initializeState() {
        if (this.hasAttribute('open')) {
          this.expandAccordion();
        }
      }

      toggleAccordion() {
        if (this.dropdownContent.hidden) {
          this.expandAccordion();
        } else {
          this.collapseAccordion();
        }
      }

      expandAccordion() {
        this.dropdownContent.hidden = false;
        this.dropdownContent.setAttribute('aria-hidden', 'false');
        this.toggleButton.setAttribute('aria-expanded', 'true');
        this.classList.add('js-active');
      }

      collapseAccordion() {
        this.dropdownContent.hidden = true;
        this.dropdownContent.setAttribute('aria-hidden', 'true');
        this.toggleButton.setAttribute('aria-expanded', 'false');
        this.classList.remove('js-active');
      }

      handleResize() {
        const newIsMobile = window.innerWidth < this.mobileBreakpoint;

        if (newIsMobile !== this.isMobile) {
          this.isMobile = newIsMobile;

          if (this.isMobile) {
            if (this.setupElements()) {
              this.setupEventListeners();
            }
          } else {
            this.cleanupAccordion();
          }
        }
      }

      cleanupAccordion() {
        if (!this.toggleButton || !this.dropdownContent) {
          return;
        }

        this.classList.remove('js-active');
        this.dropdownContent.hidden = false;
        this.toggleButton.setAttribute('aria-expanded', 'false');
        this.dropdownContent.setAttribute('aria-hidden', 'true');
        this.toggleButton.removeEventListener('click', this.toggleAccordion);
      }

      disconnectedCallback() {
        if (this._idleId) {
          if ('cancelIdleCallback' in window) {
            cancelIdleCallback(this._idleId);
          } else {
            clearTimeout(this._idleId);
          }
          this._idleId = null;
        }

        window.removeEventListener('resize', this.handleResize);
        if (this.toggleButton) {
          this.toggleButton.removeEventListener('click', this.toggleAccordion);
        }
      }
    }

    customElements.define('accordion-panel', AccordionPanel);
  }
})();
