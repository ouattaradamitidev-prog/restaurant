// ==================== HERO : trois carrousels synchronisés ====================
// Version JavaScript natif du composant « Hero Section 41 » (Embla) : grande assiette, miniatures et avis
// avancent ensemble en boucle. Défilement automatique toutes les 3 s ; il s'arrête au survol et au focus,
// et ne démarre pas si le visiteur a choisi « réduire les animations ».
(() => {
    const hero = document.querySelector('[data-h41]');
    if (!hero) return;

    const DELAY = 3000, DURATION = 560;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const carousels = [...hero.querySelectorAll('[data-h41-c]')].map(el => {
        const track = el.querySelector('.h41-track');
        const real = [...track.children];
        return { el, track, real };
    });
    const N = carousels[0].real.length;
    let v = N;                     // position virtuelle : on garde N <= v < 2N au repos (copies avant/après)
    let timer = null, paused = false, jumpTimer = null;

    // Copies avant et après pour que la boucle soit continue
    carousels.forEach(c => {
        const copy = (hidden) => c.real.map(n => {
            const k = n.cloneNode(true);
            k.setAttribute('aria-hidden', 'true');
            k.querySelectorAll('img').forEach(i => { i.loading = 'lazy'; i.removeAttribute('fetchpriority'); });
            k.querySelectorAll('button').forEach(b => { b.tabIndex = -1; });
            return k;
        });
        c.track.prepend(...copy());
        c.track.append(...copy());
        c.items = [...c.track.children];
    });

    const idx = () => ((v % N) + N) % N;

    function render() {
        const cur = idx();
        carousels.forEach(c => {
            c.track.style.setProperty('--v', v);
            c.items.forEach((it, k) => {
                const isReal = k >= N && k < 2 * N;
                const isCurrent = k % N === cur;
                const btn = it.querySelector('.h41-thumb');
                if (btn) {
                    btn.setAttribute('aria-current', isCurrent ? 'true' : 'false');
                    if (isReal) it.removeAttribute('aria-hidden');
                } else if (isReal) {
                    it.setAttribute('aria-hidden', isCurrent ? 'false' : 'true');
                }
            });
        });
    }

    // Ramène v dans [N, 2N) sans animation (l'image affichée ne change pas)
    function normalize() {
        if (v >= N && v < 2 * N) return;
        v = ((v % N) + N) % N + N;
        carousels.forEach(c => c.track.classList.add('is-jump'));
        render();
        void hero.offsetWidth;
        carousels.forEach(c => c.track.classList.remove('is-jump'));
    }

    function goTo(delta) {
        clearTimeout(jumpTimer);
        normalize();
        v += delta;
        render();
        jumpTimer = setTimeout(normalize, DURATION + 40);
    }

    function goToIndex(i) {
        let d = (((i - idx()) % N) + N) % N;
        if (d > N / 2) d -= N;
        if (d) goTo(d);
    }

    function startTimer() {
        clearInterval(timer); timer = null;
        if (paused || document.hidden || reduced.matches) return;
        timer = setInterval(() => goTo(1), DELAY);
    }
    const manual = fn => { fn(); startTimer(); };

    // Clic sur une miniature
    let dragged = false;
    carousels.forEach(c => {
        c.items.forEach((it, k) => {
            const btn = it.querySelector('.h41-thumb');
            if (btn) btn.addEventListener('click', () => { if (!dragged) manual(() => goToIndex(k % N)); });
        });

        // Balayage (souris ou doigt)
        let x0 = null;
        c.el.addEventListener('pointerdown', e => { x0 = e.clientX; dragged = false; });
        c.el.addEventListener('pointerup', e => {
            if (x0 === null) return;
            const dx = e.clientX - x0; x0 = null;
            if (Math.abs(dx) > 40) { dragged = true; manual(() => goTo(dx < 0 ? 1 : -1)); setTimeout(() => { dragged = false; }, 50); }
        });
        c.el.addEventListener('pointercancel', () => { x0 = null; });

        // Flèches du clavier
        c.el.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); manual(() => goTo(-1)); }
            if (e.key === 'ArrowRight') { e.preventDefault(); manual(() => goTo(1)); }
        });
    });

    hero.addEventListener('mouseenter', () => { paused = true; startTimer(); });
    hero.addEventListener('mouseleave', () => { paused = false; startTimer(); });
    hero.addEventListener('focusin', () => { paused = true; startTimer(); });
    hero.addEventListener('focusout', () => { paused = false; startTimer(); });
    document.addEventListener('visibilitychange', startTimer);
    reduced.addEventListener('change', startTimer);

    // Premier affichage sans animation
    carousels.forEach(c => c.track.classList.add('is-jump'));
    render();
    void hero.offsetWidth;
    carousels.forEach(c => c.track.classList.remove('is-jump'));
    startTimer();
})();
