/* Apparition des sections au défilement.
   - Natif (IntersectionObserver), aucune dépendance, ne touche pas à ScrollTrigger.
   - Seul le contenu des sections est animé, pas les sections (les fonds restent fixes).
   - Exclus volontairement : #home (visible dès l'arrivée) et le carrousel épinglé de #dishes.
   - Désactivé si le visiteur a choisi « réduire les animations ».
   Pour animer un autre élément : ajouter son sélecteur dans TARGETS. */
(function () {
    'use strict';

    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var TARGETS = [
        // La sélection du chef : seulement l'intro, jamais le carrousel épinglé
        '#dishes .orbit-kicker', '#dishes .orbit-intro h2', '#dishes .orbit-intro p',
        // À propos
        '#about .sub-heading', '#about .heading', '#about .row .image', '#about .row .content',
        // Menu (tapis roulant)
        '#menu .sub-heading', '#menu .heading', '#menu .belt',
        // Témoignages
        '#review .sub-heading', '#review .heading', '#review .tm-wrap',
        // Appel à commander (les images flottantes gardent leur propre animation)
        '#float-cta .float-cta-content',
        // Formulaire de commande
        '#order .of-title', '#order .of-sub', '#order .of-form',
        // Pied de page
        '#footer .wmf-top'
    ];

    var STAGGER = 90;      // ms entre deux éléments qui apparaissent ensemble
    var MAX_STEPS = 5;     // plafond du décalage (évite les attentes longues)
    var viewportH = window.innerHeight || document.documentElement.clientHeight;

    function reveal(el) {
        var done = false;
        function cleanup() {
            if (done) return;
            done = true;
            el.removeEventListener('transitionend', onEnd);
            el.classList.remove('rv', 'is-in');
            el.style.removeProperty('--rv-d');
        }
        function onEnd(e) {
            if (e.target === el && e.propertyName === 'opacity') cleanup();
        }
        el.addEventListener('transitionend', onEnd);
        setTimeout(cleanup, 1800); // filet de sécurité si transitionend ne se déclenche pas
        requestAnimationFrame(function () { el.classList.add('is-in'); });
    }

    var io = new IntersectionObserver(function (entries) {
        var step = 0;
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            io.unobserve(el);
            el.style.setProperty('--rv-d', Math.min(step++, MAX_STEPS) * STAGGER + 'ms');
            reveal(el);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll(TARGETS.join(',')).forEach(function (el) {
        // Déjà visible (ou déjà dépassé, ex. retour sur une page rechargée en bas) : on n'anime pas
        if (el.getBoundingClientRect().top < viewportH * 0.92) return;
        el.classList.add('rv');
        io.observe(el);
    });
})();
