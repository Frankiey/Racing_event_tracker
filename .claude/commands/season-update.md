# Full Season Data Refresh

Refresh all race calendar data for the current season — covers both API-sourced series and manually curated seed files.

## When to use

- Start of a new season (new year, new calendar announced)
- Mid-season bulk update (multiple series have schedule changes)
- After a season extension or calendar reshuffle

## What to do

### 1. Audit first

Before changing anything, run the seed audit to establish a clean baseline:

```
/seed-audit
```

Fix any pre-existing schema errors before making bulk changes.

### 2. Update the season year (if starting a new season)

Check `pipeline/config.py` for the current `SEASON_YEAR` constant and update if needed. Also check `src/lib/series.ts` for any hardcoded year references.

### 3. Refresh API-sourced series (F1, MotoGP, NASCAR)

```bash
uv run python -m pipeline --series f1,motogp,nascar
```

Review the silver output for sanity:

```bash
python3 -c "
import json, pathlib
for series in ['f1', 'motogp', 'nascar']:
    data = json.loads(pathlib.Path(f'data/silver/{series}.json').read_text())
    print(f'{series}: {len(data)} events, first={data[0][\"dateStart\"]}, last={data[-1][\"dateStart\"]}')
"
```

### 4. Update seed files for non-API series

Seed files to review (edit manually in `data/seed/`):

| File | Series |
|------|--------|
| `fe.json` | Formula E |
| `indycar.json` | IndyCar |
| `wec.json` | WEC |
| `f2.json` | F2 |
| `f3.json` | F3 |
| `moto2.json` | Moto2 |
| `moto3.json` | Moto3 |
| `imsa.json` | IMSA |
| `dtm.json` | DTM |
| `nls.json` | NLS |
| `wsbk.json` | WSBK (seed fallback) |
| `superformula.json` | Super Formula |
| `iomtt.json` | IOMTT |

For each series:
1. Check the official calendar announcement
2. Update round dates, event names, circuits
3. Use `T00:00:00Z` as a placeholder for sessions with unconfirmed times
4. Keep `countryCode` as ISO alpha-2 (2 letters)

After editing each seed file, rebuild silver:

```bash
uv run python -m pipeline --series <id>
```

### 5. Rebuild gold

After all series are updated:

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

### 6. Run quality gates

```bash
npm run validate:data    # must pass with no errors
npm test                 # Astro check + smoke tests + pipeline unit tests
npm run build            # production build must succeed
```

### 7. Spot-check the UI

```bash
npm run dev
```

Check:
- [ ] Dashboard shows correct next events
- [ ] Calendar page covers full season with no gaps
- [ ] Series pages show correct round count and progress
- [ ] No empty flags (bad countryCode)
- [ ] No events showing wrong status (past event still "upcoming")

### 8. Commit and push

```bash
git add data/silver/ data/gold/ data/seed/
git commit -m "chore: update race data for <season> season"
git push
```

---

**Key files:**
- `pipeline/config.py` — `SEASON_YEAR`, API URLs
- `data/seed/*.json` — manual calendar data for non-API series
- `data/silver/*.json` — normalized per-series output (committed)
- `data/gold/calendar.json` + `upcoming.json` — what the frontend reads

**Gotchas:**
- Moto2/Moto3 race times are approximately MotoGP+2h and MotoGP+4h respectively
- `upcoming.json` is sorted by series not date — sort by `dateStart` before applying dashboard caps
- WSBK has a JWT-gated API; if the fetch fails, update `data/seed/wsbk.json` manually
- Never use `data/bronze/` as a source of truth — it's a local cache and not committed
