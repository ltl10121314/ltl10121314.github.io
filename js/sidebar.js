(function() {
  'use strict';

  var breakpoint = 1180;
  var body = document.body;
  var nav = document.getElementById('sidebar');
  var navOpen = document.getElementById('docs-nav-open');
  var navClose = document.getElementById('docs-nav-close');
  var toc = document.getElementById('article-toc');
  var tocOpen = document.getElementById('docs-toc-open');
  var tocClose = document.getElementById('docs-toc-close');
  var backdrop = document.getElementById('docs-backdrop');
  var navKey = 'maupassant-docs-nav-open';
  var tocKey = 'maupassant-docs-toc-open';
  var wasMobile = window.innerWidth < breakpoint;
  var sidebarScrolls = document.querySelectorAll('.docs-sidebar-scroll');

  function readPreference(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function savePreference(key, open) {
    try {
      localStorage.setItem(key, String(open));
    } catch (error) {
      // Local storage may be disabled by the browser.
    }
  }

  function isMobile() {
    return window.innerWidth < breakpoint;
  }

  function hasCurrentCategory() {
    return Boolean(body.getAttribute('data-current-category'));
  }

  function isPanelOpen(panel) {
    return !body.classList.contains(panel + '-collapsed');
  }

  function updateBackdrop() {
    if (!backdrop) return;
    var mobileOpen = isMobile() && (
      isPanelOpen('docs-nav') ||
      (toc && isPanelOpen('docs-toc'))
    );
    backdrop.classList.toggle('visible', mobileOpen);
    backdrop.setAttribute('aria-hidden', String(!mobileOpen));
    body.classList.toggle('docs-mobile-panel-open', mobileOpen);
  }

  function setPanelOpen(panel, open, persist) {
    body.classList.toggle(panel + '-collapsed', !open);
    var openButton = panel === 'docs-nav' ? navOpen : tocOpen;
    if (openButton) {
      openButton.setAttribute('aria-expanded', String(open));
    }
    if (persist) {
      savePreference(panel === 'docs-nav' ? navKey : tocKey, open);
    }
    updateBackdrop();
  }

  function initialPreference(key) {
    var stored = readPreference(key);
    if (isMobile()) return false;
    return stored === null ? true : stored === 'true';
  }

  function markCurrentCategory() {
    var currentLinks = Array.prototype.map.call(
      document.querySelectorAll('.docs-breadcrumb a[href*="/categories/"]'),
      function(link) {
        return link.getAttribute('href');
      }
    );
    var currentName = body.getAttribute('data-current-category');
    var categoryLinks = Array.prototype.slice.call(
      document.querySelectorAll('#category-list a')
    );
    var currentHref = currentLinks.length ? currentLinks[currentLinks.length - 1] : '';
    var currentMatches = currentHref
      ? categoryLinks.filter(function(link) {
        return link.getAttribute('href') === currentHref;
      })
      : categoryLinks.filter(function(link) {
        return currentName && link.textContent.trim() === currentName;
      });
    var current = currentMatches.length ? currentMatches[currentMatches.length - 1] : null;

    categoryLinks.forEach(function(link) {
      var isCurrent = link === current;
      link.classList.toggle('current', isCurrent);
      if (isCurrent) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function revealCurrentCategory(animate) {
    if (!nav || (isMobile() && !isPanelOpen('docs-nav'))) return;

    var container = nav.querySelector('.docs-sidebar-scroll');
    var currentItems = container
      ? Array.prototype.slice.call(container.querySelectorAll('#category-list a.current'))
      : [];
    var current = currentItems[currentItems.length - 1];
    if (!container || !current || container.clientWidth <= 0 || container.clientHeight <= 0) return;

    var containerRect = container.getBoundingClientRect();
    var currentRect = current.getBoundingClientRect();
    var topBoundary = containerRect.top + 18;
    var bottomBoundary = containerRect.bottom - 18;
    if (currentRect.top >= topBoundary && currentRect.bottom <= bottomBoundary) return;

    var currentCenter = currentRect.top - containerRect.top + container.scrollTop + currentRect.height / 2;
    var maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
    var target = Math.max(0, Math.min(maxScroll, currentCenter - container.clientHeight * 0.38));
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (container.scrollTo) {
      container.scrollTo({
        top: target,
        behavior: animate && !reduceMotion ? 'smooth' : 'auto'
      });
    } else {
      container.scrollTop = target;
    }
  }

  function scheduleCurrentCategoryReveal(animate) {
    window.requestAnimationFrame(function() {
      window.requestAnimationFrame(function() {
        revealCurrentCategory(animate);
      });
    });
  }

  function applyInitialState() {
    if (nav) {
      var openForCategoryList = !isMobile() && hasCurrentCategory();
      setPanelOpen('docs-nav', openForCategoryList || initialPreference(navKey), false);
    }
    if (toc) setPanelOpen('docs-toc', initialPreference(tocKey), false);
  }

  function fitSidePanel(panel) {
    if (!panel) return;
    if (isMobile()) {
      panel.style.removeProperty('--panel-rest-height');
      panel.style.removeProperty('--panel-stuck-height');
      panel.classList.remove('is-stuck');
      return;
    }

    var stickyTop = parseFloat(window.getComputedStyle(panel).top) || 24;
    panel.dataset.stickyTop = String(stickyTop);
    var main = document.querySelector('.docs-main');
    var mainTop = main
      ? main.getBoundingClientRect().top + window.scrollY
      : panel.getBoundingClientRect().top + window.scrollY;
    var restTop = Math.max(mainTop, window.scrollY + stickyTop);
    var restHeight = Math.max(240, Math.floor(window.innerHeight - restTop - stickyTop));
    var stuckHeight = Math.max(240, Math.floor(window.innerHeight - stickyTop * 2));
    panel.style.setProperty('--panel-rest-height', restHeight + 'px');
    panel.style.setProperty('--panel-stuck-height', stuckHeight + 'px');
    updateStickyState(panel);
  }

  function updateStickyState(panel) {
    if (!panel || isMobile()) {
      if (panel) panel.classList.remove('is-stuck');
      return;
    }
    var stickyTop = parseFloat(panel.dataset.stickyTop) || 24;
    panel.classList.toggle(
      'is-stuck',
      panel.getBoundingClientRect().top <= stickyTop + 1
    );
  }

  function updateScrollHint() {
    sidebarScrolls.forEach(function(container) {
      var hasOverflow = container.scrollHeight > container.clientHeight + 1;
      var atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 2;
      container.classList.toggle('has-overflow', hasOverflow);
      container.classList.toggle('is-at-bottom', atBottom);
    });
  }

  var fitFrame = 0;
  function scheduleSidePanelFit() {
    window.cancelAnimationFrame(fitFrame);
    fitFrame = window.requestAnimationFrame(function() {
      fitSidePanel(nav);
      fitSidePanel(toc);
      updateScrollHint();
    });
  }

  var stickyStateFrame = 0;
  function scheduleStickyState() {
    window.cancelAnimationFrame(stickyStateFrame);
    stickyStateFrame = window.requestAnimationFrame(function() {
      updateStickyState(nav);
      updateStickyState(toc);
    });
  }

  function initPageTransitions() {
    var links = document.querySelectorAll('#nav-menu a, .docs-quick-nav a, #category-list a');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    links.forEach(function(link) {
      link.addEventListener('click', function(event) {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          link.classList.contains('current')
        ) return;

        event.preventDefault();
        body.classList.add('page-leaving');
        body.setAttribute('aria-busy', 'true');
        window.setTimeout(function() {
          window.location.assign(link.href);
        }, reduceMotion ? 0 : 170);
      });
    });

    window.addEventListener('pageshow', function() {
      body.classList.remove('page-leaving');
      body.removeAttribute('aria-busy');
    });
  }

  function bindPanel(openButton, closeButton, panel, container) {
    if (!openButton || !closeButton) return;

    openButton.addEventListener('click', function() {
      setPanelOpen(panel, true, true);
      closeButton.focus();
      if (panel === 'docs-nav') {
        scheduleCurrentCategoryReveal(true);
      }
    });
    closeButton.addEventListener('click', function() {
      setPanelOpen(panel, false, true);
      openButton.focus();
    });

    if (container) {
      container.addEventListener('click', function(event) {
        if (isMobile() && event.target.closest('a[href^="#"]')) {
          setPanelOpen(panel, false, false);
        }
      });
    }
  }

  bindPanel(navOpen, navClose, 'docs-nav', nav);
  bindPanel(tocOpen, tocClose, 'docs-toc', toc);
  markCurrentCategory();
  applyInitialState();
  fitSidePanel(nav);
  fitSidePanel(toc);
  updateScrollHint();
  revealCurrentCategory(false);
  initPageTransitions();
  sidebarScrolls.forEach(function(container) {
    container.addEventListener('scroll', updateScrollHint, { passive: true });
  });

  if (backdrop) {
    backdrop.addEventListener('click', function() {
      if (nav && isPanelOpen('docs-nav')) setPanelOpen('docs-nav', false, false);
      if (toc && isPanelOpen('docs-toc')) setPanelOpen('docs-toc', false, false);
    });
  }

  document.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape' || !isMobile()) return;
    if (nav && isPanelOpen('docs-nav')) setPanelOpen('docs-nav', false, false);
    if (toc && isPanelOpen('docs-toc')) setPanelOpen('docs-toc', false, false);
  });

  window.addEventListener('resize', function() {
    var mobile = isMobile();
    scheduleSidePanelFit();
    if (mobile === wasMobile) {
      updateBackdrop();
      return;
    }
    wasMobile = mobile;

    if (mobile) {
      setPanelOpen('docs-nav', false, false);
      if (toc) setPanelOpen('docs-toc', false, false);
    } else {
      setPanelOpen('docs-nav', initialPreference(navKey), false);
      if (toc) setPanelOpen('docs-toc', initialPreference(tocKey), false);
    }
    scheduleCurrentCategoryReveal(false);
  });
  window.addEventListener('scroll', scheduleStickyState, { passive: true });
  updateBackdrop();
})();
