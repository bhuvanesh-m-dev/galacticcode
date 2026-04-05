/* ═══════════════════════════════════════════════════
   GalacticCode by Py-Run — Code the Cosmos
   script.js  |  Main application logic
   https://github.com/bhuvanesh-m-dev/cosmotools
═══════════════════════════════════════════════════ */

"use strict";

/* ── DEFAULT STARTER CODE ── */
const DEFAULT_CODE = `import cosmotalker as ct

print("✅ CosmoTalker imported successfully in GalacticCode!")

try:
    print(f"Version: {ct.__version__}")
except:
    pass

print("\\nTry these commands:")
print("ct.planet_info('Earth')")
print("ct.get_fun_fact()")
print("ct.search('black hole')")
`;

/* ── EDITOR ↔ THEME MAP ── */
const THEME_EDITOR_MAP = {
  "galactic-space": "dracula",
  "neon-night":  "material-darker",
  "forest-dusk": "nord",
  "candy-pop":   "solarized dark",
  "rose-gold":   "monokai",
  "mono-ink":    "solarized dark",
};

/* ── STATE ── */
let pyodide           = null;
let editor            = null;
let isRunning         = false;
let outputLineCount   = 0;
let startTime         = null;
let countdownInterval = null;
let loadStartTime     = null;

/* ── ELEMENT REFS ── */
const $ = id => document.getElementById(id);

const elStatus      = $("pyodide-status");
const elStatusText  = $("status-text");
const elStatusTimer = $("status-timer");
const elOutput      = $("output");
const elBtnRun      = $("btn-run");
const elBtnClear    = $("btn-clear-output");
const elBtnClearEd  = $("btn-clear-editor");
const elBtnUpload   = $("btn-upload");
const elFileUpload  = $("file-upload");
const elBtnDownload = $("btn-download");
const elBtnCopy     = $("btn-copy");
const elBtnCopyLink = $("btn-copy-link");
const elBtnFormat   = $("btn-format");
const elBtnInstall  = $("btn-install");
const elPkgInput    = $("pkg-input");
const elPkgStatus   = $("pkg-status");
const elColorTheme  = $("color-theme");
const elEditorTheme = $("editor-theme");
const elFontSize    = $("font-size");
const elExecTime    = $("exec-time");
const elOutputStats = $("output-stats");
const elToast       = $("toast");

/* ════════════════════════════════════════════════
   CODEMIRROR SYNTAX OVERLAY (CosmoTalker)
════════════════════════════════════════════════ */
CodeMirror.defineMode("cosmotalker-overlay", function() {
  return {
    token: function(stream) {
      if (stream.match(/\bcosmotalker\b/)) {
        return "cosmo-pkg"; // Appends .cm-cosmo-pkg class
      }
      if (stream.match(/\b(get|apod|celestrak|spacex|wiki|planet_info|feedback|search|img)(?=\s*\()/)) {
        return "cosmo-func"; // Appends .cm-cosmo-func class
      }
      stream.next();
      return null;
    }
  };
});

/* ════════════════════════════════════════════════
   CODEMIRROR AUTOCOMPLETE (CosmoTalker)
════════════════════════════════════════════════ */
function cosmoHint(editor) {
  const cursor = editor.getCursor();
  const token = editor.getTokenAt(cursor);
  const start = token.start;
  const end = cursor.ch;
  const word = token.string;

  if (!/^[a-zA-Z_]+$/.test(word)) return null;

  const keywords = [
    "cosmotalker", "apod", "celestrak", "spacex", "wiki",
    "planet_info", "feedback", "search", "get", "get_fun_fact", "img",
    "import", "print", "try", "except", "True", "False", "None",
    "def", "class", "if", "elif", "else", "for", "while", "return"
  ];

  const list = keywords.filter(k => k.startsWith(word) && k !== word);
  if (!list.length) return null;

  return {
    list: list,
    from: CodeMirror.Pos(cursor.line, start),
    to: CodeMirror.Pos(cursor.line, end)
  };
}

/* ════════════════════════════════════════════════
   CODEMIRROR SETUP
════════════════════════════════════════════════ */
function initEditor() {
  editor = CodeMirror($("code-editor"), {
    value: getSavedCode() || DEFAULT_CODE,
    mode: "python",
    theme: "dracula",
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    smartIndent: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
    autoRefresh: true,
    keyMap: "sublime",
    extraKeys: {
      "Ctrl-Enter": runCode,
      "Cmd-Enter":  runCode,
      "Ctrl-Space": "autocomplete",
      "Enter": "newlineAndIndent",
      "Tab": cm => {
        if (cm.somethingSelected()) cm.indentSelection("add");
        else cm.replaceSelection("    ", "end");
      },
    },
    hintOptions: { hint: cosmoHint },
    lineWrapping: false,
    gutters: ["CodeMirror-linenumbers"],
  });

  editor.addOverlay("cosmotalker-overlay");

  editor.on("change", () => {
    clearTimeout(editor._saveTimer);
    editor._saveTimer = setTimeout(saveCode, 1000);
  });

  // Auto-trigger hint on typing
  editor.on("inputRead", function(cm, change) {
    if (!cm.state.completionActive && /^[a-zA-Z_]$/.test(change.text[0])) {
      CodeMirror.commands.autocomplete(cm, null, { completeSingle: false });
    }
  });
}

/* ════════════════════════════════════════════════
   LIVE LOADING COUNTDOWN
════════════════════════════════════════════════ */
function startLoadingTimer() {
  loadStartTime     = performance.now();
  countdownInterval = setInterval(() => {
    const elapsed = ((performance.now() - loadStartTime) / 1000).toFixed(1);
    elStatusTimer.textContent = `(${elapsed}s)`;
  }, 100);
}

function stopLoadingTimer() {
  clearInterval(countdownInterval);
  countdownInterval = null;
  const total = ((performance.now() - loadStartTime) / 1000).toFixed(2);
  elStatusTimer.textContent = `— loaded in ${total}s`;
}

/* ════════════════════════════════════════════════
   PYODIDE INIT (FIXED)
════════════════════════════════════════════════ */
async function initPyodide() {
  setStatus("loading", "Loading Python runtime…");
  startLoadingTimer();
  appendOutput("🌌 Initializing GalacticCode...\n", "info");

  try {
    // Define the bridge function BEFORE loading Pyodide
    window.appendOutputBridge = (text, kind) => appendOutput(text, kind);

    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/",
      stdout: text => appendOutput(text, "stdout"),
      stderr: text => appendOutput(text, "stderr"),
    });

    appendOutput("✅ Pyodide loaded successfully.\n", "success");

    /* Redirect Python sys.stdout / sys.stderr → JS callbacks */
    pyodide.runPython(`
import sys
import builtins

class _PyRunOut:
    def __init__(self, kind):
        self._kind = kind
    def write(self, s):
        if s:
            import js
            js.appendOutputBridge(s, self._kind)
    def flush(self): pass

sys.stdout = _PyRunOut('stdout')
sys.stderr = _PyRunOut('stderr')

def _pyrun_input(prompt_text=""):
    if prompt_text:
        import js
        js.appendOutputBridge(str(prompt_text), "stdout")
    import js
    val = js.prompt(prompt_text)
    if val is None:
        raise KeyboardInterrupt("Input cancelled")
    js.appendOutputBridge(val + "\\n", "stdout")
    return val

builtins.input = _pyrun_input
`);

    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");

    appendOutput("📦 Installing CosmoTalker via micropip...\n", "info");
    // Install CosmoTalker (and known dependencies)
    await micropip.install(["cosmodb", "cosmotalker"]);

    appendOutput("✅ CosmoTalker installed successfully!\n\n", "success");

    // Pre-import, mock tkinter (browser unsupported), and show welcome
    await pyodide.runPythonAsync(`
import sys
import types

# 1. Mock tkinter BEFORE importing cosmotalker to prevent ModuleNotFoundError
sys.modules['tkinter'] = types.ModuleType('tkinter')
sys.modules['tkinter.messagebox'] = types.ModuleType('tkinter.messagebox')
sys.modules['tkinter.ttk'] = types.ModuleType('tkinter.ttk')
sys.modules['customtkinter'] = types.ModuleType('customtkinter')

import cosmotalker as ct

# 2. Replace the img module with a friendly browser-safe warning
class DummyImg:
    def __call__(self, *args, **kwargs):
        print("⚠️  Image preview is not available in GalacticCode (browser limitation).")
        print("   This feature requires a desktop environment (tkinter/customtkinter).")
        print("   Use text-based functions instead: planet_info(), get_fun_fact(), etc.\\n")

ct.img = DummyImg()

print("🚀 Welcome to GalacticCode!")
try:
    print(f"CosmoTalker version: {ct.__version__}")
except AttributeError:
    pass
print("You can now explore the cosmos with Python.\\n")
    `);

    stopLoadingTimer();
    setStatus("ready", "GalacticCode Ready");
    elBtnRun.disabled = false;

  } catch (err) {
    stopLoadingTimer();
    setStatus("error", "Load failed");
    elStatusTimer.textContent = "";
    appendOutput("⚠️ Failed to install CosmoTalker: " + err.message + "\n", "stderr");
    console.error(err);
  }
}

/* ════════════════════════════════════════════════
   RUN CODE
════════════════════════════════════════════════ */
async function runCode() {
  if (!pyodide || isRunning) return;

  const code = editor.getValue().trim();
  if (!code) { showToast("✏️ Editor is empty!"); return; }

  isRunning = true;
  elBtnRun.disabled = true;
  elBtnRun.classList.add("running");
  elBtnRun.querySelector("span:not(.run-icon)").textContent = "Running…";
  setStatus("running", "Running…");

  appendOutput("\n" + "─".repeat(50) + "\n", "info");
  appendOutput(`▶ Executing… ${new Date().toLocaleTimeString()}\n`, "system");

  startTime = performance.now();

  try {
    await pyodide.runPythonAsync(code);
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
    appendOutput(`\n✔ Done in ${elapsed}s\n`, "success");
    elExecTime.textContent = `Execution: ${elapsed}s`;
  } catch (err) {
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
    appendOutput("\n❌ Error:\n" + (err.message || String(err)) + "\n", "error-block");
    appendOutput(`\n✘ Error after ${elapsed}s\n`, "stderr");
    elExecTime.textContent = `Failed: ${elapsed}s`;
    console.error(err);
  }

  isRunning = false;
  elBtnRun.disabled = false;
  elBtnRun.classList.remove("running");
  elBtnRun.querySelector("span:not(.run-icon)").textContent = "Run";
  setStatus("ready", "GalacticCode Ready");
  updateStats();
  scrollOutput();
}

/* ════════════════════════════════════════════════
   OUTPUT HELPERS
════════════════════════════════════════════════ */
function appendOutput(text, kind = "stdout") {
  const span = document.createElement("span");
  span.className = `output-line ${kind}`;
  span.textContent = text;
  elOutput.appendChild(span);
  outputLineCount++;
  updateStats();
  scrollOutput();
}

function clearOutput() {
  elOutput.innerHTML = "";
  outputLineCount    = 0;
  elExecTime.textContent = "";
  updateStats();
}

function scrollOutput() { elOutput.scrollTop = elOutput.scrollHeight; }
function updateStats()  { elOutputStats.textContent = outputLineCount > 0 ? `${outputLineCount} lines` : ""; }

/* ════════════════════════════════════════════════
   STATUS
════════════════════════════════════════════════ */
function setStatus(state, text) {
  elStatus.className        = `status ${state}`;
  elStatusText.textContent  = text;
}

/* ════════════════════════════════════════════════
   TOAST
════════════════════════════════════════════════ */
let _toastTimer;
function showToast(msg) {
  elToast.textContent = msg;
  elToast.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => elToast.classList.remove("show"), 2800);
}

/* ════════════════════════════════════════════════
   COPY CODE
════════════════════════════════════════════════ */
async function copyCode() {
  const code = editor.getValue();
  try {
    await navigator.clipboard.writeText(code);
    showToast("✅ Code copied to clipboard!");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast("✅ Code copied!");
  }
}

/* ════════════════════════════════════════════════
   UPLOAD FILE
════════════════════════════════════════════════ */
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    editor.setValue(evt.target.result);
    saveCode();
    showToast(`✅ Loaded ${file.name}`);
  };
  reader.onerror = function() {
    showToast("❌ Failed to read file");
  };
  reader.readAsText(file);
  e.target.value = "";
}

/* ════════════════════════════════════════════════
   DOWNLOAD FILE
════════════════════════════════════════════════ */
function downloadCode() {
  const code = editor.getValue();
  const blob = new Blob([code], { type: "text/x-python" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "main.py";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("✅ Code downloaded as main.py");
}

/* ════════════════════════════════════════════════
   FORMAT / VALIDATE SYNTAX
════════════════════════════════════════════════ */
async function formatCode() {
  if (!pyodide) { showToast("⏳ Pyodide not ready yet."); return; }
  const code = editor.getValue();
  try {
    const result = await pyodide.runPythonAsync(`
import ast
code = ${JSON.stringify(code)}
try:
    ast.parse(code)
    "OK"
except SyntaxError as e:
    f"SyntaxError: {e}"
`);
    showToast(result === "OK" ? "✅ Valid Python syntax!" : "⚠️ " + result);
  } catch {
    showToast("⚠️ Validation failed.");
  }
}

/* ════════════════════════════════════════════════
   MICROPIP INSTALL
════════════════════════════════════════════════ */
async function installPackages() {
  if (!pyodide) { showToast("⏳ Pyodide not ready."); return; }
  const raw = elPkgInput.value.trim();
  if (!raw) { showToast("✏️ Enter package name(s)."); return; }

  const packages = raw.split(",").map(p => p.trim()).filter(Boolean);
  elPkgStatus.textContent = "📦 Installing…";
  elBtnInstall.disabled   = true;
  const results = [];

  for (const pkg of packages) {
    try {
      appendOutput(`\n📦 Installing ${pkg}…\n`, "system");
      await pyodide.runPythonAsync(`import micropip\nawait micropip.install("${pkg}")`);
      appendOutput(`✅ ${pkg} installed!\n`, "success");
      results.push(`✅ ${pkg}`);
    } catch (err) {
      appendOutput(`❌ ${pkg}: ${err.message}\n`, "stderr");
      results.push(`❌ ${pkg}`);
    }
  }

  elPkgStatus.textContent = results.join("  ");
  elBtnInstall.disabled   = false;
  elPkgInput.value        = "";
  scrollOutput();
}

/* ════════════════════════════════════════════════
   THEME — COLOR & EDITOR
════════════════════════════════════════════════ */
function applyColorTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const suggested = THEME_EDITOR_MAP[theme];
  if (suggested) {
    elEditorTheme.value = suggested;
    applyEditorTheme(suggested);
  }
  try { localStorage.setItem("pyrun-color-theme", theme); } catch (e) {}
}

function applyEditorTheme(theme) {
  if (editor) editor.setOption("theme", theme);
  try { localStorage.setItem("pyrun-editor-theme", theme); } catch (e) {}
}

function applyFontSize(size) {
  document.querySelectorAll(".CodeMirror").forEach(el => {
    el.style.fontSize = size + "px";
  });
  try { localStorage.setItem("pyrun-font-size", size); } catch (e) {}
}

/* ════════════════════════════════════════════════
   LOCAL STORAGE — code + preferences
════════════════════════════════════════════════ */
function saveCode() {
  if (editor) {
    try { localStorage.setItem("pyrun-code", editor.getValue()); } catch (e) {}
  }
}
function getSavedCode() {
  try { return localStorage.getItem("pyrun-code"); } catch (e) { return null; }
}

function loadPreferences() {
  let ct = "galactic-space", et = "dracula", fs = "14";
  try {
    ct = localStorage.getItem("pyrun-color-theme")  || ct;
    et = localStorage.getItem("pyrun-editor-theme") || et;
    fs = localStorage.getItem("pyrun-font-size")    || fs;
  } catch (e) {}
  elColorTheme.value  = ct;
  elEditorTheme.value = et;
  elFontSize.value    = fs;
  document.documentElement.setAttribute("data-theme", ct);
}

/* ════════════════════════════════════════════════
   LOAD SHARED CODE FROM URL ?code=
   (Share as Code links land here)
════════════════════════════════════════════════ */
function loadSharedCode() {
  const params  = new URLSearchParams(location.search);
  const encoded = params.get("code");
  if (encoded) {
    try { editor.setValue(decodeCode(encoded)); }
    catch(e) { console.warn("Failed to decode shared code", e); }
  }
}

/* ════════════════════════════════════════════════
   RESIZABLE PANES
════════════════════════════════════════════════ */
function initResizablePanes() {
  const divider    = $("pane-divider");
  if (!divider) return;
  const workspace  = divider.parentElement;
  const editorPane = workspace.querySelector(".editor-pane");
  const outputPane = workspace.querySelector(".output-pane");

  let dragging = false, startX, startY, startEdSize, startOutSize, isVertical;

  function onStart(e) {
    dragging  = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    startX     = clientX;
    startY     = clientY;
    isVertical = window.innerWidth <= 720;
    
    if (isVertical) {
      startEdSize  = editorPane.getBoundingClientRect().height;
      startOutSize = outputPane.getBoundingClientRect().height;
    } else {
      startEdSize  = editorPane.getBoundingClientRect().width;
      startOutSize = outputPane.getBoundingClientRect().width;
    }
    
    divider.classList.add("dragging");
    document.body.style.cursor     = isVertical ? "row-resize" : "col-resize";
    document.body.style.userSelect = "none";
  }

  function onMove(e) {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    if (isVertical) {
      const dy     = clientY - startY;
      const total  = startEdSize + startOutSize;
      const newEdH = Math.max(100, Math.min(total - 100, startEdSize + dy));
      editorPane.style.flex = `0 0 ${newEdH}px`;
      outputPane.style.flex = `0 0 ${total - newEdH}px`;
    } else {
      const dx     = clientX - startX;
      const total  = startEdSize + startOutSize;
      const newEdW = Math.max(200, Math.min(total - 200, startEdSize + dx));
      editorPane.style.flex = `0 0 ${newEdW}px`;
      outputPane.style.flex = `0 0 ${total - newEdW}px`;
    }
    if (editor) editor.refresh();
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    divider.classList.remove("dragging");
    document.body.style.cursor     = "";
    document.body.style.userSelect = "";
  }

  divider.addEventListener("mousedown", onStart);
  divider.addEventListener("touchstart", onStart, { passive: true });
  document.addEventListener("mousemove", onMove);
  document.addEventListener("touchmove", onMove, { passive: true });
  document.addEventListener("mouseup", onEnd);
  document.addEventListener("touchend", onEnd);

  window.addEventListener("resize", () => {
    // Wipe flex properties on window resize to ensure desktop/mobile orientations don't clash 
    editorPane.style.flex = "";
    outputPane.style.flex = "";
    if (editor) editor.refresh();
  });
}

/* ════════════════════════════════════════════════
   EVENT LISTENERS
════════════════════════════════════════════════ */
function bindEvents() {
  elBtnRun.addEventListener("click",     runCode);
  elBtnClear.addEventListener("click",   clearOutput);
  elBtnUpload.addEventListener("click",  () => elFileUpload.click());
  elFileUpload.addEventListener("change", handleFileUpload);
  elBtnDownload.addEventListener("click", downloadCode);
  elBtnClearEd.addEventListener("click", () => {
    if (confirm("Clear editor?")) { editor.setValue(""); saveCode(); }
  });
  elBtnCopy.addEventListener("click",    copyCode);
  elBtnCopyLink.addEventListener("click", () => shareAsCode(() => editor.getValue(), showToast));
  elBtnFormat.addEventListener("click",  formatCode);
  elBtnInstall.addEventListener("click", installPackages);

  elPkgInput.addEventListener("keydown", e => {
    if (e.key === "Enter") installPackages();
  });

  elColorTheme.addEventListener("change",  e => applyColorTheme(e.target.value));
  elEditorTheme.addEventListener("change", e => applyEditorTheme(e.target.value));
  elFontSize.addEventListener("change",    e => applyFontSize(e.target.value));

  /* Ctrl+Enter / Cmd+Enter → Run */
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runCode();
    }
  });
}

/* ════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════ */
async function boot() {
  loadPreferences();
  initEditor();
  bindEvents();
  initResizablePanes();

  /* Apply saved editor theme + font size after CodeMirror is ready */
  let savedEditorTheme = "dracula";
  let savedFontSize = "14";
  try {
    savedEditorTheme = localStorage.getItem("pyrun-editor-theme") || "dracula";
    savedFontSize    = localStorage.getItem("pyrun-font-size")    || "14";
  } catch(e) {}
  applyEditorTheme(savedEditorTheme);
  applyFontSize(savedFontSize);

  /* Load shared code from URL if present */
  loadSharedCode();

  /* Wire share buttons (share.js handles its own events) */
  initShareUI(() => editor.getValue(), showToast);

  /* Disable run until Pyodide finishes loading */
  elBtnRun.disabled = true;

  await initPyodide();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
