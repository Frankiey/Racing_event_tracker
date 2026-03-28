# Data Source Research — MotoGP

**Series ID:** `motogp`
**Status:** `integrated`
**Integration path:** `api`
**Last reviewed:** 2026-03-22

---

## Series Overview

The FIM MotoGP World Championship. 22 rounds in 2026. Weekend format: Practice, Sprint (Saturday), Race (Sunday). Each round also hosts Moto2 and Moto3 support races. Excellent free public API via Pulselive.

---

## APIs & Sources Researched

### Source 1 — MotoGP Pulselive API (primary)

- **Auth required:** No
- **Status:** Working — confirmed with full 2025 and 2026 calendars
- **Rate limiting:** None observed
- **Seasons endpoint:** `https://api.motogp.pulselive.com/motogp/v1/results/seasons`
  - Returns array of `{ id (UUID), year, current }`
  - 2025 UUID: `ae6c6f0d-c652-44f8-94aa-420fc5b3dab4`
  - 2026 UUID: `e88b4e43-2209-47aa-8e83-0e0b1cedde6e`
- **Events endpoint:** `https://api.motogp.pulselive.com/motogp/v1/results/events?seasonUuid={UUID}`
  - Filter `"test": false` to exclude test events
  - 2025: 22 race weekends (+ 11 test events)
  - 2026: 10+ rounds confirmed, full calendar available
- **Sample response:**
```json
{
  "id": "b84b9bd0-3ef3-4367-90cb-2840350673ca",
  "name": "GRAND PRIX OF THAILAND",
  "short_name": "THA",
  "date_start": "2025-02-28",
  "date_end": "2025-03-02",
  "status": "FINISHED",
  "test": false,
  "country": { "iso": "TH", "name": "Thailand" },
  "circuit": {
    "name": "Chang International Circuit",
    "place": "Buriram",
    "nation": "THA"
  }
}
```
- **Notes:** `country.iso` is alpha-2 — perfect for `countryFlag()`. `circuit.nation` is alpha-3 — do not use for flags. Session times not included in the events endpoint; must be derived or approximated.

### Source 2 — TheSportsDB

- **URL:** `https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4407&s=2025`
- **Auth required:** No (free tier)
- **Status:** Working
- **Data quality:** Calendar + results text, poster/thumb images, YouTube highlights. Lists Sprint races and GPs as separate events.
- **Rate limiting:** ~10-15 requests then blocked for ~15 seconds. Cache aggressively.
- **Notes:** Useful for enrichment (images, highlights) but not reliable as primary due to rate limits and partial season data (events added progressively).

---

## Decision

**Chosen source:** Pulselive API (primary)
**Integration path:** API fetcher (`pipeline/fetchers/motogp.py`)

**Rationale:**
Pulselive is the official MotoGP data provider. The API is free, no auth, returns full season calendars including future rounds, and uses ISO alpha-2 country codes directly. TheSportsDB is available as an enrichment source for images if needed later.

**Trade-offs accepted:**
- Session times are not returned by the events endpoint — Moto2 and Moto3 times are approximated as offsets from MotoGP times (Moto2 ≈ MotoGP − 2h, Moto3 ≈ MotoGP − 4h)
- `circuit.nation` is alpha-3 — must use `country.iso` for flag rendering

---

## Data Mapping

| Source field | Silver field | Notes |
|-------------|-------------|-------|
| `name` | `eventName` | |
| `date_start` | `dateStart` | Already ISO 8601 date |
| `country.iso` | `circuit.countryCode` | Alpha-2 ✓ |
| `country.name` | `circuit.country` | |
| `circuit.name` | `circuit.name` | |
| `circuit.place` | `circuit.city` | |
| (approx) | `sessions[]` | Sprint Saturday + Race Sunday at standard MotoGP times |

---

## Maintenance

- **Update frequency:** Nightly via GitHub Actions cron
- **Season rollover:** Fetch seasons endpoint first to get new year UUID — `SEASON_YEAR` in `config.py` drives this
- **Owner:** Automated — UUID lookup handles year transitions automatically

---

## TheSportsDB Reference

- **League ID:** 4407
- **Available data:** Full calendar, results, poster images, YouTube highlights
