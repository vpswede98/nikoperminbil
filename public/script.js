/* niköperminbil.se — scroll choreography engine */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fmt = new Intl.NumberFormat("sv-SE");
  var vh = window.innerHeight;
  var vw = window.innerWidth;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(p, a, b) { return clamp01((p - a) / (b - a)); }

  /* ---------- text splitting ---------- */

  document.querySelectorAll("[data-split]").forEach(function (el) {
    var mode = el.getAttribute("data-split");
    var text = el.textContent;
    el.setAttribute("aria-label", text);
    el.textContent = "";
    var frag = document.createDocumentFragment();
    var i = 0;

    if (mode === "chars") {
      text.split("").forEach(function (ch) {
        var mask = document.createElement("span");
        mask.className = "ch-mask";
        mask.setAttribute("aria-hidden", "true");
        var s = document.createElement("span");
        s.className = "ch";
        s.style.setProperty("--i", i++);
        s.innerHTML = ch === " " ? "&nbsp;" : ch;
        mask.appendChild(s);
        frag.appendChild(mask);
      });
    } else {
      text.split(/\s+/).forEach(function (word, wi, arr) {
        var w = document.createElement("span");
        w.className = "w";
        w.setAttribute("aria-hidden", "true");
        var inner = document.createElement("i");
        inner.style.setProperty("--i", i++);
        inner.textContent = word;
        w.appendChild(inner);
        frag.appendChild(w);
        if (wi < arr.length - 1) frag.appendChild(document.createTextNode(" "));
      });
    }
    el.appendChild(frag);
  });

  /* ---------- entrance observer ---------- */

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });

  document.querySelectorAll(".reveal, [data-split]").forEach(function (el) {
    if (reduced) { el.classList.add("in"); return; }
    io.observe(el);
  });

  // hero title reveals on load, not on scroll
  window.addEventListener("load", function () {
    document.querySelectorAll(".hero-title [data-split]").forEach(function (el) {
      io.unobserve(el);
      el.classList.add("in");
    });
  });
  // fallback if load already fired or fonts are slow
  setTimeout(function () {
    document.querySelectorAll(".hero-title [data-split]").forEach(function (el) {
      el.classList.add("in");
    });
  }, 600);

  /* ---------- SVG draw prep ---------- */

  var drawPaths = [];
  document.querySelectorAll("#carSvg .draw").forEach(function (p) {
    var len = 0;
    try { len = p.getTotalLength(); } catch (e) { return; }
    p.style.strokeDasharray = len + " " + len;
    p.style.strokeDashoffset = reduced ? 0 : len;
    drawPaths.push({ el: p, len: len });
  });
  var wheels = document.querySelectorAll("[data-wheel]");

  /* ---------- scrub registry ---------- */

  var scrubs = [];

  function addScrub(el, fn, opts) {
    if (!el) return;
    scrubs.push({ el: el, fn: fn, start: 0, dist: 1, opts: opts || {} });
  }

  function measure() {
    vh = window.innerHeight;
    vw = window.innerWidth;
    scrubs.forEach(function (s) {
      var rect = s.el.getBoundingClientRect();
      var top = rect.top + window.scrollY;
      if (s.opts.pin) {
        // pinned: progress runs while section is stuck (height - viewport)
        s.start = top;
        s.dist = Math.max(1, s.el.offsetHeight - vh);
      } else {
        // in-view: 0 when top enters bottom of viewport, 1 when bottom leaves top
        s.start = top - vh;
        s.dist = Math.max(1, s.el.offsetHeight + vh);
      }
    });
  }

  /* ---------- story section ---------- */

  var story = document.querySelector(".story");
  var storySticky = document.querySelector(".story-sticky");
  var carSvg = document.getElementById("carSvg");
  var stamp = document.getElementById("stamp");
  var captions = document.querySelectorAll(".caption");
  var callouts = document.querySelectorAll(".callout");

  var capRanges = [ [0, 0.2], [0.24, 0.46], [0.5, 0.8], [0.84, 1.01] ];

  if (story && !reduced) {
    addScrub(story, function (p) {
      // headlights
      storySticky.classList.toggle("lit", p > 0.1);

      // draw car between 0.08 and 0.46
      var dp = seg(p, 0.08, 0.46);
      var e = 1 - Math.pow(1 - dp, 2);
      for (var i = 0; i < drawPaths.length; i++) {
        drawPaths[i].el.style.strokeDashoffset = drawPaths[i].len * (1 - e);
      }

      // car slides in slightly + wheels roll
      var slide = (1 - e) * -6;
      carSvg.style.transform = "translateX(" + slide + "%)";
      carSvg.style.setProperty("--wf", seg(dp, 0.55, 0.95));
      var rot = p * 500;
      wheels.forEach(function (w) { w.style.transform = "rotate(" + rot + "deg)"; });

      // captions
      captions.forEach(function (c, ci) {
        var r = capRanges[ci];
        c.classList.toggle("on", p >= r[0] && p < r[1]);
      });

      // callouts
      callouts.forEach(function (c) {
        var at = parseFloat(c.getAttribute("data-at"));
        c.classList.toggle("on", p >= at && p < 0.86);
      });

      // stamp
      stamp.classList.toggle("on", p >= 0.84);
    }, { pin: true });
  } else if (story && reduced) {
    storySticky.classList.add("lit");
    captions.forEach(function (c) { c.classList.add("on"); });
    callouts.forEach(function (c) { c.classList.add("on"); });
    stamp.classList.add("on");
  }

  /* ---------- hero parallax + fade out ---------- */

  var hero = document.getElementById("hero");
  var heroContent = document.getElementById("heroContent");
  var depthEls = document.querySelectorAll("[data-depth]");
  var mouseX = 0, mouseY = 0, curX = 0, curY = 0;

  if (!reduced) {
    window.addEventListener("pointermove", function (e) {
      mouseX = (e.clientX / vw - 0.5) * 2;
      mouseY = (e.clientY / vh - 0.5) * 2;
    }, { passive: true });

    addScrub(hero, function (p) {
      // p: 0.5 = hero fully in view at top, 1 = scrolled past
      var out = seg(p, 0.5, 0.95);
      heroContent.style.opacity = 1 - out * 1.1;
      heroContent.style.transform = "translateY(" + (out * -60) + "px) scale(" + (1 - out * 0.06) + ")";
    });
  }

  /* ---------- process horizontal scrub ---------- */

  var processSec = document.querySelector(".process");
  var track = document.getElementById("processTrack");
  var stepNow = document.getElementById("stepNow");
  var processDist = 0;

  function sizeProcess() {
    if (!processSec || !track) return;
    if (vw <= 820 || reduced) {
      processSec.style.height = "";
      track.style.transform = "";
      return;
    }
    processDist = track.scrollWidth + parseFloat(getComputedStyle(track).paddingLeft) * 0 - vw + 2 * parseFloat(getComputedStyle(track).paddingLeft || 0);
    processDist = Math.max(0, track.scrollWidth - vw + 80);
    processSec.style.height = (processDist + vh) + "px";
  }

  if (processSec && !reduced) {
    addScrub(processSec, function (p) {
      if (vw <= 820) return;
      track.style.transform = "translateX(" + (-p * processDist) + "px)";
      var step = Math.min(4, Math.floor(p * 4) + 1);
      var label = "0" + step;
      if (stepNow.textContent !== label) stepNow.textContent = label;
    }, { pin: true });
  }

  /* ---------- nav + progress ---------- */

  var nav = document.getElementById("nav");
  var progressBar = document.getElementById("progressBar");
  var docH = 1;

  /* ---------- rAF loop ---------- */

  var lastY = -1;

  function frame() {
    var y = window.scrollY;

    if (y !== lastY) {
      lastY = y;
      nav.classList.toggle("scrolled", y > 40);
      progressBar.style.transform = "scaleX(" + clamp01(y / docH) + ")";
      for (var i = 0; i < scrubs.length; i++) {
        var s = scrubs[i];
        s.fn(clamp01((y - s.start) / s.dist));
      }
    }

    // mouse parallax (hero layers) — lerped
    if (!reduced && y < vh * 1.2) {
      curX += (mouseX - curX) * 0.06;
      curY += (mouseY - curY) * 0.06;
      for (var j = 0; j < depthEls.length; j++) {
        var d = parseFloat(depthEls[j].getAttribute("data-depth"));
        depthEls[j].style.translate = (curX * d * -26) + "px " + (curY * d * -18) + "px";
      }
    }

    // custom cursor
    if (cursorOn) {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      dot.style.transform = "translate(" + tx + "px," + ty + "px)";
      ring.style.transform = "translate(" + cx + "px," + cy + "px)";
    }

    requestAnimationFrame(frame);
  }

  /* ---------- custom cursor ---------- */

  var cursor = document.getElementById("cursor");
  var dot = cursor.querySelector(".cursor-dot");
  var ring = cursor.querySelector(".cursor-ring");
  var cursorOn = false;
  var tx = -100, ty = -100, cx = -100, cy = -100;

  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!cursorOn) { cursorOn = true; cursor.classList.add("on"); cx = tx; cy = ty; }
    }, { passive: true });
    document.addEventListener("mouseleave", function () {
      cursorOn = false; cursor.classList.remove("on");
    });
    document.addEventListener("mouseenter", function () {
      if (tx > 0) { cursorOn = true; cursor.classList.add("on"); }
    });
    document.addEventListener("pointerover", function (e) {
      cursor.classList.toggle("hot", !!e.target.closest("a, button, summary, input, [data-tilt]"));
    }, { passive: true });
  }

  /* ---------- tilt cards ---------- */

  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      var rect = null;
      card.addEventListener("pointerenter", function () {
        rect = card.getBoundingClientRect();
      }, { passive: true });
      card.addEventListener("pointermove", function (e) {
        if (!rect) rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        card.style.setProperty("--mx", (px * 100) + "%");
        card.style.setProperty("--my", (py * 100) + "%");
        card.style.transform =
          "rotateY(" + ((px - 0.5) * 10) + "deg) rotateX(" + ((0.5 - py) * 8) + "deg) translateZ(0)";
      }, { passive: true });
      card.addEventListener("pointerleave", function () {
        rect = null;
        card.style.transform = "";
      }, { passive: true });
    });
  }

  /* ---------- magnetic buttons ---------- */

  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-magnet]").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = "translate(" + dx * 0.18 + "px," + dy * 0.3 + "px)";
      }, { passive: true });
      btn.addEventListener("pointerleave", function () {
        btn.style.transform = "";
      }, { passive: true });
    });
  }

  /* ---------- förhandlingssimulatorn ---------- */

  var range = document.getElementById("bidRange");
  var bidValue = document.getElementById("bidValue");
  var bidResponse = document.getElementById("bidResponse");
  var PRICE = 4750000;

  function quip(bid) {
    if (bid === PRICE) return "Äntligen en seriös spekulant. Budet matchar priset exakt — vilket det gör i samtliga accepterade fall.";
    if (bid === 0) return "Noll kronor. Vi uppskattar ärligheten. Priset är 4 750 000 kr.";
    if (bid < 500000) return "Vi har valt att tolka ditt bud som humor. Marknaden skrattar inte. 4 750 000 kr.";
    if (bid < PRICE) return "Intressant bud. Vi har övervägt det noggrant i nej. Skillnad mot marknaden: " + fmt.format(PRICE - bid) + " kr.";
    return "Överbud accepteras inte — vi tar inte emot dricks. Priset är, som alltid, 4 750 000 kr.";
  }

  if (range) {
    range.addEventListener("input", function () {
      var bid = parseInt(range.value, 10);
      bidValue.textContent = fmt.format(bid) + " kr";
      bidResponse.textContent = quip(bid);
      bidResponse.classList.remove("bump");
      void bidResponse.offsetWidth;
      bidResponse.classList.add("bump");
    }, { passive: true });
  }

  /* ---------- price counter ---------- */

  var counter = document.getElementById("priceCounter");
  if (counter) {
    var target = parseInt(counter.getAttribute("data-target"), 10);
    var counted = false;
    var cio = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || counted) return;
      counted = true;
      cio.disconnect();
      if (reduced) { counter.textContent = fmt.format(target); return; }
      var t0 = performance.now(), dur = 1800;
      (function tick(now) {
        var t = clamp01((now - t0) / dur);
        var e = 1 - Math.pow(1 - t, 3);
        counter.textContent = fmt.format(Math.round(target * e));
        if (t < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.4 });
    cio.observe(counter);
  }

  /* ---------- intresseanmälan + burst ---------- */

  var applyBtn = document.getElementById("applyBtn");
  var applyResult = document.getElementById("applyResult");
  var burst = document.getElementById("burst");

  if (applyBtn) {
    applyBtn.addEventListener("click", function () {
      var ref = "NPMB-" + Math.floor(10000 + Math.random() * 90000);
      applyResult.textContent = "Tack. Din intresseanmälan (ref. " + ref + ") har registrerats i minnet på den här sidan, och ingenstans annars. Genomsnittlig svarstid: 6–8 månader.";
      applyResult.hidden = false;
      applyBtn.setAttribute("disabled", "true");
      applyBtn.textContent = "Anmälan mottagen";

      if (reduced || !burst.animate) return;
      for (var i = 0; i < 42; i++) {
        var p = document.createElement("i");
        burst.appendChild(p);
        var ang = Math.random() * Math.PI * 2;
        var dist = 90 + Math.random() * 240;
        var dx = Math.cos(ang) * dist;
        var dy = Math.sin(ang) * dist - 120;
        p.animate([
          { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
          { transform: "translate(" + dx + "px," + dy + "px) rotate(" + (Math.random() * 720 - 360) + "deg)", opacity: 0 }
        ], {
          duration: 900 + Math.random() * 700,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards"
        }).onfinish = function () { this.effect.target.remove(); };
      }
    });
  }

  /* ---------- measure + go ---------- */

  function remeasure() {
    sizeProcess();
    measure();
    docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    lastY = -1; // force scrub refresh
  }

  window.addEventListener("resize", remeasure);
  window.addEventListener("load", remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  remeasure();
  requestAnimationFrame(frame);
})();
