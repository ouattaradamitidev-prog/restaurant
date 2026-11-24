// ==================== TÉMOIGNAGES ====================
// Version JavaScript natif du composant « unique-testimonial » : on choisit un avis avec les pastilles,
// le texte s'efface en flou (200 ms), change, puis réapparaît. Pas de changement pendant l'animation.
(() => {
    const root = document.querySelector('[data-tm]');
    if (!root) return;
    const section = root.closest('.tm');
    const chips = [...root.querySelectorAll('.tm-chip')];
    const text = root.querySelector('[data-tm-text]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let active = 0, busy = false;

    function select(i) {
        if (i === active || busy) return;
        const apply = () => {
            text.textContent = chips[i].dataset.quote;
            chips.forEach((c, k) => c.setAttribute('aria-current', k === i ? 'true' : 'false'));
            active = i;
        };
        if (reduced.matches) { apply(); return; }
        busy = true;
        section.classList.add('is-swapping');
        setTimeout(() => {
            apply();
            section.classList.remove('is-swapping');
            setTimeout(() => { busy = false; }, 400);
        }, 200);
    }

    chips.forEach((c, i) => c.addEventListener('click', () => select(i)));
})();
