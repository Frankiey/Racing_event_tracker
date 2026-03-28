# Data Source Research — DTM

**Series ID:** `dtm`
**Status:** `integrated`
**Integration path:** seed
**Last reviewed:** 2026-03-28

---

## Series Overview

The Deutsche Tourenwagen Masters — Germany's premier touring car championship. GT3-based cars since 2021. ~7 rounds per season, primarily European venues (Germany, Netherlands, Belgium, Austria). Run by ITR (Internationale Tourenwagen-Rennen e.V.). Each round features two races with separate qualifying sessions.

---

## APIs & Sources Researched

### DTM.com
- **URL:** `https://www.dtm.com/en/calendar`
- **Status:** No public API. Calendar is server-rendered with no accessible JSON endpoint.
- **Notes:** Would need scraping or manual entry.

### TheSportsDB
- **Status:** DTM not confirmed in TheSportsDB.

### Motorsport-total / Speedweek
- **Status:** Third-party coverage sites, no structured API.

---

## Decision

**Integration path:** Seed file (`data/seed/dtm.json`)

**Rationale:** No free public API. DTM calendar is small (~7 rounds) and stable. Seed data is easy to maintain.

**Trade-offs accepted:**
- Manual update required each season
- Session times are approximate (DTM weekend format: Practice → Q1 → Race 1 → Q2 → Race 2 across Fri–Sun)

---

## Data Mapping

Manually entered following the silver schema. Each DTM round is one seed event with 5 sessions (Practice, Qualifying 1, Race 1, Qualifying 2, Race 2).

| Field | Notes |
|-------|-------|
| `countryCode` | Varies by venue (DE, NL, BE, AT) |
| `sessions` | Practice + Qualifying 1/2 + Race 1/2 |

---

## Maintenance

- **Update frequency:** Once per season
- **Season rollover:** Replace `data/seed/dtm.json` with new schedule, update IDs

---

## TheSportsDB Reference

- **League ID:** Not confirmed
