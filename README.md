# DevPrep — Technical Interview Preparation Hub

A modern, full-featured React + Vite dashboard that reads, parses, and transforms Markdown files from [krishnapawar/dev-interview-notes](https://github.com/krishnapawar/dev-interview-notes) into an all-in-one technical interview preparation platform.

---

## ✨ Features & Capabilities

### ⚡ 1. Interactive Coding Challenge Playground (`CodePlayground`)
- **In-Browser Code Runner:** Real-time JavaScript sandbox executing code with millisecond execution profiling and integrated console output.
- **Top Interview Coding Challenges:** Built-in challenge library covering `debounce`, `throttle`, `deepClone`, `custom Promise.all`, `flattenArray`, `curry`, `memoize`, `twoSum`, and `LRUCache`.
- **Automated Test Assertions:** Evaluates candidate solutions against automated test suites with instant pass/fail validation.
- **Freeform JS Sandbox:** Scratchpad mode for sketching algorithms, testing ES6 features, and profiling runtime.

### 🧠 2. Smart Spaced Repetition (SRS) Engine (`DailyRevision`)
- **5-Tier Leitner Box Algorithm:** Schedules questions across scientifically spaced retention intervals (Box 1: 1 day, Box 2: 3 days, Box 3: 7 days, Box 4: 14 days, Box 5: 30-day permanent mastery).
- **Daily Revision Queue:** Prioritizes questions that are due for review today so candidates never suffer memory decay.
- **Study Streak & 28-Day Activity Heatmap:** Tracks daily consecutive study streaks (`🔥 X Days`) and visualizes study intensity on an interactive contribution calendar.

### 📄 3. 30-Minute Cram Sheet Mode & Printable PDF Export (`CramSheet`)
- **Ultra-Condensed High-Yield Cards:** Distills complex topics into 1-sentence definitions, interviewer follow-up traps, and senior developer architectural nuances.
- **Printable One-Sheet / PDF Export:** Clean `@media print` styling optimized for paper or PDF export—perfect for last-minute review right before heading into an interview.
- **Markdown Export:** One-click download of filtered cheat sheets or bookmarked questions as `.md` files.

### 🎙️ 4. Speech-to-Text Voice Practice (`VoicePractice`)
- **Verbal Answer Simulator:** Uses the native Web Speech API (`SpeechRecognition`) to transcribe spoken answers in real-time.
- **Key Concept Coverage Matcher:** Analyzes candidate spoken/typed answers against essential technical concepts from the benchmark answer (e.g., checking for *Fiber*, *Virtual DOM*, *Diffing*), outputting a percentage coverage score.
- **Speaking Pace & Filler Word Detection:** Real-time words-per-minute (WPM) gauge and filler word tracking (*um*, *like*, *you know*).

### 🎯 5. STAR Behavioral Simulator & System Design Matrix (`BehavioralDesignHub`)
- **STAR Method Response Builder:** Guides candidates through Situation, Task, Action, and Result framing for high-frequency behavioral questions (technical disagreements, outages, tight deadlines, leadership).
- **Personal Story Bank:** Saves and exports structured STAR stories locally.
- **System Design Core Matrix:** Interactive architectural trade-offs covering CAP Theorem (CP vs AP), Caching strategies (Cache-Aside, Write-Through, Write-Behind), Database Scaling (Replication vs Sharding), and API Rate Limiting algorithms (Token Bucket, Sliding Window).

### 🗂️ 6. Custom Question Studio (`CustomQuestionStudio`)
- **Personalized Question Creator:** Form to input custom questions, Markdown benchmark answers, and code snippets.
- **Company & Seniority Tagging:** Filter by target company (*Google, Amazon, Meta, Netflix, Stripe, Startups*) and seniority level (*Junior, Mid, Senior, Staff*).
- **JSON Backup & Sharing:** Export and import custom question sets for cross-device backup or team study.

### 📊 7. Candidate Readiness Radar & Diagnostics (`ReadinessRadar`)
- **Multi-Axis SVG Spider Chart:** Visualizes candidate readiness across Frontend, Backend, Databases, Protocols, DevOps, and Fullstack.
- **Readiness Grade:** Composite readiness evaluation (e.g. `Grade: A- (78%)`).
- **Weak-Spot Diagnostic Engine:** Automatically detects the candidate's lowest-scoring domain and recommends the top 5 high-impact questions to master next.

### 🃏 8. Active Recall Flashcards & Timed Mock Rounds
- 3D flip card animations with 2-minute verbal countdown timers.
- Mock interview simulator with 5, 10, or 15-question rounds, candidate self-scoring, and end-of-round scorecards.
- Question Bank directory indexing 200+ technical questions with search and accordions.

### 📖 9. Supercharged Technical Reader
- Interactive Table of Contents with scrollspy and section filtering.
- Syntax-highlighted code blocks with Prism.js and one-click copy.
- Reading comfort controls (font resizing, estimated reading time, continuous document vs Q&A card mode).
- Global Command Palette (`⌘K` / `Ctrl+K`).

---

## 🚀 Run Locally

Requires Node.js 20+ (Node 22 recommended).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173/dev-interview-hub/`).

## 📦 Build for Production

```bash
npm run build
npm run preview
```

## 🌐 Deploy to GitHub Pages

1. Push this project to the `main` branch of `krishnapawar/dev-interview-hub`.
2. `vite.config.js` is configured with `base: '/dev-interview-hub/'`.
3. In your GitHub repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` builds and publishes the site to `https://krishnapawar.github.io/dev-interview-hub/`.
