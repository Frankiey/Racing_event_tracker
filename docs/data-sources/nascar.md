# Data Source Research — NASCAR

**Series ID:** `nascar`
**Status:** `integrated`
**Integration path:** `api`
**Last reviewed:** 2026-03-22

---

## Series Overview

NASCAR Cup Series — the top tier of American oval racing. 41 races per season. Weekend format: Practice, Qualifying, Race (times vary by track/broadcast deal). The CDN feed also contains Xfinity Series (series_2) and Truck Series (series_3) — currently only Cup (series_1) is integrated.

---

## APIs & Sources Researched

### Source 1 — NASCAR CDN (primary)

- **URL:** `https://cf.nascar.com/cacher/{year}/race_list_basic.json`
- **Auth required:** No
- **Status:** Working — official NASCAR data feed, very detailed
- **Data quality:** Excellent. Full calendar with per-race schedule breakdown, track details, qualifying times, laps, distances, results.
- **Rate limiting:** Standard CDN caching — no observed limits
- **Sample response:**
```json
{
  "series_1": [
    {
      "race_id": 5543,
      "series_id": 1,
      "race_season": 2025,
      "race_name": "Cook Out Clash at Bowman Gray",
      "track_name": "Bowman Gray Stadium",
      "date_scheduled": "2025-02-02T20:00:00",
      "race_date": "2025-02-02T20:00:00",
      "qualifying_date": "2025-02-02T20:00:00",
      "schedule": [
        { "event_name": "Practice / Qualifying", "start_time_utc": "...", "run_type": 1 },
        { "event_name": "Race", "start_time_utc": "...", "run_type": 2 }
      ]
    }
  ],
  "series_2": [...],
  "series_3": [...]
}
```
- **Notes:** `qualifying_date` is sometimes `1900-01-01T00:00:00Z` when not yet scheduled. The `isPlaceholderTime()` function in `src/lib/time.ts` filters these from the UI.

### Source 2 — Per-race detail endpoint

- **URL:** `https://cf.nascar.com/cacher/{year}/1/{race_id}/race_list_basic.json`
- **Auth required:** No
- **Status:** Working
- **Data quality:** More granular per-race data. Useful for results enrichment.
- **Notes:** Not currently used — base endpoint has enough for calendar purposes.

### Source 3 — TheSportsDB

- **URL:** `https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4393&s=2025`
- **Auth required:** No (free tier)
- **Status:** Working — 15 events returned for 2025 (added progressively)
- **Data quality:** Adds poster images, YouTube highlights, venue details
- **Rate limiting:** ~10-15 req then blocked ~15 seconds
- **Notes:** Partial coverage — not all races appear. Useful for image enrichment only.

### Source 4 — SportsData.io

- **URL:** `https://api.sportsdata.io/v3/nascar/scores/json/races/2025`
- **Auth required:** Yes (API key)
- **Status:** HTTP 401
- **Notes:** Paid tier required. Not pursued.

---

## Decision

**Chosen source:** NASCAR CDN
**Integration path:** API fetcher (`pipeline/fetchers/nascar.py`)

**Rationale:**
The NASCAR CDN is the official data feed — comprehensive, free, no auth, and includes session-level schedule breakdowns per race. TheSportsDB has only partial coverage and rate limits. SportsData.io requires a paid key.

**Trade-offs accepted:**
- `qualifying_date` uses `1900-01-01T00:00:00Z` as a placeholder for unscheduled sessions — must filter these in the UI
- Times in the CDN are Eastern Time (ET), not UTC — transform must convert
- Xfinity and Truck Series are available in the same feed but not yet integrated

---

## Data Mapping

| Source field | Silver field | Notes |
|-------------|-------------|-------|
| `race_name` | `eventName` | |
| `date_scheduled` | `dateStart` | Convert ET → UTC |
| `track_name` | `circuit.name` | |
| `schedule[]` | `sessions[]` | Filter out 1900 placeholder times |
| (derived) | `circuit.countryCode` | All Cup races are US → "US" |

---

## Implementation Notes

- `qualifying_date` of `1900-01-01T00:00:00Z` = not yet scheduled. Skip in session array.
- `series_1` = Cup Series, `series_2` = Xfinity, `series_3` = Trucks
- All races are in the US so `countryCode: "US"` can be hardcoded in the transform

---

## Maintenance

- **Update frequency:** Nightly via GitHub Actions cron
- **Season rollover:** URL year segment changes — driven by `SEASON_YEAR` in `config.py`
- **Owner:** Automated — no manual updates needed

---

## TheSportsDB Reference

- **League ID:** 4393
- **Available data:** Partial calendar (events added progressively), poster images, YouTube highlights
