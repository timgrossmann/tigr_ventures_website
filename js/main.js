/**
 * TIGR VENTURES — main.js
 */
(function () {
    'use strict';

    document.documentElement.classList.remove('no-js');

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var top = document.getElementById('top');
    var hero = document.getElementById('hero');
    var stage = hero && hero.querySelector('.hero-stage');
    var heroText = hero && hero.querySelector('.hero-text');
    var canvas = hero && hero.querySelector('.hero-canvas');

    // ------------------------------------------------------------
    // Header theme: light when a light section sits under the bar
    // ------------------------------------------------------------
    var darkSections = Array.prototype.slice.call(document.querySelectorAll('.hero, .contact, .footer'));
    function updateHeader() {
        var y = top.offsetHeight / 2;
        var onDark = darkSections.some(function (el) {
            var r = el.getBoundingClientRect();
            return r.top <= y && r.bottom > y;
        });
        top.classList.toggle('on-light', !onDark);
    }

    // ------------------------------------------------------------
    // Hero sequence: frames scrubbed by scroll progress
    // ------------------------------------------------------------
    var frames = [];
    var loaded = [];
    var frameCount = hero ? parseInt(hero.dataset.frames, 10) || 0 : 0;
    var seqBase = hero ? hero.dataset.seq : '';
    var seqSize = window.innerWidth <= 760 ? 720 : 1280;
    var ctx = canvas && canvas.getContext('2d', { alpha: false });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var current = -1;
    var progress = 0;
    var useSequence = !!(canvas && ctx && frameCount && !reduceMotion);

    function framePath(i) {
        var n = ('00' + i).slice(-3);
        return seqBase + '/' + seqSize + '/f-' + n + '.webp';
    }

    function sizeCanvas() {
        var w = stage.clientWidth, h = stage.clientHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        current = -1;
        draw();
    }

    function nearestLoaded(i) {
        if (loaded[i]) return i;
        for (var d = 1; d < frameCount; d++) {
            if (loaded[i - d]) return i - d;
            if (loaded[i + d]) return i + d;
        }
        return -1;
    }

    function draw() {
        if (!useSequence) return;
        var target = Math.round(progress * (frameCount - 1));
        var idx = nearestLoaded(target);
        if (idx < 0 || idx === current) return;
        current = idx;
        var img = frames[idx];
        var cw = canvas.width, ch = canvas.height;
        var scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        var dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
        // anchor slightly right so the cuts stay in frame on narrow screens
        var dx = (cw - dw) * 0.7, dy = (ch - dh) * 0.5;
        ctx.drawImage(img, dx, dy, dw, dh);
        if (!canvas.classList.contains('ready')) canvas.classList.add('ready');
    }

    // Load order: first, last, then successive midpoints, so a partial
    // download already scrubs coarsely.
    function loadOrder(n) {
        var order = [0, n - 1], seen = {};
        seen[0] = seen[n - 1] = true;
        var queue = [[0, n - 1]];
        while (queue.length) {
            var pair = queue.shift(), a = pair[0], b = pair[1];
            var m = (a + b) >> 1;
            if (m === a || m === b) continue;
            if (!seen[m]) { seen[m] = true; order.push(m); }
            queue.push([a, m], [m, b]);
        }
        return order;
    }

    function loadFrames() {
        var order = loadOrder(frameCount);
        var inFlight = 0, next = 0;
        function pump() {
            while (inFlight < 4 && next < order.length) {
                (function (i) {
                    var img = new Image();
                    img.decoding = 'async';
                    img.onload = function () { frames[i] = img; loaded[i] = true; inFlight--; draw(); pump(); };
                    img.onerror = function () { inFlight--; pump(); };
                    img.src = framePath(i);
                })(order[next++]);
                inFlight++;
            }
        }
        pump();
    }

    var textSettled = false;
    if (heroText) {
        heroText.addEventListener('animationend', function () {
            heroText.classList.add('settled');
            textSettled = true;
            updateHero();
        }, { once: true });
    }

    function updateHero() {
        if (!hero) return;
        var rect = hero.getBoundingClientRect();
        var track = hero.offsetHeight - window.innerHeight;
        var p = track > 0 ? Math.min(1, Math.max(0, -rect.top / track)) : 0;
        progress = p;
        hero.classList.toggle('scrolled', p > 0.03);

        // Text holds, then lifts and fades over the last third of the track
        if (heroText && !reduceMotion && (textSettled || p > 0.05)) {
            if (!textSettled) { heroText.classList.add('settled'); textSettled = true; }
            var t = Math.min(1, Math.max(0, (p - 0.62) / 0.3));
            var eased = t * t * (3 - 2 * t);
            heroText.style.opacity = String(1 - eased);
            heroText.style.transform = 'translateY(' + (-eased * 48) + 'px)';
        }
        draw();
    }

    var ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            updateHero();
            updateHeader();
            ticking = false;
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
        if (useSequence) sizeCanvas();
        onScroll();
    });

    if (useSequence) {
        sizeCanvas();
        loadFrames();
    }
    updateHero();
    updateHeader();

    // ------------------------------------------------------------
    // Anchors: offset for the fixed header
    // ------------------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href === '#' || href === '#imprint') return;
            var target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            var y = target.getBoundingClientRect().top + window.scrollY - top.offsetHeight;
            window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    });

    // ------------------------------------------------------------
    // Reveal on scroll
    // ------------------------------------------------------------
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
        reveals.forEach(function (el) { io.observe(el); });
    } else {
        reveals.forEach(function (el) { el.classList.add('visible'); });
    }

    // ------------------------------------------------------------
    // Contact form (Formspree)
    // ------------------------------------------------------------
    var form = document.getElementById('inquiryForm');
    var success = document.getElementById('formSuccess');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var button = form.querySelector('button[type="submit"]');
            var label = button.textContent;
            button.textContent = 'Sending…';
            button.disabled = true;

            fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { Accept: 'application/json' }
            }).then(function (res) {
                if (!res.ok) throw new Error('Submission failed');
                form.hidden = true;
                success.hidden = false;
            }).catch(function () {
                button.textContent = label;
                button.disabled = false;
                alert('That did not go through. Please try again or email tim@tigr.ventures directly.');
            });
        });
    }

    // ------------------------------------------------------------
    // Imprint modal
    // ------------------------------------------------------------
    var modal = document.getElementById('imprintModal');
    var imprintLink = document.getElementById('imprintLink');
    var lastFocused = null;

    function openModal() {
        lastFocused = document.activeElement;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        var close = modal.querySelector('.modal-close');
        if (close) close.focus();
    }
    function closeModal() {
        if (modal.hidden) return;
        modal.hidden = true;
        document.body.style.overflow = '';
        if (lastFocused && lastFocused.focus) lastFocused.focus();
    }
    if (imprintLink && modal) {
        imprintLink.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
        modal.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', closeModal); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
    }

    // Footer year
    var year = document.querySelector('.footer-year');
    if (year) year.textContent = new Date().getFullYear();
})();
