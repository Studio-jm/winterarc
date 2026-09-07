# Winter Arc

A small, self-contained **90-day habit tracker**. Pick the habits that define your
"winter arc," check them off each day, and watch your streaks and overall progress
grow. All data is stored locally in the browser (no backend required).

Built with [Vite](https://vite.dev), [React](https://react.dev), and TypeScript.

## Features

- 90-day arc progress ring (day _N_ of 90)
- Daily habit checklist with one-tap toggling
- Per-habit streak counter
- Add and remove custom habits with emoji icons
- "Perfect day" celebration when everything is checked off
- Progress persisted in `localStorage`

## Getting started

Requires [Node.js](https://nodejs.org) 20+ and npm.

```bash
npm install      # install dependencies
npm run dev      # start the dev server on http://localhost:5173
```

## Scripts

| Script              | Description                                        |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Start the Vite dev server (hot reload) on `:5173`. |
| `npm run build`     | Type-check and build the production bundle.         |
| `npm run preview`   | Serve the production build on `:4173`.              |
| `npm run lint`      | Run ESLint over the project.                        |
| `npm run typecheck` | Type-check without emitting output.                 |

## Project structure

```
src/
  components/     UI components (progress ring, habit item, add form)
  lib/            date math and localStorage helpers
  types.ts        shared types
  App.tsx         top-level app + state
```

## Cloud Agent environment

This repository is configured for Cursor Cloud Agents via
[`.cursor/environment.json`](.cursor/environment.json): dependencies are installed
with `npm ci`, and the dev server runs in a persistent terminal on port `5173`.
