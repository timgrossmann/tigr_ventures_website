/**
 * TIGR VENTURES - Main JavaScript
 */

(function() {
    'use strict';

    // ================================================
    // Navigation scroll effect
    // ================================================
    const nav = document.getElementById('nav');
    let lastScrollY = 0;

    function handleNavScroll() {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        lastScrollY = currentScrollY;
    }

    window.addEventListener('scroll', handleNavScroll, { passive: true });

    // ================================================
    // Smooth scroll for anchor links
    // ================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                const navHeight = nav.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ================================================
    // Fade-in animations on scroll
    // ================================================
    const fadeElements = document.querySelectorAll('.fade-in');

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElements.forEach(element => {
        fadeObserver.observe(element);
    });

    // ================================================
    // Form handling
    // ================================================
    const form = document.getElementById('inquiryForm');
    const formSuccess = document.getElementById('formSuccess');

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitButton = form.querySelector('.form-submit');
            const originalText = submitButton.textContent;

            // Show loading state
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;

            try {
                const formData = new FormData(form);
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // Show success message
                    form.classList.add('hidden');
                    formSuccess.classList.add('show');
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                // Reset button on error
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                alert('There was an issue sending your inquiry. Please try again or email us directly.');
            }
        });
    }

    // ================================================
    // Imprint modal
    // ================================================
    const imprintModal = document.getElementById('imprintModal');
    const imprintLink = document.getElementById('imprintLink');
    let lastFocused = null;

    function openModal() {
        if (!imprintModal) return;
        lastFocused = document.activeElement;
        imprintModal.hidden = false;
        document.body.style.overflow = 'hidden';
        const closeBtn = imprintModal.querySelector('.modal-close');
        if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
        if (!imprintModal || imprintModal.hidden) return;
        imprintModal.hidden = true;
        document.body.style.overflow = '';
        if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
        }
    }

    if (imprintLink) {
        imprintLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openModal();
        });
    }

    if (imprintModal) {
        imprintModal.querySelectorAll('[data-close]').forEach(el => {
            el.addEventListener('click', closeModal);
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeModal();
        });
    }

    // ================================================
    // Footer year
    // ================================================
    const footerYear = document.querySelector('.footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    // ================================================
    // Prevent FOUC (Flash of Unstyled Content)
    // ================================================
    document.documentElement.classList.add('js-loaded');

})();
