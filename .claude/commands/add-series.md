# Add a New Motorsport Series

Guide me through adding a new motorsport series to RaceTrack end-to-end.

## What to do

Ask the user for the series name and ID they want to add (e.g. "DTM", id: "dtm"). Then work through these steps in order:

### 1. Check if an API exists
Search `pipeline/fetchers/` for existing examples. If a free, unauthenticated API exists for this series, build a fetcher. If not, we'll use seed data — check `data/seed/` for the format.

### 2. Register series metadata
Add the series to `src/lib/series.ts`:
- Entry in the `SERIES` map: `id`, `name`, `shortName`, `color` (hex), `textColor`
- Add the id to `SERIES_LIST`

### 3. Create the data

**Seed data path:** Create `data/seed/<id>.json` following the silver schema in `docs/architecture.md`. Required fields per event:
- `id` (e.g. `"dtm-2026-r01"`), `seriesId`, `eventName`, `round`
- `circuit`: `name`, `city`, `country`, `countryCode` (ISO alpha-2 — 2 letters only!)
- `sessions[]`: each with `type`, `startTimeUTC` (ISO 8601 UTC), `endTimeUTC`
- `dateStart`, `dateEnd`, `status`

**API path:** Create `pipeline/fetchers/<id>.py` (bronze) and `pipeline/transforms/<id>.py` (silver). Follow the pattern in existing fetchers.

### 4. Wire up the pipeline
In `pipeline/config.py` add the series id to the series list. In `pipeline/run.py` import and register the fetcher/transform.

### 5. Rebuild gold
```bash
uv run python -m pipeline --series <id>
```
Verify `data/silver/<id>.json` looks correct, then check `data/gold/calendar.json` includes the new events.

### 6. Test the UI
```bash
npm run dev
```
Check:
- [ ] Series badge renders with correct color on EventCard
- [ ] Events appear on dashboard (`/`) and calendar (`/calendar`)
- [ ] Series page at `/series/<id>` loads correctly
- [ ] Event modal shows all sessions with correct local times
- [ ] No empty flags (means countryCode is wrong — must be alpha-2)

### 7. Track the work
```bash
bd create --title="Add <Series Name> series" --type=feature --priority=2
bd update <id> --claim
```

---

**Gotchas:**
- `countryCode` must be ISO alpha-2 (2 letters) — alpha-3 silently returns an empty flag emoji
- All times must be UTC in ISO 8601 format — the browser converts to local time
- Never use `bg-[#hex]` Tailwind classes for series colors — always `style="background: #hex"`
- `upcoming.json` is sorted by series not date — always sort by `dateStart` before applying caps
