# Data Source Research — GT World Challenge Europe

**Series ID:** `gtworld`
**Status:** `integrated`
**Integration path:** seed
**Last reviewed:** 2026-04-30

---

## Series Overview

GT World Challenge Europe Powered by AWS is SRO's flagship European GT3 championship. The season mixes Sprint Cup and Endurance Cup weekends, including the 24 Hours of Spa, and runs across major European circuits from April to October.

---

## APIs & Sources Researched

### GT World Challenge Europe official calendar
- **URL:** `https://www.gt-world-challenge-europe.com/calendar`
- **Status:** Working
- **Notes:** Provides the official 2026 round list, venue names, and date ranges.

### GT World Challenge Europe save-date feed
- **URL:** `https://www.gt-world-challenge-europe.com/feed/get_event_calendar?meeting_id=<id>`
- **Status:** Working
- **Notes:** Provides event-level date ranges for each meeting.

### GT World Challenge Europe event pages
- **URL:** `https://www.gt-world-challenge-europe.com/event/<id>`
- **Status:** Working
- **Notes:** Official event pages expose timetable tables with `Session`, `Local Time`, and `GMT` columns. These were used for the 2026 seed session times, but RaceTrack intentionally excludes `Official Paid Test Sessions` and `Bronze Test` entries from the public calendar.

---

## Decision

**Integration path:** Seed file (`data/seed/gtworld.json`)

**Rationale:** The official site exposes the calendar and weekend timetables in HTML, but there is no stable public JSON API for direct ingestion. The season is compact and stable enough for manual normalization.

**Trade-offs accepted:**
- Manual update required each season
- Session names follow the official GT World Europe timetable wording where useful, but are normalized to Race / Race 1 / Race 2 for downstream UI behavior
- Non-competitive public-facing sessions such as pit walks, parades, paid tests, and bronze tests are excluded from the seed data

---

## Data Mapping

| Field | Notes |
|-------|-------|
| `seriesId` | Always `gtworld` |
| `eventName` | Official event title normalized to venue-first names |
| `sessions` | Derived from official event timetable tables on each meeting page, excluding paid/bronze test sessions |
| `countryCode` | Venue country alpha-2 code |

---

## Maintenance

- **Update frequency:** Once per season, plus any timetable updates published on official event pages
- **Season rollover:** Replace `data/seed/gtworld.json` and rebuild gold via the pipeline
- **Owner:** Manual; validate against `gt-world-challenge-europe.com/calendar` and each event page timetable