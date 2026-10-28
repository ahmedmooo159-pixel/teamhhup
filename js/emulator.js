/* ==========================================================================
   Phone emulator
   - builds a realistic phone frame in pure DOM/CSS
   - shows real screenshots (scrollable, zoomable) with a "camera"
   - plays small scene scripts (see js/content.js for the command list)
   Exposes: window.Emu
   ========================================================================== */
(function () {
  'use strict';

  var C = window.CONTENT;

  // Phone geometry (px, before the layout scale is applied)
  var BODY_W = 440, BODY_H = 900, BEZEL = 12;
  var SCREEN_W = BODY_W - BEZEL * 2;      // 416
  var SCREEN_H = BODY_H - BEZEL * 2;      // 876
  var STATUS_H = 56;                       // status bar area (app content starts below)
  var VIEW_H = SCREEN_H - STATUS_H;        // visible app area

  // Where the phone sits on the 1920x1080 stage for each layout name.
  var LAYOUTS = {
    hidden:     { x: 0,   y: 0, s: 0.35, ry: 0,  rx: 0,   o: 0 },
    center:     { x: 0,   y: 0, s: 1.0,  ry: 0,  rx: 0,   o: 1 },
    focus:      { x: 0,   y: 0, s: 1.1,  ry: 0,  rx: 0,   o: 1 },
    right:      { x: 560, y: 0, s: 0.97, ry: -5, rx: 1.5, o: 1 },
    rightSmall: { x: 700, y: 0, s: 0.84, ry: -5, rx: 1.5, o: 1 },
    coming:     { x: 640, y: 0, s: 0.92, ry: 0,  rx: 0,   o: 1 }
  };

  var root, phone, spin, screenEl, viewEl, layers = [], active = 0;
  var touch, ring, calloutBox, typeEl, darkEl, curLayoutName = 'hidden';
  var available = {};              // screens that really exist (from content.js screenFiles)
  var runId = 0, running = null, fast = false;
  var finger = { x: SCREEN_W * 0.5, y: SCREEN_H * 1.05, shown: false };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- tiny helpers ----------
  function el(tag, cls, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }
  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, fast ? 0 : ms); });
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // ---------- build the phone ----------
  function build(host) {
    root = host;
    var wrap = el('div', 'phone-wrap', root);
    phone = el('div', 'phone', wrap);
    el('div', 'p-glow', phone);
    el('div', 'p-shadow', phone);
    var float = el('div', 'p-float', phone);
    spin = el('div', 'p-spin', float);
    var body = el('div', 'p-body', spin);

    // side buttons
    el('i', 'p-btn b-action', body); el('i', 'p-btn b-up', body);
    el('i', 'p-btn b-down', body);   el('i', 'p-btn b-power', body);

    screenEl = el('div', 'p-screen', body);

    // status bar
    var st = el('div', 'p-status', screenEl);
    el('span', 'p-time', st).textContent = '9:41';
    st.insertAdjacentHTML('beforeend',
      '<span class="p-sys"><svg width="20" height="12" viewBox="0 0 20 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>' +
      '<svg width="28" height="13" viewBox="0 0 28 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="17" height="9" rx="2"/><rect x="25" y="4.5" width="2" height="4" rx="1" opacity=".5"/></svg></span>');

    viewEl = el('div', 'p-view', screenEl);
    for (var i = 0; i < 2; i++) {
      var L = el('div', 'p-layer', viewEl);
      L.cam = el('div', 'p-cam', L);
      L.c = { s: 1, tx: 0, ty: 0 };
      L.name = '';
      layers.push(L);
    }

    ring = el('div', 'p-ring', screenEl);
    typeEl = el('div', 'p-type', screenEl);
    touch = el('div', 'p-touch', screenEl);
    darkEl = el('div', 'p-dark', screenEl);
    var mark = el('img', 'p-bootmark', darkEl);
    mark.alt = ''; mark.src = 'assets/logo/logo-symbol.png';
    mark.onerror = function () { mark.style.display = 'none'; };

    el('div', 'p-glare', body);
    el('div', 'p-island', body);
    el('div', 'p-home', body);

    calloutBox = el('div', 'p-callouts', spin);       // outside the clipped screen
    el('div', 'p-label', spin).textContent = C.sections[8].comingLabel || 'Coming next';

    set(LAYOUTS.hidden);
  }

  function set(L) {
    phone.style.transform = 'translate3d(' + L.x + 'px,' + L.y + 'px,0) scale(' + L.s +
      ') rotateY(' + L.ry + 'deg) rotateX(' + L.rx + 'deg)';
    phone.style.opacity = L.o;
  }

  // ---------- screens ----------
  function loadScreens(list) {
    // Only names listed in content.js "screenFiles" are requested (no 404 noise).
    (C.screenFiles || []).forEach(function (n) { available[n] = true; });
    var uniq = {};
    Object.keys(C.sectionScreens).forEach(function (k) {
      C.sectionScreens[k].forEach(function (n) { uniq[resolve(n) || ''] = 1; });
    });
    Object.keys(uniq).forEach(function (n) {
      if (!n) return;
      var im = new Image();
      im.src = C.screensFolder + n;       // warm the cache so swaps are instant
    });
  }
  function resolve(name) {
    if (available[name]) return name;
    var fb = C.screenFallbacks && C.screenFallbacks[name];
    if (fb && available[fb]) return fb;
    return null;
  }
  function fillLayer(L, name) {
    L.cam.innerHTML = '';
    var real = resolve(name);
    var node;
    if (real) {
      node = el('img', 'p-img', L.cam);
      node.alt = '';
      node.draggable = false;
      node.src = C.screensFolder + real;
      node.onerror = function () {              // clean labelled placeholder
        node.remove(); placeholder(L, name);
      };
    } else {
      placeholder(L, name);
    }
    L.name = name;
  }
  function placeholder(L, name) {
    var p = el('div', 'p-placeholder', L.cam);
    p.innerHTML = '<div class="ph-bar"></div><div class="ph-title"></div><div class="ph-sub">Add this screenshot to<br><b>assets/screens/</b></div>' +
      '<div class="ph-card"></div><div class="ph-card"></div><div class="ph-card short"></div>';
    p.querySelector('.ph-title').textContent = name;
  }
  function size(L) {
    var c = L.cam.firstElementChild;
    return { w: SCREEN_W, h: Math.max(c ? c.offsetHeight : VIEW_H, VIEW_H) };
  }
  function setCam(L, s, tx, ty, ms) {
    L.cam.style.transition = ms ? 'transform ' + ms + 'ms var(--ease-in-out)' : 'none';
    L.cam.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0) scale(' + s + ')';
    L.c = { s: s, tx: tx, ty: ty };
  }
  function cur() { return layers[active]; }

  // image-percent point -> coordinates inside .p-screen (uses the TARGET camera)
  function toScreen(x, y) {
    var L = cur(), z = size(L), c = L.c;
    return { x: c.tx + c.s * (x / 100) * z.w, y: STATUS_H + c.ty + c.s * (y / 100) * z.h };
  }

  async function swap(name) {
    var L = cur();
    if (L.name === name && L.cam.firstChild) { return; }
    var N = layers[1 - active];
    fillLayer(N, name);
    setCam(N, 1, 0, 0, 0);
    N.style.transition = 'none';
    N.style.opacity = 0; N.style.transform = 'translate3d(7%,0,0)';
    void N.offsetWidth;
    var dur = fast || reduced ? 0 : 650;
    N.style.transition = 'opacity ' + dur + 'ms var(--ease-out), transform ' + dur + 'ms var(--ease-out)';
    L.style.transition = 'opacity ' + dur + 'ms var(--ease-out), transform ' + dur + 'ms var(--ease-out)';
    N.style.opacity = 1; N.style.transform = 'none';
    L.style.opacity = 0; L.style.transform = 'translate3d(-5%,0,0)';
    active = 1 - active;
    await sleep(dur * 0.8);
  }

  // ---------- camera commands ----------
  async function scroll(y, ms) {
    var L = cur(), z = size(L);
    var ty = -clamp((y / 100) * z.h, 0, Math.max(0, z.h - VIEW_H));
    setCam(L, 1, 0, ty, fast ? 0 : ms || 1200);
    await sleep(ms || 1200);
  }
  async function zoom(p, ms) {
    var L = cur(), z = size(L), s = p[2];
    var px = (p[0] / 100) * z.w, py = (p[1] / 100) * z.h;
    var tx = clamp(SCREEN_W / 2 - s * px, SCREEN_W - s * z.w, 0);
    var ty = clamp(VIEW_H * 0.45 - s * py, Math.min(0, VIEW_H - s * z.h), 0);
    setCam(L, s, tx, ty, fast ? 0 : ms || 1200);
    await sleep(ms || 1200);
  }
  async function unzoom(ms) {
    var L = cur(), z = size(L), c = L.c;
    // pull back to scale 1 keeping roughly the same scroll position
    var ty = -clamp((-c.ty / c.s) , 0, Math.max(0, z.h - VIEW_H));
    setCam(L, 1, 0, ty, fast ? 0 : ms || 1100);
    await sleep(ms || 1100);
  }

  // ---------- overlays ----------
  function highlight(r) {
    if (!r) { ring.classList.remove('on'); return; }
    var L = cur(), z = size(L), c = L.c;
    var p = toScreen(r[0], r[1]);
    ring.style.width = (c.s * (r[2] / 100) * z.w) + 'px';
    ring.style.height = (c.s * (r[3] / 100) * z.h) + 'px';
    ring.style.transform = 'translate3d(' + p.x + 'px,' + p.y + 'px,0)';
    ring.classList.add('on');
  }
  function clearOverlays(instant) {
    ring.classList.remove('on');
    typeEl.classList.remove('on'); typeEl.textContent = '';
    Array.prototype.slice.call(calloutBox.children).forEach(function (n) {
      if (instant) { n.remove(); return; }
      n.classList.remove('show');
      setTimeout(function () { n.remove(); }, 450);
    });
  }
  function callout(text, at) {
    var p = toScreen(at[0], at[1]);
    Array.prototype.slice.call(calloutBox.children).forEach(function (n) {
      n.classList.remove('show'); setTimeout(function () { n.remove(); }, 400);
    });
    var rightSide = /^(right|rightSmall|coming)$/.test(curLayoutName) ? false : p.x >= SCREEN_W / 2;
    var y = clamp(p.y + BEZEL, 70, BODY_H - 70);
    var x = p.x + BEZEL;
    var wrap = el('div', 'p-pill-wrap ' + (rightSide ? 'to-right' : 'to-left'), calloutBox);
    wrap.style.top = y + 'px';
    wrap.style.left = (rightSide ? BODY_W : 0) + 'px';
    // connector: from the phone edge to the target point
    var len = rightSide ? Math.max(24, x - BODY_W - 0) : Math.max(24, 0 - x);
    var line = el('i', 'p-line', wrap);
    var dist = rightSide ? (BODY_W - x) : x;           // distance from edge to target (inside the phone)
    line.style.width = (dist + 26) + 'px';
    var pill = el('span', 'p-pill', wrap);
    pill.textContent = text;
    void wrap.offsetWidth;
    wrap.classList.add('show');
  }
  function pulse(at) {
    var p = toScreen(at[0], at[1]);
    var d = el('div', 'p-pulse', screenEl);
    d.style.left = p.x + 'px'; d.style.top = p.y + 'px';
    if (d.animate && !fast) {
      var a = d.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: .8 },
                         { transform: 'translate(-50%,-50%) scale(2.6)', opacity: 0 }],
                        { duration: 1000, easing: 'cubic-bezier(0.16,1,0.3,1)' });
      a.onfinish = function () { d.remove(); };
    } else { d.remove(); }
  }
  async function typing(o) {
    var p = toScreen(o.at[0], o.at[1]), my = runId;
    typeEl.style.left = p.x + 'px'; typeEl.style.top = p.y + 'px';
    typeEl.style.width = ((o.at[2] / 100) * SCREEN_W) + 'px';
    typeEl.textContent = ''; typeEl.classList.add('on');
    for (var i = 1; i <= o.text.length; i++) {
      if (my !== runId) return;
      typeEl.textContent = o.text.slice(0, i);
      await sleep(55);
    }
  }

  // ---------- finger ----------
  function placeFinger(x, y) {
    finger.x = x; finger.y = y;
    touch.style.transform = 'translate3d(' + (x - 23) + 'px,' + (y - 23) + 'px,0)';
  }
  async function moveTo(pt) {
    var my = runId, to = toScreen(pt[0], pt[1]);
    if (!finger.shown) {
      placeFinger(SCREEN_W * 0.55, SCREEN_H * 0.96);
      touch.classList.add('on'); finger.shown = true;
    }
    if (fast || reduced) { placeFinger(to.x, to.y); return; }
    var x0 = finger.x, y0 = finger.y, dx = to.x - x0, dy = to.y - y0;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var dur = clamp(520 + dist * 1.15, 520, 1500);
    // curved path: control point pushed sideways, like a real thumb arc
    var side = dx >= 0 ? -1 : 1;
    var cx = x0 + dx * 0.5 + (-dy / (dist || 1)) * dist * 0.22 * side;
    var cy = y0 + dy * 0.5 + (dx / (dist || 1)) * dist * 0.22 * side;
    var t0 = performance.now();
    await new Promise(function (done) {
      (function frame(now) {
        if (my !== runId) return done();
        var t = clamp((now - t0) / dur, 0, 1), e = easeInOut(t), u = 1 - e;
        placeFinger(u * u * x0 + 2 * u * e * cx + e * e * to.x,
                    u * u * y0 + 2 * u * e * cy + e * e * to.y);
        if (t < 1) requestAnimationFrame(frame); else done();
      })(t0);
    });
    await sleep(140);                    // slight hesitation before a tap
  }
  async function tap() {
    touch.classList.add('press');
    var d = el('div', 'p-ripple', screenEl);
    d.style.left = finger.x + 'px'; d.style.top = finger.y + 'px';
    if (d.animate && !fast) {
      var a = d.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: .55 },
                         { transform: 'translate(-50%,-50%) scale(2.8)', opacity: 0 }],
                        { duration: 750, easing: 'cubic-bezier(0.16,1,0.3,1)' });
      a.onfinish = function () { d.remove(); };
    } else { d.remove(); }
    await sleep(160);
    touch.classList.remove('press');
    await sleep(120);
  }

  // ---------- boot (screen-on) ----------
  async function boot() {
    if (fast || reduced) { darkEl.style.transition = 'none'; darkEl.style.opacity = 0; phone.classList.add('lit'); return; }
    darkEl.style.transition = 'none'; darkEl.style.opacity = 1;
    darkEl.classList.remove('wake'); void darkEl.offsetWidth;
    phone.classList.add('lit');                      // glow rises
    await sleep(750);
    darkEl.classList.add('wake');                    // mark pops, then screen wakes
    darkEl.style.transition = 'opacity 1100ms var(--ease-out) 300ms';
    darkEl.style.opacity = 0;
    viewEl.animate([{ transform: 'scale(1.05)', filter: 'brightness(1.25)' },
                    { transform: 'scale(1)', filter: 'brightness(1)' }],
                   { duration: 1500, easing: 'cubic-bezier(0.16,1,0.3,1)', delay: 300 });
    await sleep(1300);
  }

  // ---------- scene runner ----------
  async function exec(c) {
    if (c.swap !== undefined) return swap(c.swap);
    if (c.boot) return boot();
    if (c.scroll !== undefined) return scroll(c.scroll, c.ms);
    if (c.zoom) return zoom(c.zoom, c.ms);
    if (c.unzoom) return unzoom(c.ms);
    if (c.moveTo) return moveTo(c.moveTo);
    if (c.tapAt) { await moveTo(c.tapAt); return tap(); }
    if (c.tap) return tap();
    if (c.highlight !== undefined) { highlight(c.highlight); return sleep(300); }
    if (c.callout) { callout(c.callout, c.at); return sleep(500); }
    if (c.type) return typing(c.type);
    if (c.pulse) { pulse(c.pulse); return sleep(250); }
    if (c.clear) { clearOverlays(fast); return; }
    if (c.wait) return sleep(c.wait);
  }
  async function run(script, opts) {
    var my = ++runId;
    fast = !!(opts && opts.fast);
    running = { script: script };
    if (fast) clearOverlays(true);
    // a scene without {boot} must never leave the screen dark (e.g. after fast navigation)
    var hasBoot = script.some(function (c) { return c.boot; });
    if (!hasBoot) { darkEl.style.transition = 'none'; darkEl.style.opacity = 0; phone.classList.add('lit'); }
    for (var i = 0; i < script.length; i++) {
      if (my !== runId) return;
      await exec(script[i]);
    }
    if (my === runId) {
      running = null; fast = false;
      touch.classList.remove('on', 'press'); finger.shown = false;    // finger lifts away
    }
  }
  // Jump the running scene (if any) straight to its final state.
  async function finish() {
    if (!running) return;
    var s = running.script;
    runId++; running = null;
    await run(s, { fast: true });
  }
  function cancel() { runId++; running = null; fast = false; }

  // ---------- public layout control ----------
  function layout(name) {
    var L = LAYOUTS[name] || LAYOUTS.right;
    var prev = curLayoutName;
    curLayoutName = name;
    set(L);
    phone.classList.toggle('coming', name === 'coming');
    phone.classList.toggle('flat', name === 'focus' || name === 'center');
    if (name === 'coming' && prev !== 'coming' && spin.animate && !reduced) {
      spin.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(360deg)' }],
                   { duration: 1500, easing: 'cubic-bezier(0.65,0,0.35,1)', delay: 250 });
    }
    if (name === 'hidden') { phone.classList.remove('lit'); }
  }
  function currentLayout() { return curLayoutName; }

  window.Emu = {
    init: function (host) { build(host); loadScreens(); },
    layout: layout, run: run, finish: finish, cancel: cancel,
    isRunning: function () { return !!running; },
    currentLayout: currentLayout,
    // prepare the dark screen so a later boot() can wake it
    sleepScreen: function () { darkEl.style.transition = 'none'; darkEl.style.opacity = 1; phone.classList.remove('lit'); },
    reset: function () { clearOverlays(true); touch.classList.remove('on'); finger.shown = false; }
  };
})();
