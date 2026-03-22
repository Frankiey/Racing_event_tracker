# RaceTrack — Claude Instructions

## Project Overview
RaceTrack is a static motorsport event tracker. It aggregates race calendars, session schedules, standings, and broadcast info across F1, F2, F3, Formula E, IndyCar, NASCAR, MotoGP, WEC/endurance, and more into a single dashboard.

## Tech Stack
- **Frontend:** Astro (static-first, island architecture) + Tailwind CSS v4
- **Data pipeline:** Python (managed with uv) — separate process from the website
- **Data:** JSON files in `data/` — medallion architecture (bronze → silver → gold)
- **Hosting:** GitHub Pages via GitHub Actions
- **No backend, no database, no auth**

## Project Structure
```
src/
  pages/          — Astro pages (.astro)
  components/     — Reusable UI components
  layouts/        — Page layouts
  styles/         — Global styles (Tailwind v4 via @import "tailwindcss")
pipeline/
  fetchers/       — Bronze layer: API fetch scripts (Python)
  transforms/     — Silver + gold layer transforms (Python)
  config.py       — Shared config (paths, API URLs, season year)
  utils.py        — HTTP client, JSON read/write helpers
  run.py          — Main pipeline entrypoint
data/
  bronze/         — Raw API responses (cached)
  silver/         — Cleaned/normalized per-series JSON
  gold/           — Merged calendar.json, upcoming.json
  seed/           — Manual JSON for series without APIs (FE, IndyCar, WEC, F2, F3)
public/           — Static assets (logos, flags, images)
```

## Key Conventions
- All times stored in UTC, converted to local time in the browser
- Data files are JSON, committed to the repo
- Series identifiers: `f1`, `f2`, `f3`, `fe`, `indycar`, `nascar`, `motogp`, `moto2`, `moto3`, `wec`
- Keep components small and focused
- Prefer static generation over client-side fetching
- Dark mode is the default theme

## Commands
- `npm run dev` — local Astro dev server with hot reload
- `npm run build` — production build
- `npm run preview` — preview production build locally
- `npm run fetch-data` — run Python data pipeline (`uv run python -m pipeline`)
- `uv run python -m pipeline --series f1,motogp` — fetch specific series only
- `uv run python -m pipeline --bronze-only` — fetch raw data without transforms

## Data Pipeline
Python scripts in `pipeline/` fetch from APIs (Jolpica/OpenF1 for F1, Pulselive for MotoGP, NASCAR CDN for NASCAR), normalize into the medallion layers, and write JSON to `data/`. Series without APIs (FE, IndyCar, WEC, F2, F3) use manually curated seed files in `data/seed/`. A GitHub Action runs this nightly and commits updated data.

## Data Sources
| Series | Source | Type |
|--------|--------|------|
| F1 | Jolpica API + OpenF1 | API (free, no auth) |
| MotoGP | Pulselive API | API (free, no auth) |
| NASCAR | NASCAR CDN | API (free, no auth) |
| F2, F3, FE, IndyCar, WEC | `data/seed/*.json` | Manual seed data |

## When Making Changes
- Check `docs/architecture.md` for system design decisions
- Check `worknotes.md` for current status and open questions
- Keep the `/status` route minimal — it targets small screens and kiosk displays
- Broadcast/where-to-watch data is manually curated in `data/gold/broadcasts.json`
