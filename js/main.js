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
    // Hero video: looping clip, scroll adds a slow zoom and a dim
    // ------------------------------------------------------------
    var video = hero && hero.querySelector('.hero-video');
    var object = hero && hero.querySelector('.hero-object');
    var objectSettled = false;
    if (object) {
        object.addEventListener('animationend', function () { objectSettled = true; updateHero(); }, { once: true });
    }
    var progress = 0;

    (function startVideo() {
        if (!video || reduceMotion) return;
        var conn = navigator.connection;
        if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return;
        var small = window.innerWidth <= 760;
        video.src = small && video.dataset.srcSmall ? video.dataset.srcSmall : video.dataset.src;
        video.load();
        video.playbackRate = 0.6;   // the clip is rendered fast; slow it to a calm 11 s loop
        var shown = false;
        function show() {
            if (shown) return;
            shown = true;
            video.play().then(function () { video.classList.add('ready'); }).catch(function () {});
        }
        video.addEventListener('canplay', show, { once: true });
        video.addEventListener('playing', function () { video.classList.add('ready'); }, { once: true });
    })();

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

        if (object && !reduceMotion && (objectSettled || p > 0.05)) {
            if (!objectSettled) { object.style.animation = 'none'; objectSettled = true; }
            var lift = -p * 16;               // vh, faster than the text
            var scale = 1 - p * 0.05;
            object.style.transform = 'translateY(calc(-50% + ' + lift.toFixed(2) + 'vh)) scale(' + scale.toFixed(4) + ')';
        }

        // Nothing fades out: the next section slides over the stage like a
        // curtain. Text and object only drift upward at different speeds.
        if (heroText && !reduceMotion && (textSettled || p > 0.05)) {
            if (!textSettled) { heroText.classList.add('settled'); textSettled = true; }
            heroText.style.transform = 'translateY(' + (-p * 9).toFixed(2) + 'vh)';
        }
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
    window.addEventListener('resize', onScroll);

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

})();
