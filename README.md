<div align="center">

# 🌌 GalacticCode — Code the Cosmos

**Powered by CosmoTalker**  
*A specialized online Python coding and learning platform designed as the dedicated browser-based companion to CosmoTalker.*

[![Live Demo](https://img.shields.io/badge/Live_Demo-Play_Now-4ade80?style=for-the-badge&logo=vercel)](https://bhuvanesh-m-dev.github.io/galacticcode/)
[![Powered by Pyodide](https://img.shields.io/badge/Powered_by-Pyodide-38bdf8?style=for-the-badge&logo=python&logoColor=white)](https://pyodide.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<img src="https://raw.githubusercontent.com/bhuvanesh-m-dev/galacticcode/refs/heads/main/img/1.png" alt="GalacticCode Interface Preview" width="800" style="border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.3); margin-top: 15px; margin-bottom: 15px;" />

</div>

## 🚀 Project Overview

**GalacticCode** by Py-Run provides an interactive, in-browser Python environment where users can instantly write, execute, and experiment with Python code focused on astronomy and space exploration. It is powered by **Pyodide** (Python running directly in the browser via WebAssembly) and pre-loads the **CosmoTalker** library, eliminating any installation requirements.

Users can write code in GalacticCode to fetch real planetary data via CosmoTalker and then immediately visualize it in the 3D Solar System explorer.

### Why GalacticCode Was Created

CosmoTalker is an award-winning, offline-first Python library developed by Bhuvanesh M that delivers planetary data, star and galaxy information, scientific facts, fun cosmic insights, and real-time space updates. It has achieved over 50,000 downloads on PyPI and serves developers, students, educators, and space enthusiasts worldwide.

However, traditional use of CosmoTalker requires installing Python, setting up a local environment, and managing dependencies. Many learners face barriers such as limited device access or restricted installations. **GalacticCode** was created to remove these barriers by offering a zero-install, fully browser-based Python REPL tailored specifically for CosmoTalker.

### Core Objectives
- Enable anyone with a web browser to run CosmoTalker commands instantly.
- Provide a dedicated educational space with ready-to-run astronomy examples and tutorials.
- Bridge the gap between data (CosmoTalker) and visualization (Orbitarium / Solar System 3D explorer).
- Promote interactive, hands-on learning of space science through code.
- Maintain the spirit of your broader ecosystem: offline-first where possible, educational, and open-source.

## ✨ Key Features

- **🌌 Pre-loaded CosmoTalker**: The library installs automatically via `micropip` on first load.
- **🔭 Space Lab Section**: Curated astronomy-themed example scripts and mini-tutorials (e.g., exploring planets, generating fun facts, orbital calculations).
- **💻 Full Python REPL**: Syntax-highlighted editor (CodeMirror), output console, file upload/download, and sharing capabilities inherited from Py-Run.
- **🎨 Cosmic-Themed Interface**: Deep space background, nebula gradients, star accents, and professional dark themes consistent with the Solar System visualization.
- **🔗 Cross-Linking**: Direct links or one-click navigation to the interactive 3D Solar System demo and Orbitarium resources.
- **📚 Educational Focus**: Designed for students, teachers, coding clubs, and self-learners interested in astronomy.
- **🔗 Advanced Sharing Mechanisms**:
  - **Share as Code**: Encodes the editor payload into a base64 URL. Link recipients can immediately view, edit, and run the code.
  - **Share as Run**: Generates a standalone, unbranded HTML execution environment. Perfect for sharing clean output logs with clients or peers.

## 🎯 Target Audience

- School and college students learning Python or astronomy.
- Space enthusiasts and hobbyists.
- Educators seeking interactive teaching tools.
- Developers exploring your CosmoTalker library without local setup.

## 🌌 Connection to Your Existing Projects

- **CosmoTalker** — Core data and intelligence engine.
- **Orbitarium** — Umbrella visual ecosystem.
- **Solar System** — Immersive 3D browser visualization (built with Three.js/WebGL) that complements the Python code executed in GalacticCode.

## 🏗️ Architecture & Technical Stack

| Technology | Usage |
| --- | --- |
| **HTML5 / CSS3** | Clean, responsive UI layout with CSS Variables for dynamic theming. |
| **Vanilla JS (ES6)** | Lightweight DOM manipulation and application lifecycle management. |
| **Pyodide (v0.25.0)** | Compiles the CPython interpreter to WebAssembly for native browser execution. |
| **CodeMirror 5** | High-performance text editor optimized for code editing. |

### How the JS-Python Bridge Works
Py-Run overrides standard Python builtins to route streams seamlessly to the browser DOM:
```python
# Concept implementation under the hood
import sys, builtins

class BrowserOutput:
    def write(self, s): js.appendOutputBridge(s, 'stdout')

sys.stdout = BrowserOutput()
```

## 🛠️ Local Setup & Development

Since GalacticCode is a strictly static client-side application, setup is incredibly straightforward. No build steps, bundlers, or package managers are required.

### Prerequisites
- Any modern web browser.
- A local web server (Optional but recommended, to prevent strict CORS policies from blocking Pyodide WASM payloads).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/bhuvanesh-m-dev/cosmotools.git
   cd cosmotools/galacticcode
   ```
2. Serve the directory locally. For example, using Python's built-in HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
3. Navigate to `http://localhost:8000` in your web browser.

## 📂 Project Structure

```text
galacticcode/
├── index.html       # Application layout and DOM structure
├── script.js        # Core logic: Pyodide initialization, editor config, I/O bridging
├── share.js         # Base64 encoding logic and standalone runner page generation
├── shared-run.js    # Unbranded Pyodide execution script for "Share as Run" URLs
├── style.css        # UI components, flexbox layouts, and toolbars
└── themes.css       # Dynamic CSS variables for UI and CodeMirror themes
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <b>Developed with ❤️ by <a href="https://github.com/bhuvanesh-m-dev">CosmoTools</a></b><br>
  <sub>Turning browsers into compilers.</sub>
</div>


<p align="center">
  <img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%" alt="Header Banner">
</p>

<h3 align="center">
    🌌 You are my &nbsp;
    <a href="https://github.com/bhuvanesh-m-dev">
    <img src="https://count.getloli.com/@bhuvanesh-m-dev?name=bhuvanesh-m-dev&theme=ai-1&padding=13&offset=0&align=top&scale=1&pixelated=1&darkmode=auto" alt="bhuvanesh-m-dev" />
    </a>
    &nbsp; visitor. Welcome to my orbit.
</h3>

<p align="center">
  <img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%" alt="Header Banner">
</p>
