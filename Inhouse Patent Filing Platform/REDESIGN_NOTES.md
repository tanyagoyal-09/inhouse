# SRMS Redesign & Navigation Fix — Change Notes

> Product name in the UI, PDFs and docs: **Inhouse Patent Filing System** (formerly "IPForge"). Internal storage keys (`ipforge-*`, `patentflow-*`), npm package names and environment variables were intentionally not renamed.

## Root cause of the Back-button problem
The app had **no router**. `App.tsx` switched screens with `useState("dashboard")`, `selectedPatent`
and `editingPatentId`, and `AdminDashboard` swapped to a "review screen" through its own
`selectedPatent` state. The URL never changed, so the browser had a single history entry and Back
left the app (or appeared to "jump to the first page").

## What changed
**Routing (React Router v6, `react-router-dom@^6.30.1`)**
- `src/App.tsx` – route table (see README → Routing). `src/main.tsx` – `BrowserRouter` + `AuthProvider`.
- `src/auth/` – `AuthContext` (same localStorage keys, legacy `ipforge-*` still read), role guards
  (`RequireRole`, `PublicOnly`) with safe return-to-requested-URL after login, 401 → back to sign-in.
- `src/navigation/` – `useGoBack` (real `navigate(-1)`, falls back to a list page only when the page was opened
  directly), `useFinishTo` (leave a form without duplicate history entries), scroll/focus manager, breadcrumb metadata.
- `src/routes/PatentRoutes.tsx` – details / new / edit pages that also work from refresh or a pasted URL.
- Admin console split from one 3,233-line state-switched component into routed pages in `src/admin/`
  (`AdminContext` keeps loaded data, search and filters across pages).
- Header search is now real and URL-driven (`/patents?q=…`); previously it only displayed the typed text.
- Obsolete state-based navigation (`Page` type, old `Sidebar`/`Topbar`, `AdminDashboard.tsx`, `window.location` logout) removed.

**SRMS look & feel**
- Palette sampled from the SRMS / SRMS CET logos bundled in the project (crimson ≈ `#A01C21`), charcoal utility bar and
  footer, Poppins (headings) + Inter (body), tokens in `tailwind.config.js`; shared button/card/field/focus styles in `index.css`.
- New shared layout: utility bar, header, sidebar/mobile drawer, breadcrumbs, footer, page header, alert/loading/empty states.
- Redesigned Landing, Sign in/Register, Admin login, Dashboard (feature cards for every route), 404. Existing pages
  inherit the new tokens; decorative blue/black accents were remapped to the brand colour (status colours kept semantic).
- Logos used are the project's own bundled assets; external SRMS links point to srms.ac.in. No images were hotlinked.

## Verification actually performed (sandbox had no internet)
| Check | Result |
| --- | --- |
| Original project `tsc --noEmit` (baseline) | 0 errors |
| Modified project `tsc --noEmit` | 0 errors |
| esbuild bundle + Tailwind CLI build | succeeded |
| Responsive layout audit: 17 pages x 3 widths (1366 / 768 / 390 px), full page length, with long titles, long text, claims, drawings and documents in the data | 51 / 51 with no horizontal overflow and no uncaught page errors; every page also reviewed by eye in full-page screenshots |
| Headless-Chromium navigation suite (44 checks: Back/Forward chain, refresh, direct URLs, 404, guards, role separation, login return-to, logout, search-in-URL, 401 expiry, admin review route, mobile drawer, no horizontal overflow) | 44 / 44 passed, no uncaught page errors |

## Responsive / alignment pass
- Phone & tablet: search row under the header (previously hidden on small screens), wizard step bar wraps instead of clipping 11 steps,
  stat tiles 2-up, full-width action buttons, consistent status-badge alignment, tighter card padding, darker low-contrast labels.
- Consistent page titles (some were crimson, some black); redesigned Profile page; removed global smooth-scroll
  (it made every page change glide back to the top).
- Header search switches to the full-width row below 1024 px so it never shrinks to an unusable pill.

## Limitations — please read
1. **`react-router-dom` could not be installed in the sandbox**, so the routing suite ran against a small local stand-in that
   implements the same API subset. Only standard v6 APIs are used, but run `npm install` and click through the routes once with the real library.
2. **`vite build` / `npm run build` was not run** (Windows-only native binaries in the supplied `node_modules`, no network).
   Type-check and bundling were run with the same sources via esbuild.
3. **The real backend was not run** (no MongoDB/credentials). The frontend was tested against a mock API; `services/api.ts`,
   endpoints and payloads are unchanged. Document generation, PDF export, uploads and admin actions were not exercised end-to-end.
4. **There is no AI/LLM functionality in this codebase** (no model calls, prompts or AI endpoints). It is a patent-filing workflow
   platform, so no AI features were added or faked. If AI features exist elsewhere, send them over.
5. Fonts load from Google Fonts; offline they fall back to system fonts. Palette/typography are derived from the logos and the
   site's structure — the site's CSS could not be read, so exact brand tokens should be checked against SRMS brand guidelines.
6. Drafting-wizard steps are still internal steps of one form (not separate URLs); a brand-new draft stays on `/patents/new` until saved.
7. `backend/.env`, `backend/uploads/*` and `node_modules` are excluded (per the project's `.gitignore`); copy your own `backend/.env` back.
