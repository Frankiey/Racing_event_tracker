---
name: astro-frontend-conventions
description: >-
  RaceTrack frontend conventions for Astro + Tailwind v4 with vanilla JS only.
  USE FOR: creating or editing anything under src/components, src/pages,
  src/layouts, or src/lib client code — components, pages, styling, client-side
  interactivity, favorites, modals, time rendering. DO NOT USE FOR: Python
  pipeline work, editing data/ JSON, CI changes. FOR SINGLE OPERATIONS:
  one-line tweaks still follow these rules.
---

# Astro Frontend Conventions

Static-first Astro + Tailwind v4, dark mode only, no backend. Page map: `docs/architecture.md`.

## Non-negotiable rules

1. **No framework islands** — vanilla `<script>` only; no React/Vue/Svelte. Prefer static generation.
2. **Tailwind v4 cannot do dynamic class names** — variable-built `bg-[#hex]` fails at runtime. Use `style` with `getSeriesMeta(seriesId).color`; opacity tint = hex suffix (`color + '20'`).
3. **Times are UTC in data** — render via `<LocalTime>` / `data-local-time` (+ `data-format`); never format in a component or hardcode offsets. `data-utc` is NOT read.
4. **Country codes are ISO alpha-2** — `countryFlag()` returns empty for alpha-3.
5. **Session durations**: `getSessionDurationMinutes()` (`src/lib/sessions.ts`) — don't redefine maps.

## Client script pattern

```astro
<script>
  function init() { /* queries, listeners */ }
  init();
  document.addEventListener('astro:after-swap', init);
</script>
```

## Event bus

`rt-open-event` (detail: event) opens EventModal; `rt-favs-changed` syncs favorites; `rt-filters-changed` broadcasts filters. Favorites live in `localStorage['rt-favs']` (event-ID array) — dispatch `rt-favs-changed` after writing.

## Gotchas

- Sort `upcoming.json` by `dateStart` before per-series caps — not pre-sorted.
- New pages: add a `Nav.astro` link + instruction-file structure-map line.
- Keep `/status` (kiosk) minimal — small screens, auto-refresh.
