# Data Source Research — [SERIES NAME]

**Series ID:** `<id>` (must match `SERIES_IDS` in `pipeline/config.py`)
**Status:** `candidate` | `researched` | `integrated` | `needs-update`
**Integration path:** `api` | `seed`
**Last reviewed:** YYYY-MM-DD

---

## Series Overview

Brief description of the series: what it is, how many rounds per season, who runs it, why it's worth including.

---

## APIs & Sources Researched

For each source tested, document the result — working or not — so future agents don't repeat the same dead ends.

### Source 1 — [Name]

- **URL:** `https://...`
- **Auth required:** Yes / No
- **Status:** Working / 404 / No response / Requires paid key
- **Data quality:** What fields does it return? Missing anything?
- **Rate limiting:** Observed limits, caching behaviour
- **Sample response:**
```json
{
  "field": "value"
}
```
- **Notes:** Anything surprising or worth knowing

### Source 2 — [Name]

- **URL:** `https://...`
- **Auth required:**
- **Status:**
- **Data quality:**
- **Rate limiting:**
- **Notes:**

_(Add more sources as needed. Always document failed attempts — it saves future research time.)_

---

## Decision

**Chosen source:** [Name]
**Integration path:** API fetcher (`pipeline/fetchers/<id>.py`) | Seed file (`data/seed/<id>.json`)

**Rationale:**
Why this source over the alternatives? What made it the best fit?

**Trade-offs accepted:**
What are the known downsides of this choice? (e.g. manual updates each season, missing session times, partial calendar)

---

## Data Mapping

How the source fields map to the RaceTrack silver schema:

| Source field | Silver field | Notes |
|-------------|-------------|-------|
| `source.name` | `eventName` | |
| `source.date` | `dateStart` | Convert to ISO 8601 |
| `source.country.iso` | `circuit.countryCode` | Must be alpha-2 |
| `source.sessions[]` | `sessions[]` | |

---

## Implementation Notes

- Any quirks in the data that the fetcher/transform needs to handle
- Placeholder values to watch for (e.g. `1900-01-01` for missing times)
- Country code format (alpha-2 vs alpha-3 — `countryFlag()` requires alpha-2)
- Session type naming conventions used by this source

---

## Maintenance

- **Update frequency:** How often does this data change? (nightly / start of season / manually each season)
- **Season rollover:** What needs to change at the start of a new season?
- **Owner:** Who is responsible for keeping this up to date?

---

## TheSportsDB Reference

If applicable, note the TheSportsDB league ID for this series — useful for enriching with images and YouTube highlights even if a better primary source exists.

- **League ID:** —
- **Available data:** —
