# Prompt 01 — Role: `ground` (Ground Handling Staff) — LOWEST ROLE

> Role hierarchy: `admin > ops > airline > ground`
> This is the first and least-privileged role. Everything built here (design tokens, layout shell, shared components) becomes the foundation for every higher role.

---

## 1. Role Definition

**Who they are:** Ground handling crew — ramp agents, baggage handlers, turnaround coordinators, gate agents. They work shifts, they are on their feet, they glance at screens quickly. They do NOT create or delete flights, do NOT see airline-commercial data, do NOT manage users or airports.

**Permission scope (least privilege):**
- ✅ View all flights (read-only board)
- ✅ View assigned turnarounds / tasks for their shift
- ✅ Update turnaround progress steps (checklist state)
- ✅ View & scan baggage events for their assigned flights
- ✅ Report incidents (create only)
- ✅ View their own shift schedule and staff assignments
- ❌ Create / edit / delete flights (403)
- ❌ Create airports, manage gates, view charges/revenue
- ❌ See other airlines' internal data beyond the operational board
- ❌ Manage users or roles

**Backend reality check (current code):**
- Role exists in seed (`apps/api/seed/seed.py`) but `ground` is not enforced anywhere yet.
- Endpoints the pages will consume today: `GET /flights`, `GET /flights/{id}`, `GET /airports`, `POST /auth/login`, `GET /auth/me`.
- Turnaround / baggage / incident / shift models exist in `apps/api/app/modules/operations/models.py` but have **no routers yet**. Build the UI against clearly-typed API client functions with mockable data, so wiring real endpoints later is a one-file change.

---

## 2. Design Foundation — Color System (built once, reused by ALL roles)

### 2.1 Color psychology contract

| Token | Color | Meaning — use ONLY for this |
|---|---|---|
| `status-critical` | Red (muted) | Danger, incidents, failures, overdue, blocked |
| `status-ok` | Green (muted) | On track, completed, healthy, work progressing well |
| **`status-pending`** | **Yellow / amber (muted)** | **Waiting, pending, queued, awaiting confirmation** |
| `status-neutral` | Slate/gray | Informational, no status, scheduled/inactive |

Rules:
- Red is never decorative. If a screen is mostly red, the screen is wrong.
- Green never marks "new" — only "done/healthy/on-track".
- Yellow = anything not yet started or waiting on someone/something.
- Never color by airline or by importance alone — color only by **state**.

### 2.2 Eye-comfort neutral base (age range 20–60)

Do **not** use pure white (`oklch(1 0 0)`) or pure black. Replace the stock shadcn tokens in `apps/web/app/globals.css`:

```
--background:        oklch(0.972 0.004 85)   /* warm bone — soft, non-glaring */
--card:              oklch(0.985 0.003 85)   /* slightly lifted surface */
--surface-secondary: oklch(0.955 0.005 85)   /* panels, table stripes */
--foreground:        oklch(0.22 0.01 60)     /* soft charcoal, not pure black */
--muted-foreground:  oklch(0.48 0.01 60)     /* secondary text */

/* Status — desaturated so they never vibrate on screen */
--status-critical:   oklch(0.55 0.19 25)     /* muted red   */
--status-ok:         oklch(0.60 0.13 155)    /* muted green */
--status-pending:    oklch(0.75 0.14 80)     /* muted amber */
--status-neutral:    oklch(0.65 0.01 260)    /* slate       */
```

Rationale: warm off-white lowers glare for younger users on long shifts and stays readable without strain for 35–60 users; desaturated status colors keep meaning without alarm fatigue. All pairs must pass **WCAG AA (4.5:1)** for text.

### 2.3 Dark mode
The `dark` variant already exists in `globals.css`. Ship light theme first; keep all new colors in tokens (never hardcode hex in components) so dark mode is a token swap later.

---

## 3. Pages to Build (ground role — entire set)

```
apps/web/app/(ground)/
├── layout.tsx              # App shell: left sidebar nav + top bar (role badge, shift info, logout)
├── page.tsx                # Dashboard (home)
├── turnaround/
│   ├── page.tsx            # Turnaround board (list of today's turnarounds)
│   └── [id]/page.tsx       # Turnaround detail (step checklist, timeline)
├── flights/
│   ├── page.tsx            # Live flight board (read-only)
│   └── [id]/page.tsx       # Flight detail (gate, times, assigned crew, baggage status)
├── baggage/
│   └── page.tsx            # Baggage tracking (scan input + event stream)
├── incidents/
│   ├── page.tsx            # Incident list (filters: open / resolved)
│   └── new/page.tsx        # Report incident form
└── schedule/
    └── page.tsx            # My shift & assignments (week view)
```

### Page specs

**Dashboard** — shift-aware home.
- Top: 4 KPI tiles — Turnarounds in progress (`status-ok` border), Awaiting departure (`status-pending`), Open incidents (`status-critical`), Next task countdown (neutral).
- Middle: "My current tasks" list (priority-ordered, status dot per row) + "Airport live board" compact strip (next 5 departures/arrivals).
- Bottom: shift progress bar (elapsed vs. remaining).

**Turnaround board** — table/cards of today's turnarounds keyed by flight.
- Columns: Flight, Airline, Gate, STD/STA, Status chip, Progress %, Assigned team.
- Status chip mapping: `scheduled` → neutral, `in_progress` → ok, `delayed` → pending, `incident` → critical.
- Click row → detail page.

**Turnaround detail** — the core working screen.
- Step checklist (on-blocks, passengers deplaned, cleaning, catering, fueling, baggage load, pushback-ready). Each step: state = done (green) / current (amber ring) / not started (neutral) / failed (red). Toggle updates progress %.
- Vertical timeline of FlightEvents (timestamped, colored by state).
- Right rail: baggage summary, crew assigned, "Report incident" button.

**Live flight board** — read-only, big scanability.
- Tabs: Departures / Arrivals. Rows show time, flight, destination/origin, gate, status chip.
- Red row highlight only for cancelled/critical; amber for delayed; green for on-time/boarded.
- Search by flight number, filter by terminal.

**Flight detail** — everything about one flight for ground crew: schedule, gate, aircraft type, turnaround checklist snapshot, baggage counts, assigned staff, event timeline.

**Baggage tracking** — barcode/bag-tag input field at top; submitting appends to a live event stream (`received → screened → loaded → offloaded` states using the color contract). Summary counters: loaded / pending (amber) / mishandled (red).

**Incidents** — list with severity chips (low=neutral, medium=pending, high=critical) and status (open/resolved). "Report incident" form: type (baggage, safety, delay, equipment, passenger), severity, flight (select), description, optional photo. On submit → success state, incident appears at top with amber "open" chip.

**My schedule** — week grid of shifts + staff assignments: day cards showing shift window, position, assigned gate/zone, teammates. Today's card highlighted with neutral ring (not red/green — schedule has no good/bad state).

### Navigation (sidebar)
Dashboard · Turnarounds · Flights · Baggage · Incidents · My Schedule — icons from `lucide-react`. Sidebar collapsed on mobile into a sheet/drawer. Role badge "Ground Staff" in top bar.

---

## 4. Shared Components to Build

- `components/layout/app-shell.tsx` — sidebar + topbar shell used by every role later
- `components/layout/sidebar.tsx`, `components/layout/topbar.tsx`
- `components/status/status-chip.tsx` — maps a status string → token color + label (single source of truth for the color contract)
- `components/status/status-dot.tsx`
- `components/kpi/kpi-tile.tsx`
- `components/data/data-table.tsx` — generic table: sorting, empty state, loading skeletons
- `components/flight/flight-row.tsx`
- `components/turnaround/step-checklist.tsx`
- `components/incident/incident-form.tsx`
- `components/baggage/baggage-scanner-input.tsx`
- `components/ui/*` — extend shadcn (card, badge, tabs, dialog, input, select, skeleton, sheet, avatar, table, dropdown) as needed

---

## 5. Technical Constraints

- **Stack:** Next.js 16 App Router, React 19, TS strict, Tailwind v4 (CSS-first tokens in `globals.css`), shadcn (base-nova), `lucide-react`.
- **Read `apps/web/AGENTS.md` first** — Next 16 has breaking changes; consult `node_modules/next/dist/docs/` before writing code.
- **Auth:** login page (`/login`), JWT stored client-side, `lib/api/client.ts` with fetch wrapper that attaches `Authorization: Bearer`, redirects to `/login` on 401, and exposes typed helpers (`getFlights`, `login`, `getMe`, …). Route guard: middleware or layout check — unauthenticated → `/login`; logged-in user whose role ≠ `ground` → redirect to their home.
- **Mock mode:** `lib/api/mock.ts` + `NEXT_PUBLIC_API_MOCK=1` flag serves typed fixture data so all pages are demo-able before operations endpoints exist.
- **No hardcoded colors in components** — tokens only. Status color chosen exclusively via `status-chip`/token vars.
- **Responsive:** desktop-first (ops rooms), but must not break at 768px.
- **Files to remove** from starter: `app/page.tsx` default content (replaced), default `public/*.svg` assets, stock content in `README.md` of `apps/web`.

---

## 6. Acceptance Criteria

1. `npm run build` in `apps/web` passes; `npm run lint` clean.
2. Login as a mock `ground` user → land on dashboard; any other route guarded.
3. All 8 pages render with realistic airport data; no page uses `#fff` background or raw hex status colors.
4. Status chips: every state shown maps correctly — red=danger, green=done/on-track, yellow=pending, neutral=info.
5. Color contrast passes WCAG AA on all text.
6. Sidebar navigation works between all pages; mobile drawer works at 768px.
7. Incident form submits and reflects in list (mock mode); turnaround checklist toggles update progress %.
8. Zero references to roles/permissions above `ground` in this codebase slice.
