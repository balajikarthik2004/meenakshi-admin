# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Operations console for Sri Meenakshi Temple Society, Pearland TX — a companion admin
app to `../meenakshi-devotee` (the public/devotee-facing app), sharing the same seed
data and design tokens. Stack: Vite · React 19 · TypeScript · Tailwind v4 · hand-rolled
shadcn-style `components/ui` · react-router-dom v7 · zustand · recharts.

## Commands

```bash
npm install && npm run dev   # local dev server
npm run build                # tsc -b && vite build
npm run preview              # preview a production build
npm run lint                 # oxlint
npm run format                # prettier --write .
```

There is no test suite/command in this repo.

Path alias: `@/*` → `./src/*` (set in both `vite.config.ts` and `tsconfig.app.json`).

## Data layer — the one seam that matters

Everything reads and writes in-memory mock data. `src/lib/data/api.ts` is the single
seam between the UI and the data — every screen calls an async function from there
(`listDonations`, `getYearlyContributions`, `setBookingStatus`, etc.), never the mock
arrays directly. Swapping each function body for a real `fetch` call moves the app to
a real backend without touching a single page. Mock seed data lives in
`src/lib/data/mock/` (identical seed to `meenakshi-devotee`) and shapes are in
`src/lib/data/types.ts`.

Several entity pairs in `types.ts` deliberately split "intent" from "what actually
happened" rather than collapsing them into one status field — read the doc comments
above `ApprovalStage` vs `Booking.status`, `PujaRequirementSheet` vs `StockItem` vs
`StockMovement`, and `VolunteerInvite` vs `VolunteerAssignment` before changing any of
those flows; the split exists so questions like "we asked forty people and eleven
turned up" stay answerable.

## Pledges: a promise is not a donation

`Pledge` in `types.ts` is deliberately its own record rather than a flag on `Donation`
— the same "intent vs. what actually happened" split as `ApprovalStage` vs
`Booking.status`. The pledge register (`/donations/pledges`) reports outstanding money
*beside* the ledger and never inside it: a pledge is not income, is absent from
`getAdminStats().donations` and from the collected figure on `/transparency`, and
carries no tax receipt. The transparency screen shows it as its own strip for exactly
this reason.

`settlePledgeInstallment` is the one crossing point — it mints a real `Donation`
carrying `pledgeId`, which is what makes the money receiptable and puts it in the YTD
figure. `writeOffPledge` and `skipPledgeInstallment` are the two ways work leaves the
chase list without money arriving; neither touches instalments already paid. All the
arithmetic lives in `src/lib/pledge.ts`, kept byte-identical with the devotee app's
copy, as are `mock/pledges.ts` and `components/shared/PledgeSchedule.tsx`. The seed is
forward-only (no instalment starts life paid), so it cannot disturb the $723,000
reconciliation the donation seed is built around.

## Auth & routing

Mock auth in `src/lib/store/auth.ts` (zustand + persist) — `signIn` accepts anything
and resolves to a seeded user; there is no credential check. `/signin` offers three
roles: Admin (Meera Sundaram), Priest (Ramesh Iyer), Board (Perumal Annamalai).

Route guards live in `src/components/layout/AdminLayout.tsx`:
- `RequireAdminAuth` — must be signed in at all.
- `RequireRole roles={[...]}` — gates a route to specific roles, with an explicit
  `fallback` (never left at the dashboard default) so a wrong-role user lands
  somewhere relevant to them, not on data that isn't their business.
- `RequireBoard` — `/board` only; everyone else redirects to `/transparency`.

A page's audience (nav visibility, guard, and sign-in role list) is declared once in
`src/lib/nav.ts` and read by the guards, the nav rail, and sign-in — keep those in
sync by editing `nav.ts` rather than restating a role list inline in a route.

Routes are lazily loaded in `src/App.tsx` specifically to keep `recharts` out of the
initial bundle — only Dashboard and Transparency pull it in. Follow that pattern for
any new heavy dependency (e.g. `jspdf`/`html2canvas`, used by the receipt feature).

## Capital projects

`/projects` is the register; `mock/projects.ts` is four projects whose raised and spent
totals must equal `PROJECTS_RAISED` / `PROJECTS_SPENT`, which `misc.ts` imports as the
construction head of `TRANSPARENCY`. The transparency page counts the same money a
second way, so editing a project without rebalancing its siblings puts a variance row
on that page — the seed asserts it at import instead.

`recordProjectExpense` recomputes `spentAmount` from the lines rather than incrementing
it, which is the runtime half of the same rule; `hydrateProjects` does the same on
load. Expenses the console books are stored whole in `LOCAL_KEYS.projects` because they
exist nowhere else, while progress, status and notes are stored as changed fields over
the seed — the `hydrateApprovals` shape.

`ProjectMoneyFlow` and `src/lib/project.ts` are byte-identical with the devotee app, so
the board and the public read one computation rather than two that agree today. Funding
and work-completed are separate bars on purpose.

## Membership: two prices, one membership

`MembershipTier` is `'normal' | 'senior'`. The senior rate is a concession restricted to
devotees aged `SENIOR_MIN_AGE` (65) and over, not a lesser tier — same benefits plus
reserved festival seating. The console is held to the eligibility rule too: the "gift a
membership" sheet disables the senior option for a recipient who does not qualify and
says which of the two reasons applies. All of it comes from `src/lib/membership.ts`,
shared byte-identically with the devotee app.

## The cafeteria

`/kitchen` is the kitchen display — a working surface read from a tablet by the pass,
which is why it breaks the console's house style on purpose: huge tokens, thumb-sized
buttons, and an unaccepted ticket drawn as a red sticky note. The one failure a
kitchen board exists to prevent is a ticket sitting unseen, so every other state on it
is deliberately quieter. It polls every ten seconds, and `AdminLayout` carries a live
count on the nav row so somebody three screens away still knows a ticket landed.

The `kitchen` role reaches `/kitchen` and `/kitchen/menu` and nothing else. Service
times are published in `src/lib/kitchen.ts` and are not editable from the console —
they are a commitment the temple office makes, not something to change during a rush.
Taking a dish off the board is editable, and reaches the devotee site immediately.

`ticketUrgency` returns `ontime` for collected and cancelled tickets: without that
every finished order turns red the moment its promised time passes, which is always,
and the board's one alarming colour stops meaning anything.

## The Vedic Heritage School

`/school` has two tabs. **Enrolments** is the worklist, sorted by `ACTION_ORDER` so
unpaid registrations and waiting-list names come first — sorted by status name it
opened on a screen of settled rows while the unpaid ones, which are the page's own
headline figure, sat below the fold. **Classes** is the capacity view.

Every figure comes from `src/lib/school.ts`, shared byte-identically with the devotee
app, so a parent told online that a class is full and a coordinator reading this
register cannot disagree. `promoteFromWaitlist` refuses when the class is still full
rather than quietly over-filling it.

`StatusPill` takes an optional `label` because `titleCase` renders `pending-payment`
as "Pending Payment" while the rest of the module calls that state "Awaiting payment".

The `school` role reaches `/school` and nothing else. As with `kitchen`, a role with a
sign-in card and no seeded user signs in as a devotee and gets bounced — `usr_school`
exists for exactly that reason.

## UI conventions

- `components/ui/` — local shadcn-style primitives (`Button`, `Dialog`/`Sheet`,
  `DataTable`, `Toolbar`, toast, etc.). Prefer these over adding a new dependency.
- `components/admin/` — admin-specific composites (`DataTable`, `Toolbar`, chart
  theme). `components/shared/` — shared with the devotee app's equivalents
  (`Logo`, `TaxReceiptPreview`, `TransactionReceipt`, state placeholders).
- Tailwind v4 is configured CSS-natively via `@theme` in `src/index.css` — there is no
  `tailwind.config.js`. Brand/saffron/gold/ink/muted/line/bg tokens are copied from
  `meenakshi-devotee`'s `index.css` verbatim ("keep in sync" per its own comment); this
  app adds console-only neutrals and a tighter type/radius scale on top.
- Printable views (`TaxReceiptPreview`, `TransactionReceipt`) use a `.print-area` /
  `.no-print` convention defined in `src/index.css`'s `@media print` block —
  `window.print()` hides everything except the marked node. `TransactionReceipt`
  additionally supports a true PDF file via `src/lib/pdf.ts` (`downloadElementAsPdf`,
  html2canvas → jsPDF) for cases where a print dialog isn't enough.
- `src/lib/utils.ts` holds the shared formatters (`money`, `fmtDate`/`fmtDateTime`,
  `titleCase` — note its `ACRONYMS` set for things like ACH/EIN — `downloadCSV`). Use
  these instead of re-implementing formatting in a page.

## Design assets

`public/deities/` holds temple photography and the actual reference receipt letterhead
(`recipt.png`) used by `TransactionReceipt`. Per its `CREDITS.md`, the deity photos are
public-domain/CC placeholders — replace with the Temple Society's own photography
before production. The display face (Marcellus) is self-hosted for LCP reasons; don't
add a Google Fonts request for it.
