# Scaffold a New Astro Component

Help me create a new Astro component for RaceTrack following project conventions.

## What to do

Ask the user what the component should do and where it will be used. Then scaffold it correctly.

### Conventions to follow

**File location:** `src/components/<ComponentName>.astro`

**Standard structure:**
```astro
---
// Props interface at the top
interface Props {
  // typed props here
}
const { propA, propB } = Astro.props;
---

<!-- Markup -->
<div class="...">
  <!-- content -->
</div>

<script>
  // Vanilla JS only — no framework imports
  // Init function pattern for Astro page transitions:
  function init() {
    // DOM queries, event listeners, etc.
  }

  init();
  document.addEventListener('astro:after-swap', init);
</script>
```

### Rules (non-negotiable)

1. **No framework islands** — vanilla `<script>` tags only, no React/Vue/Svelte
2. **Dynamic colors via `style=`** — never `bg-[#hex]` or `text-[#hex]` Tailwind classes
3. **Times:** render UTC strings with `<LocalTime data-local-time="...utc..." data-format="time-short" />` — never format times in the component itself
4. **Series colors:** get from `getSeriesMeta(seriesId).color` in `src/lib/series.ts`
5. **Cross-component events:** use `window.dispatchEvent(new CustomEvent('rt-open-event', { detail: event }))` to open the modal; `rt-favs-changed` for favorites sync
6. **Favorites:** read/write `localStorage['rt-favs']` as a JSON array of event IDs

### Cross-component event bus

| CustomEvent | Direction | Purpose |
|------------|-----------|---------|
| `rt-open-event` | dispatch → EventModal | Open the detail modal |
| `rt-favs-changed` | dispatch ↔ listen | Sync fav button state and watchlist |

### After scaffolding

1. Import and use the component in the relevant page (`src/pages/*.astro`)
2. If it needs to appear site-wide, add it to `src/layouts/Layout.astro`
3. If it's navigation-related, update `src/components/Nav.astro` and add a note to `CLAUDE.md`
4. Check it works with `npm run dev` and test the `astro:after-swap` path by navigating between pages

### Track the work
```bash
bd create --title="Add <ComponentName> component" --type=feature --priority=2
```
