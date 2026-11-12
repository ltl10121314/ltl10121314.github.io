(function() {
  'use strict';

  var dialog = null;
  var largeImage = null;
  var caption = null;
  var lastTrigger = null;

  function ensureDialog() {
    if (dialog) return dialog;

    dialog = document.createElement('dialog');
    dialog.className = 'image-lightbox';
    dialog.setAttribute('aria-label', '图片预览');

    largeImage = document.createElement('img');
    largeImage.className = 'image-lightbox-image';
    largeImage.alt = '';

    caption = document.createElement('p');
    caption.className = 'image-lightbox-caption';

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'image-lightbox-close';
    close.setAttribute('aria-label', '关闭图片预览');
    close.textContent = '\u00d7';

    close.addEventListener('click', function() {
      dialog.close();
    });
    dialog.addEventListener('click', function(event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function() {
      largeImage.removeAttribute('src');
      if (lastTrigger) lastTrigger.focus();
    });

    dialog.appendChild(close);
    dialog.appendChild(largeImage);
    dialog.appendChild(caption);
    document.body.appendChild(dialog);
    return dialog;
  }

  function imageSource(image) {
    var link = image.closest('a');
    if (link && /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(link.getAttribute('href') || '')) {
      return link.href;
    }
    return image.getAttribute('data-src') || image.currentSrc || image.src;
  }

  function openImage(image) {
    if (!image || !image.src || image.classList.contains('nofancybox')) return;
    ensureDialog();
    lastTrigger = image;
    largeImage.src = imageSource(image);
    largeImage.alt = image.alt || '';
    caption.textContent = image.alt || '';
    caption.hidden = !image.alt;
    dialog.showModal();
  }

  function bindImages() {
    document.querySelectorAll('.post-content img').forEach(function(image) {
      if (image.classList.contains('nofancybox') || image.dataset.lightboxBound === 'true') return;
      image.dataset.lightboxBound = 'true';
      image.classList.add('zoomable-image');
      image.tabIndex = 0;

      image.addEventListener('click', function(event) {
        event.preventDefault();
        openImage(image);
      });
      image.addEventListener('keydown', function(event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openImage(image);
      });
    });
  }

  document.addEventListener('error', function(event) {
    if (event.target instanceof HTMLImageElement) {
      event.target.classList.add('broken-image');
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindImages);
  } else {
    bindImages();
  }
})();
