(function() {
  'use strict';

  function initArticleTools() {
    var progress = document.getElementById('reading-progress');
    var progressFill = document.getElementById('reading-progress-fill');
    var article = document.querySelector('.post-content');
    var tocContainer = document.getElementById('toc');
    var tocLinks = Array.prototype.slice.call(
      document.querySelectorAll('#toc a[href^="#"]')
    );
    var tocItems = tocLinks.map(function(link) {
      var id;
      try {
        id = decodeURIComponent(link.getAttribute('href').slice(1));
      } catch (error) {
        id = link.getAttribute('href').slice(1);
      }
      var heading = document.getElementById(id);
      return heading ? { link: link, heading: heading } : null;
    }).filter(Boolean);
    var activeIndex = -1;
    var articleEnd = 1;
    var articleStart = 0;
    var headingPositions = [];
    var lastProgressPercent = -1;
    var measureTicking = false;
    var ticking = false;

    function measureLayout() {
      if (!article) return;

      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      articleStart = Math.max(0, article.getBoundingClientRect().top + scrollTop - 120);
      var articleBottom = articleStart + article.offsetHeight;
      articleEnd = Math.max(articleStart + 1, articleBottom - window.innerHeight + 140);
      headingPositions = tocItems.map(function(item) {
        return item.heading.getBoundingClientRect().top + scrollTop;
      });
      measureTicking = false;
    }

    function scheduleMeasure() {
      if (measureTicking) return;
      measureTicking = true;
      window.requestAnimationFrame(measureLayout);
    }

    function findActiveHeading(scrollTop, threshold) {
      var target = scrollTop + threshold;
      var low = 0;
      var high = headingPositions.length - 1;
      var result = 0;

      while (low <= high) {
        var middle = Math.floor((low + high) / 2);
        if (headingPositions[middle] <= target) {
          result = middle;
          low = middle + 1;
        } else {
          high = middle - 1;
        }
      }
      return result;
    }

    function updateProgress() {
      if (!progress || !progressFill || !article) return;

      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var value = Math.min(1, Math.max(0, (scrollTop - articleStart) / (articleEnd - articleStart)));
      var percent = Math.round(value * 100);

      progressFill.style.transform = 'scaleX(' + value + ')';
      if (percent !== lastProgressPercent) {
        progress.setAttribute('aria-valuenow', String(percent));
        progress.setAttribute('aria-valuetext', percent + '%');
        lastProgressPercent = percent;
      }
    }

    function revealActiveTocItem(item) {
      if (!tocContainer || !item || tocContainer.clientHeight <= 0) return;

      var containerRect = tocContainer.getBoundingClientRect();
      var itemRect = item.link.getBoundingClientRect();
      var topBoundary = containerRect.top + Math.min(24, containerRect.height * 0.18);
      var bottomBoundary = containerRect.bottom - Math.min(24, containerRect.height * 0.18);
      if (itemRect.top >= topBoundary && itemRect.bottom <= bottomBoundary) return;

      var itemCenter = itemRect.top - containerRect.top + tocContainer.scrollTop + itemRect.height / 2;
      var maxScroll = Math.max(0, tocContainer.scrollHeight - tocContainer.clientHeight);
      var target = Math.max(0, Math.min(maxScroll, itemCenter - tocContainer.clientHeight / 2));
      if (Math.abs(target - tocContainer.scrollTop) < 2) return;

      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (tocContainer.scrollTo) {
        tocContainer.scrollTo({
          top: target,
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
      } else {
        tocContainer.scrollTop = target;
      }
    }

    function updateActiveHeading() {
      if (!tocItems.length) return;

      var nextIndex = findActiveHeading(
        window.pageYOffset || document.documentElement.scrollTop,
        Math.min(180, window.innerHeight * 0.32)
      );

      if (nextIndex !== activeIndex) {
        tocItems.forEach(function(item, index) {
          var isActive = index === nextIndex;
          item.link.classList.toggle('active', isActive);
          if (isActive) {
            item.link.setAttribute('aria-current', 'location');
          } else {
            item.link.removeAttribute('aria-current');
          }
        });
        activeIndex = nextIndex;
        revealActiveTocItem(tocItems[activeIndex]);
      }
    }

    function update() {
      updateProgress();
      updateActiveHeading();
      ticking = false;
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', function() {
      scheduleMeasure();
      requestUpdate();
    });
    window.addEventListener('load', scheduleMeasure);

    if (article && window.ResizeObserver) {
      new ResizeObserver(scheduleMeasure).observe(article);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleMeasure);
    }

    tocLinks.forEach(function(link) {
      link.addEventListener('click', function(event) {
        var id;
        try {
          id = decodeURIComponent(link.getAttribute('href').slice(1));
        } catch (error) {
          id = link.getAttribute('href').slice(1);
        }
        var target = document.getElementById(id);
        if (!target) return;

        event.preventDefault();
        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start'
        });
        if (history.replaceState) {
          history.replaceState(null, '', '#' + encodeURIComponent(id));
        }
      });
    });

    measureLayout();
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArticleTools);
  } else {
    initArticleTools();
  }
})();
