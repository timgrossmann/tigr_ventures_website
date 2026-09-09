/**
 * TIGR VENTURES — main.js
 */
(function () {
    'use strict';

    document.documentElement.classList.remove('no-js');

    // Header state on scroll
    var top = document.getElementById('top');
    function onScroll() {
        if (window.scrollY > 24) top.classList.add('scrolled');
        else top.classList.remove('scrolled');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Anchor offset for sticky header
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href === '#' || href === '#imprint') return;
            var target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            var y = target.getBoundingClientRect().top + window.scrollY - top.offsetHeight;
            window.scrollTo({ top: y, behavior: 'smooth' });
        });
    });

    // Reveal on scroll
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
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

    // Hero video: load lazily, fade in over the still once it can play
    var video = document.querySelector('.hero-video');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (video && !reduceMotion && video.dataset.src) {
        var conn = navigator.connection;
        var slow = conn && (conn.saveData || /2g/.test(conn.effectiveType || ''));
        if (!slow) {
            video.src = video.dataset.src;
            video.load();
            video.addEventListener('canplaythrough', function () {
                video.play().then(function () {
                    video.classList.add('ready');
                }).catch(function () {});
            }, { once: true });
        }
    }

    // Contact form (Formspree)
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

    // Imprint modal
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
