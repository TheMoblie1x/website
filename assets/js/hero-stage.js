/* Mobile1X hero showcase: GSAP-driven 3D product stage.
   Slide switching, pointer tilt, idle float, 360 spin, floating petals. The markup works without this file (first product shown). */
(function () {
    var stage = document.getElementById('stage');
    if (!stage || !window.gsap) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var SLIDE_MS = 6;
    var $ = function (sel, root) { return Array.prototype.slice.call((root || stage).querySelectorAll(sel)); };
    var devices = $('.device'), infos = $('.info'), medias = $('.media'), rails = $('.rail__item');
    var tilt = stage.querySelector('.stage__tilt'), float = stage.querySelector('.stage__float');
    var shadow = stage.querySelector('.stage__shadow'), pause = stage.querySelector('.stage__pause'), spin = stage.querySelector('.stage__spin');
    var current = 0, busy = false, userPaused = false, hovering = false, progress;

    /* ---------- Slides ---------- */
    function infoParts(i) { return Array.prototype.slice.call(infos[i].children); }

    function show(next, first) {
        if (busy || next === current) return;
        busy = true;
        var prev = current;
        current = next;
        var d = reduce ? 0 : 1;

        rails.forEach(function (r, i) {
            r.classList.toggle('is-active', i === next);
            if (i === next) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current');
        });
        medias.forEach(function (m, i) { m.classList.toggle('is-active', i === next); });

        gsap.timeline({ onComplete: function () { busy = false; restart(); } })
            .to(devices[prev], { rotationY: 90, scale: 0.8, duration: 0.45 * d, ease: 'power2.in' }, 0)
            .to(infoParts(prev), { x: 30, autoAlpha: 0, duration: 0.3 * d, stagger: 0.04 * d, ease: 'power1.in' }, 0)
            .add(function () {
                devices[prev].classList.remove('is-active');
                infos[prev].classList.remove('is-active');
                devices[next].classList.add('is-active');
                infos[next].classList.add('is-active');
                gsap.set(devices[prev], { clearProps: 'all' });
                gsap.set(infoParts(prev), { clearProps: 'all' });
            })
            .fromTo(devices[next], { rotationY: -90, scale: 0.8 }, { rotationY: 0, scale: 1, duration: 0.9 * d, ease: 'back.out(1.5)' })
            .fromTo(infoParts(next), { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6 * d, stagger: 0.08 * d, ease: 'power3.out' }, '<0.15');
    }

    function go(i) { show((i + devices.length) % devices.length); }

    /* ---------- Autoplay: the active rail item's bar is the progress indicator ---------- */
    function restart() {
        if (reduce) return;
        if (progress) progress.kill();
        progress = gsap.fromTo(rails[current].querySelector('.rail__bar'), { scaleX: 0 }, { scaleX: 1, duration: SLIDE_MS, ease: 'none', onComplete: function () { go(current + 1); } });
        syncPlayback();
    }
    function syncPlayback() { if (progress) progress.paused(userPaused || hovering || document.hidden); }

    rails.forEach(function (r, i) {
        r.addEventListener('click', function () { show(i); });
    });
    stage.addEventListener('pointerenter', function () { hovering = true; syncPlayback(); });
    stage.addEventListener('pointerleave', function () { hovering = false; syncPlayback(); });
    stage.addEventListener('focusin', function () { hovering = true; syncPlayback(); });
    stage.addEventListener('focusout', function () { hovering = false; syncPlayback(); });
    document.addEventListener('visibilitychange', syncPlayback);

    if (!reduce) {
        pause.hidden = false;
        pause.addEventListener('click', function () {
            userPaused = !userPaused;
            pause.setAttribute('aria-pressed', String(userPaused));
            pause.lastElementChild.textContent = userPaused ? 'Play' : 'Pause';
            syncPlayback();
        });
    }

    /* ---------- 360 spin ---------- */
    spin.hidden = false;
    spin.addEventListener('click', function () {
        if (busy) return;
        busy = true;
        gsap.fromTo(devices[current], { rotationY: 0 }, { rotationY: 360, duration: reduce ? 0 : 1.4, ease: 'power3.inOut', onComplete: function () { gsap.set(devices[current], { rotationY: 0 }); busy = false; } });
    });

    /* ---------- Pointer tilt (parallax on the petals and light too) ---------- */
    if (!reduce && window.matchMedia('(hover: hover)').matches) {
        var rotY = gsap.quickTo(tilt, 'rotationY', { duration: 0.8, ease: 'power3' });
        var rotX = gsap.quickTo(tilt, 'rotationX', { duration: 0.8, ease: 'power3' });
        var sunX = gsap.quickTo(stage.querySelector('.stage__sun'), 'x', { duration: 1.2, ease: 'power3' });
        var layers = $('.stage__petals').map(function (l, i) { return { x: gsap.quickTo(l, 'x', { duration: 1, ease: 'power3' }), k: i ? 26 : -18 }; });
        stage.addEventListener('pointermove', function (e) {
            var b = stage.getBoundingClientRect();
            var nx = (e.clientX - b.left) / b.width - 0.5, ny = (e.clientY - b.top) / b.height - 0.5;
            rotY(nx * 34); rotX(-ny * 20); sunX(nx * -60);
            layers.forEach(function (l) { l.x(nx * l.k); });
            stage.style.setProperty('--gx', (0.5 + nx).toFixed(3));
        });
        stage.addEventListener('pointerleave', function () { rotY(0); rotX(0); sunX(0); layers.forEach(function (l) { l.x(0); }); stage.style.setProperty('--gx', '0.5'); });
    }

    if (reduce) return;

    /* ---------- Idle motion: float, soft shadow breathing, sun glow ---------- */
    gsap.to(float, { y: -16, rotationZ: 1.2, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to(shadow, { scaleX: 0.85, opacity: 0.7, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to(stage.querySelector('.stage__sun'), { scale: 1.12, opacity: 0.8, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    /* ---------- Petals: tumbling in 3D, falling at different speeds; paused while off-screen ---------- */
    var PALETTE = [['#ffd0dc', '#ff8fb1'], ['#ffe0b0', '#ffb36b'], ['#ffffff', '#ffd9cf'], ['#ffc2b0', '#f26f8f'], ['#fff1c9', '#f4c15d']];
    var small = window.innerWidth < 900;
    var petalsTl = gsap.timeline();
    var rand = gsap.utils.random;
    $('.stage__petals').forEach(function (layer) {
        var front = layer.getAttribute('data-petals') === 'front';
        var count = front ? (small ? 3 : 6) : (small ? 9 : 18);
        for (var i = 0; i < count; i++) {
            var c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            var size = front ? rand(26, 44) : rand(10, 24);
            var el = document.createElement('i');
            el.className = 'petal';
            el.style.cssText = '--c1:' + c[0] + ';--c2:' + c[1] + ';width:' + size + 'px;height:' + size * 0.8 + 'px;' + (front ? 'filter:blur(1.5px);' : '');
            layer.appendChild(el);
            var w = stage.clientWidth, h = stage.clientHeight, dur = rand(9, 17) / (front ? 1.4 : 1);
            var fall = gsap.fromTo(el, { x: rand(0, w), y: -60, rotationX: rand(0, 360), rotationY: rand(0, 360), rotationZ: rand(0, 360) },
                { y: h + 60, rotationX: '+=360', rotationY: '+=480', rotationZ: '+=240', duration: dur, ease: 'none', repeat: -1 });
            fall.progress(Math.random());
            petalsTl.add(fall, 0);
            petalsTl.add(gsap.to(el, { xPercent: rand(80, 220), duration: rand(2.5, 5), ease: 'sine.inOut', yoyo: true, repeat: -1 }), 0);
        }
    });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) { petalsTl.paused(!entries[0].isIntersecting); }).observe(stage);
    }

    /* ---------- Entrance ---------- */
    gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from(stage, { y: 40, opacity: 0, duration: 0.9 }, 0)
        .from(rails, { x: -24, autoAlpha: 0, duration: 0.6, stagger: 0.1 }, 0.3)
        .from(devices[0], { rotationY: -140, scale: 0.5, duration: 1.4, ease: 'back.out(1.3)' }, 0.35)
        .from(infoParts(0), { x: 40, autoAlpha: 0, duration: 0.7, stagger: 0.09 }, 0.9);
    restart();
})();
