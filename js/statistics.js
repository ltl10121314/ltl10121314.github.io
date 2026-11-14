(function() {
  'use strict';

  var script = document.currentScript;
  var endpoint = script && String(script.dataset.endpoint || '').replace(/\/+$/, '');
  var state = null;
  var statusMode = 'idle';
  var statusSavedAt = null;
  var loading = false;
  var backgroundRetryTimer = null;
  var snapshotKey = 'liutianlong-analytics-snapshot-v1';
  var requestTimeout = 8000;
  var maxRetries = 2;

  function currentLanguage() {
    return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'zh';
  }

  function copy() {
    return currentLanguage() === 'en'
      ? {
          loading: 'Loading traffic data…',
          noData: 'No traffic data yet',
          unavailable: 'Traffic statistics are temporarily unavailable',
          cached: 'Network issue. Showing the last successful update from {time}.',
          views: 'views',
          visitors: 'visitors',
          since: 'Tracking since {date}'
        }
      : {
          loading: '正在加载访问数据…',
          noData: '暂时没有访问数据',
          unavailable: '访问数据暂不可用',
          cached: '网络连接波动，当前显示 {time} 获取的最近统计数据。',
          views: '次',
          visitors: '人',
          since: '统计起始于 {date}'
        };
  }

  function formatNumber(value) {
    return new Intl.NumberFormat(currentLanguage() === 'en' ? 'en-US' : 'zh-CN').format(value || 0);
  }

  function formatDay(day) {
    var date = new Date(day + 'T00:00:00+08:00');
    return new Intl.DateTimeFormat(currentLanguage() === 'en' ? 'en-US' : 'zh-CN', {
      month: 'numeric',
      day: 'numeric',
      timeZone: 'Asia/Shanghai'
    }).format(date);
  }

  function setMetric(id, value, suffix) {
    var valueElement = document.getElementById(id);
    var suffixElement = document.getElementById(id + '-suffix');
    if (valueElement) valueElement.textContent = formatNumber(value);
    if (suffixElement) suffixElement.textContent = suffix;
  }

  function setStatus(message, isError) {
    var status = document.getElementById('analytics-status');
    if (!status) return;
    status.textContent = message || '';
    status.hidden = !message;
    status.classList.toggle('is-error', Boolean(isError));
  }

  function renderChart(days) {
    var chart = document.getElementById('traffic-chart');
    if (!chart) return;
    chart.replaceChildren();

    var maxViews = Math.max.apply(null, [1].concat((days || []).map(function(day) {
      return Number(day.views) || 0;
    })));

    (days || []).forEach(function(day) {
      var column = document.createElement('div');
      column.className = 'traffic-chart-column';

      var value = document.createElement('span');
      value.className = 'traffic-chart-value';
      value.textContent = formatNumber(day.views);

      var track = document.createElement('span');
      track.className = 'traffic-chart-track';
      track.setAttribute('title', formatNumber(day.views) + ' ' + copy().views);

      var bar = document.createElement('span');
      bar.className = 'traffic-chart-bar';
      bar.style.height = Math.max(2, Math.round((Number(day.views) || 0) / maxViews * 100)) + '%';
      track.appendChild(bar);

      var label = document.createElement('span');
      label.className = 'traffic-chart-day';
      label.textContent = formatDay(day.day);

      column.appendChild(value);
      column.appendChild(track);
      column.appendChild(label);
      chart.appendChild(column);
    });
  }

  function renderTopPages(pages) {
    var list = document.getElementById('popular-pages');
    if (!list) return;
    list.replaceChildren();

    if (!pages || !pages.length) {
      var empty = document.createElement('li');
      empty.className = 'popular-pages-empty';
      empty.textContent = copy().noData;
      list.appendChild(empty);
      return;
    }

    pages.forEach(function(page, index) {
      var item = document.createElement('li');
      item.className = 'popular-page-item';

      var rank = document.createElement('span');
      rank.className = 'popular-page-rank';
      rank.textContent = String(index + 1).padStart(2, '0');

      var link = document.createElement('a');
      link.className = 'popular-page-link';
      link.href = page.path && page.path.charAt(0) === '/' ? page.path : '/';
      link.textContent = page.title || page.path || '/';

      var count = document.createElement('span');
      count.className = 'popular-page-count';
      count.textContent = formatNumber(page.views) + ' ' + copy().views;

      item.appendChild(rank);
      item.appendChild(link);
      item.appendChild(count);
      list.appendChild(item);
    });
  }

  function renderTrackingSince(value) {
    var element = document.getElementById('analytics-since');
    if (!element) return;
    if (!value) {
      element.textContent = '';
      return;
    }
    var date = new Date(value);
    var formatted = new Intl.DateTimeFormat(currentLanguage() === 'en' ? 'en-US' : 'zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Shanghai'
    }).format(date);
    element.textContent = copy().since.replace('{date}', formatted);
  }

  function cacheSnapshot(data) {
    try {
      localStorage.setItem(snapshotKey, JSON.stringify({
        savedAt: Date.now(),
        data: data
      }));
    } catch (error) {}
  }

  function readSnapshot() {
    try {
      var snapshot = JSON.parse(localStorage.getItem(snapshotKey) || 'null');
      if (!snapshot || !snapshot.data || !snapshot.data.ok) return null;
      if (!snapshot.data.totals || !Array.isArray(snapshot.data.days)) return null;
      if (Date.now() - Number(snapshot.savedAt) > 24 * 60 * 60 * 1000) return null;
      return snapshot;
    } catch (error) {
      return null;
    }
  }

  function formatCachedTime(timestamp) {
    return new Intl.DateTimeFormat(currentLanguage() === 'en' ? 'en-US' : 'zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Shanghai'
    }).format(new Date(timestamp));
  }

  function render(data, mode, savedAt) {
    state = data;
    statusMode = mode || 'fresh';
    statusSavedAt = savedAt || null;
    setMetric('stat-total-views', data.totals.views, copy().views);
    setMetric('stat-total-visitors', data.totals.visitors, copy().visitors);
    setMetric('stat-today-views', data.today.views, copy().views);
    setMetric('stat-week-visitors', data.week.visitors, copy().visitors);
    renderChart(data.days);
    renderTopPages(data.topPages);
    renderTrackingSince(data.trackingSince);
    if (statusMode === 'cached') {
      setStatus(copy().cached.replace('{time}', formatCachedTime(statusSavedAt)), false);
    } else {
      setStatus(data.totals.views ? '' : copy().noData, false);
    }
  }

  function renderCurrentLanguage() {
    if (state) render(state, statusMode, statusSavedAt);
  }

  function wait(delay) {
    return new Promise(function(resolve) {
      window.setTimeout(resolve, delay);
    });
  }

  function requestStats(attempt) {
    var cacheBucket = Math.floor(Date.now() / 15000);
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = controller
      ? window.setTimeout(function() {
          controller.abort();
        }, requestTimeout)
      : null;

    return fetch(endpoint + '/api/stats?cache=' + cacheBucket, {
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: controller ? controller.signal : undefined
    })
      .then(function(response) {
        if (!response.ok) throw new Error('stats_unavailable');
        return response.json();
      })
      .then(function(data) {
        if (timer) window.clearTimeout(timer);
        if (!data || !data.ok) throw new Error('stats_unavailable');
        return data;
      })
      .catch(function(error) {
        if (timer) window.clearTimeout(timer);
        if (attempt >= maxRetries) throw error;
        return wait(500 * (attempt + 1)).then(function() {
          return requestStats(attempt + 1);
        });
      });
  }

  function load() {
    if (loading) return;
    if (!endpoint) {
      statusMode = 'unavailable';
      setStatus(copy().unavailable, true);
      return;
    }
    loading = true;
    setStatus(copy().loading, false);
    requestStats(0)
      .then(function(data) {
        if (backgroundRetryTimer) {
          window.clearTimeout(backgroundRetryTimer);
          backgroundRetryTimer = null;
        }
        cacheSnapshot(data);
        render(data, 'fresh');
      })
      .catch(function() {
        var snapshot = readSnapshot();
        if (snapshot) {
          render(snapshot.data, 'cached', snapshot.savedAt);
        } else {
          statusMode = 'unavailable';
          setStatus(copy().unavailable, true);
        }
        if (!backgroundRetryTimer) {
          backgroundRetryTimer = window.setTimeout(function() {
            backgroundRetryTimer = null;
            load();
          }, 15000);
        }
      })
      .finally(function() {
        loading = false;
      });
  }

  window.addEventListener('site-language-change', renderCurrentLanguage);
  window.addEventListener('online', load);
  load();
})();
