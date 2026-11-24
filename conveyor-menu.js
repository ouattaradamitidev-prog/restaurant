// ==================== TAPIS ROULANT DES PLATS ====================
// Version JavaScript natif du composant "sushi-conveyor-menu" (React/Tailwind),
// adaptée au site statique : mêmes maths pour la boucle, le zoom en perspective,
// le survol, le glissement à la souris/au doigt et la fenêtre de détails.
(() => {
    const root = document.querySelector('[data-belt]');
    if (!root) return;

    // ---------- Les plats (modifie ici noms, prix, photos) ----------
    const DISHES = [
        { name: 'Wrap Poulet',     price: 3200, image: './IMAGE/c5.jpg', description: 'Wrap garni de poulet grillé, légumes frais et sauce spéciale.' },
        { name: 'Nuggets Box',     price: 2800, image: './IMAGE/c7.jpg', description: '10 nuggets croustillants avec sauce au choix.' },
        { name: 'Hot Dog Premium', price: 2200, image: './IMAGE/c8.jpg', description: 'Saucisse de qualité avec garniture complète.' },
        { name: 'Sandwich Club',   price: 3500, image: './IMAGE/p3.jpg', description: 'Triple sandwich avec poulet, bacon et œuf.' },
        { name: 'Pasta Carbonara', price: 4000, image: './IMAGE/p5.jpg', description: 'Pâtes crémeuses avec lardons et parmesan.' },
        { name: 'Menu Enfant',     price: 2000, image: './IMAGE/p6.jpg', description: 'Nuggets, frites et boisson avec jouet surprise.' }
    ];

    // Le bord de l'assiette change de couleur selon le prix (5 niveaux)
    const prices = DISHES.map(d => d.price);
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    DISHES.forEach(d => { d.tier = hi === lo ? 1 : 1 + Math.round((d.price - lo) / (hi - lo) * 4); });

    const n = DISHES.length;
    const SPACING = 1.35, CURVE = 0.95, BAND = 1.22, TILT = 0.8, SLAT = 0.34;
    const LIFT_Y = -6, LIFT_SCALE = 0.08, CHIP_ROOM = 34, SPEED = 26;
    const RUN = 0, SEEK = 1, DRAG = 2;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const pad = v => String(v).padStart(2, '0');
    const number = v => new Intl.NumberFormat('fr-FR').format(v);
    const money = v => number(v) + ' FCFA';

    // ---------- Géométrie : une piste en forme de stade, vue en perspective ----------
    function along(g, u) {
        const { s, r } = g;
        let t = ((u % g.l) + g.l) % g.l;
        if (t < s) return { x: s / 2 - t, z: r, nx: 0, nz: 1, tx: -1, tz: 0 };
        t -= s;
        const arc = Math.PI * r;
        if (t < arc) {
            const f = t / r, sin = Math.sin(f), cos = Math.cos(f);
            return { x: -s / 2 - r * sin, z: r * cos, nx: -sin, nz: cos, tx: -cos, tz: -sin };
        }
        t -= arc;
        if (t < s) return { x: -s / 2 + t, z: -r, nx: 0, nz: -1, tx: 1, tz: 0 };
        t -= s;
        const f = Math.min(Math.PI, t / r), sin = Math.sin(f), cos = Math.cos(f);
        return { x: s / 2 + r * sin, z: -r * cos, nx: sin, nz: -cos, tx: cos, tz: sin };
    }

    function project(g, x, z) {
        const k = g.a + g.b * z;
        return { x: g.cx + x * k, y: g.ym + TILT * (g.a * z + (g.b * z * z) / 2), k };
    }

    function makeGeo(width, count, d, kb) {
        const l = Math.max(1, count) * SPACING * d;
        const r = Math.min(CURVE * d, l / (2 * Math.PI));
        const s = Math.max(0, (l - 2 * Math.PI * r) / 2);
        const g = { width, height: 0, d, r, s, l, pitch: l / Math.max(1, count), n: Math.max(1, count), kb, cx: width / 2, ym: 0, a: (1 + kb) / 2, b: (1 - kb) / (2 * r), band: BAND * d, slats: Math.max(10, Math.round(l / (SLAT * d))), side: Math.max(3, d * 0.07) };
        let top = Infinity, bottom = -Infinity;
        for (let j = 0; j < 120; j++) {
            const p = along(g, (j / 120) * l);
            const rim = project(g, p.x + (p.nx * g.band) / 2, p.z + (p.nz * g.band) / 2);
            const plate = project(g, p.x, p.z);
            const half = (plate.k * d * TILT) / 2;
            top = Math.min(top, rim.y, plate.y + (LIFT_Y / 100) * half * 2 - half * (1 + LIFT_SCALE) - CHIP_ROOM);
            bottom = Math.max(bottom, rim.y + g.side + d * 0.06, plate.y + half + d * 0.08);
        }
        g.ym = Math.ceil(-top) + 2;
        g.height = Math.ceil(bottom - top) + 4;
        return g;
    }

    function halfSpan(g) {
        let span = 0;
        for (let j = 0; j < 120; j++) {
            const p = along(g, (j / 120) * g.l);
            const rim = project(g, p.x + (p.nx * g.band) / 2, p.z + (p.nz * g.band) / 2);
            const plate = project(g, p.x, p.z);
            span = Math.max(span, Math.abs(rim.x - g.cx) + 3, Math.abs(plate.x - g.cx) + (plate.k * g.d * (1 + LIFT_SCALE)) / 2);
        }
        return span;
    }

    function edgePath(g, offset) {
        let d = '';
        for (let j = 0; j < 168; j++) {
            const p = along(g, (j / 168) * g.l);
            const q = project(g, p.x + p.nx * offset, p.z + p.nz * offset);
            d += `${j ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
        }
        return d + 'Z';
    }

    // Les traits en croissant du tapis : redessinés à chaque image pour suivre le mouvement
    function slatPath(g, offset, shift) {
        const half = g.band * 0.46;
        const pitch = g.l / g.slats;
        const bulge = pitch * 0.2;
        let d = '';
        for (let j = 0; j < g.slats; j++) {
            const p = along(g, offset + shift + j * pitch);
            const inner = project(g, p.x - p.nx * half, p.z - p.nz * half);
            const outer = project(g, p.x + p.nx * half, p.z + p.nz * half);
            const mid = project(g, p.x + p.tx * bulge, p.z + p.tz * bulge);
            d += `M${inner.x.toFixed(1)} ${inner.y.toFixed(1)}Q${(2 * mid.x - (inner.x + outer.x) / 2).toFixed(1)} ${(2 * mid.y - (inner.y + outer.y) / 2).toFixed(1)} ${outer.x.toFixed(1)} ${outer.y.toFixed(1)}`;
        }
        return d;
    }

    function pose(g, offset, i) {
        const p = along(g, offset - i * g.pitch);
        const q = project(g, p.x, p.z);
        return { x: q.x, y: q.y, k: q.k, depth: (p.z + g.r) / (2 * g.r) };
    }

    const centerOf = (g, offset) => ((Math.round((offset - g.s / 2) / g.pitch) % g.n) + g.n) % g.n;

    // ---------- Éléments de la page ----------
    const stage = root.querySelector('[data-belt-stage]');
    const svg = root.querySelector('[data-belt-svg]');
    const caption = root.querySelector('[data-belt-caption]');
    const legendEl = root.querySelector('[data-belt-legend]');
    const pauseBtn = root.querySelector('[data-belt-pause]');
    const dialog = document.querySelector('[data-belt-dialog]');
    const defaultCaption = caption.textContent.trim();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    const cheapest = {};
    DISHES.forEach(d => { if (!(d.tier in cheapest) || d.price < cheapest[d.tier]) cheapest[d.tier] = d.price; });
    legendEl.innerHTML = Object.keys(cheapest).sort().map(t => `<li><span class="belt-dot" data-tier="${t}"></span>${number(cheapest[t])}</li>`).join('') + '<li>FCFA</li>';

    const plates = DISHES.map((d, i) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'plate';
        el.dataset.dish = i;
        el.dataset.tier = d.tier;
        el.setAttribute('aria-label', `${d.name}, ${money(d.price)}`);
        el.setAttribute('aria-haspopup', 'dialog');
        el.innerHTML =
            '<span class="plate-shadow" aria-hidden="true"></span>' +
            '<span class="plate-lift">' +
                `<span class="plate-disc" aria-hidden="true"><img src="${d.image}" alt="" draggable="false"></span>` +
                '<span class="plate-ring" aria-hidden="true"></span>' +
                '<span class="plate-anchor" aria-hidden="true"><span class="plate-chip"><i></i>' + d.name + ' <b>' + money(d.price) + '</b></span></span>' +
            '</span>';
        stage.appendChild(el);
        return { el, lift: el.querySelector('.plate-lift'), shadow: el.querySelector('.plate-shadow'), anchor: el.querySelector('.plate-anchor') };
    });

    // ---------- État ----------
    const s = { offset: 0, v: 0, mode: RUN, target: 0, lift: [], vlift: [], raf: 0, last: 0, visible: true, init: false, l: 0, center: -1, px: 0, py: 0, inside: false, lock: false, lockX: 0, lockY: 0 };
    const ptr = { id: -1, index: -1, x: 0, y: 0, moved: false, start: 0, lane: 1, lastX: 0, lastT: 0, v: 0 };
    let geo = null, active = null, paused = false, isOpen = false, returnIndex = null, pendingOpen = -1, seam = null, glint = null;

    const focusVisible = () => !!stage.querySelector('.plate:focus-visible');

    function buildSvg(g) {
        const outer = edgePath(g, g.band / 2);
        const inner = edgePath(g, -g.band / 2);
        const island = edgePath(g, -g.band / 2 - g.d * 0.035);
        const w = (a, b) => Math.max(a, g.d * b).toFixed(2);
        svg.setAttribute('width', g.width);
        svg.setAttribute('height', g.height);
        svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
        svg.innerHTML =
            '<defs>' +
                `<filter id="belt-soft" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="${(g.d * 0.06).toFixed(1)}"/></filter>` +
                '<linearGradient id="belt-island" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--island)"/><stop offset="1" style="stop-color:var(--island-low)"/></linearGradient>' +
            '</defs>' +
            `<path d="${outer}" transform="translate(0 ${(g.side + g.d * 0.07).toFixed(1)})" fill="#000" opacity=".18" filter="url(#belt-soft)"/>` +
            `<path d="${outer}${inner}" fill-rule="evenodd" transform="translate(0 ${g.side.toFixed(1)})" style="fill:var(--belt-side)"/>` +
            `<path d="${outer}${inner}" fill-rule="evenodd" style="fill:var(--belt)"/>` +
            `<path class="seam" fill="none" stroke="#000" stroke-opacity=".42" stroke-width="${w(1, 0.013)}" stroke-linecap="round"/>` +
            `<path class="glint" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="${w(0.8, 0.009)}" stroke-linecap="round"/>` +
            `<path d="${outer}" fill="none" style="stroke:var(--rail)" stroke-width="${w(2, 0.026)}"/>` +
            `<path d="${inner}" fill="none" style="stroke:var(--rail)" stroke-width="${w(1.6, 0.02)}"/>` +
            `<path d="${island}" style="fill:var(--island-wall)"/>` +
            `<path d="${island}" transform="translate(0 ${(-g.side * 0.6).toFixed(1)})" style="fill:url(#belt-island)"/>` +
            `<path d="${island}" transform="translate(0 ${(-g.side * 0.6 - 0.6).toFixed(1)})" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="${w(0.8, 0.008)}"/>`;
        seam = svg.querySelector('.seam');
        glint = svg.querySelector('.glint');
    }

    function paintPlate(i) {
        const g = geo;
        const p = plates[i];
        const q = pose(g, s.offset, i);
        const e = s.lift[i] || 0;
        p.el.style.transform = `translate3d(${(q.x - g.d / 2).toFixed(2)}px,${(q.y - (g.d * TILT) / 2).toFixed(2)}px,0) scale(${q.k.toFixed(4)})`;
        p.el.style.zIndex = i === active ? 2000 : 100 + Math.round(q.y);
        p.lift.style.transform = `translateY(${(LIFT_Y * e).toFixed(3)}%) scale(${(1 + LIFT_SCALE * e).toFixed(4)})`;
        p.shadow.style.transform = `translate3d(0,${(g.d * TILT * 0.05 * e).toFixed(2)}px,0) scale(${(1 + 0.14 * e).toFixed(3)})`;
        p.shadow.style.opacity = (0.5 * (1 - 0.5 * clamp(e, 0, 1))).toFixed(3);
        p.anchor.style.transform = `scale(${(1 / (q.k * (1 + LIFT_SCALE * e))).toFixed(4)})`;
    }

    function paintAll() {
        if (!geo) return;
        for (let i = 0; i < n; i++) paintPlate(i);
        seam.setAttribute('d', slatPath(geo, s.offset, 0));
        glint.setAttribute('d', slatPath(geo, s.offset, -Math.max(1.4, geo.d * 0.024)));
        const c = centerOf(geo, s.offset);
        if (c !== s.center) { s.center = c; updateTabs(); }
    }

    // Une seule assiette est atteignable au clavier (Tab), les flèches font le reste
    function updateTabs() {
        const roving = active !== null ? active : s.center;
        plates.forEach((p, i) => { p.el.tabIndex = i === roving ? 0 : -1; });
    }

    function hitTest(px, py) {
        if (!geo) return null;
        let best = null, bestY = -Infinity;
        for (let i = 0; i < n; i++) {
            const q = pose(geo, s.offset, i);
            const e = clamp(s.lift[i] || 0, 0, 1.2);
            const grow = (1 + LIFT_SCALE * e) * (i === active ? 1.1 : 1);
            const rx = (geo.d * q.k * grow) / 2;
            const ry = (geo.d * TILT * q.k * grow) / 2;
            const dx = (px - q.x) / rx;
            const dy = (py - (q.y + (LIFT_Y / 100) * geo.d * TILT * q.k * e)) / ry;
            if (dx * dx + dy * dy > 1) continue;
            if (i === active) return i;
            if (q.y > bestY) { best = i; bestY = q.y; }
        }
        return best;
    }

    function hover(hit) {
        if (hit === active) return;
        if (hit !== null) { setActive(hit); return; }
        if (active !== null && !focusVisible()) setActive(null);
    }

    // ---------- Boucle d'animation ----------
    function tick(now) {
        s.raf = 0;
        if (!geo || !s.visible) { s.last = 0; return; }
        const dt = s.last ? clamp((now - s.last) / 1000, 0, 0.25) : 1 / 60;
        s.last = now;
        const steps = Math.max(1, Math.ceil(dt / 0.017));
        const h = dt / steps;
        const stopped = paused || active !== null || isOpen;
        const cruise = reduce.matches ? 0 : SPEED;
        for (let step = 0; step < steps; step++) {
            if (s.mode === SEEK) {
                const w = 5.6;
                s.v += (w * w * (s.target - s.offset) - 2 * w * s.v) * h;
                s.offset += s.v * h;
                if (Math.abs(s.target - s.offset) < 0.3 && Math.abs(s.v) < 4) { s.offset = s.target; s.v = 0; s.mode = RUN; }
            } else if (s.mode === RUN) {
                if (stopped) {
                    s.v *= Math.exp(-7.2 * h);
                    if (Math.abs(s.v) < 0.02) s.v = 0;
                } else {
                    let e = s.v - cruise;
                    if (Math.abs(e) > Math.max(6, cruise * 0.5)) e = Math.sign(e) * Math.max(0, Math.abs(e) * Math.exp(-2.4 * h) - 90 * h);
                    else e *= Math.exp(-3.4 * h);
                    s.v = cruise + (Math.abs(e) < 0.01 ? 0 : e);
                }
                s.offset += s.v * h;
            }
            for (let i = 0; i < n; i++) {
                const goal = i === active ? 1 : 0;
                if (reduce.matches) { s.lift[i] = goal; s.vlift[i] = 0; continue; }
                const x = s.lift[i] || 0;
                const v = (s.vlift[i] || 0) + (330 * (goal - x) - 23 * (s.vlift[i] || 0)) * h;
                s.lift[i] = x + v * h;
                s.vlift[i] = v;
            }
        }
        let busy = s.mode !== RUN || s.v !== 0 || (!stopped && cruise > 0);
        for (let i = 0; i < n; i++) {
            const goal = i === active ? 1 : 0;
            if (Math.abs(goal - (s.lift[i] || 0)) < 0.002 && Math.abs(s.vlift[i] || 0) < 0.02) { s.lift[i] = goal; s.vlift[i] = 0; }
            else busy = true;
        }
        // La souris reste immobile mais le tapis avance : une assiette peut arriver sous le curseur
        if (s.inside && !s.lock && s.mode === RUN && !isOpen && ptr.id < 0 && Math.abs(s.v) > 0.3) {
            const hit = hitTest(s.px, s.py);
            if (hit !== null && hit !== active) hover(hit);
        }
        paintAll();
        if (busy) s.raf = requestAnimationFrame(tick);
        else s.last = 0;
    }

    function kick() {
        if (s.raf || !s.visible) return;
        s.last = 0;
        s.raf = requestAnimationFrame(tick);
    }

    function setActive(next) {
        if (active === next) return;
        active = next;
        plates.forEach((p, i) => { if (i === next) p.el.dataset.active = ''; else delete p.el.dataset.active; });
        const d = next === null ? null : DISHES[next];
        caption.innerHTML = d ? `<strong>${d.name}</strong> <span>· ${money(d.price)}</span><em>${d.description}</em>` : defaultCaption;
        updateTabs();
        kick();
    }

    function seekTo(index) {
        if (!geo) return;
        const base = geo.s / 2 + index * geo.pitch;
        s.target = base + Math.round((s.offset - base) / geo.l) * geo.l;
        if (reduce.matches) { s.offset = s.target; s.v = 0; s.mode = RUN; paintAll(); return; }
        s.mode = SEEK;
        kick();
    }

    function go(index, focus) {
        const next = ((index % n) + n) % n;
        if (focus) plates[next].el.focus({ preventScroll: true });
        setActive(next);
        seekTo(next);
    }

    // ---------- Taille de la page ----------
    function layout() {
        const width = Math.round(stage.clientWidth);
        const full = Math.round(root.clientWidth);
        if (!width) return;
        const kb = full < 480 ? 0.6 : 0.68;
        const span = halfSpan(makeGeo(1000, n, 100, kb)) / 100;
        const cap = full >= 900 ? 150 : clamp(full * 0.16, 96, 150);
        const fit = (width - 8) / (2 * span);
        const g = makeGeo(width, n, Math.round(clamp(fit, Math.min(96, cap), cap)), kb);
        if (!s.init) {
            s.init = true;
            s.offset = reduce.matches ? g.s / 2 : g.s / 2 - Math.min(SPEED * 1.62, g.pitch * 0.45);
            s.v = reduce.matches || paused ? 0 : SPEED;
        } else if (s.l > 0 && s.l !== g.l) {
            const f = g.l / s.l;
            s.offset *= f;
            s.target *= f;
        }
        s.l = g.l;
        geo = g;
        stage.style.height = g.height + 'px';
        buildSvg(g);
        plates.forEach(p => {
            p.el.style.width = g.d + 'px';
            p.el.style.height = (g.d * TILT) + 'px';
            p.shadow.style.filter = `blur(${Math.max(2, g.d * 0.045).toFixed(1)}px)`;
        });
        paintAll();
        kick();
    }

    // ---------- Souris, doigt et clavier ----------
    const local = e => {
        const box = stage.getBoundingClientRect();
        return { x: e.clientX - box.left, y: e.clientY - box.top };
    };

    stage.addEventListener('pointerdown', e => {
        if (e.button !== 0 || !geo) return;
        const at = local(e);
        const hit = hitTest(at.x, at.y);
        pendingOpen = -1;
        Object.assign(ptr, { id: e.pointerId, index: hit === null ? -1 : hit, x: e.clientX, y: e.clientY, moved: false, start: s.offset, lane: at.y >= geo.ym ? 1 : -1, lastX: e.clientX, lastT: e.timeStamp, v: 0 });
    });

    stage.addEventListener('pointermove', e => {
        if (!geo) return;
        const at = local(e);
        if (e.pointerType === 'mouse') { s.px = at.x; s.py = at.y; s.inside = true; }
        if (ptr.id === e.pointerId) {
            const dx = e.clientX - ptr.x;
            if (!ptr.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - ptr.y)) {
                ptr.moved = true;
                if (s.mode === SEEK) s.mode = RUN;
                setActive(null);
                s.mode = DRAG;
                stage.setPointerCapture(e.pointerId);
            }
            if (ptr.moved) {
                const v = (e.clientX - ptr.lastX) / Math.max(1, e.timeStamp - ptr.lastT);
                ptr.v = ptr.v * 0.6 + v * 0.4;
                ptr.lastX = e.clientX;
                ptr.lastT = e.timeStamp;
                const scale = ptr.lane > 0 ? 1 : 1 / geo.kb;
                s.offset = ptr.start - ptr.lane * dx * scale;
                s.v = reduce.matches ? 0 : -ptr.lane * ptr.v * 1000 * scale;
                kick();
            }
            return;
        }
        if (e.pointerType !== 'mouse' || isOpen) return;
        if (s.lock) {
            if (Math.hypot(at.x - s.lockX, at.y - s.lockY) < 4) return;
            s.lock = false;
        }
        hover(hitTest(at.x, at.y));
    });

    function finishPointer(e, cancelled) {
        if (ptr.id !== e.pointerId) return;
        if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
        const p = { ...ptr };
        ptr.id = -1;
        if (s.mode === DRAG) {
            s.mode = RUN;
            // Si on s'arrête avant de lâcher, l'élan disparaît
            const carry = Math.exp(-Math.max(0, e.timeStamp - p.lastT) / 70);
            s.v = reduce.matches ? 0 : clamp(s.v * carry, -1400, 1400);
            if (e.pointerType === 'mouse') { const at = local(e); s.lock = true; s.lockX = at.x; s.lockY = at.y; }
            kick();
            return;
        }
        if (cancelled || p.moved) return;
        const touch = e.pointerType !== 'mouse';
        if (p.index < 0) { if (touch && active !== null) setActive(null); return; }
        if (touch && active !== p.index) setActive(p.index);
        else pendingOpen = p.index;
    }
    stage.addEventListener('pointerup', e => finishPointer(e, false));
    stage.addEventListener('pointercancel', e => finishPointer(e, true));

    stage.addEventListener('pointerleave', e => {
        if (e.pointerType !== 'mouse') return;
        s.inside = false;
        s.lock = false;
        if (ptr.id < 0 && !isOpen && active !== null && !focusVisible()) setActive(null);
    });

    stage.addEventListener('focusout', e => {
        const next = e.relatedTarget;
        if ((next && stage.contains(next)) || isOpen || s.inside) return;
        if (active !== null) setActive(null);
    });

    stage.addEventListener('keydown', e => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        const own = e.target.closest('[data-dish]');
        const from = own ? Number(own.dataset.dish) : (active !== null ? active : s.center);
        go(e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : from + (e.key === 'ArrowRight' ? 1 : -1), true);
    });

    plates.forEach((p, i) => {
        p.el.addEventListener('focus', () => { if (ptr.id < 0) setActive(i); });
        // Entrée / Espace au clavier ouvrent la fiche ; à la souris c'est pointerup qui décide
        p.el.addEventListener('click', e => {
            const pending = pendingOpen;
            pendingOpen = -1;
            if (e.detail === 0 || pending === i) openDish(i);
        });
    });

    root.querySelector('[data-belt-prev]').addEventListener('click', () => go((active !== null ? active : s.center) - 1, false));
    root.querySelector('[data-belt-next]').addEventListener('click', () => go((active !== null ? active : s.center) + 1, false));
    pauseBtn.addEventListener('click', () => {
        paused = !paused;
        pauseBtn.setAttribute('aria-pressed', String(paused));
        pauseBtn.setAttribute('aria-label', paused ? 'Relancer le tapis' : 'Mettre le tapis en pause');
        pauseBtn.firstElementChild.className = paused ? 'fas fa-play' : 'fas fa-pause';
        if (!paused && active !== null && !focusVisible() && !s.inside) setActive(null);
        kick();
    });

    // ---------- Fenêtre de détails ----------
    const $d = selector => dialog.querySelector(selector);
    const addBtn = $d('[data-dialog-add]');
    const favBtn = $d('[data-dialog-fav]');
    const absolute = path => new URL(path, location.href).href;
    let closeTimer = 0;

    function openDish(i) {
        const d = DISHES[i];
        setActive(i);
        s.v = 0;
        s.mode = RUN;
        isOpen = true;
        returnIndex = i;
        dialog.dataset.tier = d.tier;
        dialog.dataset.dish = i;
        const img = $d('[data-dialog-image]');
        img.src = d.image;
        img.alt = d.name;
        $d('[data-dialog-index]').textContent = `${pad(i + 1)} / ${pad(n)}`;
        $d('[data-dialog-title]').textContent = d.name;
        $d('[data-dialog-desc]').textContent = d.description;
        $d('[data-dialog-price]').textContent = money(d.price);
        addBtn.disabled = false;
        addBtn.innerHTML = ihbMarkup('Ajouter au panier');
        favBtn.setAttribute('aria-pressed', String(typeof favorites !== 'undefined' && favorites.some(f => f.name === d.name)));
        document.body.style.overflow = 'hidden';
        dialog.showModal();
        kick();
    }

    addBtn.addEventListener('click', () => {
        const d = DISHES[Number(dialog.dataset.dish)];
        if (!d || addBtn.disabled) return;
        if (typeof addToCart === 'function') addToCart(d.name, d.price, absolute(d.image));
        addBtn.disabled = true;
        addBtn.innerHTML = ihbMarkup('Ajouté');
        closeTimer = window.setTimeout(() => dialog.close(), reduce.matches ? 0 : 600);
    });

    favBtn.addEventListener('click', () => {
        const d = DISHES[Number(dialog.dataset.dish)];
        if (!d || typeof addToFavorites !== 'function') return;
        addToFavorites(d.name, d.price, absolute(d.image));
        favBtn.setAttribute('aria-pressed', String(favorites.some(f => f.name === d.name)));
    });

    $d('[data-belt-close]').addEventListener('click', () => dialog.close());
    // Un clic sur le fond (hors de la carte) ferme la fenêtre
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
        window.clearTimeout(closeTimer);
        isOpen = false;
        document.body.style.overflow = '';
        if (returnIndex !== null) {
            plates[returnIndex].el.focus({ preventScroll: true });
            if (!focusVisible() && !s.inside) setActive(null);
        }
        kick();
    });

    // ---------- Démarrage ----------
    if (typeof ResizeObserver === 'function') {
        const ro = new ResizeObserver(layout);
        ro.observe(root);
        ro.observe(stage);
    } else window.addEventListener('resize', layout);

    // Le tapis s'arrête tout seul quand la section n'est pas visible (économise la batterie)
    let inView = true;
    const syncVisibility = () => {
        const visible = inView && !document.hidden;
        if (visible === s.visible) return;
        s.visible = visible;
        if (visible) kick();
        else if (s.raf) { cancelAnimationFrame(s.raf); s.raf = 0; s.last = 0; }
    };
    if (typeof IntersectionObserver === 'function') {
        new IntersectionObserver(entries => { inView = entries.some(en => en.isIntersecting); syncVisibility(); }).observe(root);
    }
    document.addEventListener('visibilitychange', syncVisibility);
    reduce.addEventListener('change', () => { s.v = reduce.matches ? 0 : SPEED; kick(); });

    layout();
})();
