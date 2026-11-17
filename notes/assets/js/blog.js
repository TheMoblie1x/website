/* Notes blog behaviour: theme, list filter, device-aware install buttons, reading events, and a fallback that
   lists posts published from the studio before the next site build has pre-rendered them. */
(function () {
  'use strict';
  var root = document.documentElement;
  var track = function (name, params) { if (window.m1xTrack) window.m1xTrack(name, params || {}); };
  var os = window.m1xDeviceOS ? window.m1xDeviceOS() : 'desktop';
  var APPLE = 'https://apps.apple.com/us/app/notes-voice-record-ai/id6798175378';
  var PLAY = 'https://play.google.com/store/apps/details?id=com.rp.notes';

  /* Theme */
  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('app-theme', next); } catch (e) { /* private mode */ }
    track('theme_toggle', { theme_after: next });
  });

  /* Device-aware install buttons */
  if (os === 'android') document.querySelectorAll('[data-badges]').forEach(function (g) {
    var play = g.querySelector('.badge--play');
    if (play) g.insertBefore(play, g.firstChild);
  });
  document.querySelectorAll('[data-store-cta]').forEach(function (a) {
    if (os === 'ios' || os === 'android') { a.href = os === 'ios' ? APPLE : PLAY; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  });

  /* Reveal on scroll */
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(function (n) { n.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.1 });
    items.forEach(function (n) { io.observe(n); });
  }

  /* Post page: which guide was opened, and whether it was read to the end */
  var post = document.getElementById('post');
  if (post) {
    var slug = post.getAttribute('data-post-slug'), type = post.getAttribute('data-post-type');
    track('post_view', { post_slug: slug, post_type: type, device_os: os });
    var end = document.getElementById('post-end');
    if (end && 'IntersectionObserver' in window) {
      var done = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { track('post_read_complete', { post_slug: slug, post_type: type }); done.disconnect(); }
      });
      done.observe(end);
    }
  }

  /* Index: filter chips + fallback for posts not yet pre-rendered */
  var grid = document.getElementById('post-grid');
  if (grid && document.querySelector('.filters')) {
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
    var apply = function (filter) {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-filter') === filter ? 'true' : 'false'); });
      grid.querySelectorAll('.post-card').forEach(function (card) {
        card.hidden = !(filter === 'all' || card.getAttribute('data-type') === filter);
      });
    };
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        apply(c.getAttribute('data-filter'));
        track('blog_filter_click', { filter: c.getAttribute('data-filter') });
      });
    });

    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); };
    fetch('/notes/blogs/data/posts.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.posts) return;
        var have = {};
        grid.querySelectorAll('.post-card').forEach(function (c) { have[c.getAttribute('data-slug')] = true; });
        var added = 0;
        data.posts.filter(function (p) { return p.published && !have[p.slug]; }).forEach(function (p) {
          var a = document.createElement('article');
          a.className = 'post-card in'; a.setAttribute('data-type', p.type); a.setAttribute('data-slug', p.slug);
          a.innerHTML = '<a href="/notes/blogs/post.html?slug=' + encodeURIComponent(p.slug) + '" class="post-card__link"><div class="post-card__body">' +
            '<p class="post-card__meta"><span class="tag tag--' + esc(p.type) + '">' + (p.type === 'howto' ? 'How-to' : 'Article') + '</span></p>' +
            '<h3>' + esc(p.title) + '</h3><p>' + esc(p.excerpt) + '</p></div></a>';
          grid.insertBefore(a, grid.firstChild);
          added++;
        });
        if (added) apply((chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; })[0] || chips[0]).getAttribute('data-filter'));
      })
      .catch(function () { /* the pre-rendered list is already complete as of the last build */ });
  }
})();
