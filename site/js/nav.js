/* ============================================================
   KAMUNITY MPA — nav.js
   AoC dismiss, hamburger nav, FAB visibility on homepage
   No dependencies. Vanilla JS only.
   ============================================================ */

(function () {
    'use strict';

    /* AoC banner dismiss — sessionStorage so it persists per session */
    var aocBanner = document.getElementById('aoc-banner');
    var aocClose  = document.getElementById('aoc-close');

    if (aocBanner && aocClose) {
        if (sessionStorage.getItem('aoc-dismissed')) {
            aocBanner.style.display = 'none';
        }
        aocClose.addEventListener('click', function () {
            aocBanner.style.display = 'none';
            sessionStorage.setItem('aoc-dismissed', '1');
        });
    }

    /* Hamburger nav toggle */
    var hamburger = document.getElementById('mpa-hamburger');
    var navLinks   = document.getElementById('mpa-nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            var open = navLinks.classList.toggle('open');
            hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        /* Close nav when clicking outside */
        document.addEventListener('click', function (e) {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* FAB visibility: hide when #chats section is in viewport (homepage only) */
    var fab      = document.getElementById('kai-fab');
    var chatsSection = document.getElementById('chats');

    if (fab && chatsSection) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    fab.classList.add('hidden');
                    fab.setAttribute('aria-hidden', 'true');
                } else {
                    fab.classList.remove('hidden');
                    fab.removeAttribute('aria-hidden');
                }
            });
        }, { threshold: 0.1 });

        observer.observe(chatsSection);
    }

    /* Reflection consent gate */
    var reflectionAgree = document.getElementById('reflection-agree');
    var reflectionStart = document.getElementById('reflection-start');
    var reflectionConsent = document.getElementById('reflection-consent');
    var reflectionChat  = document.getElementById('reflection-chat');

    if (reflectionAgree && reflectionStart) {
        reflectionAgree.addEventListener('change', function () {
            reflectionStart.disabled = !this.checked;
        });
        reflectionStart.addEventListener('click', function () {
            if (reflectionConsent) reflectionConsent.style.display = 'none';
            if (reflectionChat)    reflectionChat.style.display    = 'flex';
        });
    }

}());

/* Toggle quiz inline embed */
function toggleQuiz(id) {
    var embed   = document.getElementById(id + '-embed');
    var toggle  = document.getElementById(id + '-toggle');
    if (!embed) return;

    var isOpen = embed.classList.toggle('open');
    if (toggle) toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

/* Toggle contact form inline */
function toggleForm(id) {
    var embed  = document.getElementById(id + '-embed');
    var toggle = document.getElementById(id + '-toggle');
    if (!embed) return;

    var isOpen = embed.classList.toggle('open');
    if (toggle) toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}
