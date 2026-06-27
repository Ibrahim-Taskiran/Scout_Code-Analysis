# 🔍 Code Analysis Application - Project Documentation

## 📌 Project Overview

This application is a cross-platform desktop app that enables developers to perform comprehensive code analysis before uploading or publishing their projects to GitHub. When any project folder is selected, the application automatically scans all files, scores them across various categories, and provides improvement suggestions.

> **Cost:** Completely free. All AI operations run on the local machine — no internet connection or API fees required.

---

## 🛠️ Technical Stack

| Feature | Detail |
|---|---|
| **Platform** | Desktop (Windows, Mac, Linux) |
| **Framework** | Electron + React |
| **AI** | Ollama (local, free) — model details below |
| **Database** | SQLite (file-based, zero cost) |
| **Language Support** | All programming languages (JavaScript, Python, Java, C#, Go, etc.) |
| **UI Language** | Turkish / English (user selects) |
| **Theme** | Dark / Light mode (user selects) |
| **Reporting** | In-app display + export as `.md` file |
| **Updates** | Automatic download and installation via electron-updater |

---

## 🏗️ Electron Application Architecture

The application uses Electron's standard **Main Process / Renderer Process** separation.

```
┌─────────────────────────────────────────┐
│           RENDERER PROCESS              │
│           (React UI)                    │
│  Dashboard │ Analysis │ Chatbot │ Settings │
└────────────────┬────────────────────────┘
                 │ IPC (ipcRenderer)
┌────────────────▼────────────────────────┐
│            MAIN PROCESS                 │
│          (Node.js / Electron)           │
│  - File system access                   │
│  - SQLite database                      │
│  - Ollama API communication             │
│  - OS notifications                     │
│  - electron-updater                     │
└────────────────┬────────────────────────┘
                 │ REST API (localhost:11434)
┌────────────────▼────────────────────────┐
│           OLLAMA (Local)                │
│  deepseek-coder:6.7b (Fast Mode)       │
│  deepseek-coder-v2:16b (Deep Mode)     │
└─────────────────────────────────────────┘
```

**Rules:**
- Only the **Main Process** connects to the Ollama API (secure, Node.js fetch)
- The React UI communicates with the Main Process via **IPC channels**
- File system and SQLite operations are handled exclusively by the Main Process
- The Renderer Process never directly accesses Ollama or the file system

---

## 🤖 AI Model Configuration

The application uses different Ollama models depending on the analysis mode. Both models run locally and require no internet connection.

| Analysis Mode | Default Model | RAM Usage | Feature |
|---|---|---|---|
| **Fast Mode** | `deepseek-coder:6.7b` | ~4GB | Quick, lightweight, basic analysis |
| **Deep Mode** | `deepseek-coder-v2:16b` | ~16GB | Comprehensive, detailed analysis |

> The user can change the model for either mode from the **Settings** screen.

---

## 📡 Ollama API Communication Protocol

Communication with Ollama is established via REST API over `localhost:11434`. The Main Process manages this connection.

| Use Case | Method | Description |
|---|---|---|
| **Code Analysis** | Single response (non-streaming) | Structured response received once the full analysis is complete |
| **Chatbot** | Streaming | Response flows word by word, appearing live to the user |

**Analysis endpoint:** `POST /api/generate` — `stream: false`
**Chatbot endpoint:** `POST /api/generate` — `stream: true`

---

## 📦 Large File Management (Chunking)

Some files may exceed Ollama's context window limit (e.g. files with 5000+ lines). In this case, the application automatically applies a **chunking strategy**:

1. The file is split into logical blocks (by function/class boundaries)
2. Each chunk is sent to the model separately
3. Results from all chunks are merged together
4. The merged result is reported as the analysis output for that file

> The user is not notified of this process; the progress bar shows chunks at the file level.

---

## ⚙️ Initial Setup

On first launch, the application checks whether Ollama and the required models are installed.

- **If not installed:** A one-click automatic installation script runs
- The script downloads and installs Ollama, then pulls `deepseek-coder:6.7b` and `deepseek-coder-v2:16b`
- No technical knowledge is required from the user
- Once installation is complete, the application automatically navigates to the home screen

---

## 🔄 Automatic Updates

The application can update itself automatically using the **electron-updater** package.

- On launch, it checks for updates in the background
- If a new version is available, it is automatically downloaded
- Once the download is complete, a notification is shown: *"Update ready — restart now?"*
- The application restarts with user confirmation and the new version is installed

---

## 🏠 Home Screen (Dashboard)

The screen that greets the user on first launch contains the following components:

- **Previous Analyses List** — Summary cards of previously analyzed projects (score, date, language, mode)
- **Add New Project** — Quick analysis start area via folder selection
- **Local Library** — All of the user's projects and the languages they use, listed in a library view
- **Chatbot Panel** — Ollama-powered personal developer assistant

---

## 📊 Analysis Categories

Each project is **scored out of 10** across the following 5 categories. The user can select which categories to analyze before starting; unselected categories are not analyzed.

| Category | Description |
|---|---|
| 🔒 **Security** | Security vulnerabilities, sensitive data exposure, authentication errors |
| ⚡ **Performance** | Slow algorithms, unnecessary loops, memory leaks |
| 🧹 **Code Quality** | Code duplication, readability, naming standards |
| 🧪 **Test Coverage** | Unit tests, integration tests, test ratio |
| 🏗️ **Architecture** | Layered structure, dependency management, modularity |

---

## 🔄 Analysis Flow

```
User Selects Root Folder
        ↓
Excluded Files and Folders Are Filtered
        ↓
File Count Check
(Warning shown for 300+ files → Continue / Cancel)
        ↓
User Selects Analysis Mode: Fast Mode / Deep Mode
        ↓
User Selects Categories to Analyze (checkboxes)
(All or selected categories — e.g. Security only)
        ↓
Main Process Sends Each File to Ollama One by One
(Large files are automatically split into chunks)
(Progress bar + live file name shown)
        ↓
Selected Categories Are Scored (out of 10)
        ↓
Problematic Files Are Listed
        ↓
Improvement Suggestions Are Presented
        ↓
System Notification Sent: "Analysis complete ✅"
        ↓
Results Displayed In-App + Exportable as .md
```

**If analysis is cancelled:** All temporary data is deleted and nothing is saved to the database. A clean slate is ensured.

---

## ⚡ Analysis Modes

| Mode | Model Used | Description | Use Case |
|---|---|---|---|
| **Fast Mode** | `deepseek-coder:6.7b` | Scans files at a summary level, focuses on critical issues | Small projects, quick check |
| **Deep Mode** | `deepseek-coder-v2:16b` | Each file is analyzed in depth, all details are reported | Large projects, pre-release comprehensive review |

> The model preference for each mode can be changed from the Settings screen.

---

## 🎯 Category-Based Analysis

The user can analyze all 5 categories at once, or select only the category/categories they are interested in for a faster, more focused analysis.

- A **checkbox list** is shown before the analysis starts
- All categories are selected by default
- The user can uncheck categories they don't need
- **Only selected categories are analyzed** — the model is not run for unselected ones

**Example use cases:**
- Only 🔒 Security selected → only security vulnerabilities are scanned
- 🔒 Security + ⚡ Performance selected → two categories analyzed, others skipped
- All selected → standard 5-category analysis runs

---

## 📁 File Filtering

The following files and folders are **automatically excluded** during scanning:

**Folders (default):** `node_modules/`, `.git/`, `dist/`, `build/`

**File types:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`, `.webp`, `.mp4`, `.mp3`, `.wav`, `.avi`, `.mov`, `.ttf`, `.woff`, `.ico`

**User-defined exclusions:**
- The user can add any folder or file type to the exclusion list from the Settings screen
- Examples: `.env`, `secrets/`, `*.log`, `private/`
- This list is saved in SQLite and automatically applied with every analysis

**File count warning:** If more than 300 files are detected after filtering, a warning is shown to the user. The user chooses "Continue" or "Cancel".

---

## 🔁 Re-Analyzing the Same Project

When a previously analyzed project is analyzed again, the user is presented with a choice:

- **Overwrite** — The existing record is updated, the old result is deleted
- **Create new record** — The old analysis is preserved; the new analysis is added as a separate version (version history tracking)

---

## 🛠️ Auto-Fix

> ⚠️ Auto-Fix is only active in **Deep Mode**. This feature is not shown in Fast Mode.

The application's primary purpose is to **detect and report issues.** Auto-Fix is an optional feature that activates only when the user requests it.

**Flow:**
1. The user clicks the "Fix" button on an issue in the analysis results
2. A **diff screen** opens — the current code and the suggested code are shown side by side
3. If the user **approves** the change, it is written to the file
4. If the user **rejects** it, nothing changes

> No file is modified without user approval.

---

## ⚙️ Settings Screen

The user manages the following preferences from the Settings screen. All changes become permanent when the **Save** button is pressed and are written to SQLite.

| Setting | Options |
|---|---|
| **UI Language** | Turkish / English |
| **Theme** | Dark / Light |
| **Fast Mode Model** | Default: `deepseek-coder:6.7b` (customizable) |
| **Deep Mode Model** | Default: `deepseek-coder-v2:16b` (customizable) |
| **Excluded Folders** | User-defined list (add / remove) |
| **Excluded File Types** | User-defined list (add / remove) |

---

## 📋 Sample Analysis Output

```
📁 Project: Jarvis
📅 Analysis Date: 2026-06-24
⚡ Mode: Deep Analysis
🎯 Categories: Security, Performance, Code Quality

─────────────────────────────
🔒 Security        : 7/10
⚡ Performance      : 6/10
🧹 Code Quality    : 8/10
─────────────────────────────
📊 Overall Score   : 7.0/10

⚠️ Issues:
- authService.js    → Security vulnerability: token stored in plain text
- HomePage.jsx      → Excessive code duplication
- utils/parser.js   → Unnecessary loop: O(n²) complexity

💡 Suggestions:
- Token management in authService.js should be encrypted
- Shared UI components should be moved to a components/ folder
- The nested loop in parser.js should be reduced to a single pass
```

---

## 📈 Analysis Results Page (Visuals)

When analysis is complete, results are visualized with two charts:

- **Radar / Spider Chart** — Overall view of selected categories at a glance (main chart)
- **Bar Chart** — Numerical comparison of categories (detail view)

Both charts appear on the same page.

---

## 🖥️ UI During Analysis

While the analysis runs in the background, the user sees the following in the UI:

- **Progress bar** — Completion percentage (e.g. 34%)
- **Live file name** — The name of the file currently being analyzed (e.g. `File 23/150 — authService.js`)
- **Cancel** button — The user can stop the analysis at any time; if cancelled, all temporary data is deleted

---

## 💾 Export

After analysis is complete, the user can:
- View results **in-app** (charts, tables)
- Save them to their computer as a **`.md` file**

**File name format:** `ProjectName_YYYY-MM-DD.md`
**Example:** `Jarvis_2026-06-24.md`

---

## 🔔 Notifications

- An **OS notification** is sent when analysis is complete
- The user is instantly informed even if they are working in another window
- Notification content: `"[ProjectName] analysis complete — Overall Score: X/10"`

---

## 🤖 Chatbot (Personal Developer Assistant)

Runs completely **locally** via Ollama — no internet connection required. Responses flow via **streaming**; the user sees the reply being typed in real time.

**Memory:** Chatbot history is reset each session. When the application is closed, the conversation is deleted. This keeps the model context clean and preserves performance.

The chatbot assists with three different topics:

| Topic | Example Questions |
|---|---|
| **Analysis Results** | *"How do I improve my security score?"* / *"What is the most critical issue?"* |
| **General Code Questions** | *"What is this design pattern?"* / *"What could be causing this error?"* |
| **Project Suggestions** | *"What project could I build?"* / *"What should I learn with my Python skills?"* |

> For project suggestions, the chatbot uses the user's **language statistics from their local library** (e.g. 60% JavaScript, 30% Python) as context.

---

## 📁 Local Library

All of the user's projects and the languages they use are listed visually on the home screen:

- Each project card shows: project name, analysis date, overall score, analysis mode, selected categories
- Languages used are shown statistically (e.g. 60% JavaScript, 30% Python)
- Past analyses can be reviewed comparatively
- For projects with version history, score changes over time can be tracked

---

## 🗄️ Data Storage

All application data is stored locally in a **SQLite** database:

| Table | Contents |
|---|---|
| `projects` | Project name, folder path, analysis date, mode |
| `analysis_results` | Selected category scores, overall score, problematic files |
| `suggestions` | File-level improvement suggestions |
| `settings` | Theme, language, model preferences, excluded folders and file types |

---

## 🚀 Development Roadmap

- [ ] Electron + React project skeleton (Main/Renderer separation, IPC setup)
- [ ] SQLite integration (better-sqlite3)
- [ ] Automatic Ollama + model installation script (`deepseek-coder:6.7b` + `deepseek-coder-v2:16b`)
- [ ] Ollama REST API connection (Main Process — non-streaming analysis, streaming chatbot)
- [ ] File system scanner module (default + user-defined filtering)
- [ ] Large file chunking strategy (context window overflow management)
- [ ] Category-based analysis selection (checkbox UI)
- [ ] Fast Mode / Deep Mode analysis engine (separate model per mode)
- [ ] 5-category scoring system
- [ ] Progress bar + live file name display during analysis
- [ ] Analysis cancellation mechanism (temporary data cleanup)
- [ ] Auto-Fix (diff screen + approval flow, Deep Mode only)
- [ ] Dashboard UI
- [ ] Analysis results page (Radar + Bar chart)
- [ ] OS notification system
- [ ] Chatbot panel (streaming, analysis + general code + project suggestions, session-based memory)
- [ ] `.md` export module (`ProjectName_Date.md`)
- [ ] Local library view
- [ ] Settings screen (language, theme, model, filters — applied via Save button)
- [ ] Turkish / English language support
- [ ] Dark / Light theme support
- [ ] Automatic update system via electron-updater
- [ ] Past analysis versioning system
