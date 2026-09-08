/* Google Analytics (GA4) — shared bootstrap + critical-event tracking for the
   Notes site (landing page + blog). Loaded right after the gtag.js loader on
   every page so the config and event wiring live in exactly one place. */
(function () {
  'use strict';
  var GA_ID = 'G-FTJGYFC2BV';

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);

  // Exposed so page scripts can report their own critical events.
  function track(name, params) { gtag('event', name, params || {}); }
  window.notesTrack = track;

  // --- Outbound conversion clicks — delegated, so every page is covered
  //     without touching its markup or React tree. ---
  var OUTBOUND = [
    { host: 'apps.apple.com',  event: 'app_store_click' },
    { host: 'play.google.com', event: 'play_store_click' },
    { host: 'producthunt.com', event: 'product_hunt_click' }
  ];

  // Which of the (repeated) store buttons was clicked — nav, footer, a
  // section id ('download', 'product-hunt'), else the hero.
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
        track(OUTBOUND[i].event, {
          link_url: href,
          link_domain: OUTBOUND[i].host,
          link_location: linkLocation(link)
        });
        return;
      }
    }
  }, true);
})();
