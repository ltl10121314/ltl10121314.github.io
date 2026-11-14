(function() {
  'use strict';

  var script = document.currentScript;
  var endpoint = script && String(script.dataset.endpoint || '').replace(/\/+$/, '');
  var siteId = script && script.dataset.siteId;
  var trackedHosts = ['liutianlong.top', 'www.liutianlong.top'];
  var visitorKey = 'liutianlong-analytics-visitor';

  if (!endpoint || !siteId || trackedHosts.indexOf(window.location.hostname) === -1) return;

  function privacySignalEnabled() {
    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    return dnt === '1' || dnt === 'yes' || navigator.globalPrivacyControl === true;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID().replace(/-/g, '');
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 14);
  }

  function getVisitorId() {
    try {
      var value = localStorage.getItem(visitorKey);
      if (/^[a-zA-Z0-9_-]{8,128}$/.test(value || '')) return value;
      value = createId();
      localStorage.setItem(visitorKey, value);
      return value;
    } catch (error) {
      return createId();
    }
  }

  function trackPageView() {
    if (privacySignalEnabled()) return;
    fetch(endpoint + '/api/track', {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      keepalive: true,
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId: siteId,
        eventId: createId(),
        visitorId: getVisitorId(),
        path: window.location.pathname,
        title: document.title
      })
    }).catch(function() {});
  }

  if (document.readyState === 'complete') {
    trackPageView();
  } else {
    window.addEventListener('load', trackPageView, { once: true });
  }
})();
