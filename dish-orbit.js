// ==================== LA SÉLECTION DU CHEF — CARROUSEL ORBITAL ====================
// Version JavaScript natif du composant "dish-orbit-carousel" (React/GSAP).
// Le plat sort par le haut sur une grande orbite pendant que le suivant arrive de l'autre côté,
// le titre s'efface en deux traits (fin / gras), la carte et l'arc coloré changent de plat.
// Le défilement de la page pilote le tout : la section reste fixe et chaque "cran" de scroll
// amène le plat suivant. Flèches, miniatures, pastilles, clavier et balayage fonctionnent aussi.
(() => {
    const root = document.querySelector('[data-dsh]');
    if (!root) return;
    const track = root.closest('[data-dsh-track]');

    // ---------- Les plats (modifie ici noms, prix, photos, textes) ----------
    const DISHES = [
        { title: 'Burger',  subtitle: 'Deluxe',         name: 'Burger Deluxe',         image: './IMAGE/BURGER2.png',    price: 3500, rating: 4.8, tag: 'Très apprécié',   eyebrow: 'Le favori de nos clients', accent: '#f6a37c', description: 'Un burger généreux, préparé avec des ingrédients frais et une sauce maison irrésistible.',                 ingredients: ['Pain', 'Steak', 'Fromage', 'Crudités', 'Sauce maison'] },
        { title: 'Pizza',   subtitle: 'Margherita',     name: 'Pizza Margherita',      image: './IMAGE/PLAT3.png',   price: 5000, rating: 5.0, tag: 'Coup de cœur',    accent: '#f2a6a0',                                    description: 'Une pâte savoureuse, une sauce tomate parfumée et du fromage fondant à chaque bouchée.',                ingredients: ['Pâte', 'Sauce tomate', 'Fromage', 'Basilic'] },
        { title: 'Frites',  subtitle: 'Croustillantes', name: 'Frites Croustillantes', image: './IMAGE/img2.png',   price: 1500, rating: 4.7, tag: 'Incontournable',  accent: '#f5d26a',                                    description: 'Des frites dorées et croustillantes, parfaites pour accompagner toutes vos envies.',                    ingredients: ['Pommes de terre', 'Sel', 'Sauce au choix'] },
        { title: 'Poulet',  subtitle: 'Grillé',         name: 'Poulet Grillé',         image: './IMAGE/plat2.png',     price: 4500, rating: 5.0, tag: 'Favori du chef',  accent: '#e8b27a',                                    description: 'Un poulet tendre et généreux, délicatement grillé et relevé avec nos épices maison.',                  ingredients: ['Poulet', 'Épices maison', 'Herbes'] },
        { title: 'Tacos',   subtitle: 'Mexicain',       name: 'Tacos Mexicain',        image: './IMAGE/IJJ.png',    price: 3000, rating: 4.8, tag: 'Très apprécié',   accent: '#f2a6c6',                                    description: 'Une tortilla garnie et généreuse, aux saveurs relevées pour un plaisir à chaque bouchée.',              ingredients: ['Tortilla', 'Viande', 'Fromage', 'Sauce relevée'] },
        { title: 'Salade',  subtitle: 'César',          name: 'Salade César',          image: './IMAGE/img4.png', price: 2500, rating: 5.0, tag: 'Fraîcheur garantie', accent: '#bcd98e',                                 description: 'Une assiette fraîche et gourmande, idéale pour un repas léger sans compromis sur le goût.',            ingredients: ['Salade', 'Poulet', 'Parmesan', 'Croûtons', 'Sauce César'] }
    ];

    const N = DISHES.length;
    const ORBIT_X = 299, ORBIT_Y = -450, ORBIT_R = 650; // pivot de l'orbite des assiettes (au-dessus du décor)
    const SCROLL_PER_DISH = 0.7;                          // hauteurs d'écran de défilement par plat
    const SWING = 50;                                     // degrés parcourus par l'assiette
    const ITEM = 118, VISIBLE = 4;                        // miniatures
    const ARC_REST = [[50, 98], [46, 124], [60, 126], [40, 100]];
    const ARC_SWEEP = [38, 146];
    const HIDE_1 = 'inset(0% 0% 0% 100%)';                // ligne fine : sort/entre par la droite
    const HIDE_2 = 'inset(0% 100% 0% 0%)';                // ligne grasse : sort/entre par la gauche
    const SHOW = 'inset(0% 0% 0% 0%)';

    const money = v => new Intl.NumberFormat('fr-FR').format(v) + ' FCFA';
    const pad = v => String(v).padStart(2, '0');
    const wrap = i => ((Math.round(i) % N) + N) % N;
    const stepDirection = (from, to) => { const f = (((to - from) % N) + N) % N; return f <= N - f ? 1 : -1; };
    const stripStart = index => (N <= VISIBLE ? 0 : Math.max(0, Math.min(index - 1, N - VISIBLE)));
    const fitSize = (chars, max, width, em) => Math.min(max, width / (Math.max(1, chars) * em));
    const absolute = path => new URL(path, location.href).href;

    // Le ruban pastel : un trait épais le long de l'orbite, qui s'affine aux deux bouts
    function arcPath(a0, a1, cx, cy, r, w, steps = 48) {
        const outer = [], inner = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
            const h = (w / 2) * Math.pow(Math.sin(Math.PI * t), 0.45);
            const c = Math.cos(a), s = Math.sin(a);
            outer.push((cx + c * (r + h)).toFixed(1) + ' ' + (cy + s * (r + h)).toFixed(1));
            inner.push((cx + c * (r - h)).toFixed(1) + ' ' + (cy + s * (r - h)).toFixed(1));
        }
        return 'M' + outer.join('L') + 'L' + inner.reverse().join('L') + 'Z';
    }

    // Écrit des styles avec GSAP s'il est là, sinon directement (le site reste lisible sans GSAP)
    function put(targets, v) {
        const list = [].concat(targets).filter(Boolean);
        if (window.gsap) { gsap.set(list, v); return; }
        list.forEach(el => {
            if ('autoAlpha' in v) { el.style.opacity = v.autoAlpha; el.style.visibility = v.autoAlpha > 0 ? 'visible' : 'hidden'; }
            if ('clipPath' in v) el.style.clipPath = v.clipPath;
            if ('rotation' in v || 'y' in v) el.style.transform = `translateY(${v.y || 0}px) rotate(${v.rotation || 0}deg)`;
        });
    }

    // ---------- Construction de la page ----------
    const $ = selector => root.querySelector(selector);
    const platesEl = $('[data-dsh-plates]');
    const headsEl = $('[data-dsh-heads]');
    const bodiesEl = $('[data-dsh-bodies]');
    const pagerEl = $('[data-dsh-pager]');
    const stripTrack = $('[data-dsh-strip-track]');
    const arcEl = $('[data-dsh-arc]');
    const live = $('[data-dsh-live]');
    const addBtn = $('[data-dsh-add]');
    const favBtn = $('[data-dsh-fav]');
    const make = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
    const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';

    const orbits = [], heads = [], bodies = [], dots = [], thumbs = [];
    DISHES.forEach((d, i) => {
        const orbit = make(`<div class="dsh-orbit" aria-hidden="true"><img src="${d.image}" alt="${d.name}" width="245" height="245" draggable="false"></div>`);
        platesEl.appendChild(orbit); orbits.push(orbit);

        const head = make(
            `<div class="dsh-hd" aria-hidden="true"><p class="dsh-eye">${d.eyebrow || 'N°' + (i + 1) + ' · Plat du chef'}</p>` +
            `<h3 class="dsh-title"><span class="dsh-t1" style="font-size:${fitSize(d.title.length, 56, 330, 0.66)}px">${d.title}</span>` +
            `<span class="dsh-t2" style="font-size:${fitSize(d.subtitle.length, 62, 320, 0.76)}px">${d.subtitle}</span></h3></div>`);
        headsEl.appendChild(head); heads.push(head);

        const body = make(
            `<div class="dsh-body" aria-hidden="true">` +
            `<div class="dsh-rate"><div class="dsh-badge" style="background:${d.accent}">${STAR}</div><span class="dsh-num" aria-label="Note ${d.rating.toFixed(1)} sur 5">${d.rating.toFixed(1)}</span></div>` +
            `<p class="dsh-chef">${money(d.price)}</p><p class="dsh-kit">${d.tag}</p>` +
            `<p class="dsh-desc">${d.description}</p>` +
            `<ul class="dsh-ing">${d.ingredients.map(x => `<li>${x}</li>`).join('')}</ul></div>`);
        bodiesEl.appendChild(body); bodies.push(body);

        const dot = make(`<button type="button" role="tab" class="dsh-btn dsh-dot" aria-label="${d.name}"><i></i></button>`);
        dot.addEventListener('click', () => go(i));
        pagerEl.appendChild(dot); dots.push(dot);

        const thumb = make(`<div class="dsh-th"><button type="button" class="dsh-btn"><img src="${d.image}" alt="" width="56" height="56" draggable="false"><span>${d.name}</span></button></div>`);
        thumb.firstElementChild.addEventListener('click', () => go(i));
        stripTrack.appendChild(thumb); thumbs.push(thumb.firstElementChild);
    });

    // ---------- État ----------
    const arc = { a0: 0, a1: 0 };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let index = 0, shown = -1, dir = 1, tl = null, segment = 0, st = null, swipe = null;
    const steps = Math.max(0, N - 1);

    const parts = i => {
        const head = heads[i];
        return { orbit: orbits[i], head, eye: head.querySelector('.dsh-eye'), t1: head.querySelector('.dsh-t1'), t2: head.querySelector('.dsh-t2'), body: bodies[i] };
    };
    const drawArc = () => arcEl.setAttribute('d', arcPath(arc.a0, arc.a1, ORBIT_X, ORBIT_Y, ORBIT_R, 118));

    // Le changement de plat : tout est dans la page, GSAP ne bouge que le plat qui part et celui qui arrive
    function swap(to) {
        const from = shown;
        const rest = ARC_REST[to % ARC_REST.length];
        const tint = DISHES[to].accent;
        if (tl) { tl.progress(1).kill(); tl = null; }
        const b = parts(to);
        if (from === -1 || from === to || reduced.matches || !window.gsap) {
            for (let i = 0; i < N; i++) if (i !== to) { const p = parts(i); put([p.orbit, p.head, p.body], { autoAlpha: 0 }); }
            put([b.orbit, b.head, b.body, b.eye], { autoAlpha: 1, rotation: 0, y: 0 });
            put(b.t1, { clipPath: SHOW });
            put(b.t2, { clipPath: SHOW });
            arc.a0 = rest[0]; arc.a1 = rest[1]; drawArc();
            arcEl.style.fill = tint;
            shown = to;
            return;
        }
        const a = parts(from);
        const d = dir;
        tl = gsap.timeline({ onComplete: () => { tl = null; } });
        // assiette : sort par le haut sur l'orbite, la suivante arrive de l'autre côté
        tl.to(a.orbit, { rotation: SWING * d, duration: 0.62, ease: 'power2.in' }, 0)
          .set(a.orbit, { autoAlpha: 0, rotation: 0 }, 0.62)
          .fromTo(b.orbit, { autoAlpha: 1, rotation: -SWING * d }, { rotation: 0, duration: 0.95, ease: 'power3.out' }, 0.3);
        // titre : la ligne fine part à droite, la grasse à gauche, puis les suivantes entrent
        tl.to(a.t1, { clipPath: HIDE_1, duration: 0.42, ease: 'power2.in' }, 0)
          .to(a.t2, { clipPath: HIDE_2, duration: 0.42, ease: 'power2.in' }, 0.06)
          .to(a.eye, { autoAlpha: 0, duration: 0.25 }, 0)
          .set(a.head, { autoAlpha: 0 }, 0.5)
          .set(b.head, { autoAlpha: 1 }, 0.5)
          .fromTo(b.eye, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.55)
          .fromTo(b.t1, { clipPath: HIDE_1 }, { clipPath: SHOW, duration: 0.7, ease: 'power3.out' }, 0.55)
          .fromTo(b.t2, { clipPath: HIDE_2 }, { clipPath: SHOW, duration: 0.7, ease: 'power3.out' }, 0.62);
        // carte : fondu croisé, les lignes arrivent l'une après l'autre
        tl.to(a.body, { autoAlpha: 0, y: -6, duration: 0.3, ease: 'power1.in' }, 0.05)
          .set(b.body, { autoAlpha: 1, y: 0 }, 0.4)
          .fromTo(b.body.children, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' }, 0.4);
        // le ruban s'étire avec les assiettes, puis se pose sur le plat suivant en changeant de couleur
        tl.to(arc, { a0: ARC_SWEEP[0], a1: ARC_SWEEP[1], duration: 0.6, ease: 'power2.inOut', onUpdate: drawArc }, 0)
          .to(arc, { a0: rest[0], a1: rest[1], duration: 0.85, ease: 'power3.out', onUpdate: drawArc }, 0.6)
          .to(arcEl, { fill: tint, duration: 1.1, ease: 'power1.inOut' }, 0.1);
        shown = to;
    }

    function render() {
        dots.forEach((dot, i) => {
            dot.setAttribute('aria-selected', String(i === index));
            if (i === index) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
        });
        thumbs.forEach((thumb, i) => { if (i === index) thumb.setAttribute('aria-current', 'true'); else thumb.removeAttribute('aria-current'); });
        orbits.forEach((el, i) => el.setAttribute('aria-hidden', String(i !== index)));
        heads.forEach((el, i) => el.setAttribute('aria-hidden', String(i !== index)));
        bodies.forEach((el, i) => el.setAttribute('aria-hidden', String(i !== index)));
        stripTrack.style.transform = `translateX(${-stripStart(index) * ITEM}px)`;
        live.textContent = `Plat ${index + 1} sur ${N} : ${DISHES[index].name}`;
        const fav = typeof favorites !== 'undefined' && favorites.some(f => f.name === DISHES[index].name);
        favBtn.setAttribute('aria-pressed', String(fav));
    }

    function select(next, d) {
        if (next === index) return;
        dir = d;
        index = next;
        swap(index);
        render();
    }

    // Boutons, touches et balayages : on va au plat ET on déplace le scroll à son "cran", pour rester synchronisé
    function go(to, d) {
        const next = wrap(to);
        if (next === index) return;
        if (st) {
            const y = st.scroll();
            if (y >= st.start - 1 && y <= st.end + 1) {
                segment = next;
                st.scroll(st.start + ((st.end - st.start) * next) / steps);
            }
        }
        select(next, d || stepDirection(index, next));
    }
    const step = d => go(index + d, d);

    // ---------- Défilement : la section reste fixe, un cran de scroll = un plat ----------
    // hauteur réservée en haut : la pilule de navigation (#liquid-nav) + ses marges
    const topBar = () => { const n = document.getElementById('nimbus-bar'); return n ? n.offsetHeight + 24 : 0; };
    function syncTop() {
        track.style.setProperty('--dsh-top', topBar() + 'px');
    }
    syncTop();
    window.addEventListener('resize', syncTop);

    if (window.gsap && window.ScrollTrigger && steps > 0) {
        gsap.registerPlugin(ScrollTrigger);
        track.style.setProperty('--dsh-span', String(1 + steps * SCROLL_PER_DISH));
        st = ScrollTrigger.create({
            trigger: track,
            start: () => 'top ' + topBar() + 'px',
            end: 'bottom bottom',
            invalidateOnRefresh: true,
            snap: { snapTo: 1 / steps, duration: { min: 0.3, max: 0.8 }, delay: 0.08, ease: 'power2.inOut' },
            onUpdate: self => {
                const seg = Math.round(self.progress * steps);
                if (seg === segment) return;
                const d = seg > segment ? 1 : -1;
                segment = seg;
                select(seg, d);
            }
        });
    }

    // ---------- Taille du décor : le décor de 960 x 520 s'adapte à la section ----------
    const fit = () => root.style.setProperty('--dsh-s', String(Math.min(root.clientWidth / 960, root.clientHeight / 520, 1.6)));
    fit();
    if (typeof ResizeObserver === 'function') new ResizeObserver(fit).observe(root);
    else window.addEventListener('resize', fit);

    // ---------- Interactions ----------
    $('[data-dsh-prev]').addEventListener('click', () => step(-1));
    $('[data-dsh-next]').addEventListener('click', () => step(1));
    root.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });
    platesEl.addEventListener('pointerdown', e => { swipe = { x: e.clientX, y: e.clientY }; });
    platesEl.addEventListener('pointercancel', () => { swipe = null; });
    platesEl.addEventListener('pointerup', e => {
        const s = swipe; swipe = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.4) step(dx < 0 ? 1 : -1);
    });
    root.querySelectorAll('[data-dsh-tab]').forEach(tab => tab.addEventListener('click', () => {
        root.dataset.tab = tab.dataset.dshTab;
        root.querySelectorAll('[data-dsh-tab]').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    }));
    addBtn.addEventListener('click', () => {
        const d = DISHES[index];
        if (typeof addToCart === 'function') addToCart(d.name, d.price, absolute(d.image));
    });
    favBtn.addEventListener('click', () => {
        const d = DISHES[index];
        if (typeof addToFavorites === 'function') addToFavorites(d.name, d.price, absolute(d.image));
        render();
    });

    root.dataset.tab = 'overview';
    swap(0);
    render();
})();
