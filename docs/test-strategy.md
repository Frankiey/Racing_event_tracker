# Test Strategy — RaceTrack

**Goal:** High confidence when pushing to `main` that the dashboard shows the correct upcoming events in the right order, with correct dates and times, without regressions in other pages.

---

## What Can Go Wrong (and How to Catch It)

| Risk | How it manifests | Caught by |
|------|-----------------|-----------|
| Past event still shown as "upcoming" | Dashboard shows stale/completed race | Playwright: date order check |
| `upcoming.json` sorted by series not date | Events appear out of chronological order | Playwright: sort check + data test |
| Wrong `status` on event (upcoming/live/completed) | Race shown as upcoming after it finished | Python unit test + Playwright |
| Placeholder time (`T00:00:00Z`) shown as `00:00` | Session times say midnight | Smoke test (exists) + Playwright |
| LocalTime hydration never ran | All times show raw UTC string | Playwright: hydration check |
| countryCode is alpha-3 → empty flag | Blank flag emoji on event card | validate:data (exists) |
| `dateStart` > `dateEnd` on an event | Event card shows backwards dates | validate:data (exists) |
| F1 transform breaks → no F1 events | Dashboard missing F1 entirely | Python unit test + Playwright |
| Seed file edit breaks schema | Series disappears from dashboard | validate:data + Playwright |
| Build succeeds but JS error on load | Page renders but interactivity broken | Playwright: console error check |
| Series filter state corrupts event list | Filtering shows wrong events | Playwright: filter test |

---

## Test Layers

### Layer 1 — Python Unit Tests (fast, ~5s)
**Location:** `tests/test_*.py`  
**Run:** `npm run test:pipeline`

**Exists:**
- Gold transform: sorts events, filters past, respects limit
- Validate: date formats, countryCode alpha-2, session times
- MotoGP: UTC conversion
- NASCAR: schedule parsing

**Gaps to fill:**
- F1 transform (most important series — zero coverage)
- Seed file passthrough (covers ~10 series)
- `upcoming.json` output is sorted by `dateStart`
- `status` field is correctly assigned based on event dates

---

### Layer 2 — JS Unit Tests (fast, ~5s)
**Location:** `tests/unit/`  
**Run:** `node --test tests/unit/*.test.mjs` (Node built-in test runner, no extra deps)

**Why:** The browser-side filtering logic (`isPastEvent`, `isSessionLive`, `sleepVerdict`) is what determines what the user sees. A bug here is invisible to Python tests and smoke tests.

**Functions to cover (`src/lib/client-utils.ts`):**
- `isPastEvent(event)` — must correctly classify past events (used to grey cards out)
- `isSessionLive(session)` — live session banner logic
- `getLiveSession(event)` — picks the right session to highlight
- `sleepVerdict(utcTime, localOffset)` — red/amber/green for late-night races
- `countryFlag(code)` — returns empty string for alpha-3, not an error

**Functions to cover (`src/lib/time.ts`):**
- `isPlaceholderTime(isoString)` — must catch `T00:00:00Z` pattern
- `isPastEvent(event)` — server-side version (same logic, different context)

**Functions to cover (`src/lib/sessions.ts`):**
- `getSessionDurationMinutes(type)` — must return a number > 0 for all known session types

---

### Layer 3 — Data Integrity Tests (fast, ~2s)
**Location:** `tests/test_data_integrity.py`  
**Run:** `npm run test:pipeline`

Validates the *current committed gold files* reflect correct real-world state. These run against `data/gold/upcoming.json` and `data/gold/calendar.json` directly.

**Checks:**
- `upcoming.json` events are sorted ascending by `dateStart`
- No event in `upcoming.json` has `dateEnd` before today
- At least one event per major series (f1, motogp, nascar) is present in upcoming
- Event IDs are unique across all of `calendar.json`
- No `upcoming.json` event has a session at `T00:00:00Z` (placeholder times on upcoming events)

---

### Layer 4 — Build Smoke Tests (medium, ~30s)
**Location:** `tests/smoke.test.mjs`  
**Run:** `npm run test:smoke`

Exists and covers: build succeeds, key pages present, multiple series on dashboard, no 1900 placeholder times in HTML.

**Gaps to fill:**
- `watchlist/index.html` and `recap/index.html` exist
- At least one `<article data-series="f1">` present on dashboard (F1 specifically)
- Inline event data in `<script id="upcoming-data">` is valid JSON and sorted by dateStart
- Series pages (spot-check `series/f1/index.html`) exist and contain event data

---

### Layer 5 — Playwright E2E Tests (slow, ~60s)
**Location:** `tests/e2e/`  
**Run:** `npx playwright test`  
**Against:** `npm run preview` (production build, local server)

This is the confidence layer. It runs in a real browser, triggers LocalTime hydration, and validates what the user actually sees.

#### Priority 1 — Dashboard correctness (most critical)

**`dashboard.spec.ts`**
- All event cards have a `dateStart` >= today (no past events visible)
- Event cards appear in chronological date order
- The hero countdown event is the earliest upcoming event
- At least 4 different series are represented
- No event card shows an empty flag (catches alpha-3 countryCode)
- No session time reads `"00:00"` (catches placeholder times slipping through)
- Console has no uncaught JS errors

**`local-time.spec.ts`**
- After page load, `<time data-local-time>` elements have been hydrated (content changed from UTC)
- Session times on event cards are not in ISO 8601 format (hydration ran)

#### Priority 2 — Interactivity

**`event-modal.spec.ts`**
- Click an event card → modal opens
- Modal shows the event name and at least one session
- Modal closes on Escape and on backdrop click

**`series-filter.spec.ts`**
- Click "F1" filter → only F1 event cards remain visible
- Click "F1" again (deselect) → all cards return
- Filter state survives a soft navigation (if applicable)

#### Priority 3 — Other pages

**`calendar.spec.ts`**
- Calendar page loads and shows month headings for the current year
- Each series in the filter bar renders its badge

**`status.spec.ts`**
- Status page shows a countdown (already covered in smoke, but verify it counts down live)
- No series filter rendered (kiosk constraint)

**`watchlist.spec.ts`**
- Favorite an event on dashboard → it appears on watchlist page
- Unfavorite → it disappears

---

## CI Integration

Add a `playwright.yml` GitHub Actions workflow:

```
trigger: push to main, PR to main
steps:
  1. npm ci
  2. npx playwright install --with-deps chromium
  3. npm run build
  4. npm run preview &  (start static server in background)
  5. npx playwright test
  6. Upload playwright-report/ as artifact on failure
```

Playwright tests should run **after** the existing `npm test` gate (typecheck + smoke + pipeline unit tests), not instead of it.

---

## What We Deliberately Won't Test

- Visual regression / pixel-perfect screenshots — too brittle for a rapidly-iterated static site
- Third-party API availability — the pipeline fetches from Jolpica, Pulselive, NASCAR CDN; those are tested by running the pipeline manually
- Browser compatibility beyond Chromium — this is a personal dashboard, not a public product requiring cross-browser guarantees
- Python fetcher logic (HTTP calls) — those are covered by the data validation layer; unit-testing them requires mocking APIs which gives false confidence

---

## Implementation Order

1. `tests/unit/` — JS unit tests for client-utils and time.ts (no new deps, just `node --test`)
2. `tests/test_data_integrity.py` — data integrity checks on gold files
3. `tests/test_f1_transform.py` — F1 pipeline unit test
4. Playwright scaffold + dashboard spec (Priority 1)
5. Playwright: modal + filter specs (Priority 2)
6. Playwright: other pages (Priority 3)
7. CI workflow for Playwright
8. Update `npm test` to include JS unit tests + data integrity tests
