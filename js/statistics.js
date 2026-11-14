(function() {
  'use strict';

  var script = document.currentScript;
  var endpoint = script && String(script.dataset.endpoint || '').replace(/\/+$/, '');
  var state = null;

  function currentLanguage() {
    return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'zh';
  }

  function copy() {
    return currentLanguage() === 'en'
      ? {
          loading: 'Loading traffic data…',
          noData: 'No traffic data yet',
          unavailable: 'Traffic statistics are temporarily unavailable',
          views: 'views',
          visitors: 'visitors',
          since: 'Tracking since {date}'
        }
      : {
          loading: '正在加载访问数据…',
          noData: '暂时没有访问数据',
          unavailable: '访问数据暂不可用',
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

  function render(data) {
    state = data;
    setMetric('stat-total-views', data.totals.views, copy().views);
    setMetric('stat-total-visitors', data.totals.visitors, copy().visitors);
    setMetric('stat-today-views', data.today.views, copy().views);
    setMetric('stat-week-visitors', data.week.visitors, copy().visitors);
    renderChart(data.days);
    renderTopPages(data.topPages);
    renderTrackingSince(data.trackingSince);
    setStatus(data.totals.views ? '' : copy().noData, false);
  }

  function renderCurrentLanguage() {
    if (state) render(state);
  }

  function load() {
    if (!endpoint) {
      setStatus(copy().unavailable, true);
      return;
    }
    setStatus(copy().loading, false);
    fetch(endpoint + '/api/stats', {
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    })
      .then(function(response) {
        if (!response.ok) throw new Error('stats_unavailable');
        return response.json();
      })
      .then(function(data) {
        if (!data || !data.ok) throw new Error('stats_unavailable');
        render(data);
      })
      .catch(function() {
        setStatus(copy().unavailable, true);
      });
  }

  window.addEventListener('site-language-change', renderCurrentLanguage);
  load();
})();
