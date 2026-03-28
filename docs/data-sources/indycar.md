# Data Source Research — IndyCar

**Series ID:** `indycar`
**Status:** `integrated`
**Integration path:** `seed`
**Last reviewed:** 2026-03-22

---

## Series Overview

The NTT IndyCar Series — America's premier open-wheel racing series. ~17 rounds per season including the Indianapolis 500 (the biggest event). Mix of ovals, street circuits, and road courses. Weekend format varies by track type.

---

## APIs & Sources Researched

### Source 1 — IndyCar official API

- **URL:** `https://www.indycar.com/api/schedule/2025`
- **Status:** Redirect → 404
- **Notes:** Dead endpoint.

### Source 2 — IndyCar API v1

- **URL:** `https://api.indycar.com/v1/schedule`
- **Status:** No response
- **Notes:** Dead or private.

### Source 3 — IndyCar media schedule JSON

- **URL:** `https://www.indycar.com/-/media/indycar/schedule/2025-schedule.json`
- **Status:** 404
- **Notes:** Dead endpoint.

### Source 4 — IndyCar ICS feed

- **URL:** `https://www.indycar.com/Schedule.ics`
- **Status:** 404
- **Notes:** Dead endpoint.

### Source 5 — TheSportsDB

- **Status:** IndyCar **not available** in TheSportsDB motorsport database.

---

## Decision

**Chosen source:** Manual seed file
**Integration path:** Seed (`data/seed/indycar.json`)

**Rationale:**
No usable free public API exists for IndyCar. All tested endpoints are dead or private. ~17 rounds announced well in advance — manual curation is viable at low maintenance cost.

**Trade-offs accepted:**
- Manual update required each season
- No automatic oval vs. road course distinction in the data (could be added to seed manually)

---

## Data Mapping

Seed file is written directly in silver schema. Key notes:
- `countryCode` is almost always `"US"` except for a few international rounds (e.g. Canada → `"CA"`, Brazil → `"BR"`)
- Indianapolis 500 deserves a distinct `eventName` — it is not just "IndyCar Round 5" culturally

---

## Maintenance

- **Update frequency:** Once per season (calendar typically announced in November)
- **Season rollover:** Manually update `data/seed/indycar.json` with new round list
- **Owner:** Manual — check `indycar.com/schedule` for official calendar

---

## TheSportsDB Reference

IndyCar is **not available** in TheSportsDB.
