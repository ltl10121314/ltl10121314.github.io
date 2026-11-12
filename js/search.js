var searchFunc = function(path, searchId, contentId) {
  'use strict';

  var input = document.getElementById(searchId);
  var result = document.getElementById(contentId);
  if (!input || !result) return;
  if (result.parentElement !== document.body) {
    document.body.appendChild(result);
  }

  var entries = [];
  var loaded = false;
  var loadStarted = false;
  var renderTimer = null;
  var entityDecoder = document.createElement('textarea');

  function uiText(key, values) {
    if (window.SitePreferences && window.SitePreferences.t) {
      return window.SitePreferences.t(key, values);
    }
    var fallbacks = {
      searchLoading: '正在加载搜索索引…',
      searchEmpty: '没有找到相关文章',
      searchSummary: '找到 {count} 篇文章',
      searchError: '搜索索引加载失败，请稍后重试'
    };
    return (fallbacks[key] || key).replace(/\{(\w+)\}/g, function(match, name) {
      return Object.prototype.hasOwnProperty.call(values || {}, name) ? values[name] : match;
    });
  }

  function decodeEntities(value) {
    entityDecoder.innerHTML = value;
    return entityDecoder.value;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(value, terms) {
    var safe = escapeHtml(value);
    terms.forEach(function(term) {
      if (!term) return;
      var pattern = new RegExp('(' + escapeRegExp(escapeHtml(term)) + ')', 'gi');
      safe = safe.replace(pattern, '<em class="search-keyword">$1</em>');
    });
    return safe;
  }

  function positionResults() {
    if (!result.innerHTML) return;
    var rect = input.getBoundingClientRect();
    var margin = 12;
    var gap = 8;
    var viewportHeight = window.innerHeight;
    var spaceBelow = viewportHeight - rect.bottom - margin;
    var spaceAbove = rect.top - margin;
    var openAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
    var availableHeight = openAbove ? spaceAbove : spaceBelow;
    var availableWidth = Math.max(260, window.innerWidth - rect.left - margin);

    result.style.maxHeight = Math.max(120, Math.floor(availableHeight)) + 'px';
    result.style.left = Math.round(Math.max(margin, rect.left)) + 'px';
    result.style.width = Math.min(620, availableWidth) + 'px';
    if (openAbove) {
      result.style.top = 'auto';
      result.style.bottom = Math.round(viewportHeight - rect.top + gap) + 'px';
    } else {
      result.style.top = Math.round(rect.bottom + gap) + 'px';
      result.style.bottom = 'auto';
    }
  }

  function showResults(html) {
    result.innerHTML = html;
    positionResults();
  }

  function renderResults() {
    var query = input.value.trim();
    var terms = query.toLowerCase().split(/[\s-]+/).filter(Boolean);
    var html = '';
    var matches = 0;

    if (!terms.length) {
      result.innerHTML = '';
      return;
    }

    if (!loaded) {
      showResults('<p class="search-empty">' + escapeHtml(uiText('searchLoading')) + '</p>');
      return;
    }

    entries.forEach(function(entry) {
      var title = entry.title.trim();
      var content = entry.content.replace(/\s+/g, ' ').trim();
      var titleLower = title.toLowerCase();
      var contentLower = content.toLowerCase();
      var isMatch = terms.every(function(term) {
        return titleLower.indexOf(term) >= 0 || contentLower.indexOf(term) >= 0;
      });
      if (!isMatch) return;

      var firstMatch = -1;
      terms.forEach(function(term) {
        var index = contentLower.indexOf(term);
        if (index >= 0 && (firstMatch < 0 || index < firstMatch)) {
          firstMatch = index;
        }
      });

      var start = Math.max(0, firstMatch - 55);
      var excerpt = content.slice(start, start + 240);
      if (start > 0) excerpt = '…' + excerpt;
      if (start + 240 < content.length) excerpt += '…';

      html += '<li class="search-result-item">';
      html += '<a class="search-result-link" href="' + escapeHtml(entry.url) + '">';
      html += '<span class="search-result-title">' + highlight(title, terms) + '</span>';
      if (excerpt) {
        html += '<p class="search-result">' + highlight(excerpt, terms) + '</p>';
      }
      html += '</a>';
      html += '</li>';
      matches += 1;
    });

    if (!matches) {
      showResults('<p class="search-empty">' + escapeHtml(uiText('searchEmpty')) + '</p>');
      return;
    }

    showResults(
      '<div class="search-summary">' + escapeHtml(uiText('searchSummary', { count: matches }).replace(String(matches), '__COUNT__')).replace('__COUNT__', '<strong>' + matches + '</strong>') + '</div>' +
      '<ul class="search-result-list">' + html + '</ul>'
    );
  }

  function scheduleRender() {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(renderResults, 70);
  }

  function loadEntries() {
    if (loadStarted) return;
    loadStarted = true;

    fetch(path, {
      credentials: 'same-origin',
      cache: 'force-cache'
    })
      .then(function(response) {
        if (!response.ok) throw new Error('Search index request failed.');
        return response.text();
      })
      .then(function(xmlText) {
        var xml = new DOMParser().parseFromString(xmlText, 'application/xml');
        if (xml.querySelector('parsererror')) throw new Error('Search index is invalid.');

        entries = Array.prototype.map.call(xml.querySelectorAll('entry'), function(entry) {
          return {
            title: entry.querySelector('title')?.textContent || '',
            content: entry.querySelector('content')?.textContent || '',
            url: entry.querySelector('url')?.textContent || ''
          };
        });
        loaded = true;

        if (input.value.trim()) renderResults();
      })
      .catch(function() {
        loadStarted = false;
        if (input.value.trim()) {
          showResults('<p class="search-empty">' + escapeHtml(uiText('searchError')) + '</p>');
        }
      }
      );
  }

  input.addEventListener('focus', loadEntries, { once: true });
  input.addEventListener('input', function() {
    loadEntries();
    scheduleRender();
  });
  input.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape') return;
    this.value = '';
    result.innerHTML = '';
    this.blur();
  });

  document.addEventListener('click', function(event) {
    if (!input.parentElement.contains(event.target) && !result.contains(event.target)) {
      result.innerHTML = '';
    }
  });

  window.addEventListener('resize', positionResults);
  window.addEventListener('site-language-change', function() {
    if (input.value.trim()) renderResults();
  });
  var scrollContainer = input.closest('.docs-sidebar-scroll');
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', positionResults, { passive: true });
  }

};

document.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('local-search-input');
  var result = document.getElementById('local-search-result');
  if (!input || !result) return;

  var path = input.getAttribute('data-search-url') || 'search.xml';
  searchFunc(path, input.id, result.id);
});
