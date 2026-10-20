# DevPrep — Technical Interview Preparation Hub

A React + Vite dashboard that reads, parses, and transforms Markdown files from [krishnapawar/dev-interview-notes](https://github.com/krishnapawar/dev-interview-notes) into an interactive interview preparation platform.

## ✨ Key Features & Improvements

- **Interactive Active Recall Flashcards**:
  - 3D flip card animation with question on front and benchmark answer with code on back.
  - 2-minute verbal answer countdown timer with play/pause/reset to mimic answering an interviewer out loud.
  - Spaced repetition self-rating: *Needs Review* 🔄 vs *Mastered* ✅.
  - Filter deck by topic (React, Node.js, JavaScript, SQL, Git, MongoDB, etc.) with deck shuffle.
- **Mock Technical Interview Simulator**:
  - Timed interview rounds (5, 10, or 15 questions) across Fullstack, Frontend, Backend, or Database tracks.
  - Real-time question countdown timer.
  - Candidate self-scoring and end-of-round readiness scorecard with mastery percentage.
- **Interview Question Bank (200+ Questions)**:
  - Global question directory extracting individual technical questions across all notes.
  - Searchable by keyword, filterable by topic, and status (All, Mastered, Needs Review, Bookmarked).
  - Expandable question accordions for rapid revision.
- **Supercharged Reader View**:
  - Interactive Table of Contents & Outline with scrollspy and section filtering.
  - Syntax-highlighted code blocks with Prism.js (supporting JS, JSX, SQL, PHP, Bash, JSON) and one-click copy buttons.
  - Reading comfort controls: adjustable font size (Standard, Comfortable, Large) and estimated reading time.
  - View switcher: Continuous Markdown Document vs Interactive Q&A Accordion Cards.
  - Personal Study Notes drawer: write personal interview talking points and cheat sheet bullets per topic, auto-saved in local storage.
- **Global Command Palette (`⌘K` / `Ctrl+K`)**:
  - Keyboard-driven instant search across all guides and 200+ questions.
- **Robust UTF-16LE / UTF-8 Decoding**:
  - Correctly parses UTF-16LE files with BOM (such as SQL and Laravel notes) with zero broken characters.
- **Fast Local Caching & Rate-Limit Resilience**:
  - Bundled fallback data loads instantly on first visit; automatically syncs with GitHub in the background without blank screens or rate-limit crashes.
- **Rich Design System**:
  - Refined typography (Outfit, Inter, JetBrains Mono), smooth dark and light themes, glassmorphism, glowing accents, and synthesized audio feedback.

## 🚀 Run locally

Requires Node.js 20+ (Node 22 recommended).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173/dev-interview-hub/`).

## 📦 Build for production

```bash
npm run build
npm run preview
```

## 🌐 Deploy to GitHub Pages

1. Push this project to the `main` branch of `krishnapawar/dev-interview-hub`.
2. `vite.config.js` is configured with `base: '/dev-interview-hub/'`.
3. In your GitHub repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` builds and publishes the site to `https://krishnapawar.github.io/dev-interview-hub/`.

