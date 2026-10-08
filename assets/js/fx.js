/* Mobile1X site-wide motion (GSAP + ScrollTrigger): scroll progress, 3D scroll reveals, tilt cards,
   phone-depth parallax and the hero camera pan. Skipped under prefers-reduced-motion or if GSAP fails to load;
   the CSS/IntersectionObserver reveal in site.js remains the fallback. */
(function () {
    if (!window.gsap || !window.ScrollTrigger) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('fx');
    var $ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

    /* ---------- Scroll progress ---------- */
    var bar = document.createElement('i');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    /* ---------- 3D reveal: blocks tip up from below as they enter ---------- */
    ScrollTrigger.batch('.reveal', {
        start: 'top 90%',
        once: true,
        onEnter: function (els) {
            gsap.fromTo(els, { y: 56, rotationX: -18, opacity: 0, transformPerspective: 900, transformOrigin: '50% 100%' },
                { y: 0, rotationX: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.09, overwrite: true, clearProps: 'transform' });
        },
    });

    /* ---------- Tilt cards (pointer devices only) ---------- */
    if (window.matchMedia('(hover: hover)').matches) {
        $('.card, .product').forEach(function (el) {
            var rx, ry;
            el.addEventListener('pointerenter', function () {
                rx = rx || gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
                ry = ry || gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
                gsap.to(el, { y: -6, transformPerspective: 900, duration: 0.3, overwrite: 'auto' });
            });
            el.addEventListener('pointermove', function (e) {
                if (!rx) return;
                var b = el.getBoundingClientRect();
                rx(-((e.clientY - b.top) / b.height - 0.5) * 8);
                ry(((e.clientX - b.left) / b.width - 0.5) * 10);
            });
            el.addEventListener('pointerleave', function () {
                if (!rx) return;
                rx(0); ry(0);
                gsap.to(el, { y: 0, duration: 0.4, overwrite: 'auto' });
            });
        });
    }

    /* ---------- Phone mock-ups fan out in depth as the card scrolls through ---------- */
    $('.product__shots').forEach(function (box) {
        var phones = box.querySelectorAll('.phone');
        if (phones.length < 2) return;
        box.style.perspective = '700px';
        gsap.from(phones, {
            y: function (i) { return [36, 0, 52][i % 3]; },
            rotationY: function (i) { return [-14, 0, 14][i % 3]; },
            ease: 'none',
            scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom 45%', scrub: true },
        });
    });

    /* ---------- Hero camera pan: copy drifts up, the stage tilts back, light layers lag behind ---------- */
    var stage = document.getElementById('stage');
    if (stage) {
        var pan = { trigger: stage, start: 'top 25%', end: 'bottom top', scrub: true };
        gsap.to(stage, { rotationX: 7, scale: 0.93, transformPerspective: 1200, transformOrigin: '50% 0', ease: 'none', scrollTrigger: pan });
        gsap.to('.stage__bg', { y: 70, ease: 'none', scrollTrigger: pan });
        gsap.to('.hero__copy', { y: -50, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
})();
