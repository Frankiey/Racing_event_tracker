# Work Notes — RaceTrack

## Current Status
**Frontend and data coverage expanded** (updated 2026-04-06). Build succeeds, core pages render from the gold layer, and the site now covers 16 tracked series/routes including passport, recap, watchlist, widgets, and kiosk mode.

## What was built (v2 frontend — 2026-03-28)

### Changes
- **Bug fix**: EventCard session times now convert to local timezone (`data-local-time` was broken, used wrong attr `data-utc`)
- **Flags**: `countryFlag()` in `time.ts` — alpha-2 country code → emoji flag, shown in EventCard
- **Past event dimming**: `isPastEvent()` in `time.ts`; past events shown at 50% opacity with "Done" badge
- **Session abbrevations**: FP1/FP2/FP3, Quali, Sprint, etc. instead of full names
- **Dashboard**: max-w-5xl, richer countdown (series badge + circuit + flag), season stats bar per series
- **Calendar**: jump-to-today button, month anchors, current month green dot, past months dimmed
- **Series pages**: `/series/[id]` for all 8 series — season progress bar, next race callout, monthly schedule
- **Nav**: Series dropdown menu linking to all 8 series pages, Status link

## What was built (v1 frontend)

### Pages
| Route | Description | Data source |
|-------|-------------|-------------|
| `/` | Dashboard — next 20 upcoming events, grouped by week, with countdown timer to next race | `gold/upcoming.json` |
| `/calendar` | Full 2026 season calendar — all 148 events grouped by month, with sticky month headers | `gold/calendar.json` |
| `/status` | Kiosk/small-screen view — countdown to next race + next 4 events, auto-refreshes every 5 min | `gold/upcoming.json` |

### Components
| Component | Type | Description |
|-----------|------|-------------|
| `Nav` | Static | Sticky top nav with page links |
| `SeriesBadge` | Static | Colored pill with series short name (F1, MotoGP, etc.) |
| `EventCard` | Static | Card showing event name, circuit, dates, and session dots |
| `SeriesFilter` | Client JS | Toggle buttons to filter events by series — uses `data-series` attributes |
| `Countdown` | Client JS | Live countdown timer (days:hrs:min:sec) to a target UTC time |
| `LocalTime` | Client JS | Converts UTC timestamps to user's local timezone in-browser |

### Shared Code
| File | Purpose |
|------|---------|
| `src/lib/series.ts` | Series metadata — colors, labels, sort order for all 8 series |
| `src/lib/time.ts` | Time helpers — date range formatting, placeholder detection, race session finder |

### Architecture Decisions
- **No framework islands** — Used vanilla `<script>` tags for client interactivity (countdown, filter, local time). Keeps bundle tiny and avoids React/Vue/Svelte dependency.
- **Series filter uses CSS display toggle** — Components emit `data-series` attributes, filter script toggles `display:none`. Simple, fast, no re-rendering.
- **Countdown renders server-side placeholder** — Shows `--` until client JS hydrates. No layout shift.
- **Status page is "bare"** — No nav bar, auto-refreshes, designed for kiosk.
- **Placeholder time detection** — NASCAR data has `1900-01-01T00:00:00Z` for missing qualifying times. These are filtered out of session displays.
- **Week grouping on dashboard** — Events grouped as "Today", "Tomorrow", "This week", "Next week", then by month.

## Next Steps
1. Add broadcast/where-to-watch info from `gold/broadcasts.json`
2. Improve mobile responsive design
3. Implement kiosk auto-rotation between upcoming races on `/status`
4. Add standings data per series

## Decisions Made
- Astro over plain HTML — gives us components, routing, and static build for free
- Medallion architecture for data — bronze/silver/gold layers
- Dark mode as default — primary use case is ambient/status display
- GitHub Pages hosting — free, simple, auto-deploys from main
- Vanilla JS over framework islands — minimal client JS, no extra dependencies
- Series colors are distinct per-series, using Tailwind palette colors

## Known Limitations
- No real-time updates — data refreshes on cron schedule (nightly)
- Broadcast info must be manually curated per season
- NASCAR qualifying times are placeholders (1900 date) — hidden in UI
- Country codes are inconsistent across series (alpha-2 vs alpha-3)
