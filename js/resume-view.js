(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-resume-tab]'));
    var panels = {
      markdown: document.getElementById('resume-panel-markdown'),
      pdf: document.getElementById('resume-panel-pdf')
    };
    if (!tabs.length) return;

    var fullscreenButton = document.getElementById('resume-fullscreen');
    var downloadButton = document.querySelector('.resume-download');
    var openButton = document.querySelector('.resume-open-pdf');
    var overlay = document.getElementById('resume-pdf-overlay');
    var overlayFrame = document.getElementById('resume-pdf-overlay-frame');
    var closeButton = document.getElementById('resume-pdf-close');

    if (overlay && overlay.parentNode !== document.body) {
      document.body.appendChild(overlay);
    }

    function openFullscreenPdf() {
      if (!overlay || !overlayFrame) return;
      if (!overlayFrame.getAttribute('src')) {
        overlayFrame.setAttribute('src', overlayFrame.getAttribute('data-src'));
      }
      overlay.hidden = false;
      document.body.classList.add('resume-fullscreen-open');
      if (closeButton) closeButton.focus();
    }

    function closeFullscreenPdf() {
      if (!overlay) return;
      overlay.hidden = true;
      document.body.classList.remove('resume-fullscreen-open');
      if (fullscreenButton) fullscreenButton.focus();
    }

    if (fullscreenButton) fullscreenButton.addEventListener('click', openFullscreenPdf);
    if (closeButton) closeButton.addEventListener('click', closeFullscreenPdf);
    if (overlay) {
      overlay.addEventListener('click', function(event) {
        if (event.target === overlay) closeFullscreenPdf();
      });
    }

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && overlay && !overlay.hidden) closeFullscreenPdf();
    });

    function activate(mode) {
      tabs.forEach(function(tab) {
        var active = tab.getAttribute('data-resume-tab') === mode;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
      });

      Object.keys(panels).forEach(function(key) {
        if (panels[key]) panels[key].hidden = key !== mode;
      });

      if (fullscreenButton) fullscreenButton.hidden = mode !== 'pdf';
      if (downloadButton) downloadButton.hidden = mode !== 'pdf';
      if (openButton) openButton.hidden = mode !== 'pdf';
    }

    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        activate(tab.getAttribute('data-resume-tab'));
      });
    });

    activate('markdown');
  });
})();
