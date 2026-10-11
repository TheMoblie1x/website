/* Mobile1X behaviour analytics: what visitors read, skip, click and abandon.
   Built on window.m1xTrack (site.js), so every event is consent-gated: queued until the visitor chooses,
   sent on Accept, dropped on Decline. No typed text is ever sent, only field names, choice values and
   the length and place of selected passages. */
(function () {
    var send = window.m1xTrack;
    if (!send) return;

    var SCROLL_STEPS = [25, 50, 75, 90];
    var ENGAGED_STEPS = [15, 30, 60, 120, 300]; // seconds of active, visible time
    var IDLE_MS = 5000;                         // no input for this long stops the engaged clock
    var SECTIONS = 'section[data-loc], section[id]:not(#consent)';
    var LATE_SECTIONS_MS = 15000;               // how long to keep watching for client-rendered sections
    var SECTION_MIN_VISIBLE = 0.4;
    var SECTION_DWELL_MS = 1000;                // a section only counts as seen after this long on screen
    var RAGE = { clicks: 3, ms: 1000, px: 30 };
    var MAX_ERRORS = 5;
    var DOWNLOAD = /\.(pdf|zip|docx?|xlsx?|pptx?|csv|apk|dmg)(\?|#|$)/i;

    var submitted = false;
    var formStartedAt = 0;
    window.m1xTrack = function (name, params) { // observe the lead funnel for form_abandon and form_time_to_submit
        if (name === 'contact_form_start') formStartedAt = Date.now();
        if (name === 'contact_form_submit') {
            submitted = true;
            if (formStartedAt) send('form_time_to_submit', { seconds: Math.round((Date.now() - formStartedAt) / 1000), link_location: (params || {}).link_location });
        }
        send(name, params);
    };

    function once() {
        var seen = {};
        return function (key) { return seen[key] ? false : (seen[key] = true); };
    }
    function onSections(cb) { // every matching <section> now, plus client-rendered ones that appear within LATE_SECTIONS_MS
        var known = [];
        function scan() {
            document.querySelectorAll(SECTIONS).forEach(function (n) { if (known.indexOf(n) === -1) { known.push(n); cb(n); } });
        }
        scan();
        var late = new MutationObserver(scan);
        late.observe(document.body, { childList: true, subtree: true });
        setTimeout(function () { late.disconnect(); }, LATE_SECTIONS_MS);
    }
    function label(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60); }
    function where(el) { // data-loc on the main site; section id / header / footer on the Notes pages
        var host = el.closest('[data-loc]');
        if (host) return host.getAttribute('data-loc');
        var block = el.closest('section[id], header, footer');
        return block ? (block.id || block.tagName.toLowerCase()) : 'page';
    }

    /* ---------- Sections read: <section data-loc> (main site) or <section id> (Notes, rendered by React) ---------- */
    var sectionsSeen = 0;
    (function () {
        if (!('IntersectionObserver' in window)) return;
        var nodes = [];
        var timers = [];
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var i = nodes.indexOf(entry.target);
                if (entry.isIntersecting) {
                    timers[i] = setTimeout(function () {
                        observer.unobserve(entry.target);
                        sectionsSeen++;
                        send('section_view', { section: entry.target.getAttribute('data-loc') || entry.target.id, section_index: i });
                    }, SECTION_DWELL_MS);
                } else {
                    clearTimeout(timers[i]);
                }
            });
        }, { threshold: SECTION_MIN_VISIBLE });
        onSections(function (n) { nodes.push(n); observer.observe(n); });
    })();

    /* ---------- Scroll depth ---------- */
    var maxScroll = 0;
    (function () {
        var first = once();
        var ticking = false;
        function measure() {
            ticking = false;
            var doc = document.documentElement;
            var pct = Math.min(100, Math.round((window.scrollY + window.innerHeight) / doc.scrollHeight * 100));
            maxScroll = Math.max(maxScroll, pct);
            SCROLL_STEPS.forEach(function (step) {
                if (pct >= step && first(step)) send('scroll_depth', { percent: step });
            });
        }
        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(measure); }
        }, { passive: true });
    })();

    /* ---------- Engaged time: visible tab and recent input only ---------- */
    var engaged = 0;
    (function () {
        var lastInput = Date.now();
        var first = once();
        ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'].forEach(function (type) {
            window.addEventListener(type, function () { lastInput = Date.now(); }, { passive: true });
        });
        setInterval(function () {
            if (document.visibilityState !== 'visible' || Date.now() - lastInput > IDLE_MS) return;
            engaged++;
            if (ENGAGED_STEPS.indexOf(engaged) !== -1 && first(engaged)) send('engaged_time', { seconds: engaged });
        }, 1000);
    })();

    /* ---------- FAQ / accordion ---------- */
    document.addEventListener('toggle', function (e) { // toggle does not bubble, so capture
        var d = e.target;
        if (d.tagName !== 'DETAILS') return;
        var summary = d.querySelector('summary');
        send('faq_toggle', { question: summary ? label(summary) : '', state: d.open ? 'open' : 'close', link_location: where(d) });
    }, true);

    /* ---------- Links: downloads, outbound, internal navigation ---------- */
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href') || '';
        var loc = where(a);
        if (DOWNLOAD.test(href)) {
            send('file_download', { file_name: href.split('/').pop().split(/[?#]/)[0], link_location: loc });
        } else if (/^https?:$/.test(a.protocol) && a.host !== location.host) {
            send('outbound_click', { link_domain: a.hostname, link_url: a.href, link_location: loc });
        } else if (a.host === location.host && !a.classList.contains('btn')) { // .btn is already cta_click
            send('internal_link_click', { link_url: a.pathname + a.hash, link_text: label(a), link_location: loc });
        }
    }, true);

    /* ---------- Lead form funnel ---------- */
    (function () {
        var form = document.getElementById('project-form');
        if (!form) return;
        var done = once();
        var completed = 0;
        var lastField = '';
        function field(el) { return el.id ? el.id.replace(/^f-/, '') : el.name; }

        form.addEventListener('change', function (e) {
            var el = e.target;
            if (!el.name || el.name === 'bot-field' || !el.value) return;
            if (!done(field(el))) { send('form_field_correction', { field: field(el) }); return; } // changed again after its first entry
            completed++;
            lastField = field(el);
            var params = { field: lastField, fields_completed: completed };
            if (el.tagName === 'SELECT') params.field_value = el.value; // a category, never free text
            send('form_field_complete', params);
        });
        var focusedAt = 0;
        var timeSent = once();
        form.addEventListener('focusin', function (e) { if (e.target.name && e.target.name !== 'bot-field') focusedAt = Date.now(); });
        form.addEventListener('focusout', function (e) { // seconds spent in a field: where people hesitate
            if (!focusedAt || !e.target.name) return;
            var seconds = Math.round((Date.now() - focusedAt) / 1000);
            focusedAt = 0;
            if (seconds >= 2 && timeSent(field(e.target))) send('form_field_time', { field: field(e.target), seconds: seconds });
        });
        var flagged = {};
        form.addEventListener('invalid', function (e) { // fired by both checkValidity and reportValidity
            var name = field(e.target);
            if (flagged[name]) return;
            flagged[name] = true;
            setTimeout(function () { delete flagged[name]; }, 0);
            send('form_field_error', { field: name });
        }, true);

        function abandon() {
            if (submitted || !completed || !done('abandon')) return;
            send('form_abandon', { fields_completed: completed, last_field: lastField, transport_type: 'beacon' });
        }
        document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') abandon(); });
        window.addEventListener('pagehide', abandon);
    })();

    /* ---------- Copying contact details ---------- */
    document.addEventListener('copy', function () {
        var text = String(window.getSelection() || '');
        if (/@/.test(text)) send('copy_contact', { content_type: 'email' });
        else if (/\+?\d[\d\s-]{8,}/.test(text)) send('copy_contact', { content_type: 'phone' });
        else if (text.length >= 15) send('copy_text', { length: text.length });
    });

    /* ---------- Frustration: repeated clicks on the same spot ---------- */
    (function () {
        var recent = [];
        document.addEventListener('pointerdown', function (e) {
            var now = Date.now();
            recent = recent.filter(function (c) { return now - c.t < RAGE.ms; });
            recent.push({ t: now, x: e.clientX, y: e.clientY });
            var near = recent.filter(function (c) { return Math.abs(c.x - e.clientX) < RAGE.px && Math.abs(c.y - e.clientY) < RAGE.px; });
            if (near.length < RAGE.clicks) return;
            recent = [];
            send('rage_click', { target: e.target.tagName.toLowerCase() + ': ' + label(e.target).slice(0, 40), link_location: where(e.target) });
        }, true);
    })();

    /* ---------- Problems: script errors and dead links ---------- */
    (function () {
        var errors = 0;
        window.addEventListener('error', function (e) {
            if (errors++ >= MAX_ERRORS) return;
            send('js_error', { message: String(e.message).slice(0, 100), source: (e.filename || '').split('/').pop().slice(0, 60), line: e.lineno });
        });
        if (document.title.indexOf('Page not found') === 0) {
            var ref = document.referrer ? new URL(document.referrer).hostname : '(direct)';
            send('page_not_found', { requested_path: location.pathname, referrer: ref });
        }
    })();

    /* ---------- Store clicks: which app, which store ---------- */
    (function () {
        var STORES = { 'play.google.com': 'google_play', 'apps.apple.com': 'app_store' };
        document.addEventListener('click', function (e) {
            var a = e.target.closest && e.target.closest('a[href]');
            var store = a && STORES[a.hostname];
            if (!store) return;
            send('store_click', { app: /dedup/i.test(a.href) ? 'dedup' : /notes/i.test(a.href) ? 'notes' : 'other', store: store, link_location: where(a) });
        }, true);
    })();

    /* ---------- Hero showcase: what visitors pick, pause, spin and actually get shown ---------- */
    (function () {
        var stage = document.getElementById('stage');
        if (!stage) return;
        var infos = stage.querySelector('.stage__infos');
        var names = stage.querySelectorAll('.rail__name');
        var seen = once();
        var visible = false;
        function product(i) { return names[i] ? label(names[i]) : ''; }
        function activeIndex() {
            var active = stage.querySelector('.info.is-active');
            return active ? Number(active.getAttribute('data-index')) : -1;
        }

        stage.addEventListener('click', function (e) {
            var item = e.target.closest('.rail__item');
            var index = item ? Number(item.getAttribute('data-index')) : -1;
            if (item) send('showcase_select', { product: product(index), item_index: index });
            else if (e.target.closest('.stage__pause')) send('showcase_pause', { state: e.target.closest('.stage__pause').getAttribute('aria-pressed') === 'true' ? 'paused' : 'playing' });
            else if (e.target.closest('.stage__spin')) send('showcase_spin', { product: product(activeIndex()) });
        });

        function slideShown() { // counts the slide on screen, whether the visitor picked it or the carousel advanced
            var i = activeIndex();
            if (visible && i >= 0 && seen(i)) send('showcase_slide_view', { product: product(i), item_index: i });
        }
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; slideShown(); }, { threshold: 0.3 }).observe(stage);
            if (infos) new MutationObserver(slideShown).observe(infos, { attributes: true, subtree: true, attributeFilter: ['class'] });
        }
    })();

    /* ---------- Navigation: mobile menu, services dropdown, cookie settings ---------- */
    (function () {
        var toggle = document.querySelector('.nav-toggle');
        if (toggle) toggle.addEventListener('click', function () { send('nav_toggle', { state: toggle.getAttribute('aria-expanded') === 'true' ? 'open' : 'close' }); });
        var opened = once();
        document.querySelectorAll('.nav__group').forEach(function (group) {
            var parent = group.querySelector('.nav__parent');
            var name = parent ? label(parent) : 'menu';
            group.addEventListener('pointerenter', function () { if (opened(name)) send('nav_menu_open', { menu: name }); });
        });
        document.querySelectorAll('[data-cookie-settings]').forEach(function (b) {
            b.addEventListener('click', function () { send('cookie_settings_open', { link_location: where(b) }); });
        });
    })();

    /* ---------- Card interest: the pointer rests on a card, product or plan (mouse devices only) ---------- */
    (function () {
        if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
        var CARD = '.card, .product, .plan, .app-row';
        var HOVER_MS = 800;
        var first = once();
        var timer;
        document.addEventListener('pointerover', function (e) {
            var card = e.target.closest(CARD);
            if (!card || card.contains(e.relatedTarget)) return;
            var title = card.querySelector('h2, h3, strong');
            var name = label(title || card).slice(0, 40);
            timer = setTimeout(function () { if (first(name)) send('card_hover', { card: name, link_location: where(card) }); }, HOVER_MS);
        });
        document.addEventListener('pointerout', function (e) {
            var card = e.target.closest(CARD);
            if (card && !card.contains(e.relatedTarget)) clearTimeout(timer);
        });
    })();

    /* ---------- Text interest: selecting a passage (its length and place, never the text itself) ---------- */
    (function () {
        var MIN_CHARS = 15;
        var SETTLE_MS = 1000;
        var timer;
        document.addEventListener('selectionchange', function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                var selection = window.getSelection();
                var length = String(selection || '').length;
                if (length < MIN_CHARS || !selection.anchorNode || !selection.anchorNode.parentElement) return;
                send('text_select', { length: length, link_location: where(selection.anchorNode.parentElement) });
            }, SETTLE_MS);
        });
    })();

    /* ---------- Article reading: how far through a guide the reader gets, and how long that took ---------- */
    (function () {
        var article = document.querySelector('main > article'); // a blog post, not the product cards
        if (!article) return;
        var first = once();
        var ticking = false;
        function measure() {
            ticking = false;
            var box = article.getBoundingClientRect();
            var pct = Math.max(0, Math.min(100, Math.round((window.innerHeight - box.top) / box.height * 100)));
            [25, 50, 75, 100].forEach(function (step) {
                if (pct >= step && first(step)) send('article_read', { percent: step, engaged_seconds: engaged });
            });
        }
        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(measure); }
        }, { passive: true });
    })();

    /* ---------- Section dwell: seconds each section stays on screen, reported when the visit pauses or ends ---------- */
    (function () {
        if (!('IntersectionObserver' in window)) return;
        var MIN_SECONDS = 3;
        var MAX_REPORTED = 5;
        var onScreen = [];
        var dwell = {};
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var i = onScreen.indexOf(entry.target);
                if (entry.isIntersecting && i === -1) onScreen.push(entry.target);
                else if (!entry.isIntersecting && i !== -1) onScreen.splice(i, 1);
            });
        }, { threshold: SECTION_MIN_VISIBLE });
        onSections(function (n) { observer.observe(n); });
        setInterval(function () {
            if (document.visibilityState !== 'visible') return;
            onScreen.forEach(function (n) { var k = n.getAttribute('data-loc') || n.id; dwell[k] = (dwell[k] || 0) + 1; });
        }, 1000);
        function report() {
            Object.keys(dwell).filter(function (k) { return dwell[k] >= MIN_SECONDS; })
                .sort(function (a, b) { return dwell[b] - dwell[a]; }).slice(0, MAX_REPORTED)
                .forEach(function (k) { send('section_dwell', { section: k, seconds: dwell[k], transport_type: 'beacon' }); });
            dwell = {};
        }
        document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') report(); });
        window.addEventListener('pagehide', report);
    })();

    /* ---------- Attention: time to the first interaction, and returning to a tab left in the background ---------- */
    (function () {
        var RETURN_MIN_SECONDS = 10;
        var loaded = performance.now();
        var interacted = false;
        ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (type) {
            window.addEventListener(type, function () {
                if (interacted) return;
                interacted = true;
                send('first_interaction', { type: type, ms: Math.round(performance.now() - loaded) });
            }, { passive: true, once: true });
        });
        var hiddenAt = 0;
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return; }
            var seconds = hiddenAt ? Math.round((Date.now() - hiddenAt) / 1000) : 0;
            hiddenAt = 0;
            if (seconds >= RETURN_MIN_SECONDS) send('tab_return', { hidden_seconds: seconds });
        });
    })();

    /* ---------- Visit summary on exit ---------- */
    (function () {
        var sent = false;
        function exit() {
            if (sent) return;
            sent = true;
            send('page_exit', { max_scroll: maxScroll, engaged_seconds: engaged, sections_viewed: sectionsSeen, transport_type: 'beacon' });
        }
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') exit(); else sent = false;
        });
        window.addEventListener('pagehide', exit);
    })();
})();
