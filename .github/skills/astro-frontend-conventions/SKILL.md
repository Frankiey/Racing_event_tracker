---
name: astro-frontend-conventions
description: >-
  RaceTrack frontend conventions for Astro + Tailwind v4 with vanilla JS only.
  USE FOR: creating or editing anything under src/components, src/pages,
  src/layouts, or src/lib client code — components, pages, styling, client-side
  interactivity, favorites, modals, time rendering. DO NOT USE FOR: Python
  pipeline work, editing data/ JSON files, CI/workflow changes.
---

# Astro Frontend Conventions

Static-first Astro + Tailwind CSS v4, dark mode only. No backend. Full page/module map: `docs/architecture.md` ("Page Architecture" and "Frontend Support Modules").

## Non-negotiable rules

1. **No framework islands** — vanilla `<script>` tags only; no React/Vue/Svelte. Prefer static generation over client-side fetching.
2. **Tailwind v4 cannot do dynamic class names** — `bg-[#hex]` built from a variable does NOT work at runtime. Always use `style="background: #hex"` for series colors. Get colors from `getSeriesMeta(seriesId).color` in `src/lib/series.ts`. Hex opacity tint: append suffix, e.g. `color + '20'` (~12%).
3. **Times are UTC everywhere in data** — render with `<LocalTime>` / the `data-local-time` attribute (plus `data-format`, e.g. `time-short`); never format times in a component, never hardcode timezone offsets (use `Intl`/browser APIs). `data-utc` is NOT read by the hydration script.
4. **Country codes are ISO alpha-2** — `countryFlag()` silently returns an empty string for alpha-3.
5. **Session durations** come from `getSessionDurationMinutes()` in `src/lib/sessions.ts` — don't redefine duration maps.
6. Keep components small and focused; make the smallest change that satisfies the request.

## Client script pattern

Init once on load, re-init on Astro page transitions:

```astro
<script>
  function init() { /* DOM queries, listeners */ }
  init();
  document.addEventListener('astro:after-swap', init);
</script>
```

## Cross-component event bus

| CustomEvent | Purpose |
|-------------|---------|
| `rt-open-event` (detail: event object) | Opens the global EventModal |
| `rt-favs-changed` | Sync favorite-button state and watchlist |
| `rt-filters-changed` | Series filter state broadcast (`src/lib/filters.ts`) |

Favorites live in `localStorage['rt-favs']` as a JSON array of event IDs; dispatch `rt-favs-changed` after writing.

## Data gotchas that surface in the UI

- `upcoming.json` must be sorted by `dateStart` before applying per-series caps — do not assume it's pre-sorted for your use.
- New pages go in `src/pages/`, get a link in `Nav.astro`, and a line in the always-on instruction files' structure map.
- Keep `/status` (kiosk view) minimal — small screens, auto-refresh.
