/* Notes landing page behaviour: theme, feature tabs, device-aware install buttons, sticky bar, reveal-on-scroll.
   Events go through window.m1xTrack (analytics.js), so they are consent-gated like everything else. */
(function () {
  'use strict';
  var root = document.documentElement;
  var track = function (name, params) { if (window.m1xTrack) window.m1xTrack(name, params || {}); };
  var os = window.m1xDeviceOS ? window.m1xDeviceOS() : 'desktop';
  var APPLE = 'https://apps.apple.com/us/app/notes-voice-record-ai/id6798175378';
  var PLAY = 'https://play.google.com/store/apps/details?id=com.rp.notes';

  /* ---------- Landing view: which device the visitor is on, and which theme they see ---------- */
  track('notes_landing_view', { device_os: os, theme: root.getAttribute('data-theme') });

  /* ---------- Theme ---------- */
  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('app-theme', next); } catch (e) { /* private mode: lasts for this page only */ }
      track('theme_toggle', { theme_after: next });
    });
  }

  /* ---------- Device-aware install buttons: the visitor's own store first, and a direct link where it helps ---------- */
  if (os === 'android') { // the markup already lists the App Store first, which suits iPhone and desktop
    document.querySelectorAll('[data-badges]').forEach(function (group) {
      var play = group.querySelector('.badge--play');
      if (play) group.insertBefore(play, group.firstChild);
    });
  }
  document.querySelectorAll('[data-store-cta]').forEach(function (a) {
    if (os === 'ios' || os === 'android') {
      a.href = os === 'ios' ? APPLE : PLAY;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    } // on desktop the button scrolls to the download section
  });

  /* ---------- Feature tabs ---------- */
  var tabsRoot = document.querySelector('[data-tabs]');
  if (tabsRoot) {
    var tabs = Array.prototype.slice.call(tabsRoot.querySelectorAll('[role="tab"]'));
    var used = 0;
    var select = function (tab, focus, fromUser) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
      if (fromUser) { used++; track('feature_tab_click', { feature: tab.getAttribute('data-feature'), tabs_used: used, device_os: os }); }
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false, true); });
      tab.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : -1;
        if (j > -1) { e.preventDefault(); select(tabs[j], true, true); }
      });
    });
  }

  /* ---------- Sticky install bar: shown once the hero is out of view ---------- */
  var sticky = document.getElementById('sticky');
  var hero = document.getElementById('hero');
  var download = document.getElementById('download');
  if (sticky && hero && 'IntersectionObserver' in window) {
    var heroGone = false, ctaVisible = false, shown = false;
    var update = function () {
      var show = heroGone && !ctaVisible;
      sticky.hidden = !show;
      if (show && !shown) { shown = true; track('sticky_cta_shown', { device_os: os }); }
    };
    new IntersectionObserver(function (e) { heroGone = !e[0].isIntersecting; update(); }).observe(hero);
    if (download) new IntersectionObserver(function (e) { ctaVisible = e[0].isIntersecting; update(); }).observe(download);
  }

  /* ---------- Reveal on scroll ---------- */
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(function (n) { n.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (n) { io.observe(n); });
  }
})();
