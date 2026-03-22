# Copilot Instructions — RaceTrack

## Context
This is a static motorsport event tracker built with Astro + Tailwind CSS v4. It aggregates race calendars across multiple series (F1, MotoGP, IndyCar, WEC, etc.) into one dashboard. No backend — data lives as JSON files in `data/`.

The data pipeline is Python (managed with uv), completely separate from the Astro frontend. Pipeline code lives in `pipeline/`.

## Conventions
- Astro components for pages, Tailwind v4 for all styling
- Dark mode is the default (`class="dark"` on html)
- All dates/times in UTC internally, display in user's local timezone
- Series IDs: `f1`, `f2`, `f3`, `fe`, `indycar`, `nascar`, `motogp`, `moto2`, `moto3`, `wec`
- Data follows medallion architecture: bronze (raw) → silver (clean) → gold (display-ready)
- Keep components small, focused, and statically renderable
- Prefer Astro's static generation — only use client-side JS for interactivity (countdowns, timezone conversion)
- Python pipeline uses httpx, managed with uv

## Don't
- Don't add a backend or database
- Don't over-abstract — keep it simple and direct
- Don't use heavy client-side frameworks — Astro islands only where needed
- Don't hardcode timezone offsets — always use Intl/browser APIs
