# AGENTS.md — CORLIVA Agency Admin Portal

Read this before changing anything. This app is a finished, approved design. Do **not** redesign it, restyle it, swap the layout, add Tailwind, add a UI kit, or "modernise" it. Only make the change you are asked for, in the same style.

## What this is
CORLIVA is a home care platform. This repo is the **Agency Admin** web portal (the office manager of one home care agency, e.g. "Royality Home Care"). It is a clickable React prototype with demo data held in memory.

## Stack
- React 18 + Vite + TypeScript
- `HashRouter` (keep it — the app must work from any static host and in Figma Make)
- Icons: `lucide-react` only
- Styling: plain CSS in `src/styles.css` using CSS variables. **No Tailwind, no CSS reset libraries, no styled-components.**
- Font: Inter (Google Fonts link in `index.html`)
- Images live in `public/images/` and are referenced with relative paths like `./images/corliva-logo-white.svg`

## Design system (mirrors the Figma file "Corliva", page "03 · Foundations & Components")
- Page background: brand blue `--bg-page #105CBC`. The sidebar sits directly on the blue.
- Sidebar: width 236px, white text and icons, uppercase section labels (11px semibold), nav items 44px tall. The **active item is a white pill** (radius 37px) with dark text `#292D32`.
- Main content: a rounded light panel `--bg-panel #F8F6F6`, radius 24px, with a white header bar (radius 8px, border `#E5EAF1`, height 59px).
- Cards: white, 1px border `#E5EAF1`, radius 12px.
- Primary action colour `--action-primary #0E66D4`. Status colours: success `#18794A`, warning `#9A5B00`, danger `#C0322B`, each with a soft background.
- Status is always a **word plus a colour** (chips), never colour alone.
- Every token is in `:root` at the top of `src/styles.css`. Use the variables; don't hard-code new colours.

## Writing style
The client is non-technical and over 50. Use short, plain English: "Switch off", "Send back to fix", "No caregiver yet". No jargon (no "RBAC", "EVV", "CRUD", "entity").

## Rules that must keep working
- Every decision that overrides or undoes someone's work needs a **written reason** (switch off a person, override a blocking rule, send a visit back, close a referral, put a client on hold). These are saved to Audit History.
- Nothing is ever deleted — items are "switched off" so history stays correct.
- Blocking requirements stop a caregiver being assigned unless an allowed role overrides with a reason. Warnings only remind.
- The branch filter (header and sidebar) filters every page.
- Audit History is read-only.

## Structure
```
src/
  styles.css            design tokens + all component styles
  data/seed.ts          demo data (dates are relative to today)
  data/store.tsx        app state, toasts, audit log, CSV download
  components/ui.tsx     Button, Field, Input, Select, Chip, Modal, Drawer, Tabs, Toggle, StatTile, AlertBanner, EmptyState, ReasonDialog, RowMenu, Pager
  components/Shell.tsx  sidebar + header (search, branch filter, alerts, family requests, profile menu)
  components/InviteModal.tsx
  pages/                one file per menu item, plus Auth.tsx (sign in, forgot password, 4-step set-up)
```

## Run
```
npm install
npm run dev
```
Sign in with any email and any password of 8+ characters. The first sign-in walks through agency set-up.
