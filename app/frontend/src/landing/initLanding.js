// Auto-extracted landing animations/interactions. Call once after mount.
export function initLanding() {

  /* ---------- scroll reveal ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- live audit trace: stream rows, then flash violations ---------- */
  var termBody = document.getElementById("termBody");
  var rows = termBody ? Array.prototype.slice.call(termBody.querySelectorAll("[data-step]")) : [];
  var vios = Array.prototype.slice.call(document.querySelectorAll("[data-vio]"));

  function runTrace() {
    rows.forEach(function (r) { r.classList.remove("show"); });
    vios.forEach(function (v) { v.classList.remove("show", "flash"); });
    var d = 250;
    rows.forEach(function (r, i) {
      setTimeout(function () { r.classList.add("show"); }, d + i * 620);
    });
    var after = d + rows.length * 620 + 200;
    vios.forEach(function (v, i) {
      setTimeout(function () {
        v.classList.add("show");
        setTimeout(function () { v.classList.add("flash"); }, 60);
      }, after + i * 480);
    });
  }

  var traceStarted = false;
  var traceIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !traceStarted) { traceStarted = true; runTrace(); }
    });
  }, { threshold: 0.3 });
  var term = document.querySelector(".terminal-wrap");
  if (term) traceIO.observe(term);

  /* ---------- hero visuals: cursor-tracked rotation per active scene ---------- */
  var stage = document.getElementById("cubeStage");
  if (stage) {
    var px = 0, py = 0;                            // normalized cursor (-1 … 1)
    var cxRaw = 0, cyRaw = 0, hasMoved = false;    // raw cursor (px)
    window.addEventListener("pointermove", function (e) {
      px = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      py = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      cxRaw = e.clientX; cyRaw = e.clientY; hasMoved = true;
    }, { passive: true });

    var yaw = 0, spin = 42, auto = true;
    var sx = 0, sy = 0;                            // smoothed cursor lean
    var mp = 0, myaw = 0;                          // morph: smoothed proximity + directional yaw
    var vRotX = -28, vRotY = -36, vVelX = 0, vVelY = 0, vDragging = false; // voxel orbit
    var last = performance.now();

    function frame(now) {
      if (!document.getElementById("cubeStage")) return;  // self-terminate on unmount
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (auto) yaw = (yaw + spin * dt) % 360;
      sx += (px - sx) * 0.07;
      sy += (py - sy) * 0.07;

      var rotor = stage.querySelector(".viz.active .rotor");
      if (rotor) {
        if (rotor.classList.contains("voxel")) {
          if (!vDragging) {
            vRotX += vVelX; vRotY += vVelY;
            vVelX *= 0.94; vVelY *= 0.94;          // inertia / friction
            if (auto) vRotY += spin * 0.12 * dt;   // slight constant auto-spin (scaled by Cube spin)
          }
          vRotX = Math.max(-88, Math.min(88, vRotX));
          // add cursor-direction lean on top of drag / inertia / auto-spin
          var vLeanX = vRotX + (-sy * 12);
          var vLeanY = vRotY + (sx * 18);
          rotor.style.transform = "rotateX(" + vLeanX.toFixed(2) + "deg) rotateY(" + vLeanY.toFixed(2) + "deg)";
        } else if (rotor.classList.contains("morph")) {
          if (!hasMoved) {
            // visible, gently turning, mostly-dark box before any interaction
            myaw += 9 * dt;
            rotor.style.setProperty("--p", "0.12");
            rotor.style.transform = "rotateX(-18deg) rotateY(" + myaw.toFixed(2) + "deg)";
          } else {
          // proximity: closer cursor → more glass / more exploded
          var r = stage.getBoundingClientRect();
          var bcx = r.left + r.width / 2, bcy = r.top + r.height / 2;
          var dx = cxRaw - bcx, dy = cyRaw - bcy;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var tp = Math.max(0, Math.min(1, 1 - dist / 540));
          mp += (tp - mp) * 0.08;
          rotor.style.setProperty("--p", (0.12 + mp * 0.88).toFixed(3));
          // idle drift + cursor-side steering (left = anticlockwise, right = clockwise)
          var hdx = Math.max(-1, Math.min(1, dx / (r.width * 0.9)));
          myaw += (9 + hdx * spin) * dt;
          rotor.style.transform =
            "rotateX(" + (-18 + -sy * 16).toFixed(2) + "deg) " +
            "rotateY(" + myaw.toFixed(2) + "deg)";
          }
        } else {
          var bx = parseFloat(rotor.dataset.basex || "0");
          var by = parseFloat(rotor.dataset.basey || "0");
          if (rotor.dataset.mode === "spin") {
            rotor.style.transform =
              "rotateX(" + (bx + -sy * 22).toFixed(2) + "deg) " +
              "rotateY(" + (yaw + sx * 34).toFixed(2) + "deg)";
          } else {
            var sway = Math.sin(now / 2400) * 4;
            rotor.style.transform =
              "rotateX(" + (bx + -sy * 16).toFixed(2) + "deg) " +
              "rotateY(" + (by + sway + sx * 26).toFixed(2) + "deg)";
          }
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    /* ---- build & wire the cube-of-cubes scene ---- */
    var voxel = document.getElementById("voxel");
    var voxelTip = document.getElementById("voxelTip");
    if (voxel) {
      var LABELS = [
        "llm.call · plan", "retrieve_docs", "format_prompt", "get_credit_score",
        "tool.parse", "validate_input", "policy.lookup", "rank_options",
        "compose_reply", "log.write", "score.normalize", "fetch_market",
        "risk.assess", "tool.call", "summarize", "cache.read",
        "embed_query", "guardrail.check", "rate_limit", "audit.tag",
        "redact_scan", "context.build", "tool.result", "finalize"
      ];
      // coords that carry the two real violations
      var flagged = { "1,-1,1": "send_email · PII · BSN leaked ⚠", "0,1,-1": "decision · DTI rationale missing ⚠" };
      var li = 0;
      var cells = [];
      for (var x = -1; x <= 1; x++) {
        for (var y = -1; y <= 1; y++) {
          for (var z = -1; z <= 1; z++) {
            var cell = document.createElement("div");
            cell.className = "cell";
            cell.style.setProperty("--x", x);
            cell.style.setProperty("--y", y);
            cell.style.setProperty("--z", z);
            // spatial intensity gradient + distance from core (for the ripple)
            var inten = ((x + 1) * 9 + (y + 1) * 3 + (z + 1)) / 26;
            var dist = Math.sqrt(x * x + y * y + z * z);
            cell.style.setProperty("--i", inten.toFixed(3));
            cell.style.setProperty("--d", dist.toFixed(3));
            var key = x + "," + y + "," + z;
            if (flagged[key]) {
              cell.classList.add("flag");
              cell.dataset.label = flagged[key];
              cell.dataset.flag = "1";
            } else if (x === 0 && y === 0 && z === 0) {
              cell.classList.add("hot");
              cell.dataset.label = "decision · core";
            } else {
              cell.classList.add("rip");
              cell.dataset.label = LABELS[li % LABELS.length]; li++;
            }
            cell.innerHTML =
              '<div class="cf f"></div><div class="cf bk"></div><div class="cf r"></div>' +
              '<div class="cf l"></div><div class="cf u"></div><div class="cf d"></div>';
            voxel.appendChild(cell);
            cells.push({ el: cell, x: x, y: y, z: z });
          }
        }
      }

      var vExploded = false;
      function applyExplode() {
        var sp = vExploded ? 128 : 66;
        cells.forEach(function (c) {
          c.el.style.transform = "translate3d(" + (c.x * sp) + "px," + (c.y * sp) + "px," + (c.z * sp) + "px)";
        });
      }

      var vViz = stage.querySelector(".viz-voxel");
      var downX = 0, downY = 0, lastX = 0, lastY = 0, moved = false;
      function hideTip() { voxelTip.classList.remove("show"); }

      stage.addEventListener("pointerdown", function (e) {
        if (!vViz.classList.contains("active")) return;
        vDragging = true; moved = false;
        downX = lastX = e.clientX; downY = lastY = e.clientY;
        vVelX = vVelY = 0;
        vViz.classList.add("dragging");
        hideTip();
      });
      window.addEventListener("pointermove", function (e) {
        if (!vDragging) return;
        var dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 4) moved = true;
        vRotY += dx * 0.5;
        vRotX -= dy * 0.5;
        vVelY = dx * 0.5;
        vVelX = -dy * 0.5;
      });
      window.addEventListener("pointerup", function () {
        if (!vDragging) return;
        vDragging = false;
        vViz.classList.remove("dragging");
        if (!moved) { vExploded = !vExploded; applyExplode(); }   // a click (not a drag) explodes/reassembles
      });

      // hover tooltip (only when not dragging)
      stage.addEventListener("pointermove", function (e) {
        if (!vViz.classList.contains("active") || vDragging) { hideTip(); return; }
        var cell = e.target.closest && e.target.closest(".cell");
        if (cell) {
          var r = stage.getBoundingClientRect();
          voxelTip.textContent = cell.dataset.label;
          voxelTip.classList.toggle("flag", cell.dataset.flag === "1");
          voxelTip.style.left = (e.clientX - r.left) + "px";
          voxelTip.style.top = (e.clientY - r.top) + "px";
          voxelTip.classList.add("show");
        } else {
          hideTip();
        }
      });
      stage.addEventListener("pointerleave", hideTip);
    }

    window.GlassBoxCube = {
      setSpin: function (v) { spin = v; },
      setAuto: function (b) { auto = !!b; },
      setViz: function (name) {
        var layers = stage.querySelectorAll(".viz");
        Array.prototype.forEach.call(layers, function (el) {
          el.classList.toggle("active", el.getAttribute("data-viz") === name);
        });
      }
    };
  }

  /* ---------- copy buttons ---------- */
  function wireCopy(btn, text, labelEl) {
    if (!btn) return;
    btn.addEventListener("click", function () {
      navigator.clipboard && navigator.clipboard.writeText(text).then(function () {
        btn.classList.add("copied");
        var prev = labelEl ? labelEl.textContent : null;
        if (labelEl) labelEl.textContent = "Copied";
        setTimeout(function () {
          btn.classList.remove("copied");
          if (labelEl) labelEl.textContent = prev;
        }, 1600);
      });
    });
  }

  var codeBtn = document.getElementById("copyCode");
  var codeText = document.getElementById("codeBlock");
  wireCopy(codeBtn, codeText ? codeText.innerText : "", codeBtn ? codeBtn.querySelector(".ct") : null);

  var heroBtn = document.getElementById("hero-copy");
  if (heroBtn) {
    heroBtn.addEventListener("click", function () {
      navigator.clipboard && navigator.clipboard.writeText("pip install glassbox-fin");
      var orig = heroBtn.innerHTML;
      heroBtn.innerHTML = "<span class='dollar'>✓</span> Copied to clipboard";
      setTimeout(function () { heroBtn.innerHTML = orig; }, 1600);
    });
  }

  /* ---------- how-it-works: pipeline stepper + demos ---------- */
  var pipe = document.getElementById("pipeline");
  if (pipe) {
    var steps = Array.prototype.slice.call(pipe.querySelectorAll(".card.step"));
    var panes = Array.prototype.slice.call(document.querySelectorAll(".demo-pane"));
    var demoTitle = document.getElementById("demoTitle");
    var TITLES = [
      "<b>interception</b> · any framework, one wrapper",
      "<b>enforcement</b> · guardrails fire at the call boundary",
      "<b>rule engine</b> · toggle checks, watch what's caught",
      "<b>lineage</b> · raw trace becomes a readable record"
    ];
    var hidx = 0, htimer = null, HAUTO = 5200;

    function hGo(i) {
      hidx = i;
      steps.forEach(function (s, k) { s.classList.toggle("active", k === i); });
      panes.forEach(function (p, k) { p.classList.toggle("active", k === i); });
      if (demoTitle) demoTitle.innerHTML = TITLES[i];
    }
    function hNext() { hGo((hidx + 1) % steps.length); }
    function hStart() { hStop(); htimer = setInterval(hNext, HAUTO); }
    function hStop() { if (htimer) { clearInterval(htimer); htimer = null; } }

    steps.forEach(function (s, k) {
      s.addEventListener("click", function () { hGo(k); hStart(); });
      s.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hGo(k); hStart(); }
      });
    });
    var howSection = document.getElementById("how");
    if (howSection) {
      howSection.addEventListener("mouseenter", hStop);
      howSection.addEventListener("mouseleave", hStart);
    }
    var hStarted = false;
    var hIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !hStarted) { hStarted = true; hStart(); } });
    }, { threshold: 0.25 });
    hIO.observe(pipe);
    hGo(0);

    /* ENFORCE · per-severity guardrail policy at the call boundary */
    Array.prototype.forEach.call(document.querySelectorAll(".enforce-grid .seg.sm"), function (seg) {
      Array.prototype.forEach.call(seg.querySelectorAll(".seg-opt"), function (opt) {
        opt.addEventListener("click", function () {
          Array.prototype.forEach.call(seg.querySelectorAll(".seg-opt"), function (o) { o.classList.remove("active"); });
          opt.classList.add("active");
        });
      });
    });
    var enfRun = document.getElementById("enfRun");
    var enfResult = document.getElementById("enfResult");
    function critPolicy() {
      var a = document.querySelector('.seg.sm[data-pol="critical"] .seg-opt.active');
      return a ? a.dataset.act : "pause";
    }
    function enfSet(cls, html) { enfResult.className = "bnd-result show " + cls; enfResult.innerHTML = html; }
    if (enfRun && enfResult) {
      enfRun.addEventListener("click", function () {
        var p = critPolicy();
        if (p === "block") {
          enfSet("block", "\u26d4 <b>Blocked at the boundary.</b> send_email never executed \u2014 recorded as PII_IN_TOOL_ARGS.");
        } else if (p === "log") {
          enfSet("log", "\u26a0 <b>Logged &amp; continued.</b> The call ran; the violation is flagged in the trail for review.");
        } else {
          enfSet("pause", "\u23f8 <b>Paused \u2014 awaiting approver.</b> The tool is held at the boundary.<div class=\"appr\"><button class=\"yes\">Approve</button><button class=\"no\">Deny</button></div>");
          var yes = enfResult.querySelector(".yes"), no = enfResult.querySelector(".no");
          if (yes) yes.addEventListener("click", function () { enfSet("ok", "\u2713 <b>Approved.</b> Executed with sign-off recorded against loan_decision_42."); });
          if (no) no.addEventListener("click", function () { enfSet("block", "\u26d4 <b>Denied.</b> Call blocked by the approver \u2014 the violation never happened."); });
        }
      });
    }

    /* nav \u201cGuardrails\u201d jumps to the enforce step */
    var gnav = document.querySelector('a[href="#guardrails"]');
    if (gnav) gnav.addEventListener("click", function () { hGo(1); hStart(); });

    /* INTERCEPT · framework switcher */
    var FW = {
      langchain: "audit.wrap(agent_executor)",
      llamaindex: "audit.wrap(query_engine)",
      raw: "with audit.trace():\n    client.chat(messages)"
    };
    var fwCode = document.getElementById("fwCode");
    Array.prototype.forEach.call(document.querySelectorAll("#fwSeg .seg-opt"), function (opt) {
      opt.addEventListener("click", function () {
        Array.prototype.forEach.call(document.querySelectorAll("#fwSeg .seg-opt"), function (o) { o.classList.remove("active"); });
        opt.classList.add("active");
        if (fwCode) fwCode.textContent = FW[opt.dataset.fw];
      });
    });

    /* CHECK · rule toggles re-score the sample trace */
    var RULE_HITS = { pii: "s2", dti: "s4", jur: "s1", thr: "s3" };
    var RULE_NAME = { pii: "PII", dti: "DTI", jur: "JURISDICTION", thr: "THRESHOLD" };
    var togs = Array.prototype.slice.call(document.querySelectorAll("#checkTogs .tog"));
    var vCount = document.getElementById("vCount");
    var vClause = document.getElementById("vClause");
    function recheck() {
      var flagged = {};
      togs.forEach(function (t) {
        if (t.classList.contains("on")) flagged[RULE_HITS[t.dataset.rule]] = RULE_NAME[t.dataset.rule];
      });
      var count = 0;
      Array.prototype.forEach.call(document.querySelectorAll("#checkTrace .vrow"), function (row) {
        var hit = flagged[row.dataset.s];
        var vs = row.querySelector(".vs");
        if (hit) { row.classList.add("bad"); vs.className = "vs fail"; vs.textContent = "✗ " + hit; count++; }
        else { row.classList.remove("bad"); vs.className = "vs pass"; vs.textContent = "✓ clean"; }
      });
      if (vCount) vCount.textContent = count;
      if (vClause) vClause.textContent = count === 1 ? "violation caught" : "violations caught";
    }
    togs.forEach(function (t) {
      function flip() {
        t.classList.toggle("on");
        t.setAttribute("aria-checked", t.classList.contains("on") ? "true" : "false");
        recheck();
      }
      t.addEventListener("click", flip);
      t.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
    });
    recheck();

    /* EXPLAIN · raw ⇄ narrative + export */
    var exRaw = document.getElementById("exRaw");
    var exNarr = document.getElementById("exNarr");
    Array.prototype.forEach.call(document.querySelectorAll("#exSeg .seg-opt"), function (opt) {
      opt.addEventListener("click", function () {
        Array.prototype.forEach.call(document.querySelectorAll("#exSeg .seg-opt"), function (o) { o.classList.remove("active"); });
        opt.classList.add("active");
        var narr = opt.dataset.view === "narr";
        if (exRaw) exRaw.style.display = narr ? "none" : "block";
        if (exNarr) exNarr.style.display = narr ? "block" : "none";
      });
    });
    var pdfBtn = document.getElementById("pdfBtn");
    if (pdfBtn) {
      var pt = pdfBtn.querySelector(".pt");
      pdfBtn.addEventListener("click", function () {
        if (pdfBtn.classList.contains("gen")) return;
        pdfBtn.classList.add("gen");
        var orig = pt.textContent;
        pt.textContent = "generating…";
        setTimeout(function () {
          pt.textContent = "compliance.pdf ✓";
          setTimeout(function () { pt.textContent = orig; pdfBtn.classList.remove("gen"); }, 1500);
        }, 850);
      });
    }
  }

  /* ---------- rules: filter · search · expand ---------- */
  var rulesGrid = document.getElementById("rulesGrid");
  if (rulesGrid) {
    var ruleRows = Array.prototype.slice.call(rulesGrid.querySelectorAll(".rule-row"));
    var sevFilters = Array.prototype.slice.call(document.querySelectorAll("#sevFilters .filter-pill"));
    var ruleSearch = document.getElementById("ruleSearch");
    var ruleCount = document.getElementById("ruleCount");
    var rulesEmpty = document.getElementById("rulesEmpty");
    var curSev = "all";

    function applyRules() {
      var q = (ruleSearch && ruleSearch.value || "").trim().toLowerCase();
      var shown = 0;
      ruleRows.forEach(function (row) {
        var okSev = curSev === "all" || row.dataset.sev === curSev;
        var okQ = !q || row.dataset.name.toLowerCase().indexOf(q) !== -1;
        var show = okSev && okQ;
        row.classList.toggle("hidden", !show);
        if (!show) row.classList.remove("open");
        if (show) shown++;
      });
      if (ruleCount) ruleCount.innerHTML = "<b>" + shown + "</b> of " + ruleRows.length + " rules";
      if (rulesEmpty) rulesEmpty.classList.toggle("show", shown === 0);
    }

    ruleRows.forEach(function (row) {
      row.addEventListener("click", function (e) {
        if (e.target.closest(".rule-detail")) return;
        row.classList.toggle("open");
      });
    });
    sevFilters.forEach(function (pill) {
      pill.addEventListener("click", function () {
        sevFilters.forEach(function (p) { p.classList.remove("active"); });
        pill.classList.add("active");
        curSev = pill.dataset.sev;
        applyRules();
      });
    });
    if (ruleSearch) ruleSearch.addEventListener("input", applyRules);
    applyRules();
  }

}
