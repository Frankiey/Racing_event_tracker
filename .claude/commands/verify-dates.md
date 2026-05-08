# Verify Race Dates vs Reality

Cross-check event dates in the seed files and gold data against known reality to catch stale or wrong entries.

## What to do

This skill checks that dates in `data/seed/*.json` and `data/gold/calendar.json` are plausible and consistent with what's publicly known. It does **not** fetch live data — it reasons from the files plus your knowledge.

### 1. Load upcoming events

```bash
# Show all upcoming events sorted by date
python3 -c "
import json, pathlib
data = json.loads(pathlib.Path('data/gold/upcoming.json').read_text())
for e in sorted(data, key=lambda x: x.get('dateStart','')):
    print(e.get('dateStart'), e.get('seriesId'), e.get('eventName'))
"
```

### 2. Check for common anomalies

```bash
npm run validate:data   # catches schema errors, missing fields, bad country codes
```

Also look for:
- [ ] Events with `dateStart` in the past but `status: upcoming`
- [ ] Events with `dateStart` after `dateEnd`
- [ ] Session `startTimeUTC` outside 05:00–23:59 UTC (unusual but not impossible)
- [ ] Placeholder times: sessions at exactly `T00:00:00Z` (means time not yet confirmed)
- [ ] Duplicate event IDs across seed files

```bash
# Find events still marked upcoming but already past
python3 -c "
import json, pathlib
from datetime import datetime, timezone
now = datetime.now(timezone.utc).isoformat()
data = json.loads(pathlib.Path('data/gold/upcoming.json').read_text())
stale = [e for e in data if e.get('dateEnd','') < now and e.get('status') == 'upcoming']
for e in stale:
    print(e['seriesId'], e['eventName'], e['dateEnd'])
"
```

### 3. Check seed files individually

For seed-based series (FE, IndyCar, WEC, F2, F3, Moto2, Moto3, IMSA, DTM, NLS, WSBK, Super Formula, IOMTT):

```bash
ls data/seed/
```

For each file that covers the current season, scan for:
- Round numbers in sequence (no gaps, no duplicates)
- Country codes are alpha-2 (2 chars)
- `dateStart` matches the first session, `dateEnd` matches the last session

### 4. Report findings

List any issues found in priority order:
1. Dates clearly wrong (past events still upcoming, dateEnd before dateStart)
2. Placeholder times (`T00:00:00Z`) that should now have real times
3. Missing events for series that have announced their calendar
4. Minor schema warnings

For each issue, suggest the fix and the file to edit.

### 5. Apply fixes

Edit the relevant `data/seed/<series>.json` file. After any change:

```bash
uv run python -m pipeline --series <id>
npm run validate:data
```

Then rebuild gold:

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

---

**Key files:**
- `data/seed/*.json` — source of truth for non-API series
- `data/gold/upcoming.json` — what the dashboard renders
- `src/lib/time.ts` — `isPlaceholderTime()` identifies T00:00:00Z entries
