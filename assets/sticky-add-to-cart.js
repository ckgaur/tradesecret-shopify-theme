'use strict';
(function () {

	if (!customElements.get('sticky-atc-bar')) {

    class StickyAtcBar extends HTMLElement {
      constructor() {
        super();
				this.setStickyBarHeight.bind(this)			
				this.parent = this.closest('.sticky-atc-bar');
				this.select = this.querySelector('.atc-product-form .select')
				this.formBtn = this.querySelector('.button-add-card')
      }

      connectedCallback() {
        this.onVariantChange();
				this.attachResizeHandler(); 
				this.setStickyBarHeight(); // Need for correctly positioning scroll to top btn
      }

      disconnectedCallback() {
        this.cleanup(); // Clean up listeners and observers
      }

      onVariantChange = () => {
				if (!this.select) return;
				this.select.addEventListener('change', (e) => {
					this.updateMasterId(e);
					this.renderProductInfo();
				})
      };

			updateMasterId(e) {
				this.currentVariant = e.target.value;
			}

			renderProductInfo() {
				const requestedVariantId = this.currentVariant;
				fetch(
					`${this.dataset.url}?variant=${requestedVariantId}`
				)
					.then((response) => response.text())
					.then((responseText) => {
						const html = new DOMParser().parseFromString(responseText, 'text/html');
						const addButtonUpdated = html.querySelector('.main-product .product-form__submit');
						this.toggleAddButton(
							addButtonUpdated.hasAttribute('disabled'),
							window.variantStrings.soldOut
						);

						const priceContainer = html.querySelector('.main-product .price__container');
						this.updatePrice(priceContainer);
					})
					.catch((error) => {
            console.error('Error:', error);
          })
			}

			toggleAddButton(disable = true, text, modifyClass = true) {
				const addButton = this.formBtn;
				if (!addButton) return;

				const addButtonText = addButton.querySelector('span');

				if (disable) {
					addButton.setAttribute('disabled', 'disabled');
					if (text) {
						if (addButtonText) addButtonText.textContent = text;
					}
				} else {
					addButton.removeAttribute('disabled');
					const preorder =
						this.closest('sticky-atc-bar')?.dataset?.preorder === 'true' && window.variantStrings?.preOrder;
					if (addButtonText)
						addButtonText.textContent = preorder ? window.variantStrings.preOrder : window.variantStrings.addToCart;
				}

				if (!modifyClass) return;
			}
			
			updatePrice(newPrice) {
				if (!newPrice) return;

				const oldPrice = this.querySelector('.price__container');
				if (!oldPrice) return;
				
				const parent = oldPrice.parentNode;
				parent.replaceChild(newPrice, oldPrice);
				this.markEmptyStrike();			
			}

			markEmptyStrike() {
				const wrapper = this.querySelector('.price');
				if (!wrapper) return;
				const strike = wrapper.querySelector('.price__sale .price-item--regular');
				if (!strike) return;
				const txt = (strike.textContent || '').trim();
				const hasValidComparePrice = wrapper.classList.contains('price--on-sale') && txt.length > 0;
				strike.classList.toggle('is-empty', !hasValidComparePrice);
				const spanWrap = strike.closest('span');
				if (spanWrap) {
					spanWrap.classList.toggle('is-empty', !hasValidComparePrice);
					spanWrap.style.display = hasValidComparePrice ? '' : 'none';
				}
				wrapper.classList.toggle('has-strike', hasValidComparePrice);
			}

			setStickyBarHeight() {
				let height = 0;
				if (this.parent) {
					height = this.parent.offsetHeight;
				}

        document.documentElement.style.setProperty('--atc-bar-height', `${height}px`);
      }

      attachResizeHandler() {
        this.resizeObserver = new ResizeObserver(() => this.setStickyBarHeight());
        this.resizeObserver.observe(this);
        window.addEventListener('resize', () => {
					this.setStickyBarHeight.call(this)
				});
      }

			cleanup() {
        if (this.resizeObserver) {
          this.resizeObserver.disconnect(); // Stop observing size changes
        }
      }	
    }

    customElements.define('sticky-atc-bar', StickyAtcBar);

		let stickyBarVisibilityObserver = null;
		let stickyBarScrollFallback = null;
		let stickyBarTargetsState = null;

		function teardownStickyBarVisibility() {
			if (stickyBarVisibilityObserver) {
				stickyBarVisibilityObserver.disconnect();
				stickyBarVisibilityObserver = null;
			}
			if (stickyBarScrollFallback) {
				document.removeEventListener('scroll', stickyBarScrollFallback);
				window.removeEventListener('resize', stickyBarScrollFallback);
				stickyBarScrollFallback = null;
			}
			stickyBarTargetsState = null;
		}

		function getMainProductRoot() {
			// Scope target lookup to the main product so quick-add/recommendation
			// product blocks don't influence the sticky bar visibility.
			return (
				document.querySelector('product-info.product__info-container') ||
				document.querySelector('.main-product') ||
				document.querySelector('.product:not(.quick-add-modal .product)')
			);
		}

		function applyStickyBarVisibility(stickyAtcBar) {
			if (stickyAtcBar.classList.contains('js-hidden')) {
				stickyAtcBar.classList.remove('atc-visible');
				return;
			}

			let shouldShow = false;
			if (stickyBarTargetsState && stickyBarTargetsState.size) {
				shouldShow = Array.from(stickyBarTargetsState.values()).every((isVisible) => !isVisible);
			}

			stickyAtcBar.classList.toggle('atc-visible', shouldShow);
		}

		function checkBarVisibility() {
			teardownStickyBarVisibility();

			const stickyAtcBar = document.querySelector('.sticky-atc-bar');
			if (!stickyAtcBar) return;

			const productRoot = getMainProductRoot();
			const targets = productRoot
				? Array.from(productRoot.querySelectorAll('variant-selects, .buy-buttons-wrapper'))
				: [];

			if (targets.length && 'IntersectionObserver' in window) {
				stickyBarTargetsState = new Map();
				targets.forEach((target) => stickyBarTargetsState.set(target, true));

				stickyBarVisibilityObserver = new IntersectionObserver(
					(entries) => {
						entries.forEach((entry) => {
							stickyBarTargetsState.set(entry.target, entry.isIntersecting);
						});
						applyStickyBarVisibility(stickyAtcBar);
					},
					{ threshold: 0 }
				);

				targets.forEach((target) => stickyBarVisibilityObserver.observe(target));
				applyStickyBarVisibility(stickyAtcBar);
				return;
			}

			// Fallback: original scroll-based heuristic for environments without
			// IntersectionObserver or when product form blocks aren't found.
			const productVisible = document.querySelector('.product .product__info-wrapper');
			if (!productVisible) return;

			stickyBarScrollFallback = () => {
				if (stickyAtcBar.classList.contains('js-hidden')) {
					stickyAtcBar.classList.remove('atc-visible');
					return;
				}
				const halfwayDown = productVisible.offsetHeight / 2;
				const scrolled = document.scrollingElement ? document.scrollingElement.scrollTop : window.scrollY;
				stickyAtcBar.classList.toggle('atc-visible', scrolled > halfwayDown);
			};

			document.addEventListener('scroll', stickyBarScrollFallback, { passive: true });
			window.addEventListener('resize', stickyBarScrollFallback);
			stickyBarScrollFallback();
		}

		document.addEventListener('DOMContentLoaded', checkBarVisibility);
		document.addEventListener('shopify:section:load', checkBarVisibility);
		document.addEventListener('shopify:section:unload', teardownStickyBarVisibility);

		function addStickySpace() {
			const checkMobileStickyBar = document.querySelector('.mobile-sticky-bar ');
			const stickyAtcBar = document.querySelector(".sticky-atc-bar");
			const style = stickyAtcBar.dataset.style;
			const bottom = style == 'default' || style == 'default-swatches' | window.innerWidth < 750 ? 0 : 15;

			if ( window.innerWidth < 750 && checkMobileStickyBar && checkMobileStickyBar.classList.contains('active') ) {
				const mobileStickyBarHeight = checkMobileStickyBar.offsetHeight;
				stickyAtcBar.style.bottom = `${mobileStickyBarHeight + bottom}px`;
			} else {
				stickyAtcBar.style.bottom = `${bottom}px`;
			}
		}

		document.addEventListener('DOMContentLoaded', addStickySpace);
		document.addEventListener('shopify:section:load', addStickySpace);
		window.addEventListener('resize', addStickySpace);
		window.addEventListener('scroll', addStickySpace);

		const stickyAtcSelect = document.querySelector('sticky-atc-bar .select__select');
		let atcImage = document.querySelector('sticky-atc-bar img');
		if (stickyAtcSelect) {
			stickyAtcSelect.onchange = function(){
				// Price is updated via renderProductInfo() replacing .price__container
				const selectedOption = stickyAtcSelect.options[this.selectedIndex];
				if (!selectedOption) return;

				const stickyAtcForm = stickyAtcSelect.closest('form');
				const stickyAtcVariantInput = stickyAtcForm?.querySelector('input[type="hidden"][name="id"]');
				if (stickyAtcVariantInput) stickyAtcVariantInput.value = selectedOption.value;

				const getNewImage = selectedOption.getAttribute('data-media');
				if ( getNewImage != null && atcImage ) {
					atcImage.src = getNewImage;
				}
			};
		}
	}

	if (!customElements.get('sticky-atc-variants')) {
		class StickyAtcVariants extends HTMLElement {
			constructor() {
				super();
				this.handleSwatchClick = this.handleSwatchClick.bind(this);
				this.handleSwatchKeydown = this.handleSwatchKeydown.bind(this);
				this.addActiveState = this.addActiveState.bind(this);
				this.checkCurrentVariant = this.checkCurrentVariant.bind(this);
			}

			connectedCallback() {
				this.init();
			}

			disconnectedCallback() {
				this.cleanup();
			}

			init() {
				this.productCard = this.closest('sticky-atc-bar');
				if (!this.productCard) return;

				this.url = this.productCard.dataset.url || '';
				this.select = this.productCard.querySelector('.select__select');
				this.cardColorSwatches = [...this.querySelectorAll('.card-variant')];
				if (!this.cardColorSwatches.length || !this.select) return;

				this.currentId = this.select.value || this.cardColorSwatches[0]?.dataset.variantId;

				this.cardColorSwatches.forEach((swatch) => {
					swatch.addEventListener('click', this.handleSwatchClick);
					swatch.addEventListener('keydown', this.handleSwatchKeydown);
				});

				// Set the active state initially
				this.addActiveState();
			}

			handleSwatchClick(event) {
				event.preventDefault();
				event.stopPropagation();
				const swatch = event.currentTarget;
				this.updateActiveSwatch(swatch);
			}

			handleSwatchKeydown(event) {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					const swatch = event.currentTarget;
					this.updateActiveSwatch(swatch);
				}
			}

			setRadiosToOptionValue(optionValue) {
				if (optionValue == null) return false;
				let matched = false;
				this.cardColorSwatches.forEach((swatch) => {
					const radio = swatch.querySelector('input.card-variant__radio');
					if (!radio) return;
					const checked = String(radio.value) === String(optionValue);
					radio.checked = checked;
					if (checked) matched = true;
				});
				return matched;
			}

			updateActiveSwatch(swatch) {
				const { variantId } = swatch.dataset;
				if (!variantId || this.checkCurrentVariant(variantId)) return;

				const matchingOption = Array.from(this.select.options).find(
					(option) => option.value === variantId
				);

				if (matchingOption) {
					this.select.value = variantId;
					this.select.dispatchEvent(new Event('change', { bubbles: true }));
				}

				const clickedVal = swatch.querySelector('input.card-variant__radio')?.value;
				if (clickedVal != null) this.setRadiosToOptionValue(clickedVal);

				this.currentId = String(variantId);
				this.addActiveState();
			}

			addActiveState() {
				this.cardColorSwatches.forEach((swatch) => {
					const radio = swatch.querySelector('input.card-variant__radio');
					swatch.classList.toggle('active', !!(radio && radio.checked));
				});
			}

			syncFromMainVariant(variant) {
				if (!this.select || !variant || variant.id == null) return;

				const variantIdStr = String(variant.id);

				const pos = Number.parseInt(this.dataset.optionPosition || '', 10);
				let optionPosKey = '';
				if (Number.isFinite(pos) && pos > 0 && pos <= 3) optionPosKey = `option${pos}`;

				if (optionPosKey && variant[optionPosKey] != null && String(variant[optionPosKey]).length) {
					if (this.setRadiosToOptionValue(variant[optionPosKey])) {
						this.currentId = variantIdStr;
						this.addActiveState();
						return;
					}
				}

				this.syncFromVariantId(variantIdStr);
			}

			syncFromVariantId(variantId) {
				const id = variantId == null ? '' : String(variantId);
				if (!this.select || !id) return;

				const match = this.cardColorSwatches.find((s) => String(s.dataset.variantId) === id);
				if (!match) return;

				const value = match.querySelector('input.card-variant__radio')?.value;
				if (value == null || value === '') return;

				this.setRadiosToOptionValue(value);
				this.currentId = id;
				this.addActiveState();
			}

			checkCurrentVariant(id) {
				const sid = String(id);
				if (this.currentId != null && String(this.currentId) === sid) {
					return true;
				}
				this.currentId = sid;
				return false;
			}

			cleanup() {
				// Remove all event listeners
				this.cardColorSwatches.forEach((swatch) => {
					swatch.removeEventListener('click', this.handleSwatchClick);
					swatch.removeEventListener('keydown', this.handleSwatchKeydown);
				});
			}
		}

		customElements.define('sticky-atc-variants', StickyAtcVariants);
	}

	const stickyAtcBtn = document.querySelector('.sticky-atc-bar__close');

	if (stickyAtcBtn) {
		const addOnClickHandler = () => {
			const stickyAtcBar = document.querySelector(".sticky-atc-bar");
			if (!stickyAtcBar) return;

			stickyAtcBtn.addEventListener('click', () => {
				stickyAtcBar.classList.add('js-hidden');
				stickyAtcBar.classList.remove('atc-visible');
			})
		}

		addOnClickHandler();
	}
})();
