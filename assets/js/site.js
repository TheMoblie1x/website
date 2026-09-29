/* Mobile1X site behaviour: navigation, scroll reveal, GA4 events, lead form.
   No dependencies. Everything degrades gracefully: content and the form work without JS. */

/* ---------- Analytics ---------- */
(function () {
    var GA_ID = document.body.getAttribute('data-ga');
    var CONSENT_KEY = 'm1x-consent';
    var banner = document.getElementById('consent');
    var enabled = false;

    function stored() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
    function store(value) { try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* private mode: choice lasts for this page only */ } }

    // gtag.js is loaded in <head> with Consent Mode v2: analytics_storage stays denied (no cookies,
    // no identifiers) until the visitor accepts; events are only sent after that.
    function enableAnalytics() {
        window['ga-disable-' + GA_ID] = false;
        gtag('consent', 'update', { analytics_storage: 'granted' });
        enabled = true;
    }

    function disableAnalytics() {
        window['ga-disable-' + GA_ID] = true;
        gtag('consent', 'update', { analytics_storage: 'denied' });
        enabled = false;
        // Remove GA cookies set earlier (best effort, on this host and its parent domain).
        var parts = location.hostname.split('.');
        var domains = ['', location.hostname, parts.length > 2 ? '.' + parts.slice(-2).join('.') : '.' + location.hostname];
        document.cookie.split(';').forEach(function (c) {
            var name = c.split('=')[0].trim();
            if (name === '_ga' || name.indexOf('_ga_') === 0 || name === '_gid') {
                domains.forEach(function (d) { document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : ''); });
            }
        });
    }

    function choose(value) {
        store(value);
        if (value === 'granted') enableAnalytics(); else disableAnalytics();
        banner.hidden = true;
    }

    if (stored() === 'granted') enableAnalytics();
    else if (stored() === 'denied') window['ga-disable-' + GA_ID] = true;
    else banner.hidden = false;

    banner.querySelectorAll('[data-consent]').forEach(function (b) {
        b.addEventListener('click', function () { choose(b.getAttribute('data-consent')); });
    });
    document.querySelectorAll('[data-cookie-settings]').forEach(function (b) {
        b.addEventListener('click', function () { banner.hidden = false; banner.querySelector('[data-consent]').focus(); });
    });

    var CHANNELS = [
        { match: 'tel:', event: 'phone_click' },
        { match: 'wa.me', event: 'whatsapp_click' },
        { match: 'mailto:', event: 'email_click' },
        { match: 'calendly.com', event: 'consultation_booking' }
    ];

    // Where on the page a CTA sits: header, hero, service, case-study, pricing, sticky-bar, footer...
    function ctaLocation(el) {
        var host = el.closest('[data-loc]');
        return host ? host.getAttribute('data-loc') : 'page';
    }

    window.m1xTrack = function (name, params) {
        if (!enabled) return; // no consent, no events
        params = params || {};
        params.page_path = location.pathname;
        gtag('event', name, params);
    };

    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href') || '';
        var params = { link_url: href, link_text: a.textContent.trim().slice(0, 60), link_location: a.getAttribute('data-loc') || ctaLocation(a) };
        var hit = CHANNELS.filter(function (c) { return href.indexOf(c.match) !== -1; })[0];
        if (hit) window.m1xTrack(hit.event, params);
        else if (a.classList.contains('btn')) window.m1xTrack('cta_click', params);
        if (a.closest('.card, .product') && /^\/services\//.test(href)) window.m1xTrack('service_page_click', params);
    }, true);
})();

/* ---------- Lead form: posts to the Google Form ---------- */
(function () {
    var form = document.getElementById('project-form');
    if (!form) return;

    var status = document.getElementById('form-status');
    var button = form.querySelector('button[type="submit"]');
    var messageEntry = form.getAttribute('data-message-entry');
    var started = false;

    function say(message, kind) {
        status.textContent = message;
        status.className = 'form-status is-' + kind;
        status.hidden = false;
    }

    // Campaign parameters, so a lead can be traced to its source.
    var utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].map(function (k) {
        var v = new URLSearchParams(location.search).get(k);
        return v ? k + '=' + v : '';
    }).filter(Boolean).join('&');

    form.addEventListener('focusin', function () {
        if (started) return;
        started = true;
        window.m1xTrack('contact_form_start', { link_location: form.getAttribute('data-source') });
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (form.elements['bot-field'].value) return; // bot trap
        if (!form.checkValidity()) {
            say('Please fill in your name, a valid work email, the project type, budget and a short description.', 'error');
            form.reportValidity();
            return;
        }

        // Google fields keep their entry ids as input names. Phone, source page and campaign have no
        // Google column, so they travel inside the message.
        var body = new URLSearchParams();
        Array.prototype.forEach.call(form.elements, function (el) {
            if (el.name && el.name.indexOf('entry.') === 0 && el.name !== messageEntry) body.append(el.name, el.value);
        });
        var extra = ['Source page: ' + form.getAttribute('data-source')];
        if (form.elements['phone'].value) extra.unshift('Phone: ' + form.elements['phone'].value);
        if (utm) extra.push('Campaign: ' + utm);
        body.append(messageEntry, form.elements[messageEntry].value + '\n\n---\n' + extra.join('\n'));

        button.disabled = true;
        say('Sending…', 'success');

        // Opaque (no-cors) POST: Google accepts it but the response is unreadable, so a resolved request is
        // treated as sent. Only network failures are detectable, hence the follow-up line under the form.
        fetch(form.action, { method: 'POST', mode: 'no-cors', body: body }).then(function () {
            form.reset();
            say('Thanks. Your inquiry has been sent and an engineer will reply within one business day.', 'success');
            window.m1xTrack('contact_form_submit', { link_location: form.getAttribute('data-source') });
        }).catch(function () {
            say('We could not send that. Please call, WhatsApp or email hello@mobile1x.com and we will pick it up.', 'error');
        }).then(function () {
            button.disabled = false;
        });
    });
})();

/* ---------- Navigation & scroll reveal ---------- */
(function () {
    var header = document.getElementById('site-header');
    var toggle = header.querySelector('.nav-toggle');

    function setOpen(open) {
        header.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () { setOpen(!header.classList.contains('is-open')); });
    header.querySelectorAll('.nav a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('scroll', function () { header.classList.toggle('scrolled', window.scrollY > 10); }, { passive: true });

    var targets = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
        targets.forEach(function (el) { el.classList.add('visible'); });
        return;
    }
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    targets.forEach(function (el) { observer.observe(el); });
})();
