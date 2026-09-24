/* =========================================================
   MAC — Boot / Mission Loader
   Include right after <body>. Self-injects HUD markup.
   ========================================================= */
(function () {
  "use strict";

  var STORAGE_KEY = "mac-boot-seen";
  var MIN_MS = 2000;
  var MAX_MS = 2000;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Once per browser session — skip on subsequent page navigations
     Force again with ?boot=1 */
  var forceBoot = /[?&]boot=1(?:&|$)/.test(location.search);
  try {
    if (!forceBoot && sessionStorage.getItem(STORAGE_KEY) === "1") {
      document.documentElement.classList.add("boot-ready");
      return;
    }
  } catch (e) { /* private mode */ }

  if (reduceMotion) {
    MIN_MS = 500;
    MAX_MS = 500;
  }

  document.documentElement.classList.add("booting");

  var statuses = [
    "Establishing secure channel…",
    "Calibrating radar array…",
    "Loading operator assets…",
    "Syncing mission intel…",
    "Warming up combat systems…",
    "Verifying unit credentials…",
    "All systems green — deploying"
  ];

  var logLines = [
    { t: "BOOTSEQ  v2.4.1 initiated", c: "" },
    { t: "AUTH     handshake OK", c: "ok" },
    { t: "NET      encrypted tunnel up", c: "ok" },
    { t: "ASSETS   packing textures", c: "warn" },
    { t: "RADAR    sweep online", c: "ok" },
    { t: "HUD      viewport locked", c: "ok" },
    { t: "MISSION  ready for deploy", c: "ok" }
  ];

  var markup =
    '<div class="boot-scan" aria-hidden="true"></div>' +
    '<div class="boot-frame" role="status" aria-live="polite">' +
    '  <div class="boot-corners" aria-hidden="true"><span class="tr"></span><span class="bl"></span></div>' +
    '  <div class="boot-brand">' +
    '    <div class="boot-mark">' +
    '      <svg viewBox="0 0 24 24" fill="none" stroke="#0a0c08" stroke-width="2"><circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>' +
    "    </div>" +
    '    <span class="boot-name">MAC</span>' +
    "  </div>" +
    '  <div class="boot-tagline"><span class="live">●</span> Digital Command · Boot Sequence</div>' +
    '  <div class="boot-radar" aria-hidden="true">' +
    '    <div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div>' +
    '    <div class="cross"></div><div class="sweep"></div><div class="core"></div>' +
    '    <span class="pip p1"></span><span class="pip p2"></span><span class="pip p3"></span>' +
    "  </div>" +
    '  <div class="boot-status" id="bootStatus">' +
    statuses[0] +
    "</div>" +
    '  <div class="boot-progress">' +
    '    <div class="boot-progress-meta"><span>Load Progress</span><span class="boot-pct" id="bootPct">0%</span></div>' +
    '    <div class="boot-track"><div class="boot-fill" id="bootFill"></div></div>' +
    '    <div class="boot-ticks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
    "  </div>" +
    '  <div class="boot-log" id="bootLog" aria-hidden="true"></div>' +
    '  <div class="boot-footer"><span class="blink">▌</span> Stand by for deployment</div>' +
    "</div>";

  var root = document.createElement("div");
  root.id = "boot-loader";
  root.className = "boot-loader";
  root.setAttribute("aria-busy", "true");
  root.setAttribute("aria-label", "Loading MAC command interface");
  root.innerHTML = markup;

  function mount() {
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", mount, { once: true });
      return;
    }
    document.body.insertBefore(root, document.body.firstChild);
    run();
  }

  function run() {
    var fill = document.getElementById("bootFill");
    var pctEl = document.getElementById("bootPct");
    var statusEl = document.getElementById("bootStatus");
    var logEl = document.getElementById("bootLog");

    var started = performance.now();
    var progress = 0;
    var statusIdx = 0;
    var logIdx = 0;
    var pageLoaded = document.readyState === "complete";
    var finished = false;

    window.addEventListener("load", function () {
      pageLoaded = true;
    });

    function pushLog() {
      if (!logEl || logIdx >= logLines.length) return;
      var item = logLines[logIdx++];
      var line = document.createElement("span");
      line.className = "line";
      line.innerHTML =
        "> " +
        item.t.replace(
          /^(\S+)\s+/,
          '<span class="' + (item.c || "") + '">$1</span> '
        );
      logEl.appendChild(line);
      while (logEl.children.length > 4) logEl.removeChild(logEl.firstChild);
    }

    pushLog();

    var logTimer = window.setInterval(function () {
      pushLog();
      if (logIdx >= logLines.length) window.clearInterval(logTimer);
    }, reduceMotion ? 80 : 260);

    function setStatus(i) {
      if (!statusEl || i === statusIdx) return;
      statusIdx = i;
      if (reduceMotion) {
        statusEl.textContent = statuses[i];
        return;
      }
      statusEl.classList.add("is-switching");
      window.setTimeout(function () {
        statusEl.textContent = statuses[i];
        statusEl.classList.remove("is-switching");
      }, 180);
    }

    function tick(now) {
      if (finished) return;

      var elapsed = now - started;
      /* Ease toward ~92% while waiting for load; finish to 100 after load + min time */
      var target;
      if (!pageLoaded) {
        target = Math.min(92, (elapsed / MAX_MS) * 92);
      } else {
        var afterLoad = Math.min(1, elapsed / MIN_MS);
        target = 92 + afterLoad * 8;
      }

      /* smooth catch-up */
      progress += (target - progress) * (reduceMotion ? 0.5 : 0.18);
      if (progress > 99.2 && pageLoaded && elapsed >= MIN_MS) progress = 100;

      var shown = Math.floor(progress);
      if (fill) fill.style.width = shown + "%";
      if (pctEl) pctEl.textContent = shown + "%";

      var si = Math.min(
        statuses.length - 1,
        Math.floor((shown / 100) * statuses.length)
      );
      setStatus(si);

      if (shown >= 100 && pageLoaded && elapsed >= MIN_MS) {
        finish();
        return;
      }
      requestAnimationFrame(tick);
    }

    function finish() {
      if (finished) return;
      finished = true;
      window.clearInterval(logTimer);

      if (fill) fill.style.width = "100%";
      if (pctEl) pctEl.textContent = "100%";
      setStatus(statuses.length - 1);

      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch (e) { /* ignore */ }

      root.setAttribute("aria-busy", "false");
      document.documentElement.classList.remove("booting");
      document.documentElement.classList.add("boot-ready");

      window.setTimeout(function () {
        root.classList.add("is-done");
        window.setTimeout(function () {
          if (root.parentNode) root.parentNode.removeChild(root);
        }, 500);
      }, reduceMotion ? 40 : 200);
    }

    requestAnimationFrame(tick);

    /* Safety cap — never stick forever */
    window.setTimeout(function () {
      pageLoaded = true;
      if (!finished) {
        progress = 100;
        finish();
      }
    }, MAX_MS + 200);
  }

  mount();
})();
