# Data Source Research — WEC (World Endurance Championship)

**Series ID:** `wec`
**Status:** `integrated`
**Integration path:** `seed`
**Last reviewed:** 2026-03-22

---

## Series Overview

The FIA World Endurance Championship — the premier endurance racing series. 7 rounds per season including the 24 Hours of Le Mans. Races range from 6 hours to 24 hours. Classes: Hypercar, LMP2, LMGT3. The Le Mans 24h is the most prestigious motorsport event in the world.

---

## APIs & Sources Researched

### Source 1 — FIA WEC API

- **URL:** `https://api.fiawec.com/api/v1/season/2025/calendar`
- **Status:** No response
- **Notes:** Dead or private.

### Source 2 — FIA WEC calendar page

- **URL:** `https://www.fiawec.com/en/calendar/90`
- **Status:** 404
- **Notes:** Dead endpoint.

### Source 3 — FIA WEC ICS feed

- **URL:** `https://www.fiawec.com/calendar.ics`
- **Status:** 404
- **Notes:** Dead endpoint.

### Source 4 — TheSportsDB

- **Status:** WEC **not available** in TheSportsDB motorsport database.

---

## Decision

**Chosen source:** Manual seed file
**Integration path:** Seed (`data/seed/wec.json`)

**Rationale:**
No usable free public API exists for WEC. All tested endpoints are dead. Only 7 rounds per season — manual curation is extremely low cost. Calendar announced well in advance (usually at previous year's Le Mans week).

**Trade-offs accepted:**
- Manual update required each season
- `endTimeUTC` is especially important for WEC due to 6h/24h race durations — must be set accurately in the seed file

---

## Data Mapping

Seed file is written directly in silver schema. Special considerations:
- `endTimeUTC` is **required** (not optional) for WEC — endurance races have significant duration
- Le Mans 24h: `startTimeUTC` Saturday 16:00 UTC → `endTimeUTC` Sunday 16:00 UTC
- 6 Hour races: `endTimeUTC` = `startTimeUTC` + 6 hours (plus warmup/formation)
- `countryCode` varies: Belgium (`BE`), France (`FR`), Italy (`IT`), Japan (`JP`), USA (`US`), Brazil (`BR`), Bahrain (`BH`)

---

## Maintenance

- **Update frequency:** Once per season (calendar typically announced at Le Mans week the previous year)
- **Season rollover:** Manually update `data/seed/wec.json` with new round list
- **Owner:** Manual — check `fiawec.com/en/calendar` for official calendar

---

## TheSportsDB Reference

WEC is **not available** in TheSportsDB.
