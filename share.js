/* ═══════════════════════════════════════════════════
   GalacticCode by Py-Run — Code the Cosmos
   share.js  |  Share as Code + Share as Run
   https://github.com/bhuvanesh-m-dev/cosmotools
═══════════════════════════════════════════════════ */

"use strict";

/* ════════════════════════════════════════════════
   SHARE DROPDOWN TOGGLE
════════════════════════════════════════════════ */

function toggleShareDropdown(e) {
  e.stopPropagation();
  const wrapper = document.getElementById("share-wrapper");
  if (wrapper) wrapper.classList.toggle("open");
}

function closeShareDropdown() {
  const wrapper = document.getElementById("share-wrapper");
  if (wrapper) wrapper.classList.remove("open");
}

/* ════════════════════════════════════════════════
   ENCODE / DECODE HELPERS
════════════════════════════════════════════════ */

function encodeCode(code) {
  return btoa(unescape(encodeURIComponent(code)));
}

function decodeCode(encoded) {
  return decodeURIComponent(escape(atob(encoded)));
}

/* ════════════════════════════════════════════════
   SHARE AS CODE
   ─────────────────────────────────────────────
   Encodes the user's code as base64 and appends
   it to the current GalacticCode URL as ?code=...
   When the recipient opens the link in GalacticCode,
   the code is decoded and loaded directly into
   the editor — ready to edit and run.
════════════════════════════════════════════════ */

async function shareAsCode(getCode, showToast) {
  closeShareDropdown();

  const code    = getCode();
  const encoded = encodeCode(code);
  const url     = `${location.origin}${location.pathname}?code=${encoded}`;

  try {
    await navigator.clipboard.writeText(url);
    showToast("🔗 Share-as-Code URL copied! Opens in GalacticCode.");
  } catch {
    prompt("Copy this URL (opens in GalacticCode):", url);
  }
}

/* ════════════════════════════════════════════════
   SHARE AS RUN
   ─────────────────────────────────────────────
   Builds a minimal, self-contained HTML page that:
     • Loads Pyodide from CDN
     • Loads shared-run.js (the standalone runner)
     • Passes the encoded code via URL ?code=...
     • Executes the code immediately on page load
     • Shows ONLY the user's output — zero branding

   The generated page is intentionally plain.
   It is the client's code and output, nothing else.
════════════════════════════════════════════════ */

function shareAsRun(getCode, showToast) {
  closeShareDropdown();

  const code    = getCode();
  const encoded = encodeCode(code);

  /*
   * Generate run.html — a standalone, branding-free page.
   * It reads ?code= from its own URL and passes it to shared-run.js.
   */
  const runPage = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Python Output</title>
<style>
/* ── Pure output page — no branding ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #0b0c11;
  color: #d4e0f0;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 14px;
  line-height: 1.75;
  padding: 28px 32px;
  min-height: 100vh;
}

#run-loader {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #4b5a6b;
  font-size: 12px;
  margin-bottom: 16px;
}

.loader-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0%, #38bdf8 40%, #c084fc 80%, transparent 100%);
  flex-shrink: 0;
  animation: spin-galaxy 1s linear infinite;
  position: relative;
}

.loader-dot::after {
  content: '';
  position: absolute;
  inset: 2px;
  background: #0b0c11;
  border-radius: 50%;
}

@keyframes spin-galaxy {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

#run-status {
  position: fixed;
  top: 12px;
  right: 16px;
  font-size: 10px;
  padding: 3px 9px;
  border-radius: 20px;
  font-family: monospace;
  display: block;
}

#run-status.loading { background: #1e3a4a; color: #38bdf8; border: 1px solid #2a5570; }
#run-status.running { background: #1a2f1a; color: #4ade80; border: 1px solid #2a5040; }
#run-status.done    { background: #0f2a1a; color: #34d399; border: 1px solid #205040; }
#run-status.error   { background: #2a1010; color: #f87171; border: 1px solid #5a2020; }

#run-output {
  white-space: pre-wrap;
  word-break: break-all;
}

.err       { color: #f87171; }
.done-line { color: #334155; font-size: 11px; margin-top: 8px; display: block; }
</style>
</head>
<body>

<span id="run-status" class="run-badge loading">Loading…</span>

<div id="run-loader">
  <span class="loader-dot"></span>
  <span>Loading GalacticCode… </span>
  <span id="run-timer"></span>
</div>

<pre id="run-output"></pre>

<script>
  // Store encoded code for shared-run.js to access
  window._sharedRunCode = ${JSON.stringify(encoded)};
<\/script>

<script src="https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js"><\/script>
<script src="shared-run.js"><\/script>

</body>
</html>`;

  const blob = new Blob([runPage], { type: "text/html" });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
  showToast("▶ Share-as-Run opened — pure output, zero branding.");
}

/* ════════════════════════════════════════════════
   INIT — wire up DOM buttons
   Called from script.js after DOM is ready
════════════════════════════════════════════════ */

function initShareUI(getCodeFn, showToastFn) {
  const btnToggle = document.getElementById("btn-share-toggle");
  const btnCode   = document.getElementById("btn-share-code");
  const btnRun    = document.getElementById("btn-share-run");
  const wrapper   = document.getElementById("share-wrapper");

  if (btnToggle) btnToggle.addEventListener("click", toggleShareDropdown);
  if (btnCode)   btnCode.addEventListener("click",   () => shareAsCode(getCodeFn, showToastFn));
  if (btnRun)    btnRun.addEventListener("click",    () => shareAsRun(getCodeFn, showToastFn));

  /* Close on outside click */
  document.addEventListener("click", e => {
    if (wrapper && !wrapper.contains(e.target)) closeShareDropdown();
  });

  /* Close on Escape */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeShareDropdown();
  });
}