class DetailsModal extends HTMLElement {
  constructor() {
    super();
    this.detailsContainer = this.querySelector('details');
    this.summaryToggle = this.querySelector('summary');

    // Bind event handlers to preserve context
    this.handleKeyUp = (event) => event.code?.toUpperCase() === 'ESCAPE' && this.close();
    this.handleSummaryClick = this.onSummaryClick.bind(this);
    this.handleCloseClick = this.close.bind(this);

    if (this.detailsContainer) {
      this.detailsContainer.addEventListener('keyup', this.handleKeyUp);
    }

    if (this.summaryToggle) {
      this.summaryToggle.addEventListener('click', this.handleSummaryClick);
      this.summaryToggle.setAttribute('role', 'button');
      this.summaryToggle.setAttribute('aria-expanded', 'false');
    }

    this.closeButton = this.querySelector('button[type="button"]');
    if (this.closeButton) {
      this.closeButton.addEventListener('click', this.handleCloseClick);
    }
  }

  disconnectedCallback() {
    // Clean up event listeners when element is removed from DOM
    if (this.detailsContainer) {
      this.detailsContainer.removeEventListener('keyup', this.handleKeyUp);
    }

    if (this.summaryToggle) {
      this.summaryToggle.removeEventListener('click', this.handleSummaryClick);
    }

    if (this.closeButton) {
      this.closeButton.removeEventListener('click', this.handleCloseClick);
    }

    // Clean up body click listener if it exists
    if (this.onBodyClickEvent) {
      document.body.removeEventListener('click', this.onBodyClickEvent);
    }

    this.disconnectContentObserver();
  }

  isOpen() {
    return this.detailsContainer.hasAttribute('open');
  }

  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest('details').hasAttribute('open') ? this.close() : this.open(event);
  }

  onBodyClick(event) {
    if (!this.contains(event.target) || event.target.classList.contains('modal-overlay')) this.close(false);
  }

  open(event) {
    this.onBodyClickEvent = this.onBodyClickEvent || this.onBodyClick.bind(this);
    event.target.closest('details').setAttribute('open', true);
    document.body.addEventListener('click', this.onBodyClickEvent);
    document.body.classList.add('overflow-hidden');

    if (this.summaryToggle) {
      this.summaryToggle.setAttribute('aria-expanded', 'true');
    }

    this.trapContainer = this.detailsContainer.querySelector('[tabindex="-1"]');
    const focusTarget = this.detailsContainer.querySelector('input:not([type="hidden"])');

    if (this.trapContainer) {
      trapFocus(this.trapContainer, focusTarget || this.trapContainer);
      this.observeContentChanges(this.trapContainer, focusTarget);
    }
  }

  close(focusToggle = true) {
    this.disconnectContentObserver();
    removeTrapFocus(focusToggle ? this.summaryToggle : null);
    if (this.detailsContainer) {
      this.detailsContainer.removeAttribute('open');
    }
    if (this.summaryToggle) {
      this.summaryToggle.setAttribute('aria-expanded', 'false');
    }
    document.body.removeEventListener('click', this.onBodyClickEvent);
    document.body.classList.remove('overflow-hidden');
  }
  observeContentChanges(container, focusTarget) {
    if (typeof MutationObserver === 'undefined') return;

    this.disconnectContentObserver();
    this.contentObserver = new MutationObserver(() => {
      if (!this.isOpen()) return;
      if (!container.contains(document.activeElement)) {
        (focusTarget || container).focus({ preventScroll: true });
      }
    });

    this.contentObserver.observe(container, { childList: true, subtree: true });
  }

  disconnectContentObserver() {
    if (this.contentObserver) {
      this.contentObserver.disconnect();
      this.contentObserver = null;
    }
  }
}

customElements.define('details-modal', DetailsModal);
