# Debug the Data Pipeline

Help me diagnose and fix a data pipeline issue in RaceTrack.

## What to do

Ask the user what the symptom is (missing events, wrong times, empty series, build error, etc.), then work through the medallion layers from bronze → silver → gold.

### Step 1 — Identify the scope
Ask: which series is affected? Is it all series or just one?

```bash
# Check what's in each layer for a series
ls data/bronze/ | grep <series>
ls data/silver/ | grep <series>
cat data/gold/upcoming.json | python3 -c "import sys,json; d=json.load(sys.stdin); print([e['seriesId'] for e in d])"
```

### Step 2 — Inspect bronze (raw API response)
```bash
# Check if bronze exists and looks valid
cat data/bronze/<series>-*.json | python3 -m json.tool | head -50
```
If bronze is missing or stale: re-fetch with `uv run python -m pipeline --series <id> --bronze-only`

### Step 3 — Inspect silver (normalized)
```bash
cat data/silver/<series>.json | python3 -m json.tool | head -80
```
Check against the schema in `docs/architecture.md`:
- [ ] `id` field present and unique
- [ ] `countryCode` is alpha-2 (2 letters)
- [ ] `sessions[].startTimeUTC` is ISO 8601 UTC
- [ ] `dateStart` / `dateEnd` present
- [ ] `status` is one of: `upcoming`, `live`, `completed`

### Step 4 — Rebuild gold
```bash
uv run python3 -c "
from pipeline.transforms.gold import build_calendar, build_upcoming
import pathlib, json
SILVER_DIR = pathlib.Path('data/silver')
events = []
for f in SILVER_DIR.glob('*.json'):
    events += json.loads(f.read_text())
build_calendar(events)
build_upcoming(events)
print('Gold rebuilt')
"
```

### Step 5 — Check the UI render
```bash
npm run dev
```
Open the dashboard. If events still don't appear, check the browser console for JS errors and inspect `EventCard.astro` and `index.astro` for filtering logic.

### Step 6 — Common fixes

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Empty flag on EventCard | `countryCode` is alpha-3 or missing | Fix in seed/silver data |
| Wrong session time | Time stored as local, not UTC | Convert to UTC in transform |
| Series not on dashboard | Missing from `SERIES_LIST` in `series.ts` | Add it |
| Events out of order | `upcoming.json` sorted by series | Sort by `dateStart` in the consuming component |
| Series page 404 | Page not in `src/pages/series/` | Check `[id].astro` handles the series id |
| Moto2/Moto3 missing | Not rebuilt after MotoGP update | Rebuild gold from all silver files |

---

**Key files:**
- `pipeline/config.py` — series list, paths, API URLs
- `pipeline/transforms/gold.py` — gold layer build logic
- `src/lib/series.ts` — series metadata (color, name, id)
- `src/lib/time.ts` — time formatting, `isPlaceholderTime()`, `isPastEvent()`
