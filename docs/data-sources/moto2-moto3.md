# Data Source Research — Moto2 & Moto3

**Series IDs:** `moto2`, `moto3`
**Status:** `integrated`
**Integration path:** `generated-from-motogp`
**Last reviewed:** 2026-05-09

---

## Series Overview

Moto2 and Moto3 are the two support series that race at every MotoGP round. Same venues, same weekends. The previous seed-data shortcut only stored qualifying and race, which was not enough to represent Saturday practice/qualifying accurately. The pipeline now derives fuller support-class weekends directly from MotoGP silver events using local-time offsets per session.

---

## APIs & Sources Researched

### Source 1 — MotoGP Pulselive API (derived)

- **URL:** `https://api.motogp.pulselive.com/motogp/v1/results/events?seasonUuid={UUID}`
- **Status:** Working (same API as MotoGP)
- **Coverage:** The events endpoint covers the full MotoGP calendar — Moto2 and Moto3 race at all the same rounds
- **Session times:** MotoGP session times are returned by the existing Pulselive session fetch used for MotoGP silver.
- **Notes:** Moto2/Moto3 are generated from the MotoGP silver timetable using local-time offsets that preserve the support-series weekend order across time zones.

---

## Decision

**Chosen source:** Generated from MotoGP silver
**Integration path:** Pipeline generation (`pipeline/transforms/moto_support.py`)

**Rationale:**
Moto2 and Moto3 always race at the same venues and on the same weekends as MotoGP. Generating them from MotoGP silver keeps venues, weekends, and local track timing aligned without having to hand-maintain incomplete support-series seeds.

**Trade-offs accepted:**
- Session times are still modeled offsets, not first-party Moto2/Moto3 session fetches
- Offsets are applied in local circuit time so UTC output stays sensible outside Europe

---

## Data Mapping

Generated events are written directly in silver schema:
- `seriesId`: `"moto2"` or `"moto3"`
- Session types: `"FP1"`, `"Practice"`, `"FP2"`, `"Qualifying"`, `"Race"`
- Circuits are identical to MotoGP — same `circuit` objects
- `countryCode` must match MotoGP entries (alpha-2)

---

## Future Option: Fetch support classes directly

The Pulselive platform appears to expose support-class categories as well. A future improvement would replace the offset model with direct Moto2/Moto3 session fetches once the category UUIDs are wired into the fetcher.

---

## Maintenance

- **Update frequency:** Once per season (MotoGP calendar is the source of truth for venues/dates)
- **Season rollover:** Keep MotoGP season data current; Moto2/Moto3 regenerate from that source
- **Owner:** Pipeline-derived from MotoGP silver

---

## TheSportsDB Reference

Moto2 and Moto3 are not separately listed in TheSportsDB (only MotoGP at league ID 4407).
