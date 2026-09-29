/* Mobile1X behaviour analytics: what visitors read, skip, click and abandon.
   Built on window.m1xTrack (site.js), so every event is consent-gated: queued until the visitor chooses,
   sent on Accept, dropped on Decline. No typed text is ever sent, only field names and choice values. */
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
    window.m1xTrack = function (name, params) { // observe the lead conversion for form_abandon
        if (name === 'contact_form_submit') submitted = true;
        send(name, params);
    };

    function once() {
        var seen = {};
        return function (key) { return seen[key] ? false : (seen[key] = true); };
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
        function watch() {
            document.querySelectorAll(SECTIONS).forEach(function (n) {
                if (nodes.indexOf(n) === -1) { nodes.push(n); observer.observe(n); }
            });
        }
        watch();
        var late = new MutationObserver(watch); // client-rendered sections appear after load
        late.observe(document.body, { childList: true, subtree: true });
        setTimeout(function () { late.disconnect(); }, LATE_SECTIONS_MS);
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
            if (!el.name || el.name === 'bot-field' || !el.value || !done(field(el))) return;
            completed++;
            lastField = field(el);
            var params = { field: lastField, fields_completed: completed };
            if (el.tagName === 'SELECT') params.field_value = el.value; // a category, never free text
            send('form_field_complete', params);
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
