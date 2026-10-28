/* ==========================================================================
   TeamHub presentation: navigation, steps, hand-offs, page builders.
   Plain script. Content comes from js/content.js, the phone from js/emulator.js.

   HOW IT WORKS (short version)
   - Every page (logo, team, 10 sections, coda) is built from content.js.
   - A page has "steps". Elements carry data-from / data-until: they are visible
     while  from <= step < until.  CSS transitions do the animation, so going
     backward simply plays the same transitions in reverse.
   - Pages before the current one sit on the left ("before"), pages after it on
     the right ("after"): that is the direction-of-travel exit/enter motion.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.CONTENT, Emu = window.Emu;
  var stage = document.getElementById('stage');
  var camera = document.getElementById('camera');
  var tsym = document.getElementById('tsym');
  var fx = document.getElementById('fx');
  var spEl = document.getElementById('speaker');
  var cueEl = document.getElementById('cue');
  var dotsEl = document.getElementById('dots');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE_OUT = 'cubic-bezier(0.16,1,0.3,1)', EASE_IO = 'cubic-bezier(0.65,0,0.35,1)';

  /* ---------- helpers ---------- */
  function el(tag, cls, parent, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    if (text !== undefined && text !== null) {
      if (typeof text === 'string' && text.indexOf('**') !== -1) {
        e.innerHTML = text.replace(/\*\*(.+?)\*\*/g, '<strong class="kw-tag">$1</strong>');
      } else {
        e.textContent = text;
      }
    }
    return e;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function initials(name) {
    var m = String(name).match(/[A-Za-z]+|\d+/g) || ['?'];
    if (/_/.test(name) && m.length > 1) return (m[0][0] + m[1]).toUpperCase().slice(0, 3);
    return m.slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }
  // mark a node as a step-driven reveal item
  function add(parent, node, from, until, i) {
    node.dataset.from = from;
    if (until !== undefined && until !== null) node.dataset.until = until;
    if (i) node.style.setProperty('--i', i);
    parent.appendChild(node);
    return node;
  }
  function rvEl(tag, cls, parent, text, from, until, i) {
    return add(parent, el(tag, (cls ? cls + ' ' : '') + 'rv', null, text), from, until, i);
  }
  // Headline with masked word-by-word reveal. *Words in stars* get the underline sweep.
  function headline(text, from, until, compact) {
    var h = el('h1', 'hl' + (compact ? ' compact' : ''));
    var k = 0;
    String(text).split('*').forEach(function (part, i) {
      var holder = i % 2 === 1 ? el('mark', 'kw', h) : h;
      part.split(/\s+/).filter(Boolean).forEach(function (w) {
        var m = el('span', 'w', holder), wi = el('span', 'wi', m, w);
        wi.style.setProperty('--k', k++);
        holder.appendChild(document.createTextNode(' '));
      });
    });
    h.dataset.from = from;
    if (until !== undefined && until !== null) h.dataset.until = until;
    return h;
  }
  function svgEl(tag, attrs, parent) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------- stage scaling (fixed 1920x1080 canvas) ---------- */
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit);

  /* ---------- counters ---------- */
  function fmt(span, v) { return span.dataset.prefix + v.toFixed(+span.dataset.decimals); }
  function makeCount(parent, o) {
    var num = el('div', 'num', parent);
    var sp = el('span', 'count', num, o.prefix + (0).toFixed(o.decimals));
    sp.dataset.to = o.value; sp.dataset.decimals = o.decimals; sp.dataset.prefix = o.prefix;
    el('small', '', num, o.suffix);
    return sp;
  }
  function runCount(span, delay) {
    var token = (span._t = (span._t || 0) + 1), to = +span.dataset.to;
    if (reduced) { span.textContent = fmt(span, to); return; }
    span.textContent = fmt(span, 0);
    setTimeout(function () {
      if (span._t !== token) return;
      var t0 = performance.now(), D = 1700;
      (function f(now) {
        if (span._t !== token) return;
        var t = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - t, 4);   // ease-out
        span.textContent = fmt(span, to * e);
        if (t < 1) requestAnimationFrame(f);
      })(t0);
    }, delay);
  }
  function resetCount(span) { span._t = (span._t || 0) + 1; span.textContent = fmt(span, 0); }

  /* ======================================================================
     LOGO REVEAL (follows the storyboard): T alone -> orbit arc -> e,a,m emerge
     while T slides left -> Hub -> arc dissolves -> full logo settles.
     ====================================================================== */
  var LETTER_END = [468, 610, 826, 983, 1122, 1300];   // x (of 1300) where e,a,m,H,u,b end
  function buildLogo(parent, rev) {
    var root = el('div', 'logo-stage' + (rev ? ' rev' : ''), parent);
    var wrap = el('div', 'lg-wrap', root);
    var glow = el('div', 'lg-glow', wrap);
    var arcs = svgEl('svg', { 'class': 'lg-arc', viewBox: '-120 -120 890 436' }, wrap);
    var a1 = svgEl('path', { d: 'M 330 -40 A 150 140 0 1 1 190 150', pathLength: 1 }, arcs);   // orbit around the T
    var a2 = svgEl('path', { d: 'M 430 168 Q 560 205 668 128', pathLength: 1 }, arcs);          // tail under "Hub"
    [a1, a2].forEach(function (p) { p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '1'; });
    var sym = el('img', 'lg-sym', wrap); sym.alt = 'TeamHub'; sym.src = 'assets/logo/logo-symbol.png';
    var word = el('img', 'lg-word', wrap); word.alt = ''; word.src = 'assets/logo/logo-wordmark.png';
    var sweep = el('div', 'lg-sweep', wrap);
    var dashWrap = el('div', 'lg-dashes', root), dashes = [];
    for (var i = 0; i < 5; i++) dashes.push(el('i', '', dashWrap));
    [sym, word].forEach(function (im) { im.onerror = function () { im.style.display = 'none'; }; });

    var anims = [], timers = [];
    function A(node, frames, opts) {
      if (!node.animate) return null;
      opts.fill = 'both';
      var a = node.animate(frames, opts); anims.push(a); return a;
    }
    function T(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function dash(k) { dashes.forEach(function (d, i) { d.classList.toggle('on', i === k); }); }
    function stop() { anims.forEach(function (a) { a.cancel(); }); anims = []; timers.forEach(clearTimeout); timers = []; }

    function frames(end) {   // wordmark clip keyframes: e, a, m ... pause ... H, u, b
      var r = function (k) { return 'inset(0 ' + (100 - (LETTER_END[k] + 12 - 340) / 9.44).toFixed(2) + '% 0 0)'; };
      return [
        { clipPath: 'inset(0 100% 0 0)', offset: 0 },
        { clipPath: r(0), offset: 0.16, easing: EASE_OUT },
        { clipPath: r(1), offset: 0.30, easing: EASE_OUT },
        { clipPath: r(2), offset: 0.46, easing: EASE_OUT },
        { clipPath: r(2), offset: 0.62 },
        { clipPath: r(3), offset: 0.78, easing: EASE_OUT },
        { clipPath: r(4), offset: 0.89, easing: EASE_OUT },
        { clipPath: 'inset(0 0% 0 0)', offset: 1, easing: EASE_OUT }
      ];
    }
    function final() {
      stop();
      sym.style.opacity = 1; sym.style.transform = 'none';
      word.style.clipPath = 'none';
      wrap.style.transform = 'scale(1.58)';
      glow.style.opacity = 0.4;
      [a1, a2].forEach(function (p) { p.style.opacity = 0; });
      dashes.forEach(function (d) { d.classList.remove('on'); });
      dashWrap.style.opacity = 0;
    }
    function play(done) {
      stop();
      sym.style.cssText = ''; word.style.cssText = ''; wrap.style.cssText = '';
      glow.style.opacity = 0; dashWrap.style.opacity = 1;
      [a1, a2].forEach(function (p) { p.style.opacity = 0; p.style.strokeDashoffset = 1; });
      if (reduced) { final(); T(done || function () {}, 600); return; }
      dash(0);
      wrap.style.transform = 'scale(1.3)';
      // 1 · T fades in with its glow
      A(sym, [{ opacity: 0, transform: 'translate3d(231px,0,0) scale(.82)' }, { opacity: 1, transform: 'translate3d(231px,0,0) scale(1)' }], { duration: 1000, easing: EASE_OUT });
      A(glow, [{ opacity: 0, transform: 'translate3d(231px,0,0)' }, { opacity: .9, transform: 'translate3d(231px,0,0)' }], { duration: 1200, easing: EASE_OUT });
      // 2 · orbit arc sweeps around the T
      T(function () { dash(1); }, 800);
      A(a1, [{ strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1 }], { duration: 1100, delay: 800, easing: EASE_IO });
      // 3 · letters emerge while T slides left
      T(function () { dash(2); }, 1800);
      A(sym, [{ opacity: 1, transform: 'translate3d(231px,0,0) scale(1)' }, { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }], { duration: 1400, delay: 1800, easing: EASE_IO });
      A(glow, [{ transform: 'translate3d(231px,0,0)', opacity: .9 }, { transform: 'translate3d(0,0,0)', opacity: .7 }], { duration: 1400, delay: 1800, easing: EASE_IO });
      A(wrap, [{ transform: 'scale(1.3)' }, { transform: 'scale(1.5)' }], { duration: 1500, delay: 1800, easing: EASE_IO });
      A(word, frames(), { duration: 1700, delay: 2000, easing: 'linear' });
      A(word, [{ transform: 'translate3d(0,22px,0)' }, { transform: 'translate3d(0,0,0)' }], { duration: 1500, delay: 2000, easing: EASE_OUT });
      // 4 · "Hub" appears, arc tail fades behind it
      T(function () { dash(3); }, 3400);
      A(a2, [{ strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, opacity: 1 }], { duration: 900, delay: 2900, easing: EASE_IO });
      A(a1, [{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: 3300, easing: EASE_IO });
      A(a2, [{ opacity: 1 }, { opacity: 0 }], { duration: 800, delay: 3900, easing: EASE_IO });
      // 5 · arc dissolves, full logo settles
      T(function () { dash(4); }, 4100);
      A(wrap, [{ transform: 'scale(1.5)' }, { transform: 'scale(1.58)' }], { duration: 900, delay: 4200, easing: EASE_OUT });
      A(sweep, [{ transform: 'translateX(-120%)' }, { transform: 'translateX(120%)' }], { duration: 1400, delay: 4300, easing: EASE_IO });
      A(glow, [{ opacity: .7 }, { opacity: .4 }], { duration: 900, delay: 4200 });
      // 6 · dashes fade out, logo holds
      T(function () { dashWrap.style.transition = 'opacity .6s'; dashWrap.style.opacity = 0; }, 5100);
      T(function () { if (done) done(); }, 5400);
    }
    return { play: play, final: final, stop: stop, root: root };
  }

  /* ======================================================================
     PAGE BUILDERS
     ====================================================================== */
  var pages = [], R = {};
  var pagesHost = document.getElementById('pages');

  function addPage(o) {
    o.el = el('section', 'sec' + (o.theme === 'dark' ? ' dark' : '') + (o.cls ? ' ' + o.cls : ''), pagesHost);
    o.el.id = 'p-' + o.id; o.el.dataset.pos = 'after';
    o.content = el('div', 'content', o.el);
    pages.push(o);
    return o;
  }
  function bridge(P, text) {
    var b = el('div', 'bridge rv', P.el, text);
    b.dataset.from = P.n - 1;
    P.bridge = true;
  }
  function pointsList(parent, list, from, until) {
    var ul = el('ul', 'pts', parent);
    list.forEach(function (t, i) { rvEl('li', '', ul, t, from, until, i + 1); });
    return ul;
  }

  /* ---- opening: logo ---- */
  R.logo = function (P) {
    P.logo = buildLogo(P.content, false);
    P.enter = function () { P.logo.play(); };
    P.leave = function () { P.logo.final(); };
  };

  /* ---- opening: meet the team ---- */
  R.team = function (P) {
    var c = P.content;
    var t = el('div', 'team-title', c);
    t.appendChild(headline(C.meetTeamTitle, 0, null, true));
    var grid = el('div', 'team-grid', c);
    C.team.forEach(function (m, i) {
      var card = rvEl('div', 'member', grid, null, 0, null, i + 1);
      el('div', 'av', card, initials(m.name));
      var b = el('div', '', card);
      el('div', 'nm', b, m.name);
      el('div', 'pt', b, 'Part ' + pad(i + 1) + ' \u00B7 ' + C.sections[i].title);
      card._i = i;
    });
    // vectors that pull every card into the centre (used when the first speaker advances)
    P.measure = function () {
      var cards = grid.children;
      for (var i = 0; i < cards.length; i++) {
        var cd = cards[i];
        var x = grid.offsetLeft + cd.offsetLeft + cd.offsetWidth / 2, y = grid.offsetTop + cd.offsetTop + cd.offsetHeight / 2;
        cd.style.setProperty('--tx', (960 - x) + 'px'); cd.style.setProperty('--ty', (540 - y) + 'px');
      }
    };
    P.measure();
    P.enter = function () { P.measure(); };
  };

  /* ---- 01 · meet TeamHub ---- */
  R.s01 = function (P, d) {
    var col = el('div', 'col', P.content);
    col.appendChild(headline(d.headline, 1));
    rvEl('p', 'sub', col, d.sub, 1, null, 4);
    var chips = el('div', 'chips', col);
    d.points.forEach(function (t, i) { rvEl('span', 'chip', chips, t, 2, null, i + 1); });
    bridge(P, d.bridge);
  };

  /* ---- 02 · the problem ---- */
  R.s02 = function (P, d) {
    var c = P.content;
    var chaos = el('div', 'chaos', c);
    var spots = [[1040, 340], [1090, 450], [1010, 580], [1100, 700], [1030, 820], [1060, 940], [110, 990], [430, 985], [740, 1000], [1120, 560]];
    d.chaos.forEach(function (it, i) {
      var p = spots[i % spots.length];
      var wrap = rvEl('div', 'ci', chaos, null, 0, 2, 0);
      wrap.style.left = p[0] + 'px'; wrap.style.top = p[1] + 'px';
      wrap.style.setProperty('--ix', (1520 - p[0]) + 'px'); wrap.style.setProperty('--iy', (540 - p[1]) + 'px');
      wrap.style.transitionDelay = 'calc(var(--base, 0ms) + ' + (i * 70) + 'ms)';
      wrap.style.transitionDuration = '1.1s';
      wrap.style.transitionTimingFunction = 'var(--ease-spring)';
      var dr = el('div', 'drift', wrap);
      dr.style.setProperty('--dur', (7 + (i % 4) * 1.7) + 's'); dr.style.setProperty('--dl', (-i * 0.9) + 's');
      dr.style.setProperty('--dx', ((i % 2 ? -1 : 1) * (26 + i * 3)) + 'px'); dr.style.setProperty('--dy', ((i % 3 - 1) * 24 - 10) + 'px');
      dr.style.setProperty('--r0', ((i % 5) - 2) * 2.2 + 'deg'); dr.style.setProperty('--r1', ((i % 4) - 1.5) * 4 + 'deg');
      el('span', it.t, dr, it.text);
    });
    var col = el('div', 'col wide', c);
    col.appendChild(headline(d.headline, 0, null, true));
    pointsList(col, d.points, 1, 2);

    var stats = el('div', 'stats', c);
    d.stats.forEach(function (s, i) {
      var card = rvEl('div', 'stat', stats, null, 2, null, i + 1);
      makeCount(card, s);
      el('div', 'lbl', card, s.label);
      var src = el('div', 'src', card);
      el('b', '', src, s.n);
      src.appendChild(document.createTextNode(s.source));
    });
    bridge(P, d.bridge);
  };

  /* ---- 03 · vision + users ---- */
  R.s03 = function (P, d) {
    var c = P.content;
    var col = el('div', 'col wide', c);
    col.appendChild(headline(d.headline, 0, null, true));
    rvEl('p', 'goal', c, d.goal, 0, null, 3);
    var hub = el('div', 'hub', c);
    // the chaos gets pulled together and snaps into the T
    var scatter = [[-520, -200, -8], [400, -260, 6], [-380, 260, 5], [430, 230, -6], [-60, -330, 4], [-640, 30, -4], [560, 0, 7], [120, 330, -5]];
    var txt = d.users ? C.sections[1].chaos : [];
    scatter.forEach(function (s, i) {
      var g = rvEl('div', 'gather', hub, null, 0, null, i);
      g.style.setProperty('--sx', s[0] + 'px'); g.style.setProperty('--sy', s[1] + 'px'); g.style.setProperty('--sr', s[2] + 'deg');
      var it = txt[i % txt.length] || { t: 'bubble', text: '' };
      var sp = el('span', it.t, g, it.text);
      sp.style.fontSize = '20px';
    });
    var ring = rvEl('div', 'ring', hub, null, 0, null, 0);
    ring.style.transitionDelay = '.9s'; ring.style.transitionDuration = '1.2s';
    var core = rvEl('img', 'core', hub, null, 0, null, 0);
    core.src = 'assets/logo/logo-symbol.png'; core.alt = '';
    core.style.transitionDelay = '.8s'; core.onerror = function () { core.style.display = 'none'; };
    var orbit = el('div', 'orbit', hub);
    orbit.dataset.from = 1;
    d.users.forEach(function (u, i) {
      var card = el('div', 'ucard u' + i, orbit);
      el('h4', '', card, u.name); el('p', '', card, u.gets);
      card.style.animationDelay = (2 + i * .5) + 's';
    });
    bridge(P, d.bridge);
  };

  /* ---- 04 · challenges / 05 · solutions share the same path geometry ---- */
  var LINE_Y = 690, XS = [310, 560, 810, 1060];
  function pathScene(P, d, solved) {
    var c = P.content;
    var col = el('div', 'col wide', c);
    col.appendChild(headline(d.headline, 0, null, true));
    var svg = svgEl('svg', { 'class': 'path-svg rv', viewBox: '0 0 1920 1080' });
    add(c, svg, 0);
    if (!solved) svgEl('path', { 'class': 'p-base', d: 'M110 ' + LINE_Y + ' H1250' }, svg);
    var dr = svgEl('path', { 'class': 'p-draw', d: 'M110 ' + LINE_Y + ' H1250', pathLength: 1 }, svg);
    if (solved) dr.style.strokeWidth = 5;
    var nodes = [], cards = [];
    var ch = C.sections[3].challenges;
    XS.forEach(function (x, k) {
      var o = rvEl('div', 'obst' + (solved ? ' ok' : ''), c, null, 0, null, k + 1);
      o.style.left = x + 'px'; o.style.top = LINE_Y + 'px';
      nodes.push(o);
      var above = k % 2 === 0;
      var card = rvEl('div', 'ccard keep' + (solved ? ' still' : ''), c, null, solved ? 0 : k + 1, null, 0);
      card.style.left = (x - 220) + 'px'; card.style.top = (above ? LINE_Y - 50 - 260 : LINE_Y + 50) + 'px';
      var fl = el('div', 'flipper', card);
      var front = el('div', 'face front', fl);
      el('div', 'num', front, k + 1);
      el('div', 'txt', front, ch[k]);
      if (solved) {
        var back = el('div', 'face back', fl);
        el('h4', '', back, d.solutions[k].title);
        el('p', '', back, d.solutions[k].text);
        var s2 = svgEl('svg', { 'class': 'chk', viewBox: '0 0 48 48' }, back);
        svgEl('circle', { cx: 24, cy: 24, r: 22 }, s2);
        svgEl('path', { d: 'M13 25 L21 33 L35 16', pathLength: 1 }, s2);
      }
      cards.push(card);
    });
    var rw = rvEl('div', '', c, null, 0, null, 0);
    rw.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    var runner = el('div', 'runner', rw);
    var rimg = el('img', '', runner); rimg.src = 'assets/logo/logo-symbol.png'; rimg.alt = ''; rimg.onerror = function () { rimg.style.display = 'none'; };
    var RX = [110, XS[0] - 78, XS[1] - 78, XS[2] - 78, XS[3] - 78, 1250];
    runner.style.transform = 'translate3d(' + RX[0] + 'px,' + LINE_Y + 'px,0)';
    P.onStep = function (s) {
      runner.style.transform = 'translate3d(' + RX[Math.max(0, Math.min(5, s))] + 'px,' + LINE_Y + 'px,0)';
      nodes.forEach(function (n, k) {
        if (solved) { n.classList.toggle('lit', s >= k + 1); return; }
        n.classList.toggle('passed', s > k + 1);
        if (s === k + 1 && !reduced) {
          setTimeout(function () {
            if (P.curStep !== k + 1) return;
            n.classList.remove('hit'); void n.offsetWidth; n.classList.add('hit');
            if (rimg.animate) rimg.animate([{ transform: 'translateX(0) scale(1,1)' }, { transform: 'translateX(-20px) scale(.88,1.12)' }, { transform: 'translateX(0) scale(1,1)' }], { duration: 520, easing: EASE_OUT });
          }, 1250);
        }
      });
      if (solved) cards.forEach(function (cd, k) { cd.classList.toggle('flip', s >= k + 1); });
    };
    bridge(P, d.bridge);
  }
  R.s04 = function (P, d) { pathScene(P, d, false); };
  R.s05 = function (P, d) { pathScene(P, d, true); };

  /* ---- 06 · tasks ---- */
  R.s06 = function (P, d) {
    var c = P.content;
    var col = el('div', 'col wide', c);
    col.appendChild(headline(d.headline, 0, 1, true));
    pointsList(col, d.points, 0, 1);
    var board = el('div', 'board', c);
    d.columns.forEach(function (name, i) {
      var colm = rvEl('div', 'bcol', board, null, 0, 1, i + 3);
      el('h5', '', colm, name);
      if (i < 3) el('div', 'sk', colm);
      if (i === 1 || i === 3) el('div', 'sk', colm);
    });
    var mv = rvEl('div', 'mover', c, null, 0, 1, 6);
    mv.style.left = '128px'; mv.style.top = '616px';
    bridge(P, d.bridge);
  };

  /* ---- 07 · files + versions ---- */
  R.s07 = function (P, d) {
    var c = P.content;
    var col = el('div', 'col wide', c);
    col.appendChild(headline(d.headline, 0, 1, true));
    pointsList(col, d.points, 0, 1);
    var vs = el('div', 'vstack', c);
    [['v3', 'Version 3', 'latest'], ['v2', 'Version 2', ''], ['v1', 'Version 1', '']].forEach(function (v, i) {
      var cd = rvEl('div', 'vcard ' + v[0], vs, null, 0, 1, i + 3);
      el('i', '', cd); cd.appendChild(document.createTextNode(v[1])); el('span', '', cd, v[2]);
    });
    var sv = svgEl('svg', { 'class': 'vrestore rv', viewBox: '0 0 120 120' });
    svgEl('path', { d: 'M20 30 C 90 20 100 80 40 96 M40 96 L56 98 M40 96 L46 80', pathLength: 1 }, sv);
    add(vs, sv, 0, 1, 7);
    bridge(P, d.bridge);
  };

  /* ---- 08 · contribution + supervisor ---- */
  R.s08 = function (P, d) {
    var c = P.content;
    var col = el('div', 'col wide', c);
    col.appendChild(headline(d.headline, 0, 2, true));
    pointsList(col, d.points, 0, 1);
    var cs = el('div', 'counters', c);
    d.counters.forEach(function (o, i) {
      var cn = rvEl('div', 'counter', cs, null, 1, 2, i + 1);
      makeCount(cn, o);
      el('div', 'lbl', cn, o.label);
      var bar = el('div', 'bar', cn); var fill = el('i', '', bar);
      fill.style.setProperty('--fill', i === 0 ? .75 : (o.value / 100));
    });
    rvEl('div', 'cnote', c, d.countersNote, 1, 2, 5);
    bridge(P, d.bridge);
  };

  /* ---- 09 · architecture ---- */
  R.s09 = function (P, d) {
    var c = P.content;
    var col = el('div', 'col wide', c);
    col.appendChild(headline(d.headline, 0, null, true));
    var pos = { web: [110, 430], api: [580, 430], db: [1050, 430] };
    d.nodes.forEach(function (n, i) {
      var nd = rvEl('div', 'anode', c, null, 0, null, i * 2);
      nd.style.left = pos[n.id][0] + 'px'; nd.style.top = pos[n.id][1] + 'px';
      el('h4', '', nd, n.title); el('p', '', nd, n.sub);
    });
    [[410, 650], [790, 650]].forEach(function (p, i) {
      var nd = rvEl('div', 'anode side', c, null, 0, null, 6 + i);
      nd.style.left = p[0] + 'px'; nd.style.top = p[1] + 'px';
      el('h4', '', nd, d.sidecars[i]);
    });
    var fl = rvEl('div', 'anode side dashed', c, null, 1, null, 0);
    fl.style.left = '580px'; fl.style.top = '270px'; fl.style.width = '340px';
    el('h4', '', fl, 'Flutter mobile app');

    var svg = svgEl('svg', { 'class': 'alines', viewBox: '0 0 1920 1080' });
    c.appendChild(svg);
    svg.dataset.from = 0;
    var defs = [['M450 505 H580', 0], ['M920 505 H1050', 1], ['M750 580 C750 625 560 605 560 650', 2], ['M750 580 C750 625 940 605 940 650', 3]];
    var paths = defs.map(function (p) {
      var el1 = svgEl('path', { d: p[0], pathLength: 1 }, svg); el1.style.setProperty('--i', p[1]); return el1;
    });
    var lf = svgEl('path', { 'class': 'dash', d: 'M750 366 V430' }, svg); lf.dataset.from = 1;
    P.dots = [];
    [0, 0.5].forEach(function (off, k) {
      paths.slice(0, 2).forEach(function (pth, j) {
        var circ = svgEl('circle', { r: 7, cx: 0, cy: 0 }, svg);
        P.dots.push({ path: pth, c: circ, off: off + j * 0.2, speed: 0.33, rev: k === 1 });
      });
    });
    P.dots.push({ path: paths[2], c: svgEl('circle', { r: 6 }, svg), off: 0.1, speed: 0.4, rev: false });
    P.dots.push({ path: paths[3], c: svgEl('circle', { r: 6 }, svg), off: 0.6, speed: 0.4, rev: true });
    rvEl('p', 'note9', c, d.flutterNote, 1, null, 2);
    P.tick = function (now) {
      if (!P.dotsOn) return;
      P.dots.forEach(function (o) {
        var len = o.path.getTotalLength(), t = ((now / 1000) * o.speed + o.off) % 1;
        var pt = o.path.getPointAtLength((o.rev ? 1 - t : t) * len);
        o.c.setAttribute('cx', pt.x); o.c.setAttribute('cy', pt.y);
        o.c.style.opacity = Math.sin(t * Math.PI);
      });
    };
    P.enter = function () { clearTimeout(P._dt); P._dt = setTimeout(function () { P.dotsOn = true; }, 2600); };
    P.leave = function () { clearTimeout(P._dt); P.dotsOn = false; P.dots.forEach(function (o) { o.c.style.opacity = 0; }); };
    bridge(P, d.bridge);
  };

  /* ---- 10 · where we are / what is next ---- */
  R.s10 = function (P, d) {
    var c = P.content;
    var col = el('div', 'col wide', c);
    col.appendChild(headline(d.headline, 0, null, true));
    rvEl('span', 'status-pill', col, d.status, 0, null, 4);
    var tl = el('div', 'tl', c);
    rvEl('div', 'tl-line', tl, null, 0, null, 0);
    var names = { done: 'Done', progress: 'In progress', next: 'Next' };
    d.milestones.forEach(function (m, i) {
      var x = 190 + i * 230;
      var ms = rvEl('div', 'ms ' + m.status, tl, null, 0, null, i + 2);
      ms.style.left = x + 'px';
      var dot = el('div', 'dot', ms);
      dot.style.setProperty('--cx', (1520 - x) + 'px'); dot.style.setProperty('--cy', (540 - 520) + 'px');
      el('div', 'lab', ms, m.label); el('div', 'st', ms, names[m.status]);
    });
    rvEl('div', 'tl-note', tl, d.milestonesNote, 0, null, 8);
    var rm = el('div', 'roadmap', c);
    d.roadmap.forEach(function (t, i) { rvEl('div', 'rcard', rm, t, 1, null, i + 1); });
    P.onStep = function (s) {
      P.content.classList.toggle('collapse-on', s >= 2);
      if (s >= 2) {
        clearTimeout(P._t); tsym.className = 'at-right';
        P._t = setTimeout(function () { if (P.curStep >= 2) tsym.className = 'at-right show'; }, 700);
      } else { clearTimeout(P._t); tsym.className = ''; }
    };
    P.leave = function () { clearTimeout(P._t); tsym.className = ''; };
    bridge(P, d.bridge);
  };

  /* ---- 11 · AI Assistant ---- */
  R.s11 = function (P, d) {
    var c = P.content;
    var col = el('div', 'col wide', c);
    col.appendChild(headline(d.headline, 0, null, true));
    pointsList(col, d.points, 0, 1);
    var feats = el('div', 'ai-feats', c);
    d.features.forEach(function (f, i) {
      var card = rvEl('div', 'ai-card', feats, null, 1, null, i + 1);
      el('h4', '', card, f.title);
      el('p', '', card, f.text);
    });
    bridge(P, d.bridge);
  };

  /* ---- 12 · Architecture and Security ---- */
  R.s12 = function (P, d) {
    var c = P.content;
    var col = el('div', 'col wide', c);
    col.appendChild(headline(d.headline, 0, null, true));
    /* layer stack */
    var stack = el('div', 'arch-stack', c);
    d.layers.forEach(function (l, i) {
      var row = rvEl('div', 'arch-layer', stack, null, 0, null, i + 1);
      el('strong', '', row, l.name);
      el('span', '', row, l.desc);
    });
    /* permissions table */
    var tbl = el('div', 'arch-perms', c);
    rvEl('div', 'arch-perms-head', tbl, 'Permission Model', 1, null, 0);
    d.permissions.forEach(function (p, i) {
      var row = rvEl('div', 'arch-perm-row', tbl, null, 1, null, i + 1);
      el('span', 'perm-role', row, p.role);
      el('span', 'perm-can', row, p.can);
    });
    bridge(P, d.bridge);
  };

  /* ---- 13 · Future Roadmap ---- */
  R.s13 = function (P, d) {
    var c = P.content;
    var col = el('div', 'col wide', c);
    col.appendChild(headline(d.headline, 0, null, true));
    rvEl('span', 'status-pill', col, d.status, 0, null, 4);
    var tl = el('div', 'tl', c);
    rvEl('div', 'tl-line', tl, null, 0, null, 0);
    var names = { done: 'Done', progress: 'In progress', next: 'Next' };
    d.milestones.forEach(function (m, i) {
      var x = 190 + i * 200;
      var ms = rvEl('div', 'ms ' + m.status, tl, null, 0, null, i + 2);
      ms.style.left = x + 'px';
      var dot = el('div', 'dot', ms);
      dot.style.setProperty('--cx', (1520 - x) + 'px'); dot.style.setProperty('--cy', (540 - 520) + 'px');
      el('div', 'lab', ms, m.label); el('div', 'st', ms, names[m.status]);
    });
    rvEl('div', 'tl-note', tl, d.milestonesNote, 0, null, 8);
    var rm = el('div', 'roadmap', c);
    d.roadmap.forEach(function (t, i) { rvEl('div', 'rcard', rm, t, 1, null, i + 1); });
    P.onStep = function (s) {
      P.content.classList.toggle('collapse-on', s >= 2);
      if (s >= 2) {
        clearTimeout(P._t); tsym.className = 'at-right';
        P._t = setTimeout(function () { if (P.curStep >= 2) tsym.className = 'at-right show'; }, 700);
      } else { clearTimeout(P._t); tsym.className = ''; }
    };
    P.leave = function () { clearTimeout(P._t); tsym.className = ''; };
    bridge(P, d.bridge);
  };

  /* ---- intro stats page ---- */
  R.istats = function (P) {
    var d = C.introStats;
    var c = P.content;
    /* background rings decoration */
    var deco = el('div', 'is-deco', c);
    el('div', 'is-ring is-ring1', deco);
    el('div', 'is-ring is-ring2', deco);
    el('div', 'is-ring is-ring3', deco);
    /* headline */
    var col = el('div', 'is-col', c);
    col.appendChild(headline(d.headline, 0, null, false));
    /* stat cards */
    var cards = el('div', 'is-cards', c);
    var spins = [];
    d.stats.forEach(function (s, i) {
      var card = rvEl('div', 'is-card', cards, null, 0, null, i + 1);
      /* arc ring progress */
      var arcWrap = el('div', 'is-arc-wrap', card);
      var svg = svgEl('svg', { 'class': 'is-arc', viewBox: '0 0 200 200' }, arcWrap);
      svgEl('circle', { cx: 100, cy: 100, r: 84, 'class': 'is-arc-track' }, svg);
      var fill = svgEl('circle', { cx: 100, cy: 100, r: 84, 'class': 'is-arc-fill',
                                   pathLength: 100, 'stroke-dasharray': 100,
                                   'stroke-dashoffset': 100 }, svg);
      /* number — centred inside the arc wrapper */
      var numBox = el('div', 'is-num-box', arcWrap);
      var sp = el('span', 'is-num count', numBox, s.prefix + (0).toFixed(s.decimals));
      sp.dataset.to = s.value; sp.dataset.decimals = s.decimals; sp.dataset.prefix = s.prefix;
      el('span', 'is-suf', numBox, s.suffix);
      /* label + source */
      el('p', 'is-lbl', card, s.label);
      el('small', 'is-src', card, s.source);
      spins.push({ fill: fill, target: s.value });
    });
    /* trigger counters + arc on enter */
    P.enter = function () {
      spins.forEach(function (o, i) {
        var delay = 400 + i * 260;
        setTimeout(function () {
          o.fill.style.transition = 'stroke-dashoffset 1.9s cubic-bezier(0.16,1,0.3,1)';
          o.fill.style.strokeDashoffset = 100 - o.target;
        }, delay);
        var span = cards.querySelectorAll('.is-num')[i];
        if (span) runCount(span, delay);
      });
    };
    P.leave = function () {
      spins.forEach(function (o) {
        o.fill.style.transition = 'none';
        o.fill.style.strokeDashoffset = 100;
      });
      var spans = cards.querySelectorAll('.is-num');
      for (var k = 0; k < spans.length; k++) resetCount(spans[k]);
    };
  };

  /* ---- closing coda ---- */
  R.coda = function (P) {
    var c = P.content;
    var cl = el('div', 'cd-logo', c);
    P.logo = buildLogo(cl, true);
    var frame = el('div', 'cd-frame', c);
    var vid = el('video', '', frame);
    vid.setAttribute('playsinline', ''); vid.setAttribute('preload', 'auto'); vid.preload = 'auto'; vid.playsInline = true;
    vid.muted = false;
    var unmute = el('button', 'cd-unmute', frame, 'Tap to unmute');
    var txt = el('div', 'cd-text', c);
    var items = [];
    items.push(el('h2', 'rv', txt, C.coda.thanks));
    items.push(el('h3', 'rv', txt, C.coda.questions));
    var sup = el('div', 'cd-sup rv', txt, C.university + ' \u00B7 ' + C.faculty);
    el('b', '', sup, C.supervisor);
    items.push(sup);
    var names = el('div', 'cd-names rv', txt);
    C.team.forEach(function (m) { el('span', '', names, m.name); });
    items.push(names);
    items.forEach(function (it, i) { it.style.setProperty('--i', i * 1.2); it.style.setProperty('--base', '300ms'); });

    var vidState = 'unknown', tk = 0;
    function noVideo() { vidState = 'bad'; P.el.classList.remove('has-video'); P.el.classList.add('no-video'); }
    vid.addEventListener('error', noVideo);
    vid.addEventListener('canplay', function () { if (vidState !== 'bad') vidState = 'ok'; });
    // preloads during earlier sections; tries the configured file, then a .webm with the same name
    var base = C.closingVideoFolder + C.closingVideo, srcs = [base];
    if (/\.mp4$/i.test(base)) srcs.push(base.replace(/\.mp4$/i, '.webm'));
    srcs.forEach(function (u, i) {
      var so = el('source', '', vid); so.src = u;
      if (i === srcs.length - 1) so.addEventListener('error', noVideo);
    });
    try { vid.load(); } catch (e) { noVideo(); }

    function settle(token) {
      if (token !== tk) return;
      if (vidState === 'bad') P.el.classList.add('no-video'); else P.el.classList.add('has-video');
      P.el.classList.add('settled');
      items.forEach(function (it) { it.classList.add('on'); });
      if (vidState !== 'bad') {
        setTimeout(function () {
          if (token !== tk || vidState === 'bad') return;
          try {
            vid.currentTime = 0;
            var pr = vid.play();
            if (pr && pr.catch) pr.catch(function () {         // blocked with sound -> muted autoplay + unmute button
              vid.muted = true;
              var p2 = vid.play(); if (p2 && p2.catch) p2.catch(function () {});
              unmute.classList.add('show');
            });
          } catch (e) { noVideo(); }
        }, 900);
      }
    }
    unmute.addEventListener('click', function () { vid.muted = false; unmute.classList.remove('show'); unmute.blur(); });
    function reset() {
      tk++;
      P.logo.stop();
      P.el.classList.remove('settled', 'has-video', 'no-video');
      items.forEach(function (it) { it.classList.remove('on'); });
      try { vid.pause(); vid.currentTime = 0; } catch (e) {}
      vid.muted = false; unmute.classList.remove('show');
    }
    P.enter = function () {
      reset();
      var token = tk;
      P.logo.play(function () { settle(token); });
    };
    P.leave = function () { reset(); };
  };

  /* ---------- build all pages ---------- */
  addPage({ id: 'logo', kind: 'logo', n: 1, theme: 'light', speaker: null, title: 'TeamHub' });
  addPage({ id: 'istats', kind: 'istats', n: 1, theme: 'dark', speaker: null, title: 'By the numbers' });
  C.sections.forEach(function (d, i) {
    addPage({ id: d.id, kind: d.id, n: d.steps.length, theme: d.theme, speaker: null, title: d.title, def: d, no: i + 1 });
  });
  addPage({ id: 'coda', kind: 'coda', n: 1, theme: 'dark', speaker: null, title: 'Thank you', cls: 'coda', closing: true });
  pages.forEach(function (P) {
    P.curStep = -1;
    R[P.kind](P, P.def);
  });

  /* ======================================================================
     NAVIGATION
     ====================================================================== */
  var state = { p: -1, s: 0 }, token = 0, spk = -1, tTimers = [], sceneTimer, dotsTimer, chainTimer;
  var PHONE_X = { right: 560, rightSmall: 700, coming: 640, hidden: 0, center: 0, focus: 0 };

  function applySteps(P, s) {
    var nodes = P.el.querySelectorAll('[data-from]');
    var base = parseInt(P.el.style.getPropertyValue('--base')) || 0;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i], from = +n.dataset.from, until = n.dataset.until === undefined ? 1e9 : +n.dataset.until;
      var want = s >= from && s < until, has = n.classList.contains('on');
      if (want && !has) {
        n.classList.add('on');
        var cs = n.querySelectorAll ? n.querySelectorAll('.count') : [];
        for (var j = 0; j < cs.length; j++) runCount(cs[j], base + (parseFloat(n.style.getPropertyValue('--i')) || 1) * 100 + 300);
      } else if (!want && has) {
        n.classList.remove('on');
        (function (node) {
          var cs2 = node.querySelectorAll ? node.querySelectorAll('.count') : [];
          if (cs2.length) setTimeout(function () { if (!node.classList.contains('on')) for (var k = 0; k < cs2.length; k++) resetCount(cs2[k]); }, 800);
        })(n);
      }
    }
    P.el.classList.toggle('bridge-on', !!P.bridge && s === P.n - 1);
    P.curStep = s;
    if (P.onStep && s >= 0 && P.el.dataset.pos === 'active') P.onStep(s);
  }

  function setPositions(np) {
    pages.forEach(function (P, i) {
      var pos = i < np ? 'before' : i > np ? 'after' : 'active';
      if (P.el.dataset.pos !== pos) {
        P.el.dataset.pos = pos;
        if (pos === 'before') applySteps(P, P.n - 1);
        else if (pos === 'after') applySteps(P, -1);
      }
    });
  }

  function layoutFor(P, s) {
    if (!P.def) return 'hidden';
    for (var i = s; i >= 0; i--) if (P.def.steps[i] && P.def.steps[i].phone) return P.def.steps[i].phone;
    return 'right';
  }
  function sceneFor(P, s) {
    if (!P.def) return null;
    for (var i = s; i >= 0; i--) if (P.def.steps[i] && P.def.steps[i].scene) return P.def.steps[i].scene;
    return null;
  }

  /* ---- speaker badge + hand-off ---- */
  var spIn = el('div', 'sp-in', spEl);
  function fillSpeaker(idx, P) {
    spIn.innerHTML = '';
    var m = C.team[idx];
    el('div', 'av', spIn, initials(m.name));
    var b = el('div', '', spIn);
    el('div', 'nm', b, m.name);
    el('div', 'rl', b, m.role + ' \u00B7 ' + (P.closing ? 'Closing' : 'Part ' + pad(idx + 1)));
  }
  function setSpeaker(P) {
    var idx = P.speaker === null ? -2 : P.speaker;
    var key = idx === -2 ? -2 : idx + (P.closing ? 100 : 0);
    if (key === spk) return;
    var prev = spk; spk = key;
    if (idx === -2) { spEl.classList.remove('show'); return; }
    if (prev === -1 || prev === -2 || reduced) { fillSpeaker(idx, P); spEl.classList.add('show'); return; }
    // 2-second hand-off: old speaker slides out, next slides in with a blue pulse
    var a = spIn.animate ? spIn.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translate3d(-46px,0,0)' }], { duration: 380, easing: EASE_IO, fill: 'forwards' }) : null;
    var next = function () {
      if (a) a.cancel();
      fillSpeaker(idx, P);
      if (spIn.animate) spIn.animate([{ opacity: 0, transform: 'translate3d(46px,0,0)' }, { opacity: 1, transform: 'none' }], { duration: 650, easing: EASE_OUT });
      spEl.classList.remove('pulse'); void spEl.offsetWidth; spEl.classList.add('pulse');
      setTimeout(function () { spEl.classList.remove('pulse'); }, 1900);
    };
    if (a) a.onfinish = next; else next();
  }
  function updateCue() {
    var n = pages[state.p + 1];
    cueEl.textContent = n ? ('Next: ' + n.title) : 'End of presentation';
  }

  /* ---- dots (one per page, auto-hide) ---- */
  pages.forEach(function (P, i) {
    var b = el('button', '', dotsEl); b.setAttribute('aria-label', P.title);
    b.addEventListener('click', function () { b.blur(); jump(i); });
  });
  function refreshDots() {
    Array.prototype.forEach.call(dotsEl.children, function (b, i) {
      b.className = i === state.p ? 'cur' : i < state.p ? 'done' : '';
    });
  }
  function showChrome() {
    dotsEl.classList.add('show'); document.body.classList.add('show-cursor');
    clearTimeout(dotsTimer);
    dotsTimer = setTimeout(function () { dotsEl.classList.remove('show'); document.body.classList.remove('show-cursor'); }, 2400);
  }

  /* ---- fragments (hand-off from the phone into the chaos) ---- */
  function burst(x, y, n) {
    if (reduced) return;
    for (var i = 0; i < n; i++) {
      var f = el('i', '', fx), ang = (i / n) * Math.PI * 2 + Math.random(), dist = 260 + Math.random() * 420;
      f.style.left = x + 'px'; f.style.top = y + 'px';
      f.style.background = i % 3 ? 'var(--ice)' : 'var(--blue)';
      var dx = Math.cos(ang) * dist - 220, dy = Math.sin(ang) * dist * 0.8;
      var a = f.animate([{ transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.2) rotate(' + (Math.random() * 360) + 'deg)', opacity: 0 }],
        { duration: 1100 + Math.random() * 600, easing: EASE_OUT });
      a.onfinish = (function (n2) { return function () { n2.remove(); }; })(f);
    }
  }

  /* ---- the big one: move to (page, step) ---- */
  async function apply(np, ns, dir) {
    var my = ++token;
    if (Emu.isRunning()) await Emu.finish();        // "safe step": finish the running scene instantly
    if (my !== token) return;

    var prev = state, changed = np !== prev.p;
    var P = pages[np], oldP = pages[prev.p];
    state = { p: np, s: ns };
    showChrome();

    clearTimeout(sceneTimer);
    if (changed) {
      tTimers.forEach(clearTimeout); tTimers = [];
      if (oldP && oldP.leave) oldP.leave(dir);
      if (!(oldP && (oldP.id === 's10' || oldP.id === 's13'))) tsym.className = '';

      // 04 <-> 05 share the same cards: keep them still across the hand-off
      var pair = { s04: 1, s05: 1 };
      clearTimeout(chainTimer);
      pages.forEach(function (q) { q.el.dataset.chain = ''; });
      if (oldP && pair[oldP.id] && pair[P.id]) {
        pages.forEach(function (q) { if (pair[q.id]) q.el.dataset.chain = '1'; });
        chainTimer = setTimeout(function () { pages.forEach(function (q) { q.el.dataset.chain = ''; }); }, 1900);
      }

      pages.forEach(function (q) { q.el.style.setProperty('--base', '0ms'); });
      P.el.style.setProperty('--base', '420ms');

      // theme (light/navy circular reveal) + parallax depth
      var L0 = P.def ? layoutFor(P, ns) : 'hidden';
      stage.style.setProperty('--cx', ((960 + (PHONE_X[L0] || 0)) / 1920 * 100) + '%');
      stage.style.setProperty('--cy', '50%');
      stage.dataset.theme = P.theme;
      stage.style.setProperty('--p', np);

      // camera feel: slight push-in / pull-back on every hand-off
      if (camera.animate && !reduced) {
        camera.animate([{ transform: 'scale(' + (dir > 0 ? 1.04 : 0.97) + ')' }, { transform: 'scale(1)' }], { duration: 1600, easing: EASE_OUT });
      }
      setPositions(np);
      setSpeaker(P);
    }

    applySteps(P, ns);
    if (changed && P.enter) P.enter(dir);

    // ---- phone ----
    var layout = layoutFor(P, ns), scene = P.def ? P.def.steps[ns] && P.def.steps[ns].scene : null;
    var viaT = changed && dir > 0 && oldP && oldP.id === 'team' && P.id === 's01';
    var layoutDelay = viaT ? 1500 : 0, sceneDelay = viaT ? 1750 : (changed ? 750 : 120);

    if (viaT) {                                    // team cards collapse -> T -> becomes the phone
      Emu.sleepScreen();
      tTimers.push(setTimeout(function () { tsym.className = 'show'; }, 450));
      tTimers.push(setTimeout(function () { tsym.className = 'grow'; }, 1500));
      tTimers.push(setTimeout(function () { tsym.className = ''; }, 2900));
    }
    if (changed && dir > 0 && oldP && oldP.id === 's01' && P.id === 's02') {
      setTimeout(function () { burst(1520, 540, 16); }, 120);   // T / phone fragments become the chaos
    }
    if (layout === 'hidden' && !P.def) Emu.cancel();
    if (layoutDelay) tTimers.push(setTimeout(function () { Emu.layout(layout); }, layoutDelay)); else Emu.layout(layout);

    if (P.def) {
      if (dir > 0 && scene) {
        sceneTimer = setTimeout(function () { if (my === token) Emu.run(scene); }, sceneDelay);
      } else {
        var sc = sceneFor(P, ns);
        if (sc) sceneTimer = setTimeout(function () { if (my === token) Emu.run(sc, { fast: true }); }, viaT ? sceneDelay : 0);
        else if (!changed) { /* nothing to restore */ }
      }
    } else { Emu.reset(); }

    refreshDots(); updateCue();
  }

  function go(dir) {
    var P = pages[state.p], np = state.p, ns = state.s;
    if (dir > 0) {
      if (ns < P.n - 1) ns++;
      else if (np < pages.length - 1) { np++; ns = 0; } else return;
    } else {
      if (ns > 0) ns--;
      else if (np > 0) { np--; ns = pages[np].n - 1; } else return;
    }
    apply(np, ns, dir);
  }
  function jump(i) { if (i !== state.p) apply(i, 0, i > state.p ? 1 : -1); }

  /* ---------- keys: clicker, keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === ' ' || k === 'PageDown' || k === 'ArrowDown' || k === 'Enter') { e.preventDefault(); go(1); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'ArrowUp' || k === 'Backspace') { e.preventDefault(); go(-1); }
    else if (k === 'f' || k === 'F') {
      var d = document, de = d.documentElement;
      if (!d.fullscreenElement && !d.webkitFullscreenElement) { (de.requestFullscreen || de.webkitRequestFullscreen || function () {}).call(de); }
      else { (d.exitFullscreen || d.webkitExitFullscreen || function () {}).call(d); }
    }
    else if (k === 'n' || k === 'N') { cueEl.classList.toggle('show'); }
  });
  document.addEventListener('mousemove', showChrome);

  // Click anywhere = fill the whole screen (first click only; exit with F or Esc)
  function enterFullscreen() {
    var d = document, de = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) return;
    var f = de.requestFullscreen || de.webkitRequestFullscreen;
    if (f) { try { var r = f.call(de); if (r && r.catch) r.catch(function () {}); } catch (e) {} }
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#dots, .cd-unmute')) return;
    enterFullscreen();
  });

  /* ---------- global frame loop (only the active page may tick) ---------- */
  (function frame(now) {
    var P = pages[state.p];
    if (P && P.tick) P.tick(now);
    requestAnimationFrame(frame);
  })(0);

  /* ---------- start ---------- */
  Emu.init(document.getElementById('phone-layer'));
  fit();
  var started = false;
  function start() { if (started) return; started = true; apply(0, 0, 1); }
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1500); })]).then(function () { setTimeout(start, 250); });
  } else { setTimeout(start, 500); }
})();
