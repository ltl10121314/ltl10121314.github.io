(function() {
  'use strict';

  var script = document.currentScript;
  var endpoint = script && String(script.dataset.endpoint || '').replace(/\/+$/, '');
  var target = document.querySelector('.page-view-count[data-path]');
  if (!endpoint || !target) return;

  var path = target.getAttribute('data-path');
  var cacheKey = 'liutianlong-page-views-v1:' + path;
  var maxRetries = 2;
  var requestTimeout = 8000;

  function formatNumber(value) {
    var number = Number(value) || 0;
    try {
      return new Intl.NumberFormat(
        document.documentElement.getAttribute('data-lang') === 'en' ? 'en-US' : 'zh-CN'
      ).format(number);
    } catch (error) {
      return String(number);
    }
  }

  function writeCount(value) {
    target.textContent = formatNumber(value);
    target.removeAttribute('aria-busy');
  }

  function readCache() {
    try {
      var cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (!cached || !Number.isFinite(Number(cached.views))) return null;
      if (Date.now() - Number(cached.savedAt) > 24 * 60 * 60 * 1000) return null;
      return cached;
    } catch (error) {
      return null;
    }
  }

  function writeCache(views) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        views: Number(views) || 0,
        savedAt: Date.now()
      }));
    } catch (error) {}
  }

  function wait(delay) {
    return new Promise(function(resolve) {
      window.setTimeout(resolve, delay);
    });
  }

  function requestJsonp() {
    return new Promise(function(resolve, reject) {
      var callbackName = '__liutianlongPage' + Date.now() + Math.floor(Math.random() * 100000);
      var element = document.createElement('script');
      var finished = false;
      var timer = window.setTimeout(function() {
        finish(new Error('page_stats_timeout'));
      }, requestTimeout);

      function finish(error, data) {
        if (finished) return;
        finished = true;
        window.clearTimeout(timer);
        if (element.parentNode) element.parentNode.removeChild(element);
        try {
          delete window[callbackName];
        } catch (cleanupError) {
          window[callbackName] = undefined;
        }
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      }

      window[callbackName] = function(data) {
        if (!data || !data.ok) {
          finish(new Error('page_stats_unavailable'));
          return;
        }
        finish(null, data);
      };
      element.async = true;
      element.onerror = function() {
        finish(new Error('page_stats_unavailable'));
      };
      element.src = endpoint + '/api/page?path=' + encodeURIComponent(path) +
        '&cache=' + Math.floor(Date.now() / 15000) +
        '&callback=' + callbackName;
      (document.head || document.documentElement).appendChild(element);
    });
  }

  function request(attempt) {
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = controller
      ? window.setTimeout(function() {
          controller.abort();
        }, requestTimeout)
      : null;
    var url = endpoint + '/api/page?path=' + encodeURIComponent(path) +
      '&cache=' + Math.floor(Date.now() / 15000);

    return fetch(url, {
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: controller ? controller.signal : undefined
    })
      .then(function(response) {
        if (!response.ok) throw new Error('page_stats_unavailable');
        return response.json();
      })
      .then(function(data) {
        if (timer) window.clearTimeout(timer);
        if (!data || !data.ok) throw new Error('page_stats_unavailable');
        return data;
      })
      .catch(function(error) {
        if (timer) window.clearTimeout(timer);
        if (attempt >= maxRetries) {
          return requestJsonp().catch(function() {
            throw error;
          });
        }
        return wait(500 * (attempt + 1)).then(function() {
          return request(attempt + 1);
        });
      });
  }

  var cached = readCache();
  if (cached) writeCount(cached.views);
  target.setAttribute('aria-busy', 'true');

  request(0)
    .then(function(data) {
      writeCache(data.views);
      writeCount(data.views);
    })
    .catch(function() {
      if (!cached) target.textContent = '—';
      target.removeAttribute('aria-busy');
    });
})();
