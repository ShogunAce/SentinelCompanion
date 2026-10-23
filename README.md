# Sentinel

A responsive, frontend-only security workspace for people building apps with AI.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. Build with `npm run build`; serve the production build with `npm run preview`.

## Routes

- `/` — full public landing page
- `/workspace` — overview
- `/workspace/new-scan` — editable, locally validated URL form
- `/workspace/reports` — empty report library with search and filters
- `/workspace/reports/layout` — interactive, unpopulated report structure
- `/workspace/action-plan` — action filters and empty state
- `/workspace/coverage` — shared coverage and limitations

Navigation uses browser history. Vite serves direct routes; a future static host must fall back to index.html for application paths.

## Scope

Scanning, authentication, model calls, backend services and persistence are intentionally not implemented. No target requests are made. An entered URL stays in React memory and clears on refresh. The Run scan button is disabled and explains why. Fonts are loaded from Google Fonts with system fallbacks.

The original standalone implementation and configuration are preserved in `archive/` for reference. They are not imported or included in the production build. `config.js` is retained unchanged and is not used by the new frontend. Run only the Vite frontend; the archived page belongs to the previous implementation.

## Structure

`src/components.tsx` provides shared UI, URL validation and scope copy. `src/LandingPage.tsx` composes the marketing page. `src/Workspace.tsx` implements the workspace shell and views. `src/main.tsx` owns routing and temporary URL state. `src/styles.css` contains centralized tokens and responsive styles.

No deployment or publication is configured.
