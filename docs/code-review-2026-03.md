# RaceTrack — Code Review
**Date:** March 2026 | **Scope:** Full codebase — frontend, pipeline, CI, docs
**Focus:** Code quality · Agent-first readiness · Future-proofness

> Add your comments directly in this file. Use `<!-- COMMENT: your note here -->` inline or add a `### Response` section under any finding.

---

## Executive Summary

RaceTrack has solid architectural bones. The medallion data pipeline, static-first frontend, and dark-mode-by-default approach are all sound decisions that age well. The documentation quality (`architecture.md`) is unusually good for a project at this stage.

However, the codebase has reached an inflection point. Three patterns that were harmless at day one are now actively accumulating technical debt:

1. **Series metadata is defined in 6 separate places** — with divergent coverage and at least one confirmed color bug.
2. **The entire frontend types all data as `any[]`** — TypeScript is present but not providing safety.
3. **The kiosk page (`status.astro`) has become a parallel universe** — reimplementing helpers, SERIES_META, LocalTime, and flag logic that already exist in shared libs.

None of these are blockers. All are fixable. The section below maps every issue to a severity level, the exact file and line, and a suggested fix.

---

## Severity Legend

| Level | Meaning |
|-------|---------|
| 🔴 **P1 — Bug** | Confirmed incorrect behavior or data |
| 🟠 **P2 — Risk** | Will cause problems as codebase grows |
| 🟡 **P3 — Quality** | Technical debt, maintainability friction |
| 🔵 **P4 — Future** | Fine now, will bite later |

---

## 🔴 P1 — Confirmed Bugs

### 1. F3 color is wrong in EventModal and Watchlist

`src/lib/series.ts` (canonical) defines F3 as `#60a5fa`.
`src/components/EventModal.astro` and `src/pages/watchlist.astro` both use `#0090d0` — which is **F2's color**.
Users opening the detail modal for an F3 event see it colored as F2.

**Root cause:** SERIES_META is copy-pasted in 6 locations (see P2 item below), and the copies have drifted.
**Fix:** Resolve the duplication issue first (P2 #7), then the color will self-correct.

---

### 2. Event listener leak in EventCard — accumulates on every page transition

**File:** `src/components/EventCard.astro` — the `initCards()` function

On every `astro:after-swap` (page transition), `initCards()` is re-called. Inside it, `window.addEventListener('rt-favs-changed', ...)` is registered again without removing the previous one. After 5 navigations, there are 5 handlers all updating the same DOM — visible as sluggish fav sync and unpredictable re-render order.

**Fix:**
```typescript
// Store reference and remove before re-adding
let favsHandler: (() => void) | null = null;

function initCards() {
  if (favsHandler) window.removeEventListener('rt-favs-changed', favsHandler);
  favsHandler = () => { /* ... */ };
  window.addEventListener('rt-favs-changed', favsHandler);
}
```

---

### 3. Countdown interval leak — stacks on every page transition

**File:** `src/components/Countdown.astro`

`setInterval(update, 1000)` is called without storing the interval ID. On every `astro:after-swap`, a new interval starts. All previous intervals keep running and writing to the same DOM node, causing visible jitter on countdowns when navigating frequently.

**Fix:**
```typescript
let intervalId: ReturnType<typeof setInterval> | null = null;

function initCountdowns() {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(update, 1000);
}

document.addEventListener('astro:before-swap', () => {
  if (intervalId) clearInterval(intervalId);
});
```

---

### 4. `body.style.overflow` not restored on modal close via page navigation

**File:** `src/components/EventModal.astro`

When a user opens the modal and then navigates via the browser back button or Astro link (not the explicit close button), `document.body.style.overflow = 'hidden'` is never reset. The destination page has a locked scroll body.

**Fix:** Add a cleanup listener:
```typescript
document.addEventListener('astro:before-swap', () => {
  document.body.style.overflow = '';
});
```

---

### 5. `build_upcoming` `limit` parameter is dead code

**File:** `pipeline/transforms/gold.py` — `build_upcoming(limit=30)`

The `limit` parameter is accepted and documented but never applied — no slicing of the `upcoming` list happens. All future events are written regardless of the parameter value. Any caller passing a different limit will see no effect.

**Fix:** Apply the limit:
```python
return sorted(upcoming, key=_sort_key)[:limit]
```

---

### 6. `SESSION_DURATION_MS` values are in minutes, not milliseconds

**File:** `src/pages/status.astro`

The variable is named `SESSION_DURATION_MS` but the values (e.g., `90` for a race) are in **minutes**. If any future code uses this constant assuming the documented unit (milliseconds), the math will be off by 60,000×.

**Fix:** Rename to `SESSION_DURATION_MIN` or convert all values to actual milliseconds.

---

## 🟠 P2 — Risk / Will Break at Scale

### 7. Series metadata lives in 6 separate files — the #1 maintenance liability

The `SERIES_META` color/label mapping is defined independently in:

| File | Coverage | Type |
|------|----------|------|
| `src/lib/series.ts` | All 15 series | TypeScript module (canonical) |
| `src/components/EventModal.astro` | 8 series — F3 color wrong | Client JS copy |
| `src/pages/calendar.astro` | 10 series — missing imsa/dtm/nls/wsbk/superformula/moto2/moto3 | Client JS copy |
| `src/pages/watchlist.astro` | 8 series — most stripped | Client JS copy |
| `src/pages/status.astro` | All 15 — most complete client copy | Client TS copy |
| `src/styles/global.css` | 6 colors hardcoded in gradient | CSS copy |

Series missing from the client-side copies render with grey color and the raw `seriesId` as label (no localized name). Adding a new series to `series.ts` requires updating 4–5 other files manually.

**Root cause:** Astro `<script>` blocks are isolated client modules that cannot import from frontmatter scope. The fix requires a shared client-side module:

**Recommended fix:** Create `src/lib/series-client.ts` as a plain TypeScript module (no Astro frontmatter). Import it in script blocks with `import { SERIES_META } from '/src/lib/series-client.ts'` or compile it to a global script loaded in `Layout.astro`. This is the Astro-idiomatic solution for shared client state.

---

### 8. All JSON data is typed as `any[]` — TypeScript provides zero safety

Every page that imports data does this:
```typescript
import upcomingData from '../../data/gold/upcoming.json';
const upcoming = upcomingData as any[];
```

This means: no editor autocomplete for event fields, no compile-time error if the schema changes, no indication when a field is missing. The `EventCard` Props interface is good — but it's manually declared and not derived from a shared schema type, so it can silently diverge from what the pipeline actually produces.

**Recommended fix:**
1. Define a `RaceEvent` TypeScript type in `src/lib/types.ts` matching the gold layer schema.
2. Cast imports to `RaceEvent[]` instead of `any[]`.
3. Medium-term: use `zod` to generate the type from a schema and validate at build time.

---

### 9. `SESSION_ABBR` duplicated in 4 files with divergent values

| File | Keys present | Notable differences |
|------|-------------|---------------------|
| `src/components/EventCard.astro` | 12 entries | `Sprint Qualifying → 'SQ'` |
| `src/components/EventModal.astro` | 10 entries | `Sprint Qualifying → 'Sprint Qualifying'` (not abbreviated) |
| `src/pages/calendar.astro` | 10 entries | Matches EventModal |
| `src/pages/watchlist.astro` | 8 entries | Missing Sprint entries |

This is the same class of problem as SERIES_META. Sprint Qualifying abbrevation is `'SQ'` in the card but the full string `'Sprint Qualifying'` in the modal.

**Fix:** Move to `src/lib/time.ts` (or a new `src/lib/sessions.ts`) as an exported constant, imported by all pages.

---

### 10. Python pipeline helper functions copy-pasted across 3 transform files

`_to_iso()` and `_to_date()` — datetime normalization helpers — are copy-pasted identically in:
- `pipeline/transforms/motogp.py`
- `pipeline/transforms/nascar.py`
- `pipeline/transforms/wsbk.py`

If a timezone edge case is fixed in one, the others will not be updated.

**Fix:** Move both to `pipeline/utils.py` and import from there.

---

### 11. JSON embedded in HTML attributes — incomplete sanitization

**Files:** `src/pages/calendar.astro`, `src/pages/watchlist.astro`

Client-side calendar and watchlist inject events into DOM via:
```javascript
data-event='${JSON.stringify(ev).replace(/'/g, "&#39;")}'
```

This manually escapes `'` only. An event name containing `"`, `<`, or `>` from an external API could escape the attribute and inject HTML. These strings are injected via `innerHTML` — bypassing Astro's server-side escaping.

**Fix:** Use `JSON.stringify` output inside double-quoted attributes and encode with a proper HTML escape helper, or use `element.dataset` assignment instead of `innerHTML` for data-bearing elements.

---

### 12. No concurrency guard on `fetch-data.yml`

**File:** `.github/workflows/fetch-data.yml`

The deploy workflow has `concurrency: { group: pages, cancel-in-progress: true }`. The data pipeline workflow has no such guard. A manual `workflow_dispatch` triggered during the nightly cron run will produce two concurrent pipeline runs writing to the same branch — the later `git push` will fail or cause a confusing conflict.

**Fix:** Add:
```yaml
concurrency:
  group: data-pipeline
  cancel-in-progress: true
```

---

### 13. `fetch-data.yml` stages all of `data/` including bronze layer

**File:** `.github/workflows/fetch-data.yml`

```yaml
git add data/
```

This stages the bronze layer (raw API responses). F1 bronze alone is 3 JSON files per season run. Over a full season + multiple years, the bronze layer will silently inflate the git history. Bronze is a cache — it doesn't belong in version control.

**Fix:** Change to:
```yaml
git add data/silver/ data/gold/
```

And add `data/bronze/` to `.gitignore`.

---

## 🟡 P3 — Technical Debt / Quality

### 14. `getSeriesMeta` fallback is structurally invalid

**File:** `src/lib/series.ts`

The fallback returned when a series ID is not found is missing the `category` field:
```typescript
// Returns SeriesMeta but missing category
return { id, label: id, color: '#71717a', textClass: '...', bgClass: '...', order: 99 };
```

`SeriesMeta` requires `category: SeriesCategory`. TypeScript should be catching this — if it's not, the return type annotation may be too loose. Any caller that renders based on `category` (e.g., the filter) will silently receive `undefined` for unknown series.

---

### 15. `textClass` and `bgClass` on `SeriesMeta` are dead runtime fields

**File:** `src/lib/series.ts`

These Tailwind class-name fields (e.g., `textClass: 'text-red-500'`) exist on the `SeriesMeta` interface and are set for every series — but they are **never read by any component** at runtime. The CLAUDE.md correctly notes that dynamic Tailwind class names don't work in v4; all components use `style=` with the `color` hex value instead.

This is confusing dead weight that implies a capability that doesn't exist.

**Fix:** Remove `textClass` and `bgClass` from `SeriesMeta` and all 15 series definitions. If a migration back to class names is ever needed, it can be reintroduced.

---

### 16. `formatDateRange` and date-grouping are timezone-sensitive at build time

**Files:** `src/lib/time.ts`, `src/pages/series/[id].astro`

`new Date(dateStr + 'T00:00:00')` constructs a local-midnight Date. On a CI runner in UTC+0 this is fine. On a developer machine in UTC+2, an event on `2026-03-01` parses as `2026-02-28T22:00:00Z` and may appear in February's group.

**Fix:** Append `'T12:00:00Z'` (UTC noon) instead of `'T00:00:00'` to force UTC-stable midday parsing for date-only strings used purely for grouping.

---

### 17. `getRaceSession` fallback returns wrong session for multi-race formats

**File:** `src/lib/time.ts`

For WSBK events (which have "Race 1" / "Race 2" sessions), `getRaceSession` falls back to `sessions[sessions.length - 1]` when no session matching `['Race', 'Feature Race']` is found. This returns the last session — which may be "Race 2", "Superpole Race", or whatever is last in the array.

For countdown hero and next-race calculations, WSBK and endurance events need a more explicit "main session" designation.

---

### 18. `isPlaceholderTime` sentinel value duplicated across 5 files

The string `'1900-'` is independently hardcoded in:
- `src/lib/time.ts` (as `PLACEHOLDER_YEAR = 1900`, then `'1900-'` in the check)
- `src/components/EventModal.astro` (`PLACEHOLDER_YEAR = '1900'`)
- `src/pages/calendar.astro` (inline `s.startTimeUTC.startsWith('1900')`)
- `src/pages/status.astro` (`PLACEHOLDER_PREFIX = '1900-'`)
- `src/pages/watchlist.astro` (inline `.startsWith('1900')`)

`isPlaceholderTime` already exists in `src/lib/time.ts` as an exported function. The 4 client-side files should import it (or a shared client version). Instead, they each re-implement the check.

---

### 19. `architecture.md` describes fields that don't exist in real data

**File:** `docs/architecture.md`

The documented `RaceEvent` schema includes:
- `status: "upcoming" | "live" | "completed"` — not present in any gold/silver file
- `endTimeUTC` — not present in any gold/silver file
- `circuitImage`, `lat`, `lng` — not present in most events

These fields exist only in the architecture doc, not in the data. A contributor following the docs will write code expecting these fields and get `undefined` silently.

**Fix:** Mark aspirational/planned fields clearly in the doc (e.g., with a `[planned]` tag), or remove them and add them back when implemented.

---

### 20. `kiosk-redesign.md` checkboxes appear incomplete but work is done

**File:** `docs/kiosk-redesign.md`

The document has Phase 1–4 checkboxes that are all unchecked — but `status.astro` clearly contains the implemented rotation logic, sidebar, and manual override behavior described in those phases. The document was never updated after implementation.

**Fix:** Either check off the completed phases, or archive the doc as historical design context with a note at the top.

---

### 21. `worknotes.md` is stale

References v1/v2 frontend splits and "next steps" that are already done. Low priority but creates confusion when onboarding.

---

### 22. Python pipeline has zero tests

The only tests in the project are frontend smoke tests (`npm test` → `astro build`). All Python transforms, seed file loading, gold layer construction, and date normalization have no automated test coverage. A malformed seed file or API shape change will silently produce broken data until someone notices the wrong event on the frontend.

**Recommended priority additions:**
1. Test `_normalize_time` edge cases (no-tz input, `+00:00`, `Z`)
2. Test `build_upcoming` sorting and output shape
3. Test that all seed files parse and produce valid output

---

### 23. `python-dateutil` is a declared dependency that is never imported

**File:** `pyproject.toml`

`python-dateutil` is in the dependencies list but `grep`ing the entire `pipeline/` directory finds zero imports of it. Dead dependency adds install time and attack surface.

**Fix:** Remove from `pyproject.toml`.

---

### 24. `pyproject.toml` requires Python `>=3.14`

Python 3.14 is pre-release as of early 2026. Python 3.13 is the current stable. This requirement will fail on most standard CI images and developer machines that haven't manually installed 3.14.

**Fix:** Change to `>=3.11` (minimum viable for all pipeline code) and pin the exact version in CI via the `uv` cache configuration.

---

### 25. `uv` version pinned to `"latest"` in CI

**File:** `.github/workflows/fetch-data.yml`

`astral-sh/setup-uv@v5` is called with `version: "latest"`. A breaking uv release will silently fail the nightly pipeline without any diff to blame.

**Fix:** Pin to a specific version (e.g., `version: "0.5.x"`) and update manually on a cadence.

---

### 26. `npm test` runs the full Astro build as a side effect

**File:** `package.json`

The `test` script internally calls `astro build`. Running tests takes 30+ seconds and leaves a `dist/` directory behind. There is no way to run linting, type-checking, or unit tests in isolation.

**Fix:** Add separate scripts:
```json
{
  "typecheck": "astro check",
  "lint": "eslint src/",
  "test": "npm run typecheck && npm run build"
}
```

---

## 🔵 P4 — Future-Proofness

### 27. Season year hardcoded in UI

**File:** `src/pages/index.astro`

```html
<h2>2026 Season</h2>
```

Requires a manual template change each season. `pipeline/config.py` correctly uses `datetime.now().year` — the frontend should use the same source:

```astro
---
const SEASON_YEAR = new Date().getFullYear();
---
<h2>{SEASON_YEAR} Season</h2>
```

---

### 28. `astro.config.mjs` site URL is a placeholder

```javascript
site: 'https://yourusername.github.io'
```

This was never updated. If Astro ever uses this value for canonical URLs or sitemap generation, it will produce wrong output.

---

### 29. No JSON Schema validation for seed files

Seed files are the primary data source for 10 of 15 series. There is no machine-readable schema, no validation script, and no CI check. A trailing space in `countryCode`, a missing `sessions` key, or a mistyped date format will silently produce broken frontend behavior.

**Recommended fix:** Add a JSON Schema file at `data/seed/schema.json` and a validation step in `fetch-data.yml`:
```yaml
- name: Validate seed files
  run: uv run python -m pipeline.validate_seeds
```

This is especially important for agent-assisted seed file updates (see Agent-First section below).

---

### 30. No data envelope on gold layer files

`upcoming.json` and `calendar.json` are bare JSON arrays with no metadata:
```json
[{ "id": "...", "series": "f1", ... }]
```

For agent consumption, caching, and debugging, a metadata envelope would be valuable:
```json
{
  "generated": "2026-03-31T00:15:00Z",
  "season": 2026,
  "event_count": 183,
  "sources": ["f1", "motogp", "nascar", ...],
  "events": [...]
}
```

This also enables future incremental updates (only re-fetch if stale), client-side cache invalidation, and API versioning if the project ever adds a backend.

---

### 31. No TypeScript path aliases are actually used

**File:** `tsconfig.json`

`@/*` and `@data/*` are configured but all source files use relative imports (`../../data/gold/...`). Unused configuration creates confusion about the intended import style.

**Fix:** Either adopt the aliases project-wide (run a codemod), or remove them from tsconfig.

---

### 32. `upcoming.json` sort order documented incorrectly in CLAUDE.md

**File:** `CLAUDE.md`

> `upcoming.json` is sorted by series, not by date

The actual `gold.py` `build_upcoming` function calls `.sort(key=_sort_key)` which sorts by earliest session `dateStart` — i.e., chronologically. The CLAUDE.md warning is **the opposite of reality**. This will mislead developers implementing new dashboard features.

**Fix:** Update CLAUDE.md to: *"`upcoming.json` is sorted chronologically by `dateStart`. Always verify sort before applying per-series caps."*

---

### 33. MotoGP events have only 1 session, Moto2/3 have 5 — same weekend

**File:** `pipeline/transforms/motogp.py`

The MotoGP API fetcher retrieves only the race day, not the session schedule. Moto2 and Moto3 use seed files with full Friday–Sunday session breakdowns. At an event like MotoGP Jerez, MotoGP shows one dot while Moto2 (same venue, same weekend) shows five — inconsistent for users who follow multiple classes.

Medium-term fix: Use the Pulselive session API endpoint for MotoGP (already in `docs/data-sources/motogp.md`).

---

### 34. `calendar.astro` client-side render creates 5,250 comparisons per navigation

**File:** `src/pages/calendar.astro`

`renderMonth` rebuilds the full grid via `innerHTML` on every month navigation click. For ~150 events × 35 day cells per month, this is ~5,250 date comparisons per click. Fine at current data size, but if the calendar grows (multiple years, all series), this will become perceptible lag on low-end devices.

Future fix: Memoize the per-month event index at load time as a `Map<string, Event[]>` keyed by ISO date string.

---

## Agent-First Readiness Assessment

This section specifically evaluates how well the codebase supports AI-agent workflows — both as a target for AI-assisted development and as a potential source of data for AI consumers.

### Strengths

- **Medallion architecture** maps cleanly to agent reasoning: bronze = raw, silver = normalized, gold = ready-to-use. An agent can understand the data lineage without reading code.
- **CLAUDE.md** is the best project I've reviewed with explicit agent instructions, gotchas, and commands. This is exactly what good agent-first development looks like.
- **Consistent ID scheme** (`f1-2026-bahrain-gp`) makes events referenceable across files without coordination.
- **Static JSON outputs** are trivially consumable by any agent without needing API calls or authentication.
- **`bd` issue tracking** is integrated and the session protocol is well-defined.

### Gaps

| Gap | Risk | Recommended Fix |
|-----|------|-----------------|
| No JSON Schema for seed or gold files | An agent updating seed data could introduce silent schema errors | Add `data/seed/schema.json` + validation script |
| All data typed as `any[]` in TS | An agent editing pages gets no autocomplete or error feedback | Add `src/lib/types.ts` with `RaceEvent` type |
| No `generated-at` timestamp in gold files | Agent can't tell if data is fresh without checking git blame | Add metadata envelope to gold layer |
| SERIES_META in 6 files | An agent adding a series will miss 3–5 of the copies | Consolidate to `series-client.ts` |
| `SESSION_ABBR` in 4 files | Same class of problem | Move to `src/lib/sessions.ts` |
| Placeholder sentinel `'1900-'` undocumented in CLAUDE.md | An agent handling dates may not know this convention | Document in CLAUDE.md, add to a shared `PLACEHOLDER` constant |
| Session type names inconsistent across pipeline and frontend | An agent building a new transform would use the wrong format | Add a `SESSION_TYPES` enum or shared constant in both Python and TS |
| Pipeline has no schema validation | An agent running the pipeline gets no feedback on data quality | Add `pipeline/validate.py` with per-field checks |
| `worknotes.md` and `architecture.md` partially stale | Agent context-priming from docs will include wrong information | Update or clearly date-stamp stale sections |

### Agent Workflow Recommendation

The project would benefit from a `pipeline/validate.py` script that:
1. Loads each silver and gold file
2. Checks required fields against a schema
3. Validates date formats, country codes (alpha-2 only), series IDs (against `SERIES_LIST`)
4. Reports warnings for placeholder times that are suspiciously far in the future

This script should run in `fetch-data.yml` after transforms and before the git commit — providing a quality gate that an agent updating seed data cannot accidentally bypass.

---

## Quick-Win Checklist

For a focused sprint, these items have the highest fix/effort ratio:

- [ ] **Fix F3 color in EventModal and watchlist** — 2-line fix, confirms the P2 duplication problem
- [ ] **Add `clearInterval` to Countdown** — 3-line fix, stops interval accumulation
- [ ] **Add `removeEventListener` in EventCard** — 5-line fix, stops fav handler accumulation
- [ ] **Restore `body.style.overflow` on `astro:before-swap`** — 3-line fix
- [ ] **Remove `textClass`/`bgClass` from `SeriesMeta`** — cleanup, removes false affordance
- [ ] **Move `_to_iso`/`_to_date` to `pipeline/utils.py`** — reduces transform duplication
- [ ] **Update `CLAUDE.md` upcoming.json sort order documentation** — 1-line fix, stops developer confusion
- [ ] **Fix `build_upcoming` `limit` parameter** — 1-line fix, makes the API honest
- [ ] **Remove `python-dateutil` from pyproject.toml** — 1-line fix, removes dead dependency
- [ ] **Add `git add data/silver/ data/gold/` in fetch-data.yml** — stops bronze from polluting git history
- [ ] **Add concurrency guard to fetch-data.yml** — 3-line fix, prevents concurrent pipeline runs

---

## Strategic Refactoring Roadmap

### Phase 1: Stop the bleeding (data accuracy)
1. Fix F3 color (P1 #1)
2. Fix listener and interval leaks (P1 #2, #3)
3. Fix `build_upcoming` limit (P1 #5)
4. Correct `CLAUDE.md` sort order documentation (P4 #32)

### Phase 2: Consolidate metadata (maintainability)
1. Create `src/lib/series-client.ts` as shared browser module
2. Migrate all 6 SERIES_META copies to import from it
3. Move `SESSION_ABBR` to `src/lib/sessions.ts`
4. Move `isPlaceholderTime` to shared browser module

### Phase 3: Add types (quality)
1. Create `src/lib/types.ts` with `RaceEvent`, `Session`, `SeriesMeta` interfaces
2. Replace all `any[]` casts with typed imports
3. Move `_to_iso`/`_to_date` to `pipeline/utils.py`
4. Remove `textClass`/`bgClass` dead fields

### Phase 4: Add validation (agent-readiness)
1. Create JSON Schema for seed files
2. Create `pipeline/validate.py`
3. Run validation in `fetch-data.yml` before commit
4. Add metadata envelope to gold layer output

### Phase 5: Observability (future-proofness)
1. Add pipeline test suite (pytest)
2. Add `npm run typecheck` script
3. Pin `uv` version in CI
4. Fix `astro.config.mjs` site URL placeholder
5. Add documentation for `SESSION_DURATION_MIN` naming

---

*Review by Claude Code — March 2026. Comments welcome inline.*
