(function() {
  'use strict';

  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  document.documentElement.classList.toggle('is-safari', isSafari);

  function renderEmpty(container) {
    var empty = document.createElement('p');
    empty.className = 'photo-wall-empty';

    var zh = document.createElement('span');
    zh.setAttribute('data-lang-content', 'zh');
    zh.textContent = container.getAttribute('data-empty-zh') || '暂无照片';

    var en = document.createElement('span');
    en.setAttribute('data-lang-content', 'en');
    en.textContent = container.getAttribute('data-empty-en') || 'No photos yet';

    empty.appendChild(zh);
    empty.appendChild(en);
    container.appendChild(empty);
  }

  function renderPhotos(container, photos) {
    container.innerHTML = '';
    var intro = document.getElementById('photo-wall-intro');
    if (intro) intro.hidden = photos.length > 0;
    if (!photos.length) {
      renderEmpty(container);
      return;
    }

    photos.forEach(function(photo, index) {
      var figure = document.createElement('figure');
      figure.className = 'photo-wall-item';
      figure.style.setProperty('--reveal-delay', Math.min(index * 45, 360) + 'ms');

      var link = document.createElement('a');
      link.className = 'photo-wall-link';
      link.href = photo.large || photo.src;

      var image = document.createElement('img');
      image.className = 'photo-wall-image';
      image.src = photo.thumbnail || photo.src;
      image.alt = photo.alt || ('Photo ' + (index + 1));
      image.loading = 'lazy';
      image.decoding = 'async';
      image.draggable = false;
      if (photo.width && photo.height) {
        image.width = photo.width;
        image.height = photo.height;
      }
      if (isSafari && index < 3) image.loading = 'eager';

      link.appendChild(image);
      figure.appendChild(link);

      container.appendChild(figure);
    });

    observeReveal(container);
    bindTilt(container);
    bindLightbox(container);
    layoutMasonry(container);
  }

  function bindLightbox(container) {
    var lightbox = document.getElementById('photo-lightbox');
    var image = document.getElementById('photo-lightbox-image');
    var counter = document.getElementById('photo-lightbox-counter');
    var closeButton = document.getElementById('photo-lightbox-close');
    var prevButton = document.getElementById('photo-lightbox-prev');
    var nextButton = document.getElementById('photo-lightbox-next');
    var links = Array.prototype.slice.call(container.querySelectorAll('.photo-wall-link'));
    var current = 0;
    if (!lightbox || !image || !links.length) return;

    // Backdrop-filter on the reading card creates a containing block for fixed
    // descendants. Keep the viewer at the document root so it always covers
    // the complete viewport.
    if (lightbox.parentNode !== document.body) {
      document.body.appendChild(lightbox);
    }

    function show(index) {
      current = (index + links.length) % links.length;
      var link = links[current];
      var sourceImage = link.querySelector('img');
      image.src = link.href;
      image.alt = sourceImage ? sourceImage.alt : '';
      if (counter) counter.textContent = (current + 1) + ' / ' + links.length;
      lightbox.classList.remove('is-loading');
    }

    function open(index) {
      lightbox.classList.add('is-loading');
      show(index);
      lightbox.hidden = false;
      document.body.classList.add('photo-lightbox-open');
      if (closeButton) closeButton.focus();
    }

    function close() {
      lightbox.hidden = true;
      document.body.classList.remove('photo-lightbox-open');
      image.removeAttribute('src');
    }

    links.forEach(function(link, index) {
      link.addEventListener('click', function(event) {
        event.preventDefault();
        open(index);
      });
    });

    image.addEventListener('load', function() {
      lightbox.classList.remove('is-loading');
    });
    image.addEventListener('error', function() {
      lightbox.classList.remove('is-loading');
    });

    if (closeButton) closeButton.addEventListener('click', close);
    if (prevButton) {
      prevButton.addEventListener('click', function() {
        lightbox.classList.add('is-loading');
        show(current - 1);
      });
    }
    if (nextButton) {
      nextButton.addEventListener('click', function() {
        lightbox.classList.add('is-loading');
        show(current + 1);
      });
    }

    lightbox.addEventListener('click', function(event) {
      if (event.target === lightbox) close();
    });

    document.addEventListener('keydown', function(event) {
      if (lightbox.hidden) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') show(current - 1);
      if (event.key === 'ArrowRight') show(current + 1);
    });
  }

  function observeReveal(container) {
    var items = Array.prototype.slice.call(container.querySelectorAll('.photo-wall-item'));
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isSafari || reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function(item) { item.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0.08 });

    items.forEach(function(item) { observer.observe(item); });
  }

  function bindTilt(container) {
    var supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isSafari || !supportsHover || reduceMotion) return;

    container.addEventListener('pointermove', function(event) {
      var rect = container.getBoundingClientRect();
      container.style.setProperty('--spot-x', (event.clientX - rect.left) + 'px');
      container.style.setProperty('--spot-y', (event.clientY - rect.top) + 'px');
    });

    container.querySelectorAll('.photo-wall-item').forEach(function(item) {
      item.addEventListener('pointermove', function(event) {
        var rect = item.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;
        item.style.setProperty('--tilt-x', (-y * 7).toFixed(2) + 'deg');
        item.style.setProperty('--tilt-y', (x * 7).toFixed(2) + 'deg');
      });

      item.addEventListener('pointerleave', function() {
        item.style.setProperty('--tilt-x', '0deg');
        item.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  function layoutMasonry(container) {
    var styles = window.getComputedStyle(container);
    var columns = styles.gridTemplateColumns.trim().split(/\s+/).length || 1;
    var columnGap = parseFloat(styles.columnGap) || 18;
    var horizontalPadding = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    var columnWidth = (container.clientWidth - horizontalPadding - columnGap * (columns - 1)) / columns;

    if (!columnWidth || columnWidth < 1) return;

    container.querySelectorAll('.photo-wall-item').forEach(function(item) {
      var image = item.querySelector('.photo-wall-image');
      var width = image ? Number(image.getAttribute('width')) : 0;
      var height = image ? Number(image.getAttribute('height')) : 0;
      if (!width || !height) return;

      var borderHeight = 2;
      var imageHeight = (columnWidth - borderHeight) * height / width;
      item.style.gridRowEnd = 'span ' + Math.ceil((imageHeight + borderHeight + columnGap) / (1 + columnGap));
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    var container = document.getElementById('photo-wall-grid');
    if (!container) return;

    var resizeFrame = 0;
    window.addEventListener('resize', function() {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(function() {
        layoutMasonry(container);
      });
    });

    fetch(container.getAttribute('data-manifest'), { cache: 'no-store' })
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to load photo manifest');
        return response.json();
      })
      .then(function(data) {
        renderPhotos(container, Array.isArray(data.photos) ? data.photos : []);
      })
      .catch(function() {
        renderEmpty(container);
      });
  });
})();
