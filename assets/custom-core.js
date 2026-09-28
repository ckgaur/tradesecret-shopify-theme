(function () {
  'use strict';

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  /*
   * Customer discount redirect
   *
   * IMPORTANT:
   * This should not be heavily delayed because it changes
   * the customer's destination.
   */
  function initCustomerDiscount() {
    if (typeof window.Shopify === 'undefined') return;

    var customerData = window.__TS_CUSTOMER__;

    if (!customerData) return;

    try {
      if (sessionStorage.getItem('discountApplied')) return;
    } catch (e) {}

    var discountUrl = null;

    if (customerData.free) {
      discountUrl = '/discount/FREE%20CUSTOMERS';
    } else if (customerData.pro) {
      discountUrl = '/discount/PRO%20CUSTOMERS';
    }

    if (!discountUrl) return;

    try {
      sessionStorage.setItem('discountApplied', 'true');
    } catch (e) {}

    if (!window.location.href.includes('/discount/')) {
      window.location.href = discountUrl;
    }
  }

  /*
   * Header layout
   */
  function initHeader() {
    if (!window.matchMedia('(min-width: 1200px)').matches) return;

    var header = document.querySelector('.header');

    if (!header) return;

    if (header.dataset.customHeaderInitialized === 'true') {
      return;
    }

    header.dataset.customHeaderInitialized = 'true';

    var menu = header.querySelector('.header__inline-menu');

    if (!menu) return;

    header.classList.add('js-initializing');

    var wrapper = document.createElement('div');

    wrapper.className = 'header__content';

    var children = Array.from(header.children);

    children.forEach(function (child) {
      if (child !== menu) {
        wrapper.appendChild(child);
      }
    });

    header.insertBefore(wrapper, menu);

    header.classList.remove('js-initializing');
  }

  ready(function () {
    initHeader();
    initCustomerDiscount();
  });

})();