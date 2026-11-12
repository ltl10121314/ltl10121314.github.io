(function() {
  'use strict';

  var LANGUAGE_KEY = 'liutianlong-language';
  var THEME_KEY = 'liutianlong-theme';
  var root = document.documentElement;

  var translations = {
    zh: {
      home: '首页',
      archive: '文章归档',
      archiveShort: '归档',
      profile: '关于',
      photoWall: '照片墙',
      guestbook: '留言',
      statistics: '统计',
      categories: '分类',
      navigation: '导航',
      toc: '文章目录',
      contentNav: '内容导航',
      siteNav: '站点导航',
      breadcrumb: '面包屑导航',
      closeNav: '收起内容导航',
      closeToc: '收起文章目录',
      search: '搜索文章',
      articleTitle: '文章标题',
      category: '所属分类',
      actions: '操作',
      uncategorized: '未分类',
      read: '阅读',
      readMore: '阅读全文',
      views: '阅读量',
      resumeMarkdown: 'Markdown 简历',
      resumePdf: 'PDF 简历',
      fullscreenPdf: '全屏查看',
      exitFullscreen: '退出全屏',
      closeFullscreen: '关闭',
      downloadResume: '下载 PDF',
      guestbookPrivacy: '评论由 Utterances 提供，内容公开可见。',
      guestbookComments: '留言板',
      commentsUnavailable: '留言功能暂未启用。',
      totalArticles: '文章总数',
      articlesSuffix: '篇',
      totalCategories: '分类总数',
      categoriesSuffix: '个',
      categoryDistribution: '分类分布',
      topCategoriesHint: '按文章数量排序',
      dataSource: '数据说明',
      contentCounts: '文章数与分类数根据当前站点内容自动生成。',
      readingLabel: '正在查看 {name} 下的文章',
      readingProgress: '文章阅读进度',
      readTitle: '阅读 {title}',
      readingTime: '阅读约 {minutes} 分钟',
      previous: '上一页',
      next: '下一页',
      footerCopyright: '版权所有 © {year}',
      poweredBy: '基于',
      theme: '主题',
      displaySettings: '显示设置',
      languageToggle: '切换到英文',
      themeToLight: '切换到白天模式',
      themeToDark: '切换到夜间模式',
      searchLoading: '正在加载搜索索引…',
      searchEmpty: '没有找到相关文章',
      searchSummary: '找到 {count} 篇文章',
      searchError: '搜索索引加载失败，请稍后重试',
      categoriesMap: {
        '生活随笔': '生活随笔',
        '系统与中间件': '系统与中间件',
        '数据与存储': '数据与存储',
        '开发工具': '开发工具',
        'Java 基础': 'Java 基础',
        '项目实践': '项目实践',
        '计算机网络': '计算机网络',
        '大数据': '大数据'
      }
    },
    en: {
      home: 'Home',
      archive: 'Archive',
      archiveShort: 'Archive',
      profile: 'About',
      photoWall: 'Photo Wall',
      guestbook: 'Guestbook',
      statistics: 'Statistics',
      categories: 'Categories',
      navigation: 'Navigation',
      toc: 'Table of Contents',
      contentNav: 'Content Navigation',
      siteNav: 'Site Navigation',
      breadcrumb: 'Breadcrumb',
      closeNav: 'Collapse content navigation',
      closeToc: 'Collapse table of contents',
      search: 'Search articles',
      articleTitle: 'Article',
      category: 'Category',
      actions: 'Action',
      uncategorized: 'Uncategorized',
      read: 'Read',
      readMore: 'Read More',
      views: 'Views',
      resumeMarkdown: 'Markdown Resume',
      resumePdf: 'PDF Resume',
      fullscreenPdf: 'Full Screen',
      exitFullscreen: 'Exit Full Screen',
      closeFullscreen: 'Close',
      downloadResume: 'Download PDF',
      guestbookPrivacy: 'Comments are provided by Utterances and are publicly visible.',
      guestbookComments: 'Guestbook',
      commentsUnavailable: 'Comments are currently disabled.',
      totalArticles: 'Articles',
      articlesSuffix: 'articles',
      totalCategories: 'Categories',
      categoriesSuffix: 'categories',
      categoryDistribution: 'Category distribution',
      topCategoriesHint: 'Sorted by article count',
      dataSource: 'Data notes',
      contentCounts: 'Article and category totals are generated from the current site content.',
      readingLabel: 'Reading articles in {name}',
      readingProgress: 'Article reading progress',
      readTitle: 'Read {title}',
      readingTime: 'About {minutes} min read',
      previous: 'Previous',
      next: 'Next',
      footerCopyright: 'Copyright © {year}',
      poweredBy: 'Powered by',
      theme: 'theme',
      displaySettings: 'Display settings',
      languageToggle: 'Switch to Chinese',
      themeToLight: 'Switch to light mode',
      themeToDark: 'Switch to dark mode',
      searchLoading: 'Loading search index…',
      searchEmpty: 'No matching articles found',
      searchSummary: '{count} article(s) found',
      searchError: 'Failed to load the search index. Please try again later.',
      categoriesMap: {
        '生活随笔': 'Essays',
        '系统与中间件': 'Systems & Middleware',
        '数据与存储': 'Data & Storage',
        '开发工具': 'Developer Tools',
        'Java 基础': 'Java Basics',
        '项目实践': 'Project Practice',
        '计算机网络': 'Computer Networks',
        '大数据': 'Big Data'
      }
    }
  };

  function format(template, values) {
    return String(template).replace(/\{(\w+)\}/g, function(match, key) {
      return Object.prototype.hasOwnProperty.call(values || {}, key) ? values[key] : match;
    });
  }

  function getLanguage() {
    return root.getAttribute('data-lang') === 'en' ? 'en' : 'zh';
  }

  function getTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function t(key, values) {
    var bundle = translations[getLanguage()] || translations.zh;
    var template = bundle[key];
    if (template === undefined) template = translations.zh[key];
    return template === undefined ? key : format(template, values);
  }

  function savePreference(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // Local storage may be disabled.
    }
  }

  function updateControls() {
    var language = getLanguage();
    var theme = getTheme();
    var languageButton = document.getElementById('language-toggle');
    var languageLabel = document.getElementById('language-toggle-label');
    var themeButton = document.getElementById('theme-toggle');
    var themeIcon = document.getElementById('theme-toggle-icon');

    if (languageButton) {
      languageButton.setAttribute('aria-label', t('languageToggle'));
      languageButton.setAttribute('title', t('languageToggle'));
      languageButton.setAttribute('aria-pressed', String(language === 'en'));
    }
    if (languageLabel) languageLabel.textContent = language === 'zh' ? 'EN' : '中';

    if (themeButton) {
      var themeLabel = theme === 'dark' ? t('themeToLight') : t('themeToDark');
      themeButton.setAttribute('aria-label', themeLabel);
      themeButton.setAttribute('title', themeLabel);
      themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
    }
    if (themeIcon) {
      themeIcon.className = 'fa ' + (theme === 'dark' ? 'fa-sun-o' : 'fa-moon-o');
    }
  }

  function translateAttribute(selector, attribute, keyAttribute, valueAttribute) {
    document.querySelectorAll(selector).forEach(function(element) {
      var key = element.getAttribute(keyAttribute);
      var values = {};
      if (valueAttribute && element.hasAttribute(valueAttribute)) {
        values.title = element.getAttribute(valueAttribute);
      }
      element.setAttribute(attribute, t(key, values));
    });
  }

  function translateCategories(language) {
    var map = translations[language].categoriesMap;
    document.querySelectorAll('#category-list a, .post-meta .category a, .archive-category a, .docs-breadcrumb a[href*="/categories/"], .archive-category td, .statistics-category-name').forEach(function(element) {
      var textElement = element.matches('td') ? element.querySelector('a') : element;
      if (!textElement) return;

      if (!textElement.hasAttribute('data-i18n-original')) {
        textElement.setAttribute('data-i18n-original', textElement.textContent.trim());
      }
      var original = textElement.getAttribute('data-i18n-original');
      textElement.textContent = map[original] || original;
    });
  }

  function translatePageTitles(language) {
    document.querySelectorAll('[data-title-zh][data-title-en]').forEach(function(element) {
      element.textContent = language === 'en'
        ? element.getAttribute('data-title-en')
        : element.getAttribute('data-title-zh');
    });

    var pageHeading = document.querySelector('.post-title[data-title-zh][data-title-en]');
    var siteName = document.getElementById('logo');
    if (pageHeading && siteName) {
      document.title = pageHeading.textContent + ' | ' + siteName.textContent;
    }
  }

  function applyLanguage(language, persist) {
    language = language === 'en' ? 'en' : 'zh';
    root.setAttribute('data-lang', language);
    root.setAttribute('lang', language === 'zh' ? 'zh-CN' : 'en');

    document.querySelectorAll('[data-i18n]').forEach(function(element) {
      var key = element.getAttribute('data-i18n');
      if (key === 'readingTime') {
        element.textContent = t(key, { minutes: element.getAttribute('data-minutes') || '1' });
      } else if (key === 'footerCopyright') {
        element.textContent = t(key, { year: element.getAttribute('data-year') || new Date().getFullYear() });
      } else if (key === 'readingLabel') {
        var category = element.getAttribute('data-category') || '';
        var translatedCategory = translations[language].categoriesMap[category] || category;
        element.textContent = t(key, { name: translatedCategory });
      } else {
        element.textContent = t(key);
      }
    });

    translateAttribute('[data-i18n-placeholder]', 'placeholder', 'data-i18n-placeholder');
    translateAttribute('[data-i18n-aria]', 'aria-label', 'data-i18n-aria', 'data-i18n-title-arg');
    translateAttribute('[data-i18n-title]', 'title', 'data-i18n-title', 'data-i18n-title-arg');

    document.querySelectorAll('.page-navigator a.prev, .page-navigator a.next').forEach(function(link) {
      link.textContent = t(link.classList.contains('prev') ? 'previous' : 'next');
    });

    translateCategories(language);
    translatePageTitles(language);
    if (persist) savePreference(LANGUAGE_KEY, language);
    updateControls();
    window.dispatchEvent(new CustomEvent('site-language-change', { detail: { language: language } }));
  }

  function applyTheme(theme, persist) {
    theme = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    if (persist) savePreference(THEME_KEY, theme);
    updateControls();
    window.dispatchEvent(new CustomEvent('site-theme-change', { detail: { theme: theme } }));
  }

  function bindControls() {
    var languageButton = document.getElementById('language-toggle');
    var themeButton = document.getElementById('theme-toggle');

    if (languageButton) {
      languageButton.addEventListener('click', function() {
        applyLanguage(getLanguage() === 'zh' ? 'en' : 'zh', true);
      });
    }
    if (themeButton) {
      themeButton.addEventListener('click', function() {
        applyTheme(getTheme() === 'dark' ? 'light' : 'dark', true);
      });
    }
  }

  window.SitePreferences = {
    t: t,
    getLanguage: getLanguage,
    getTheme: getTheme,
    applyLanguage: applyLanguage,
    applyTheme: applyTheme
  };

  bindControls();
  applyTheme(getTheme(), false);
  applyLanguage(getLanguage(), false);

  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  var onSystemThemeChange = function(event) {
    var hasStoredTheme = false;
    try {
      hasStoredTheme = localStorage.getItem(THEME_KEY) !== null;
    } catch (error) {}
    if (!hasStoredTheme) applyTheme(event.matches ? 'dark' : 'light', false);
  };

  if (systemTheme.addEventListener) {
    systemTheme.addEventListener('change', onSystemThemeChange);
  } else if (systemTheme.addListener) {
    systemTheme.addListener(onSystemThemeChange);
  }
})();
