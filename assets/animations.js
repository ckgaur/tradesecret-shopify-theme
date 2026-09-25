const SCROLL_ANIMATION_TRIGGER_CLASSNAME = 'scroll-trigger';
const SCROLL_ANIMATION_OFFSCREEN_CLASSNAME = 'scroll-trigger--offscreen';
const SCROLL_ZOOM_IN_TRIGGER_CLASSNAME = 'animate--zoom-in';
const SCROLL_ANIMATION_CANCEL_CLASSNAME = 'scroll-trigger--cancel';


// ---------------------------------------------------------
// Scroll animation logic
// ---------------------------------------------------------

function onIntersection(entries, observer) {
  entries.forEach((entry, index) => {
    const element = entry.target;

    if (entry.isIntersecting) {
      if (element.classList.contains(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME)) {
        element.classList.remove(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);

        if (element.hasAttribute('data-cascade')) {
          element.style.setProperty('--animation-order', index);
        }
      }

      observer.unobserve(element);
    } else {
      element.classList.add(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
      element.classList.remove(SCROLL_ANIMATION_CANCEL_CLASSNAME);
    }
  });
}


function initializeScrollAnimationTrigger(
  rootEl = document,
  isDesignModeEvent = false
) {
  const animationTriggerElements = Array.from(
    rootEl.getElementsByClassName(
      SCROLL_ANIMATION_TRIGGER_CLASSNAME
    )
  );

  if (animationTriggerElements.length === 0) return;

  if (isDesignModeEvent) {
    animationTriggerElements.forEach((element) => {
      element.classList.add('scroll-trigger--design-mode');
    });

    return;
  }

  const observer = new IntersectionObserver(onIntersection, {
    rootMargin: '0px 0px -50px 0px',
  });

  animationTriggerElements.forEach((element) => {
    observer.observe(element);
  });
}


// ---------------------------------------------------------
// Zoom animation logic
// ---------------------------------------------------------

function initializeScrollZoomAnimationTrigger() {
  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  const elements = Array.from(
    document.getElementsByClassName(
      SCROLL_ZOOM_IN_TRIGGER_CLASSNAME
    )
  );

  if (elements.length === 0) return;

  const scaleAmount = 0.2 / 100;
  const visibleElements = new Set();

  let ticking = false;

  function updateZoom() {
    ticking = false;

    if (visibleElements.size === 0) return;

    visibleElements.forEach((element) => {
      const percentage = percentageSeen(element);

      element.style.setProperty(
        '--zoom-in-ratio',
        1 + scaleAmount * percentage
      );
    });
  }

  function requestUpdate() {
    if (ticking) return;

    ticking = true;

    requestAnimationFrame(updateZoom);
  }

  elements.forEach((element) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleElements.add(element);
            requestUpdate();
          } else {
            visibleElements.delete(element);
          }
        });
      },
      {
        rootMargin: '100px 0px 100px 0px',
      }
    );

    observer.observe(element);

    element.style.setProperty(
      '--zoom-in-ratio',
      1 + scaleAmount * percentageSeen(element)
    );
  });

  window.addEventListener(
    'scroll',
    requestUpdate,
    {
      passive: true
    }
  );

  window.addEventListener(
    'resize',
    requestUpdate,
    {
      passive: true
    }
  );
}


// ---------------------------------------------------------
// Calculate visible percentage
// ---------------------------------------------------------

function percentageSeen(element) {
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;

  const rect = element.getBoundingClientRect();

  const elementPositionY = rect.top + scrollY;
  const elementHeight = element.offsetHeight;

  if (elementPositionY > scrollY + viewportHeight) {
    return 0;
  }

  if (elementPositionY + elementHeight < scrollY) {
    return 100;
  }

  const distance =
    scrollY + viewportHeight - elementPositionY;

  const percentage =
    distance / ((viewportHeight + elementHeight) / 100);

  return Math.round(percentage);
}


// ---------------------------------------------------------
// Initialize
// ---------------------------------------------------------

window.addEventListener('DOMContentLoaded', () => {
  initializeScrollAnimationTrigger();
  initializeScrollZoomAnimationTrigger();
});


// ---------------------------------------------------------
// Shopify Theme Editor
// ---------------------------------------------------------

if (Shopify.designMode) {

  document.addEventListener(
    'shopify:section:load',
    (event) => {
      initializeScrollAnimationTrigger(
        event.target,
        true
      );
    }
  );

  document.addEventListener(
    'shopify:section:reorder',
    () => {
      initializeScrollAnimationTrigger(
        document,
        true
      );
    }
  );
}