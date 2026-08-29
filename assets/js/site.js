(function () {
    var GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSeaPjcwVv3HQNo3SUTxMLAs449rchnquXw4jTybsp93HvFJkg/formResponse';

    var form = document.getElementById('project-form');
    if (!form) return;

    var statusEl = document.getElementById('form-status');
    var button = form.querySelector('button[type="submit"]');
    var honeypot = form.elements['company_website'];

    function setStatus(message, kind) {
        statusEl.textContent = message;
        statusEl.className = 'form-status is-' + kind;
        statusEl.hidden = false;
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        if (honeypot && honeypot.value) return; // bot trap

        if (!form.checkValidity()) {
            setStatus('Please fill in every field, including a valid email and both dropdowns.', 'error');
            form.reportValidity();
            return;
        }

        button.disabled = true;
        setStatus('Sending…', 'success');

        // Opaque (no-cors) POST: Google accepts it but the response is unreadable,
        // so success is assumed once the request resolves.
        fetch(GOOGLE_FORM_ACTION, {
            method: 'POST',
            mode: 'no-cors',
            body: new FormData(form)
        }).then(function () {
            form.reset();
            setStatus('Thanks — your inquiry is in. We’ll be in touch within one business day.', 'success');
        }).catch(function () {
            setStatus('Something went wrong. Email us at hello@mobile1x.com and we’ll pick it up.', 'error');
        }).then(function () {
            button.disabled = false;
        });
    });
})();

(function () {
    var header = document.getElementById('site-header');
    window.addEventListener('scroll', function () {
        header.classList.toggle('scrolled', window.scrollY > 10);
    });

    var revealTargets = document.querySelectorAll('.reveal, .reveal-stagger');
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealTargets.forEach(function (el) { observer.observe(el); });
})();
