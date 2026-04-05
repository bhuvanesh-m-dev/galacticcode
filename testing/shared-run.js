/* ═══════════════════════════════════════════════════
   shared-run.js
   Standalone Python runner for GalacticCode "Share as Run"
   Pure client code execution — zero branding.
   Loaded by the generated shared-run page.
═══════════════════════════════════════════════════ */

(async function () {
  "use strict";

  /* ── DOM refs ── */
  const elOut     = document.getElementById("run-output");
  const elLoader  = document.getElementById("run-loader");
  const elTimer   = document.getElementById("run-timer");
  const elStatus  = document.getElementById("run-status");

  /* ── Read encoded code from URL or injected global ── */
  const params  = new URLSearchParams(location.search);
  let encoded = params.get("code");
  
  // Fallback for injected code (for blob URLs)
  if (!encoded && window._sharedRunCode) {
    encoded = window._sharedRunCode;
  }

  if (!encoded) {
    setStatus("error");
    write("Error: No code found in URL.\nUsage: ?code=<base64-encoded-python>", true);
    hideLoader();
    return;
  }

  let code;
  try {
    code = decodeURIComponent(escape(atob(encoded)));
  } catch (e) {
    setStatus("error");
    write("Error: Could not decode the shared code. The URL may be malformed.", true);
    hideLoader();
    return;
  }

  /* ── Live elapsed timer while loading ── */
  const loadStart = performance.now();
  const timerInterval = setInterval(() => {
    if (elTimer) elTimer.textContent = `(${((performance.now() - loadStart) / 1000).toFixed(1)}s)`;
  }, 100);

  /* ── Output helpers ── */
  function write(text, isErr) {
    const span = document.createElement("span");
    if (isErr) span.className = "err";
    span.textContent = text;
    if (elOut) elOut.appendChild(span);
    if (elOut) elOut.scrollTop = elOut.scrollHeight;
  }

  function hideLoader() {
    if (elLoader) elLoader.style.display = "none";
  }

  function setStatus(state) {
    if (!elStatus) return;
    elStatus.className = "run-badge " + state;
    const labels = { loading: "Loading…", running: "Running…", done: "Done", error: "Error" };
    elStatus.textContent = labels[state] || state;
  }

  /* ── Wait for Pyodide to be available ── */
  function waitForPyodide() {
    return new Promise((resolve) => {
      if (window.loadPyodide) {
        resolve(window.loadPyodide);
      } else {
        const checkInterval = setInterval(() => {
          if (window.loadPyodide) {
            clearInterval(checkInterval);
            resolve(window.loadPyodide);
          }
        }, 100);
      }
    });
  }

  /* ── Load Pyodide ── */
  try {
    setStatus("loading");

    const loadPyodideFn = await waitForPyodide();
    
    const py = await loadPyodideFn({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/",
      stdout: t => write(t, false),
      stderr: t => write(t, true),
    });

    /* Redirect Python stdout/stderr through JS callbacks */
    py.runPython(`
import sys
import builtins

class _Out:
    def write(self, s):
        if s:
            import js
            js._pyWrite(s, False)
    def flush(self): pass

class _Err:
    def write(self, s):
        if s:
            import js
            js._pyWrite(s, True)
    def flush(self): pass

sys.stdout = _Out()
sys.stderr = _Err()

def _shared_input(prompt_text=""):
    if prompt_text:
        import js
        js._pyWrite(str(prompt_text), False)
    import js
    val = js.prompt(prompt_text)
    if val is None:
        raise KeyboardInterrupt("Input cancelled")
    js._pyWrite(val + "\\n", False)
    return val

builtins.input = _shared_input
`);

    window._pyWrite = (text, isErr) => write(text, isErr);

    /* Pre-load CosmoTalker */
    await py.loadPackage("micropip");
    await py.runPythonAsync(`
import micropip
await micropip.install(["cosmodb", "cosmotalker"])

import sys
import types

sys.modules['tkinter'] = types.ModuleType('tkinter')
sys.modules['tkinter.messagebox'] = types.ModuleType('tkinter.messagebox')
sys.modules['tkinter.ttk'] = types.ModuleType('tkinter.ttk')
sys.modules['customtkinter'] = types.ModuleType('customtkinter')

import cosmotalker
class DummyImg:
    def __call__(self, *args, **kwargs):
        print("⚠️  Image preview is not available in GalacticCode (browser limitation).")

if hasattr(cosmotalker, 'img'):
    cosmotalker.img = DummyImg()
`);

    /* Stop load timer, start run */
    clearInterval(timerInterval);
    const loadElapsed = ((performance.now() - loadStart) / 1000).toFixed(2);
    if (elTimer) elTimer.textContent = `(loaded in ${loadElapsed}s)`;

    hideLoader();
    setStatus("running");

    const runStart = performance.now();

    await py.runPythonAsync(code);

    const runElapsed = ((performance.now() - runStart) / 1000).toFixed(3);
    setStatus("done");

    /* Subtle done indicator */
    const done = document.createElement("span");
    done.className = "done-line";
    done.textContent = `\n[finished in ${runElapsed}s]`;
    if (elOut) elOut.appendChild(done);

  } catch (err) {
    clearInterval(timerInterval);
    hideLoader();
    setStatus("error");
    write("\n" + (err.message || String(err)), true);
  }
})();