# Airport Operations Platform — Web

Next.js 16 (App Router) frontend for the Airport Operations Platform.

## Run

```bash
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Environment

| Variable | Default | Meaning |
|---|---|---|
| `NEXT_PUBLIC_API_MOCK` | `1` (mock on) | Set to `0` to hit the real API |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | FastAPI base URL |

Mock mode serves typed fixtures from `lib/mock.ts` — demo login is prefilled on `/login`.

## Structure

- `app/login` — sign-in
- `app/ground/**` — Ground Staff role (least-privileged): dashboard, turnarounds, flights, baggage, incidents, schedule
- `components/layout` — app shell (sidebar + topbar), role guard
- `components/status` — `StatusChip` / `StatusDot`, the single source of truth for the color contract
- `lib/api.ts` — typed API functions; swap mock → real endpoints here only
- `lib/auth.ts` — session (localStorage) + `homeForRole()` routing map

## Color contract

Defined once in `app/globals.css` (status tokens):

- **Red** = danger / problem (incidents, failures, cancelled, mishandled)
- **Green** = done / on track / healthy
- **Yellow (amber)** = pending / waiting / delayed
- **Slate** = neutral information

Background is warm bone (`oklch(0.972 0.004 85)`), never pure white — tuned for
comfort across ages 20–60. Never hardcode status colors in components; use the
tokens via `StatusChip`.
