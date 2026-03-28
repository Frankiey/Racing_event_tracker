# RaceTrack

**All of motorsport. One dashboard.**

> No more bouncing between five websites to find out when the next race is, what channel it's on, or whether F1 and MotoGP clash this weekend. RaceTrack puts it all in one place — fast, clean, and always up to date.

---

## What Is This?

RaceTrack is an open-source motorsport event tracker for fans who follow more than one series. It aggregates race calendars, session schedules, and standings from F1, MotoGP, IndyCar, WEC, Formula E, NASCAR, and more into a single static web app.

**Live site:** [frankiey.github.io/Racing_event_tracker](https://frankiey.github.io/Racing_event_tracker)

---

## Series Covered

| Series | Status |
|--------|--------|
| Formula 1 | Live via Jolpica API |
| Formula 2 & F3 | Seed data |
| Formula E | Seed data |
| IndyCar | Seed data |
| MotoGP, Moto2, Moto3 | Live via Pulselive API |
| NASCAR | Live via NASCAR CDN |
| WEC / Endurance (Le Mans, Spa 24h, etc.) | Seed data |

---

## Features

- **Dashboard** — next 20 events across all series, countdown hero, live session status
- **Full calendar** — complete 2026 season grouped by month with jump-to-today
- **Series pages** — per-series schedule with season progress bar
- **Watchlist** — star events you care about, saved in your browser (no account needed)
- **Status / kiosk view** — minimal `/status` route designed for Raspberry Pi, wall tablet, or small screen
- **Local times** — all sessions shown in your local timezone, no configuration needed
- **Dark mode** — default and only mode, as the racing gods intended

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | [Astro](https://astro.build) (static-first) + Tailwind CSS v4 |
| Interactivity | Vanilla JS — no framework islands |
| Data pipeline | Python + [uv](https://github.com/astral-sh/uv) |
| Data architecture | Medallion (bronze → silver → gold) JSON files |
| Hosting | GitHub Pages, deployed via GitHub Actions |

No backend. No database. No auth. No infra to babysit.

---

## Running Locally

**Prerequisites:** Node.js 18+, Python 3.11+, [uv](https://github.com/astral-sh/uv)

```bash
# Clone the repo
git clone https://github.com/Frankiey/Racing_event_tracker.git
cd Racing_event_tracker

# Install frontend deps
npm install

# Start the dev server (data is already committed to the repo)
npm run dev
```

To refresh the race data from upstream APIs:

```bash
# Fetch all series
npm run fetch-data

# Or fetch specific series only
uv run python -m pipeline --series f1,motogp
```

---

## Project Structure

```
src/            Astro pages, components, and layouts
pipeline/       Python data pipeline (fetchers + transforms)
data/
  bronze/       Raw cached API responses
  silver/       Normalized per-series JSON
  gold/         Merged calendar.json + upcoming.json
data/seed/      Manual JSON for series without public APIs
public/         Static assets (logos, flags)
docs/           Architecture and design decisions
```

Full architecture details: [docs/architecture.md](docs/architecture.md)

---

## Contributing

Contributions are welcome — bug fixes, new series data, UI improvements, anything.

**Before you start:**

1. Check [open issues](https://github.com/Frankiey/Racing_event_tracker/issues) — something might already be tracked
2. For non-trivial changes, open an issue first so we can align on approach
3. Keep PRs focused — one thing at a time

**Good first contributions:**

- Fix or improve seed data for a series you follow
- Improve mobile layout
- Add a missing circuit or event detail
- Fix a timezone edge case

**Code style:**
- Components live in `src/components/` and should stay small and focused
- All interactivity is vanilla JS — no React, no Vue, no Svelte
- Dynamic colors always use `style=` (not Tailwind dynamic classes — see [Tailwind v4 note](docs/architecture.md))
- Times are stored as UTC and converted in the browser

---

## Data Pipeline

The pipeline runs nightly via GitHub Actions, fetches from free public APIs, and commits updated JSON to the repo — triggering an automatic redeploy. Series without APIs (FE, IndyCar, WEC, F2, F3) use manually curated seed files in `data/seed/`.

See [docs/architecture.md](docs/architecture.md) for the full medallion data flow.

---

## License

[MIT](LICENSE) — free to use, fork, and build on.

---

*Built to scratch your own itch. If it's useful to you, it'll be useful to other racing fans.*
