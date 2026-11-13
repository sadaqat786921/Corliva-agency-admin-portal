# AGENTS.md — CORLIVA Agency Admin Portal

Read this before changing anything. This app is a finished, approved design. Do **not** redesign it, restyle it, swap the layout, add Tailwind, add a UI kit, or "modernise" it. Only make the change you are asked for, in the same style.

## What this is
CORLIVA is a home care platform. This repo is the **Agency Admin** web portal (the office manager of one home care agency, e.g. "Royality Home Care"). It is a clickable React prototype with built-in demo data.

## Stack
- React 19 + Vite + TypeScript. Only extra packages: `react-router-dom` and `lucide-react`. Plain web app at the top level of the repo: `index.html` (with `<div id="root">`) and entry `src/main.tsx`. No backend, no API calls, no `.env`.
- `HashRouter` (keep it — the app must work from any static host and in Figma Make)
- Icons: `lucide-react` only
- Styling: plain CSS in `src/styles.css` using CSS variables. **No Tailwind, no CSS reset libraries, no styled-components.**
- Font: Inter, from the font files in `src/fonts` (`src/fonts/inter.css`, imported in `src/main.tsx`). No Google Fonts link.
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

## Demo data
All data is sample data in `src/data/seed.ts`. Every change (invites, approvals, assignments, notes…) is saved in **sessionStorage**, so it survives a refresh in the same tab. **Reset demo data** is in the profile menu (top right) and at the bottom of Settings.

## Demo sign-in
1. Any email and any password → **Sign in**.
2. Security code **246810** → **Verify and sign in**.
3. First time only: the 4-step agency set-up (Agency details, Branches, Services, Invite your team — press Continue on each, or Skip for now on the last), then **Go to my dashboard**.

## Main flows
- **Dashboard** — today's visits, coverage, priority work queue (each item links to the right page), referral pipeline, team, calendar with "Add event", recent activity. "Invite a person" and "Download report" at the top.
- **Users & Roles** — invite a person; open someone to change role or branch, resend an invite, or switch off (needs a reason). Roles tab explains each role.
- **Agency & Branches** — edit agency details; add/edit/switch off branches (blocked while a branch has active clients).
- **Services & Lists** — 5 lists; add, rename, switch on/off.
- **Rules & Requirements** — blocking vs warning requirements, caregiver readiness, visit checks and who can approve, overrides.
- **Notifications** — in-app and email toggles per alert.
- **Referrals** — board/list of all referrals (Enquiry → Qualification → Assessment → Decision → Converted, plus Closed). Each card shows owner, days in stage, last contact and what's still needed. Clicking a referral opens its **own full screen** (`/referrals/:id`, `src/pages/ReferralDetail.tsx`), not a modal:
  - **Stage tracker** across the top. Click any stage to see its record. Finished stages are kept read-only — nothing is ever removed.
  - **Stage record** for the selected stage: Enquiry details form; Qualification checks (area, service, times, how it's paid); Assessment (book the home visit, then record care needs, risks, getting around, hours a week); Decision (service agreement signed, start date); Converted summary with a link to the client.
  - **Contact log**: every phone call, text, email, home visit or letter — who, what was said, the result, their response, and a follow-up date. Filter by all stages or the selected stage.
  - **To move on** checklist (rules in `src/data/referrals.ts`). Moving is **manual**: the "Move to …" button only works when the checklist is done. "Move on anyway" and "Go back" need a written reason.
  - Decision stage: "Accept & make client" (duplicate-name check, creates the client) or "Decline" (reason). Closing at any stage keeps every record.
  - Person summary, owner change (with reason), and an Activity list of every change.
- **Clients** — open a client to change coordinator or put on hold / restart care.
- **Schedule** — week board and list; open a visit to assign a caregiver (blocked caregivers need an override with a reason) or cancel (one or all repeats).
- **Visit Approvals** — approve one or many, or "Send back to fix" with a reason.
- **Incidents** — report an incident; set owner and date, move status, close with a final note.
- **Reports** — 6 reports with date/branch filters and CSV download.
- **Audit History** — read-only record of every change.
- **Settings** — profile, password, Reset demo data.

## Run
```
npm install
npm run dev     # preview
npm run build   # must finish with no errors
```
