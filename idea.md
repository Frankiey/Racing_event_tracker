An app where you have an overview of all upcoming interesting races, like formula 1, 2 and 3
but also the indycar 24h races motogp and more. Just to have an overview. with races events dates locations and more. in the end i also want a where to watch. and a short view of upcoming weekend or events that could be display on some small screen as status.

---

# RaceTrack — Product Description

A clean, always-up-to-date hub for motorsport fans. No more checking five different websites to know when the next race weekend is, what channel it's on, or whether there's a clash with another series. One place, all the action.

---

## What It Is

A web app that aggregates upcoming motorsport events across all major series into a single dashboard. Designed to be fast, glanceable, and genuinely useful — whether you're planning your weekend or just want a quick status update on a small screen.

---

## Series Covered

- Formula 1, Formula 2, Formula 3
- Formula E
- IndyCar
- NASCAR Cup
- MotoGP, Moto2, Moto3
- World Superbike (WSBK)
- WEC (incl. Le Mans, Spa)
- IMSA WeatherTech SportsCar Championship (incl. Daytona 24h, Sebring 12h, Petit Le Mans)
- DTM
- NLS / Nürburgring-Langstrecken-Serie (incl. ADAC 24h Nürburgring)
- Super Formula

---

## Core Features

### Event Calendar
- Full season calendar per series
- Events show: round name, circuit, city/country, flag, date & local time, timezone
- Countdown timer to next session (qualifying, race, etc.)
- Weekend schedule breakdown: FP1/2/3, Qualifying, Sprint, Race — with times in your local timezone

### "This Weekend" Widget
- Compact view of everything happening in the next 7 days
- Designed to be embedded or displayed on a small screen (Raspberry Pi, old phone, smart display)
- Shows series logo, event name, session, and time remaining
- Dark mode by default — great for ambient displays

### Where to Watch
- Per-event broadcast info by country/region
- Streaming services (e.g. F1 TV Pro, ESPN+, Sky Sports, Viaplay, etc.)
- Free-to-air options highlighted
- Link out to official streaming pages

### Series Pages
- Per-series overview with season standings (drivers + constructors/teams)
- Circuit info: name, layout image, lap record, location on map
- Recent results for context

---

## Data Sources

| Source | What it provides |
|--------|-----------------|
| [Ergast API](http://ergast.com/mrd/) / [OpenF1 API](https://openf1.org/) | F1 race & session data, results, standings |
| [Jolpica API](https://github.com/jolpica/jolpica-f1) | Modern Ergast replacement, F1 data |
| [MotoGP official API / scrape] | MotoGP calendar and results |
| [Racing Reference / iRacing calendar feeds] | Broad motorsport calendar data |
| [TheSportsDB](https://www.thesportsdb.com/) | Multi-sport event data, free tier available |
| Manual YAML/JSON fixtures | Fill gaps for WEC, IndyCar, endurance races |
| Broadcast info | Manually curated per season, community-maintained |

---

## Tech Stack (vibe coding friendly)

- **Frontend:** Plain HTML/CSS/JS or a lightweight framework like Astro or SvelteKit — fast, static-friendly
- **Hosting:** GitHub Pages for static output (free, automatic deploys from `main`)
- **Data layer:** JSON files committed to the repo, refreshed via a scheduled GitHub Action that fetches from APIs, go for medallion based architcture for quick iterations
- **Local dev:** `npm run dev` with hot reload, no backend needed
- **Styling:** Tailwind CSS — great for quick iteration and dark mode
- **Icons/flags:** Flag emoji or a flags library; series logos as SVGs

---

## Small Screen / Status Display Mode

A dedicated `/status` route that renders a minimal, auto-refreshing view:
- Next 3 upcoming sessions across all series
- Series badge + event name + countdown
- Designed for: Raspberry Pi + browser in kiosk mode, old tablet on the wall, Tidbyt, or a Stream Deck plugin

---

## Nice-to-Have Ideas (later phases)

- Personal watchlist: star the series you care about, hide the rest
- Push notifications / calendar export (`.ics` file) for upcoming races
- "Clash detector" — alerts when two series race at the same time
- Weather widget for race weekend location
- Historical stats: "last time F1 raced at Monza..."
- Discord bot that posts upcoming races to a server channel
- Mobile PWA so it installs to your home screen

---

## Hosting Plan

1. **Local first** — `npm run dev`, iterate fast
2. **GitHub Pages** — push to `main`, GitHub Action builds and deploys static site automatically
3. **Custom domain** (optional) — point a cheap domain at GitHub Pages
4. **Data freshness** — GitHub Action on a cron schedule (e.g. nightly) fetches fresh data from APIs and commits updated JSON to the repo, triggering a redeploy

---

## Project Vibe

Minimal setup, maximum fun. Static where possible, no database, no auth, no infra to babysit. Looks great, loads fast, works offline after first load (PWA cache). Built to scratch your own itch — if it's useful to you, it'll be useful to other racing fans.
