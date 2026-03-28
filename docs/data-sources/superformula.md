# Data Source Research — Super Formula

**Series ID:** `superformula`
**Status:** `integrated`
**Integration path:** seed
**Last reviewed:** 2026-03-28

---

## Series Overview

The Super Formula Championship — Japan's top single-seater series, considered one of the fastest open-wheel categories outside F1. Run by the Japan Race Promotion (JRP). ~7–8 rounds per season, exclusively at Japanese circuits. Strong link to Japanese manufacturers (Honda, Toyota) and a stepping stone to F1. Shares circuits with Super GT.

---

## APIs & Sources Researched

### Super Formula Official (superformula.net)
- **URL:** `https://superformula.net/sf2/en/schedule/`
- **Status:** No public API. Schedule is published as static HTML.

### TheSportsDB
- **Status:** Super Formula not found in TheSportsDB.

### Jolpica / Ergast
- **Status:** F1-only. Does not cover Super Formula.

---

## Decision

**Integration path:** Seed file (`data/seed/superformula.json`)

**Rationale:** No free structured API exists. The calendar is small (7 rounds) and exclusively Japanese, making manual curation straightforward.

**Trade-offs accepted:**
- Manual update required each season
- All session times in JST (UTC+9) converted to UTC — verify with official schedule
- Circuit name "Twin Ring Motegi" has been rebranded to "Mobility Resort Motegi" but both names are used

---

## Data Mapping

| Field | Notes |
|-------|-------|
| `countryCode` | Always `JP` |
| `sessions` | Practice, Qualifying, Race |
| Times | JST (UTC+9) → subtract 9h for UTC |

---

## Key Circuits

| Circuit | City | UTC offset |
|---------|------|-----------|
| Suzuka International Racing Course | Suzuka, Mie | JST (UTC+9) |
| Okayama International Circuit | Aida, Okayama | JST (UTC+9) |
| Fuji Speedway | Oyama, Shizuoka | JST (UTC+9) |
| Autopolis | Kamitsue, Ōita | JST (UTC+9) |
| Twin Ring Motegi / Mobility Resort Motegi | Motegi, Tochigi | JST (UTC+9) |
| Sports Land Sugo | Murata, Miyagi | JST (UTC+9) |

---

## Maintenance

- **Update frequency:** Once per season (schedule usually published January/February)
- **Season rollover:** Replace `data/seed/superformula.json`, update IDs and session times
- **Source:** `superformula.net/sf2/en/schedule/` or JRP press releases

---

## TheSportsDB Reference

- **League ID:** Not available
