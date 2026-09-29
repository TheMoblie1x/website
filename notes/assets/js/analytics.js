/* Google Analytics (GA4) for the Notes site (landing page + blog), gated by cookie consent (Consent Mode v2).
   gtag.js loads at once with analytics_storage denied (no cookies); accepting grants it, declining stops all hits.
   The consent key matches the main site, so a choice made on mobile1x.com carries over to /notes/. */
(function () {
  'use strict';
  var GA_ID = 'G-PYSXJKMRQV';
  var KEY = 'm1x-consent';
  var enabled = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode: choice lasts for this page only */ } }

  function enable() {
    window['ga-disable-' + GA_ID] = false;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    enabled = true;
  }

  function disable() {
    window['ga-disable-' + GA_ID] = true;
    gtag('consent', 'update', { analytics_storage: 'denied' });
    enabled = false;
    var parts = location.hostname.split('.');
    var domains = ['', location.hostname, parts.length > 2 ? '.' + parts.slice(-2).join('.') : '.' + location.hostname];
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0 || name === '_gid') {
        domains.forEach(function (d) { document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : ''); });
      }
    });
  }

  // Exposed so page scripts can report their own critical events (no-op without consent).
  window.notesTrack = function (name, params) { if (enabled) gtag('event', name, params || {}); };

  // --- Outbound conversion clicks: delegated, so every page is covered without touching its markup. ---
  var OUTBOUND = [
    { host: 'apps.apple.com',  event: 'app_store_click' },
    { host: 'play.google.com', event: 'play_store_click' },
    { host: 'producthunt.com', event: 'product_hunt_click' }
  ];

  // Which of the (repeated) store buttons was clicked: nav, footer, a section id, else the hero.
  function linkLocation(link) {
    if (link.closest('header')) return 'nav';
    if (link.closest('footer')) return 'footer';
    var section = link.closest('section[id]');
    return section ? section.id : 'hero';
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href]');
    if (!link) return;
    var href = link.href || '';
    for (var i = 0; i < OUTBOUND.length; i++) {
      if (href.indexOf(OUTBOUND[i].host) !== -1) {
        window.notesTrack(OUTBOUND[i].event, { link_url: href, link_domain: OUTBOUND[i].host, link_location: linkLocation(link) });
        return;
      }
    }
  }, true);

  // --- Consent UI (self-contained: these pages use their own Tailwind styling) ---
  var CSS = '.m1x-consent{position:fixed;right:16px;bottom:16px;z-index:9999;max-width:420px;padding:20px;border-radius:16px;background:#111;color:#f3f1ea;border:1px solid #3a3a40;box-shadow:0 24px 60px rgba(0,0,0,.6);font:14px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}' +
    '.m1x-consent[hidden],.m1x-consent-open[hidden]{display:none}.m1x-consent p{margin:0 0 14px;color:#a8a7a0}.m1x-consent strong{color:#f3f1ea}.m1x-consent a{color:#f4c15d}' +
    '.m1x-consent-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.m1x-consent button{min-height:44px;border-radius:999px;font:600 14px system-ui,sans-serif;cursor:pointer;border:1.5px solid #3a3a40;background:transparent;color:#f3f1ea}' +
    '.m1x-consent button[data-v=granted]{border:0;background:linear-gradient(135deg,#f4c15d,#c89b3c);color:#050505}.m1x-consent button:focus-visible,.m1x-consent-open:focus-visible{outline:3px solid #8ab4f8;outline-offset:2px}' +
    '.m1x-consent-open{position:fixed;left:12px;bottom:12px;z-index:9998;padding:8px 12px;min-height:36px;border:0;border-radius:8px;background:rgba(17,17,17,.85);color:#a8a7a0;font:12px system-ui,sans-serif;cursor:pointer}' +
    '@media(max-width:640px){.m1x-consent{left:12px;right:12px;max-width:none}}';

  function mountConsentUi() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var banner = document.createElement('section');
    banner.className = 'm1x-consent';
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.hidden = true;
    banner.innerHTML = '<p><strong>Analytics cookies.</strong> We use Google Analytics to see which pages and download links get used. Cookies are set only if you accept. <a href="https://mobile1x.com/privacy/">Privacy Policy</a></p>' +
      '<div class="m1x-consent-actions"><button type="button" data-v="denied">Decline</button><button type="button" data-v="granted">Accept</button></div>';

    var reopen = document.createElement('button');
    reopen.className = 'm1x-consent-open';
    reopen.type = 'button';
    reopen.textContent = 'Cookie settings';

    function show(open) { banner.hidden = !open; reopen.hidden = open; }
    banner.addEventListener('click', function (e) {
      var v = e.target.getAttribute && e.target.getAttribute('data-v');
      if (!v) return;
      store(v);
      if (v === 'granted') enable(); else disable();
      show(false);
    });
    reopen.addEventListener('click', function () { show(true); banner.querySelector('button').focus(); });

    document.body.appendChild(banner);
    document.body.appendChild(reopen);
    show(stored() === null);
  }

  gtag('consent', 'default', { analytics_storage: stored() === 'granted' ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  if (stored() === 'denied') window['ga-disable-' + GA_ID] = true;
  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(tag);
  gtag('js', new Date());
  gtag('config', GA_ID);
  if (stored() === 'granted') enabled = true;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountConsentUi);
  else mountConsentUi();
})();
