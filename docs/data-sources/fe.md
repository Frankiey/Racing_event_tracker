# Data Source Research — Formula E

**Series ID:** `fe`
**Status:** `integrated`
**Integration path:** `seed`
**Last reviewed:** 2026-03-22

---

## Series Overview

The ABB FIA Formula E World Championship — electric single-seater racing on street circuits. ~16 rounds per season, often in pairs (two races at the same venue on consecutive days). Unique format: city centre circuits, no qualifying in the traditional sense (uses Duels format).

---

## APIs & Sources Researched

### Source 1 — formulae.com API

- **URL:** `https://formulae.com/api/calendar`
- **Status:** 404
- **Notes:** Dead endpoint.

### Source 2 — FIA Formula E ICS feed

- **URL:** `https://fiaformulae.com/calendar.ics`
- **Status:** 404
- **Notes:** Dead endpoint.

### Source 3 — Pulselive Formula E API

- **URL:** `https://formula-e-api.pulselive.com/formula-e/v1/seasons`
- **URL:** `https://api.formula-e.pulselive.com/formula-e/v1/seasons`
- **Auth required:** Unknown (never got a response)
- **Status:** No response / structured 404 JSON
- **Notes:** Pulselive hosts a server at `formula-e-api.pulselive.com` (returns structured 404 JSON suggesting the API exists) but endpoints are not public. Possibly requires partner auth.

### Source 4 — FIA API

- **URL:** `https://api.fiaformulae.com/v1/seasons`
- **Status:** No response
- **Notes:** Dead or private.

### Source 5 — TheSportsDB

- **Status:** Formula E **not available** in TheSportsDB motorsport database.

---

## Decision

**Chosen source:** Manual seed file
**Integration path:** Seed (`data/seed/fe.json`)

**Rationale:**
No usable free public API exists for Formula E. All tested endpoints are dead, private, or require partner authentication. The season has ~16 rounds and is announced well in advance, making manual curation viable. Update cost is low (once per season).

**Trade-offs accepted:**
- Manual update required each season
- No automatic session time updates if FE changes its schedule mid-season

---

## Data Mapping

Seed file is written directly in silver schema. Key notes:
- `countryCode` must be alpha-2 (city circuits are often in unusual countries — double-check ISO codes)
- FE sometimes runs double-headers (two races at the same location on consecutive days) — model as separate events with different `id` values

---

## Maintenance

- **Update frequency:** Once per season (at calendar announcement, typically November/December)
- **Season rollover:** Manually update `data/seed/fe.json` with new round list
- **Owner:** Manual — check FIA Formula E website or `fiaformulae.com/en/championship/races` for official calendar

---

## TheSportsDB Reference

Formula E is **not available** in TheSportsDB.
