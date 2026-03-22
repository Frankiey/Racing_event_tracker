# Work Notes — RaceTrack

## Current Status
**Frontend v1 built** (2026-03-22). Three pages rendering with real data from the gold layer. Build succeeds, all 148 events display across 8 series.

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
1. Add series-specific page (`/series/[id]`) with per-series schedule
2. Add broadcast/where-to-watch info from `gold/broadcasts.json`
3. Add country flags next to circuit locations
4. Improve mobile responsive design
5. Add past/completed event styling (greyed out)
6. Implement kiosk auto-rotation between upcoming races on `/status`

## Open Questions
- How to handle endurance race sessions (24h+ duration) in the session schema?
- Broadcast data: start with which regions? NL + US + UK as minimum?
- F2/F3 schedule — is it always co-located with F1 weekends or are there exceptions?
- Should the calendar page have a "jump to current month" feature?

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
- Some series (DTM, IMSA) deferred to later phases
- NASCAR qualifying times are placeholders (1900 date) — hidden in UI
- Country codes are inconsistent across series (alpha-2 vs alpha-3)
