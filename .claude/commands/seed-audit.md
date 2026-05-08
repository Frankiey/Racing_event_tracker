# Audit Seed File Schemas

Validate all seed files in `data/seed/` against the silver schema and flag structural problems before a season update.

## What to do

Run a systematic schema audit across every seed file. This is a pre-flight check — run it before bulk season data edits to establish a clean baseline.

### 1. Run built-in validation

```bash
npm run validate:data
```

Fix any errors before continuing. Warnings are lower priority but note them.

### 2. Load and inspect each seed file

```bash
python3 -c "
import json, pathlib

REQUIRED_EVENT = {'id', 'seriesId', 'eventName', 'round', 'circuit', 'sessions', 'dateStart', 'dateEnd', 'status'}
REQUIRED_CIRCUIT = {'name', 'city', 'country', 'countryCode'}
REQUIRED_SESSION = {'type', 'startTimeUTC', 'endTimeUTC'}
VALID_STATUSES = {'upcoming', 'live', 'completed', 'cancelled'}

errors = []
for f in sorted(pathlib.Path('data/seed').glob('*.json')):
    data = json.loads(f.read_text())
    ids = set()
    for i, ev in enumerate(data):
        ref = f'{f.name}[{i}] {ev.get(\"id\",\"?\")}' 
        missing = REQUIRED_EVENT - ev.keys()
        if missing:
            errors.append(f'{ref}: missing event fields: {missing}')
        circ = ev.get('circuit', {})
        missing_c = REQUIRED_CIRCUIT - circ.keys()
        if missing_c:
            errors.append(f'{ref}: missing circuit fields: {missing_c}')
        cc = circ.get('countryCode', '')
        if len(cc) != 2:
            errors.append(f'{ref}: countryCode not alpha-2: {cc!r}')
        if ev.get('status') not in VALID_STATUSES:
            errors.append(f'{ref}: invalid status: {ev.get(\"status\")}')
        if ev.get('dateStart','') > ev.get('dateEnd','9'):
            errors.append(f'{ref}: dateStart after dateEnd')
        eid = ev.get('id')
        if eid in ids:
            errors.append(f'{ref}: duplicate id in file')
        ids.add(eid)
        for j, s in enumerate(ev.get('sessions', [])):
            sref = f'{ref}.sessions[{j}]'
            missing_s = REQUIRED_SESSION - s.keys()
            if missing_s:
                errors.append(f'{sref}: missing: {missing_s}')
            if s.get('startTimeUTC','').endswith('T00:00:00Z'):
                errors.append(f'{sref}: placeholder time (T00:00:00Z)')

if errors:
    print(f'Found {len(errors)} issue(s):')
    for e in errors:
        print(' -', e)
else:
    print('All seed files pass schema audit.')
"
```

### 3. Check for cross-file duplicate IDs

Event IDs must be globally unique across all seed files and series:

```bash
python3 -c "
import json, pathlib
from collections import Counter

all_ids = []
for f in pathlib.Path('data/seed').glob('*.json'):
    data = json.loads(f.read_text())
    for ev in data:
        all_ids.append((ev.get('id'), f.name))

seen = Counter(id for id, _ in all_ids)
dupes = {id for id, count in seen.items() if count > 1}
if dupes:
    for id, fname in all_ids:
        if id in dupes:
            print(f'DUPE: {id} in {fname}')
else:
    print('No cross-file duplicate IDs found.')
"
```

### 4. Check round numbering

For each series, rounds should be sequential with no gaps:

```bash
python3 -c "
import json, pathlib

for f in sorted(pathlib.Path('data/seed').glob('*.json')):
    data = json.loads(f.read_text())
    rounds = sorted(ev.get('round', 0) for ev in data)
    expected = list(range(1, len(rounds)+1))
    if rounds != expected:
        print(f'{f.name}: rounds {rounds} (expected {expected})')
    else:
        print(f'{f.name}: rounds OK ({len(rounds)} events)')
"
```

### 5. Fix issues and re-validate

Edit the offending `data/seed/<series>.json` file, then:

```bash
npm run validate:data          # confirm fix passes
uv run python -m pipeline --series <id>   # rebuild silver
```

After all fixes, rebuild gold:

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

### 6. Report summary

Summarize:
- Files audited
- Issues found and fixed
- Any issues deferred (e.g. placeholder times where dates genuinely TBD)

---

**Schema reference:** `docs/architecture.md` — silver layer event schema
**Seed files:** `data/seed/*.json`
