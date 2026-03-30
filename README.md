# RaceTrack 🏁

**All of motorsport. One dashboard.**

## [🏎 frankiey.github.io/Racing_event_tracker](https://frankiey.github.io/Racing_event_tracker)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Built with Astro](https://img.shields.io/badge/Astro-5.x-FF5D01?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Data refresh](https://img.shields.io/badge/Data-nightly_refresh-brightgreen?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/Frankiey/Racing_event_tracker/actions)
[![Built with Claude](https://img.shields.io/badge/Built_with-Claude_Code-5A2DB8?style=flat-square&logo=anthropic&logoColor=white)](https://claude.ai/code)

> No more bouncing between five websites to find out when the next race is, what channel it's on, or whether F1 and MotoGP clash this weekend. RaceTrack puts it all in one place — fast, clean, and always up to date.

---

## Why This Exists

Being a multi-series motorsport fan is a logistical nightmare. F1 has its own app. MotoGP has its own site. IndyCar, WEC, Formula E — all separate. Race times are buried in PDFs or presented in some random timezone. And every season you lose track of where your series is at in the standings.

RaceTrack fixes that. One URL, every series, your local times, your watchlist. That's it.

---

## Features

| | |
|---|---|
| **Dashboard** | Next 20 events across all series with live countdown |
| **Full Calendar** | Complete 2026 season grouped by month, jump-to-today |
| **Series Pages** | Per-series schedule with season progress bar |
| **Event Modal** | Full session breakdown with local times on click |
| **Watchlist** | Star events you care about — stored locally, no account needed |
| **Kiosk / Status View** | Minimal `/status` route for Raspberry Pi, wall tablets, small screens |
| **Local Times** | Every session in your timezone — no configuration, just works |
| **Dark Mode** | Default and only mode, as the racing gods intended |

---

## Series Covered

| Series | Data Source | Status |
|--------|-------------|--------|
| Formula 1 | Jolpica API (live) | ✅ |
| Formula 2 | Seed data | ✅ |
| Formula 3 | Seed data | ✅ |
| Formula E | Seed data | ✅ |
| IndyCar | Seed data | ✅ |
| MotoGP + Moto2 + Moto3 | Pulselive API (live) | ✅ |
| NASCAR | NASCAR CDN (live) | ✅ |
| WEC / Endurance (Le Mans, Spa 24h...) | Seed data | ✅ |
| IMSA WeatherTech (incl. Daytona 24h, Sebring 12h) | Seed data | ✅ |
| DTM | Seed data | ✅ |
| NLS / Nürburgring (incl. ADAC 24h Nürburgring) | Seed data | ✅ |
| World Superbike (WSBK) | Pulselive API + seed fallback | ✅ |
| Super Formula | Seed data | ✅ |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | [Astro](https://astro.build) | Static-first, zero JS by default, fast |
| Styling | Tailwind CSS v4 | Rapid iteration, great dark mode |
| Interactivity | Vanilla JS | No bundle overhead, no framework lock-in |
| Data pipeline | Python + [uv](https://github.com/astral-sh/uv) | Fast, reproducible, no venv friction |
| Data architecture | Medallion JSON (bronze → silver → gold) | Easy to debug, cache-friendly, versionable |
| Hosting | GitHub Pages | Free, automatic deploys on push |
| CI / Data refresh | GitHub Actions | Nightly fetch + commit + deploy |

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

# Start the dev server (data is already committed — no pipeline run needed)
npm run dev
```

To refresh race data from upstream APIs:

```bash
# All series
npm run fetch-data

# Specific series only
uv run python -m pipeline --series f1,motogp

# Raw fetch only, no transforms
uv run python -m pipeline --bronze-only
```

---

## Project Structure

```
src/
  pages/          Astro pages (index, calendar, watchlist, status, series/[id])
  components/     EventCard, EventModal, Countdown, SeriesBadge, Nav, ...
  lib/            series.ts metadata, time.ts utilities
  styles/         Tailwind v4 + global animations
pipeline/
  fetchers/       Bronze layer: raw API fetch scripts
  transforms/     Silver + gold layer normalization
data/
  bronze/         Raw cached API responses
  silver/         Normalized per-series JSON
  gold/           calendar.json + upcoming.json (consumed by Astro)
  seed/           Manual JSON for series without public APIs
docs/             Architecture decisions and data schema
```

Full architecture: [docs/architecture.md](docs/architecture.md)

---

## Contributing

Contributions are welcome — bug fixes, new series data, UI improvements, pipeline improvements. If you follow motorsport, you probably already know what's missing.

**Before you start:** open an issue so we can align. For small fixes, just send a PR.

**Good first contributions:**
- Fix or update seed data for a series you follow closely
- Improve mobile layout or accessibility
- Add a missing circuit or event detail
- Fix a timezone edge case in a specific region

**Code conventions (short version):**
- Components in `src/components/` — keep them small and focused
- Interactivity is vanilla `<script>` tags — no React, Vue, or Svelte
- Dynamic colors always use `style=` — Tailwind v4 doesn't support dynamic class names
- Times stored as UTC, converted in the browser via `data-local-time` attribute
- Series IDs: `f1`, `f2`, `f3`, `fe`, `indycar`, `nascar`, `motogp`, `wec`, `imsa`, `dtm`, `nls`, `wsbk`, `superformula`

See [docs/architecture.md](docs/architecture.md) for the full picture.

---

## AI-Assisted Development

This project is developed with [Claude Code](https://claude.ai/code) — Anthropic's AI coding assistant — as a first-class collaborator. The codebase includes project-specific Claude instructions ([CLAUDE.md](CLAUDE.md)) and slash commands (`.claude/commands/`) that make Claude immediately productive in this repo.

**If you use Claude Code**, just open the repo and it already knows:
- The data architecture and series identifiers
- Tailwind v4 gotchas specific to this project
- How to add a new series end-to-end
- The issue tracking workflow (`bd`)

Try these slash commands once you've cloned the repo:

| Command | What it does |
|---------|-------------|
| `/add-series` | Step-by-step guide to add a new motorsport series |
| `/pipeline-debug` | Diagnose and fix data pipeline issues |
| `/new-component` | Scaffold a new Astro component following project conventions |

---

## License

[MIT](LICENSE) — free to use, fork, build on.

---

*Built to scratch your own itch. If it's useful to you, it'll be useful to other racing fans.*
