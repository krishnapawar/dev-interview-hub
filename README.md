# Dev Interview Prep

A React + Vite dashboard that reads Markdown files directly from [krishnapawar/dev-interview-notes](https://github.com/krishnapawar/dev-interview-notes).

## Features
- GitHub repository sync; automatically discovers `.md` files from the default branch.
- Search across file paths and Markdown content.
- Markdown rendering with GitHub-flavored tables, lists and code fences.
- Bookmarks and reviewed progress saved in this browser's local storage.
- Active-recall quiz mode: choose a note, explain it from memory, then reveal the reference notes.
- Responsive layout and dark/light theme.
- GitHub Pages deployment workflow included.

## Run locally
Requires Node.js 20+ (Node 22 recommended).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build locally
```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages
1. Create a new GitHub repository named `dev-interview-hub` under `krishnapawar` and push this project to its `main` branch.
2. `vite.config.js` is configured with `base: '/dev-interview-hub/'`. If you choose a different repository name, update the base to `/<your-repository-name>/`.
3. In the new repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
4. Push to `main`. The included `.github/workflows/deploy.yml` builds the site and deploys it.
5. Open `https://krishnapawar.github.io/dev-interview-hub/` after the workflow succeeds.

## GitHub API notes
The application uses the unauthenticated public GitHub REST API and `raw.githubusercontent.com`. No token or backend is required for a public repository. GitHub applies rate limits to unauthenticated requests; use the **Sync notes** button after waiting if a limit is reached.

## Data and privacy
Bookmarks, theme, and reviewed progress are stored in this browser's local storage. They are not synced between browsers or devices. Notes are fetched from your public repository. The app does not send notes to a separate backend.

## Customizing the source repository
Edit `OWNER` and `REPO` in `src/github.js` if you want to read another public repository.
