# Data Source Research — ARCHIVED

> **This file is archived.** Research has been migrated to `docs/data-sources/` with one file per series.
> See [`docs/data-sources/_index.md`](docs/data-sources/_index.md) for the current source of truth.

---

# Original Research (2026-03-22)

## Research Date: 2026-03-22

---

## 1. MotoGP - TWO EXCELLENT SOURCES

### Source A: MotoGP Pulselive API (FREE, NO AUTH - CONFIRMED WORKING)
- **Seasons endpoint**: `https://api.motogp.pulselive.com/motogp/v1/results/seasons`
  - Returns array of `{id (UUID), year, current}`
  - 2025 UUID: `ae6c6f0d-c652-44f8-94aa-420fc5b3dab4`
  - 2026 UUID: `e88b4e43-2209-47aa-8e83-0e0b1cedde6e`
- **Events endpoint**: `https://api.motogp.pulselive.com/motogp/v1/results/events?seasonUuid={UUID}`
  - 2025: 33 total events (22 race weekends + 11 test events, filterable via `test` boolean)
  - 2026: 31 events with full calendar already available
- **Event data structure**:
```json
{
  "id": "b84b9bd0-3ef3-4367-90cb-2840350673ca",
  "name": "GRAND PRIX OF THAILAND",
  "short_name": "THA",
  "sponsored_name": "PT Grand Prix of Thailand",
  "additional_name": "THAILAND",
  "date_start": "2025-02-28",
  "date_end": "2025-03-02",
  "status": "FINISHED",        // also "CURRENT", "NOT-STARTED"
  "test": false,
  "country": { "iso": "TH", "name": "Thailand" },
  "circuit": {
    "id": "a8bd93f8-...",
    "name": "Chang International Circuit",
    "place": "Buriram",
    "nation": "THA"
  },
  "event_files": { "circuit_information": { "url": "..." }, ... },
  "season": { "id": "ae6c6f0d-...", "year": 2025, "current": false }
}
```
- **2025 full calendar (22 rounds)**:
  1. THA - Thailand (Feb 28 - Mar 2) FINISHED
  2. ARG - Argentina (Mar 14-16) FINISHED
  3. AME - Americas/COTA (Mar 28-30) FINISHED
  4. QAT - Qatar (Apr 11-13) FINISHED
  5. SPA - Spain/Jerez (Apr 25-27) FINISHED
  6. FRA - France/Le Mans (May 9-11) FINISHED
  7. GBR - UK/Silverstone (May 23-25) FINISHED
  8. ARA - Aragon (Jun 6-8) FINISHED
  9. ITA - Italy/Mugello (Jun 20-22) FINISHED
  10. NED - Netherlands/Assen (Jun 27-29) FINISHED
  11. GER - Germany/Sachsenring (Jul 11-13) FINISHED
  12. CZE - Czechia/Brno (Jul 18-20) FINISHED
  13. AUT - Austria/Red Bull Ring (Aug 15-17) FINISHED
  14. HUN - Hungary/Balaton Park (Aug 22-24) FINISHED
  15. CAT - Catalonia/Barcelona (Sep 5-7) FINISHED
  16. RSM - San Marino/Misano (Sep 12-14) FINISHED
  17. JPN - Japan/Motegi (Sep 26-28) FINISHED
  18. INA - Indonesia/Mandalika (Oct 3-5) FINISHED
  19. AUS - Australia/Phillip Island (Oct 17-19) FINISHED
  20. MAL - Malaysia/Sepang (Oct 24-26) FINISHED
  21. POR - Portugal/Algarve (Nov 7-9) FINISHED
  22. VAL - Valencia (Nov 14-16) FINISHED

- **2026 calendar (already available, at least 10 rounds confirmed)**:
  1. THA - Thailand (Feb 27 - Mar 1) FINISHED
  2. BRA - Brazil/Goiania (Mar 20-22) CURRENT
  3. USA - Americas/COTA (Mar 27-29)
  4. SPA - Spain/Jerez (Apr 24-26)
  5. FRA - France/Le Mans (May 8-10)
  6. CAT - Catalonia/Barcelona (May 15-17)
  7. ITA - Italy/Mugello (May 29-31)
  8. HUN - Hungary/Balaton Park (Jun 5-7)
  9. CZE - Czechia/Brno (Jun 19-21)
  10. NED - Netherlands/Assen (Jun 26-28)

### Source B: TheSportsDB (FREE - CONFIRMED WORKING)
- **Endpoint**: `https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4407&s=2025`
- **League ID**: 4407 | **API Key**: "3" (free tier)
- **Advantage over Pulselive**: Includes race results text, image URLs (poster/thumb/banner/fanart), YouTube highlight links
- **Event data includes**: `idEvent`, `strEvent`, `dateEvent`, `intRound`, `strVenue`, `strCountry`, `strCity`, `strResult`, `strPoster`, `strThumb`, `strVideo`
- **Note**: Lists Sprint races and GPs as separate events (good granularity)

---

## 2. NASCAR - TWO EXCELLENT SOURCES

### Source A: NASCAR CDN API (FREE, NO AUTH - CONFIRMED WORKING)
- **Endpoint**: `https://cf.nascar.com/cacher/2025/race_list_basic.json`
- **Returns**: JSON with `series_1` (Cup, 41 races), `series_2` (Xfinity, 33 races), `series_3` (Trucks, 25 races)
- **This is the OFFICIAL NASCAR data feed** - very detailed
- **Event data structure**:
```json
{
  "race_id": 5543,
  "series_id": 1,
  "race_season": 2025,
  "race_name": "Cook Out Clash at Bowman Gray",
  "race_type_id": 2,
  "track_id": 159,
  "track_name": "Bowman Gray Stadium",
  "date_scheduled": "2025-02-02T20:00:00",
  "race_date": "2025-02-02T20:00:00",
  "qualifying_date": "2025-02-02T20:00:00",
  "scheduled_distance": 50.6,
  "actual_distance": 50,
  "scheduled_laps": 200,
  "actual_laps": 200,
  "number_of_cars_in_field": 23,
  "number_of_lead_changes": 4,
  "number_of_cautions": 7,
  "average_speed": 40.956,
  "total_race_time": "1:13:15",
  "race_comments": "...",
  "schedule": [
    { "event_name": "Practice / Qualifying", "start_time_utc": "...", "run_type": 1 },
    ...
  ]
}
```
- **Additional detail endpoint**: `https://cf.nascar.com/cacher/2025/1/{race_id}/race_list_basic.json` (per-race)

### Source B: TheSportsDB (FREE - CONFIRMED WORKING)
- **Endpoint**: `https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4393&s=2025`
- **League ID**: 4393
- **Returned 15 events** for 2025 (events added progressively through season)
- **Adds**: poster images, YouTube highlights, venue details not in NASCAR CDN API

---

## 3. Formula E - NO API FOUND, NEEDS SEED DATA

### APIs tested (all failed):
- `https://formulae.com/api/calendar` - 404
- `https://fiaformulae.com/calendar.ics` - 404
- `https://formula-e-api.pulselive.com/formula-e/v1/seasons` - 404
- `https://api.formula-e.pulselive.com/formula-e/v1/seasons` - no response
- `https://api.fiaformulae.com/v1/seasons` - no response
- TheSportsDB: Formula E NOT in their motorsport database

### Conclusion: NEEDS MANUAL SEED DATA
- Formula E website exists but no public API found
- Pulselive hosts a server at `formula-e-api.pulselive.com` (returns structured 404 JSON) but endpoints are not public

---

## 4. IndyCar - NO API FOUND, NEEDS SEED DATA

### APIs tested (all failed):
- `https://www.indycar.com/api/schedule/2025` - redirect to 404
- `https://api.indycar.com/v1/schedule` - no response
- `https://www.indycar.com/-/media/indycar/schedule/2025-schedule.json` - 404
- `https://www.indycar.com/Schedule.ics` - 404
- TheSportsDB: IndyCar NOT in their motorsport database

### Conclusion: NEEDS MANUAL SEED DATA

---

## 5. WEC (World Endurance Championship) - NO API FOUND, NEEDS SEED DATA

### APIs tested (all failed):
- `https://api.fiawec.com/api/v1/season/2025/calendar` - no response
- `https://www.fiawec.com/en/calendar/90` - 404
- `https://www.fiawec.com/calendar.ics` - 404
- TheSportsDB: WEC NOT in their motorsport database

### Conclusion: NEEDS MANUAL SEED DATA

---

## Bonus: Other APIs Discovered

### Jolpica/Ergast API (F1 - not in scope but useful reference)
- `https://api.jolpi.ca/ergast/f1/2025.json` - WORKING, 24 races, detailed structure
- Includes circuit GPS coordinates, session times (FP1/FP2/FP3/Quali/Sprint)

### OpenF1 API (F1 only)
- `https://api.openf1.org/v1/sessions?year=2025` - WORKING, 123 sessions
- Very granular session-level data

### SportsData.io (paid, requires API key)
- Has NASCAR endpoint but requires auth (HTTP 401)
- `https://api.sportsdata.io/v3/nascar/scores/json/races/2025`

### API-Sports Motorsport (paid, requires API key)
- `https://v1.formula-1.api-sports.io/races` - exists but requires key

---

## TheSportsDB - Full Motorsport Leagues Available

| ID | League | Notes |
|----|--------|-------|
| 4407 | MotoGP | CONFIRMED - full calendar + results |
| 4393 | NASCAR Cup Series | CONFIRMED - calendar + results (partial) |
| 4489 | V8 Supercars | Australian Supercars |
| 4372 | BTCC | British Touring Car Championship |
| 4410 | British GT Championship | |
| 4730 | World Rallycross Championship | |
| 4412 | Super GT series | Japan |
| 4447 | Dakar Rally | |
| 5264 | British Superbike Championship | |
| 5600 | British Speedway Premiership | |
| 5750 | Goodwood Festival of Speed | |

**NOT in TheSportsDB**: Formula E, IndyCar, WEC, DTM, IMSA, F1

---

## Summary & Recommendations

| Series | Free API? | Best Source | Data Quality | Action |
|--------|-----------|-------------|-------------|--------|
| MotoGP | YES | Pulselive API (primary) + TheSportsDB (images/results) | Excellent | Auto-fetch |
| NASCAR | YES | NASCAR CDN (primary) + TheSportsDB (images) | Excellent (41 Cup races) | Auto-fetch |
| Formula E | NO | None | N/A | Manual seed data |
| IndyCar | NO | None | N/A | Manual seed data |
| WEC | NO | None | N/A | Manual seed data |

### Recommended architecture:
1. **MotoGP**: Fetch from Pulselive API (`/motogp/v1/results/seasons` then `/events?seasonUuid=`). Enrich with TheSportsDB for images and YouTube links.
2. **NASCAR**: Fetch from `cf.nascar.com/cacher/{year}/race_list_basic.json`. Use `series_1` for Cup Series. Enrich with TheSportsDB for images.
3. **Formula E**: Create JSON seed data file with 2025-2026 calendar. Update manually each season.
4. **IndyCar**: Create JSON seed data file with 2025-2026 calendar. Update manually each season.
5. **WEC**: Create JSON seed data file with 2025-2026 calendar. Update manually each season.

### Rate limiting notes:
- TheSportsDB free tier: aggressive rate limiting (~10-15 requests then blocked for ~15 seconds). Use caching.
- MotoGP Pulselive: No observed rate limiting. No auth required.
- NASCAR CDN: No observed rate limiting. Standard CDN caching.
