/* Navbar liquide : port en JavaScript natif du composant "Liquid Navbar / Waterline" (Nimbus UI).
   Aucune dépendance. L'eau est dessinée par un petit shader WebGL, uniquement dans la pilule, et mise en pause hors écran.
   Sans WebGL : repli sur une goutte CSS. Suit aussi la section visible (scroll-spy). */
(function () {
  'use strict';
  var PAD = 14; // marge du canvas autour de la pilule (ombres, ondulations)

  var VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FRAG = `precision highp float;
uniform vec2 uRes;uniform float uDpr;uniform float uTime;uniform vec4 uPill;
uniform vec4 uBlob[6];uniform float uSy[6];uniform vec4 uRip[6];uniform vec3 uMouse;uniform float uDark;uniform float uAmb;
float sdRB(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
float sdCap(vec2 p,vec4 B,float sy){p-=B.xy;p.y/=sy;p.x=max(abs(p.x)-B.z,0.);return(length(p)-B.w)*min(1.,sy);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float dropD(vec2 p){float d=1e4;for(int i=0;i<6;i++){if(uBlob[i].w>.5){d=smin(d,sdCap(p,uBlob[i],uSy[i]),13.);}}return d;}
float pillD(vec2 p){vec2 h=uPill.zw*.5;return sdRB(p-uPill.xy-h,h,h.y);}
float lens(float d,float w){float t=clamp(-d/w,0.,1.);return sqrt(1.-(1.-t)*(1.-t));}
float waves(vec2 p){float w=0.;
 for(int i=0;i<6;i++){vec4 R=uRip[i];if(R.w>0.){float x=length(p-R.xy)-R.z*240.;w+=R.w*exp(-R.z*1.7)*sin(x*.3)*exp(-x*x/700.);}}
 vec2 m=p-uMouse.xy;w+=uMouse.z*3.6*exp(-dot(m,m)/1000.);
 w+=uAmb*(sin(p.x*.05+uTime*1.2)*.45+sin(p.x*.13-uTime*.85+p.y*.2)*.25);return w;}
float H(vec2 p){float dp=pillD(p);return lens(dp,uPill.w*.36)*2.4+lens(dropD(p),11.)*7.5+waves(p)*smoothstep(0.,7.,-dp);}
float caus(vec2 p,float t){vec2 q=p;float c=0.;for(int i=0;i<3;i++){q+=vec2(sin(q.y*1.1+t),cos(q.x*1.3-t*.7))*.6;c+=1./(1.+16.*abs(sin(q.x)*sin(q.y)));}return c/3.;}
void main(){
 vec2 p=vec2(gl_FragCoord.x,uRes.y*uDpr-gl_FragCoord.y)/uDpr;
 float dp=pillD(p);float dd=dropD(p);
 float h0=H(p);vec3 n=normalize(vec3(h0-H(p+vec2(1.,0.)),h0-H(p+vec2(0.,1.)),1.));
 vec3 V=vec3(0.,0.,1.);
 float spec=pow(max(dot(reflect(-normalize(vec3(-.45,-.8,.85)),n),V),0.),70.);
 float spec2=pow(max(dot(reflect(-normalize(vec3(.6,.75,.7)),n),V),0.),22.)*.3;
 float fres=clamp((1.-n.z)*4.,0.,1.);
 vec3 irid=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+fres*.85+p.x*.0028+uTime*.035));
 float pm=smoothstep(1.,-1.,dp);float dm=smoothstep(1.,-1.,dd)*smoothstep(1.,-2.,dp);
 float sh=smoothstep(9.,-9.,dropD(p-vec2(0.,5.)))*(1.-dm)*pm*(.11+.07*uDark);
 vec3 c=vec3(0.,.14,.36)*sh;float a=sh;
 float pa=clamp(pm*(fres*.5+spec*.9+spec2),0.,1.);
 c=mix(vec3(1.),irid,.5*fres)*pa+c*(1.-pa);a=pa+a*(1.-pa);
 float th=lens(dd,11.);
 float cs=caus((p+n.xy*th*18.)*.085,uTime*.9);
 vec3 tint=mix(vec3(.80,.95,1.),vec3(.55,.82,1.),uDark);
 float rim=dm*(1.-smoothstep(0.,8.,-dd));
 float cres=dm*smoothstep(.12,.55,dot(n.xy,normalize(vec2(.55,.85))))*smoothstep(0.,3.,-dd);
 float body=.5+.5*clamp(-n.y*3.,-1.,1.);
 float da=dm*(.26+.14*body)*(1.-.35*uDark);vec3 dc=mix(tint,vec3(1.),body*.6);
 float la=rim*.22;vec3 lc=mix(vec3(0.,.42,.78),vec3(.1,.55,.95),uDark);dc=lc*la+dc*da*(1.-la);da=la+da*(1.-la);
 la=clamp(cres*.7+smoothstep(.6,1.,cs)*.28*th*dm,0.,1.);dc=vec3(1.)*la+dc*(1.-la);da=la+da*(1.-la);
 la=clamp(dm*(spec*1.2+spec2*.5),0.,1.);dc=vec3(1.)*la+dc*(1.-la);da=la+da*(1.-la);
 la=dm*smoothstep(-2.,0.,dd)*.4;dc=mix(vec3(1.),irid,.35)*la+dc*(1.-la);da=la+da*(1.-la);
 c=dc+c*(1.-da);a=da+a*(1.-da);
 gl_FragColor=vec4(c,a);
}`;

  function makeState() {
    return {
      a: { x: 0, v: 0 }, b: { x: 0, v: 0 }, sy: { s: 1, v: 0 }, lead: 0, lagFrom: 0,
      sats: [], rips: [], t: { x: 0, cy: 0, q: 0, r: 21 }, q: 0,
      mouse: { x: 0, y: 0, s: 0, on: false },
      moving: false, split: false, ready: false, w: 0, h: 0,
      visible: true, reduce: false, still: false, raf: 0, last: 0, time: 0, glc: null
    };
  }

  function initGL(canvas) {
    var gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    gl.useProgram(p);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(p, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var u = {};
    ['uRes', 'uDpr', 'uTime', 'uPill', 'uBlob', 'uSy', 'uRip', 'uMouse', 'uDark', 'uAmb'].forEach(function (n) { u[n] = gl.getUniformLocation(p, n); });
    return { gl: gl, u: u };
  }

  function supportsRefraction() {
    if (typeof CSS === 'undefined' || !CSS.supports) return false;
    var ua = navigator.userAgent;
    return /Chrome\/|Chromium\/|Edg\//.test(ua) && !/Firefox\//.test(ua) && CSS.supports('backdrop-filter', 'url(#a)');
  }

  function init(nav) {
    var items = [].slice.call(nav.querySelectorAll('.nimbus-item'));
    var isStatic = !items.length; // pilule sans goutte (logo, boutons) : même verre et mêmes ondulations, sans eau ambiante
    var icons = items.map(function (el) { return el.querySelector('.nv-ico'); });
    var s = makeState();
    s.still = isStatic;
    var current = Math.max(0, items.findIndex(function (el) { return el.hasAttribute('aria-current'); }));
    var dark = nav.getAttribute('data-tone') === 'dark' ? 1 : 0;

    // couches visuelles (verre, eau WebGL, goutte de repli)
    var glass = document.createElement('span'); glass.className = 'nimbus-glass'; glass.setAttribute('aria-hidden', 'true');
    var canvas = document.createElement('canvas'); canvas.className = 'nimbus-water'; canvas.setAttribute('aria-hidden', 'true');
    var dropEl = document.createElement('span'); dropEl.className = 'nimbus-drop'; dropEl.setAttribute('aria-hidden', 'true');
    nav.insertBefore(dropEl, nav.firstChild); nav.insertBefore(canvas, dropEl); nav.insertBefore(glass, canvas);
    nav.setAttribute('data-gl', 'on');
    nav.setAttribute('data-refract', supportsRefraction() ? 'on' : 'off');

    /* ---- dessin ---- */
    function draw() {
      var T = s.t, sep = Math.abs(s.a.x - s.b.x);
      var thin = Math.min(sep / (2 * (s.q + T.r) || 1), 1);
      var r = T.r * (1 - 0.3 * thin);
      if (s.glc) {
        var g = s.glc.gl, u = s.glc.u;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        g.viewport(0, 0, g.drawingBufferWidth, g.drawingBufferHeight);
        g.uniform2f(u.uRes, s.w + PAD * 2, s.h + PAD * 2);
        g.uniform1f(u.uDpr, dpr);
        g.uniform1f(u.uTime, s.time);
        g.uniform4f(u.uPill, PAD, PAD, s.w, s.h);
        var blobs = new Float32Array(24), sy = new Float32Array(6).fill(1);
        var head = s.lead === 0 ? s.a : s.b, tail = s.lead === 0 ? s.b : s.a;
        blobs.set([head.x, T.cy, s.q * (1 - 0.25 * thin), T.r * (1 - 0.12 * thin), tail.x, T.cy, s.q * (1 - 0.8 * thin), T.r * (1 - 0.5 * thin)], 0);
        sy[0] = sy[1] = s.sy.s;
        s.sats.slice(0, 4).forEach(function (d, i) { blobs.set([d.x, d.y, 0, d.r], 8 + i * 4); });
        g.uniform4fv(u.uBlob, blobs);
        g.uniform1fv(u.uSy, sy);
        var rips = new Float32Array(24);
        s.rips.slice(-6).forEach(function (p, i) { rips.set([p.x, p.y, p.age, p.amp], i * 4); });
        g.uniform4fv(u.uRip, rips);
        g.uniform3f(u.uMouse, s.mouse.x, s.mouse.y, s.mouse.s);
        g.uniform1f(u.uDark, dark);
        g.uniform1f(u.uAmb, s.reduce || s.still ? 0 : 1);
        g.clearColor(0, 0, 0, 0);
        g.clear(g.COLOR_BUFFER_BIT);
        g.drawArrays(g.TRIANGLES, 0, 3);
      } else {
        var left = Math.min(s.a.x, s.b.x) - s.q - r - PAD;
        var width = sep + 2 * (s.q + r);
        dropEl.style.width = width + 'px';
        dropEl.style.transform = 'translateX(' + left + 'px) scaleY(' + s.sy.s + ')';
      }
    }

    /* ---- physique ---- */
    function step(dt, now) {
      var T = s.t;
      s.time += dt;
      if (s.still) { // pas de goutte : seulement ondulations et ménisque sous le curseur
        s.rips.forEach(function (p) { p.age += dt; });
        s.rips = s.rips.filter(function (p) { return p.age < 2.4; });
        s.mouse.s += ((s.mouse.on ? 1 : 0) - s.mouse.s) * Math.min(1, dt * 7);
        return;
      }
      s.q += (T.q - s.q) * Math.min(1, dt * 12);
      var bodies = [s.a, s.b], still = true;
      if (s.reduce) {
        s.a.x = s.b.x = T.x; s.a.v = s.b.v = 0; s.sy.s = 1; s.sats = [];
      } else {
        bodies.forEach(function (B, i) {
          var lead = i === s.lead, k = lead ? 210 : 72, c = lead ? 25 : 13;
          var f = !lead && now < s.lagFrom ? 0.08 : 1;
          B.v += (k * (T.x - B.x) - c * B.v) * dt * f;
          B.x += B.v * dt;
          var lo = PAD + 6 + s.q + T.r - 3, hi = PAD + s.w - 6 - s.q - T.r + 3;
          if (B.x < lo || B.x > hi) {
            s.sy.v -= Math.min(Math.abs(B.v), 900) * 0.0016;
            B.x = Math.max(lo, Math.min(hi, B.x));
            B.v *= -0.25;
          }
          if (Math.abs(T.x - B.x) > 0.3 || Math.abs(B.v) > 3) still = false;
        });
        var L = bodies[s.lead];
        var syT = 1 - 0.2 * Math.min(Math.abs(L.v) / 1500, 1);
        s.sy.v += (280 * (syT - s.sy.s) - 9 * s.sy.v) * dt;
        s.sy.s += s.sy.v * dt;
        if (Math.abs(s.sy.s - 1) > 0.002 || Math.abs(s.sy.v) > 0.02) still = false;
        // le col se rompt : des gouttelettes apparaissent entre la tête et la queue
        var sep = Math.abs(s.a.x - s.b.x);
        var r = T.r * (1 - 0.3 * Math.min(sep / (2 * (T.q + T.r) || 1), 1));
        if (!s.split && s.moving && sep - 2 * T.q - 2 * r > -6) {
          s.split = true;
          var lo2 = bodies[1 - s.lead], hi2 = bodies[s.lead];
          [0.3, 0.5, 0.72].forEach(function (t, j) {
            s.sats.push({
              x: lo2.x + (hi2.x - lo2.x) * t + (Math.random() - 0.5) * 6,
              y: T.cy + (Math.random() - 0.5) * 10,
              vx: (lo2.v + hi2.v) * 0.45, vy: (Math.random() - 0.5) * 60,
              r: 5 + Math.random() * 3 - j * 0.5, k: 70 + Math.random() * 90
            });
          });
        }
        s.sats = s.sats.filter(function (d) {
          d.vx += (d.k * (T.x - d.x) - 9 * d.vx) * dt;
          d.vy += (90 * (T.cy - d.y) - 7 * d.vy) * dt;
          d.x += d.vx * dt; d.y += d.vy * dt;
          d.x = Math.max(PAD + 8 + d.r, Math.min(PAD + s.w - 8 - d.r, d.x));
          d.y = Math.max(T.cy - T.r + d.r, Math.min(T.cy + T.r - d.r, d.y));
          if (Math.abs(T.x - d.x) < T.q + T.r * 0.5) d.r -= dt * 26;
          return d.r > 0.6;
        });
        if (s.sats.length) still = false;
      }
      if (s.moving && still) {
        s.moving = false;
        if (s.split || !s.reduce) s.rips.push({ x: T.x, y: T.cy, age: 0, amp: s.split ? 1.2 : 0.7 });
      }
      s.rips.forEach(function (p) { p.age += dt; });
      s.rips = s.rips.filter(function (p) { return p.age < 2.4; });
      s.mouse.s += ((s.mouse.on ? 1 : 0) - s.mouse.s) * Math.min(1, dt * 7);
    }

    function loop() {
      if (s.raf) return;
      s.last = performance.now();
      var tick = function (now) {
        var dt = Math.min((now - s.last) / 1000, 1 / 30);
        s.last = now;
        step(dt, now); draw();
        var busy = s.moving || s.rips.length || s.sats.length || s.mouse.s > 0.01;
        // l'eau ambiante bouge tant que la barre est visible ; en mouvement réduit, seulement lors d'un changement
        if (s.visible && ((!s.reduce && !s.still) || busy)) s.raf = requestAnimationFrame(tick); else s.raf = 0;
      };
      s.raf = requestAnimationFrame(tick);
    }

    /* ---- mise en page ---- */
    function measure() {
      var el = items[current];
      s.w = nav.offsetWidth; s.h = nav.offsetHeight;
      var T = s.t;
      if (!el) { sizeCanvas(); loop(); return; }
      T.r = el.offsetHeight / 2;
      T.q = Math.max(0, el.offsetWidth / 2 - T.r);
      T.cy = PAD + el.offsetTop + el.offsetHeight / 2;
      var nx = PAD + el.offsetLeft + el.offsetWidth / 2;
      if (!s.ready) {
        s.a.x = s.b.x = nx; s.q = T.q; s.ready = true;
      } else if (Math.abs(nx - T.x) > 0.5) {
        s.lead = Math.abs(nx - s.a.x) <= Math.abs(nx - s.b.x) ? 0 : 1;
        s.lagFrom = performance.now() + 70;
        s.moving = true; s.split = false;
      }
      T.x = nx;
      sizeCanvas();
      loop();
    }
    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var W = s.w + PAD * 2, Hh = s.h + PAD * 2;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(Hh * dpr)) {
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(Hh * dpr);
        canvas.style.width = W + 'px'; canvas.style.height = Hh + 'px';
      }
    }

    /* ---- init WebGL, visibilité, redimensionnement ---- */
    s.reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    s.glc = initGL(canvas);
    if (!s.glc) nav.setAttribute('data-gl', 'off');
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); s.glc = null; nav.setAttribute('data-gl', 'off'); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { s.visible = es[0].isIntersecting; if (s.visible) loop(); }).observe(nav);
    }
    document.addEventListener('visibilitychange', function () { s.visible = document.visibilityState === 'visible'; if (s.visible) loop(); });
    var lastW = -1;
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () {
        var w = nav.offsetWidth;
        if (w !== lastW) { lastW = w; s.ready = false; measure(); }
      }).observe(nav);
    }
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { s.ready = false; measure(); });

    /* ---- interaction ---- */
    function local(cx, cy) {
      var r = nav.getBoundingClientRect();
      return { x: cx - r.left + PAD, y: cy - r.top + PAD };
    }
    function ripple(x, y, amp) {
      if (s.reduce) return;
      s.rips.push({ x: x, y: y, age: 0, amp: amp }); loop();
    }
    function iconCenter(i) {
      var el = icons[i]; if (!el) return null;
      var b = el.getBoundingClientRect();
      return local(b.left + b.width / 2, b.top + b.height / 2);
    }
    function playFx(i) {
      var kind = items[i].getAttribute('data-fx') || 'pop';
      icons.forEach(function (ic) { if (ic) ic.removeAttribute('data-fx'); });
      if (icons[i] && kind !== 'none' && !s.reduce) {
        void icons[i].offsetWidth; // relance l'animation
        icons[i].setAttribute('data-fx', kind);
      }
      var c = iconCenter(i);
      if (c && kind === 'drop') setTimeout(function () { ripple(c.x, s.t.cy, 1.4); }, 430);
      if (c && kind === 'plane') ripple(c.x, c.y, 0.6);
    }
    function setActive(i) {
      if (i === current) return;
      current = i;
      items.forEach(function (el, k) {
        if (k === i) el.setAttribute('aria-current', 'location'); else el.removeAttribute('aria-current');
      });
      measure();
    }

    /* ---- suivi de la section visible ---- */
    var targets = items.map(function (el) {
      var h = el.getAttribute('href') || '';
      return h.charAt(0) === '#' ? document.getElementById(h.slice(1)) : null;
    });
    var locked = false, unlockTimer = 0;
    if (!isStatic) {
    function spy() {
      if (locked) return;
      var best = -1, bestTop = -Infinity, y = window.scrollY + 200;
      targets.forEach(function (t, i) {
        if (!t) return;
        var top = t.offsetTop;
        if (top <= y && top >= bestTop) { best = i; bestTop = top; }
      });
      if (best >= 0) setActive(best);
    }
    function lockFor(ms) { locked = true; clearTimeout(unlockTimer); unlockTimer = setTimeout(function () { locked = false; spy(); }, ms); }
    window.addEventListener('scroll', function () { if (locked) lockFor(160); else spy(); }, { passive: true });

    items.forEach(function (el, i) {
      el.addEventListener('click', function () {
        playFx(i);
        lockFor(400); // pendant le défilement animé, l'eau ne saute pas d'une section à l'autre
        setActive(i);
      });
    });
    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var all = [].slice.call(nav.querySelectorAll('.nimbus-item, .nimbus-act'));
      var k = all.indexOf(document.activeElement);
      if (k < 0) return;
      e.preventDefault();
      all[(k + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length].focus();
    });
    nav.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var p = local(e.clientX, e.clientY);
      s.mouse.x = p.x; s.mouse.y = p.y; s.mouse.on = true; loop();
    });
    nav.addEventListener('pointerleave', function () { s.mouse.on = false; loop(); });
    nav.addEventListener('pointerdown', function (e) { var p = local(e.clientX, e.clientY); ripple(p.x, p.y, 0.8); });
    spy();
    }
  }

  function boot() { [].slice.call(document.querySelectorAll('.nimbus-nav')).forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
