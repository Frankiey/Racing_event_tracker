# Data Source Research — Moto2 & Moto3

**Series IDs:** `moto2`, `moto3`
**Status:** `integrated`
**Integration path:** `seed`
**Last reviewed:** 2026-03-22

---

## Series Overview

Moto2 and Moto3 are the two support series that race at every MotoGP round. Same venues, same weekends. Session times are offset from MotoGP by fixed amounts (Moto2 runs ~2 hours before MotoGP, Moto3 ~4 hours before). MotoGP Pulselive API covers these series in the same events feed, but session-level times are not returned by the calendar endpoints.

---

## APIs & Sources Researched

### Source 1 — MotoGP Pulselive API (indirect)

- **URL:** `https://api.motogp.pulselive.com/motogp/v1/results/events?seasonUuid={UUID}`
- **Status:** Working (same API as MotoGP)
- **Coverage:** The events endpoint covers the full MotoGP calendar — Moto2 and Moto3 race at all the same rounds
- **Session times:** Not returned by this endpoint. Session-level endpoints exist but require session UUIDs from a separate call.
- **Notes:** Technically possible to derive Moto2/Moto3 calendars from MotoGP Pulselive, but session times would still need to be approximated.

---

## Decision

**Chosen source:** Manual seed files (derived from MotoGP calendar with time offsets)
**Integration path:** Seed (`data/seed/moto2.json`, `data/seed/moto3.json`)

**Rationale:**
Moto2 and Moto3 always race at the same venues and on the same weekends as MotoGP. Rather than building a separate API fetcher (which would return the same venues/dates anyway), seed files are manually created with:
- Same circuits and dates as MotoGP
- Session times offset from MotoGP standard times:
  - **Moto2:** MotoGP Race time − 2 hours (approx)
  - **Moto3:** MotoGP Race time − 4 hours (approx)

**Trade-offs accepted:**
- Session times are approximations — exact times vary by round and are only published close to the event
- Must be kept in sync with MotoGP seed data manually

---

## Data Mapping

Seed files are written directly in silver schema:
- `seriesId`: `"moto2"` or `"moto3"`
- Session types: `"Practice"`, `"Qualifying"`, `"Sprint"`, `"Race"` (mirroring MotoGP format)
- Circuits are identical to MotoGP — same `circuit` objects
- `countryCode` must match MotoGP entries (alpha-2)

---

## Future Option: Generate from MotoGP silver

A pipeline step could auto-generate Moto2/Moto3 events from MotoGP silver data:
1. After MotoGP silver is written, clone each event with `seriesId` changed to `moto2`/`moto3`
2. Apply standard time offsets to session `startTimeUTC`
3. This would keep all three series automatically in sync

Not implemented yet — seed files are simpler for now.

---

## Maintenance

- **Update frequency:** Once per season (MotoGP calendar is the source of truth for venues/dates)
- **Season rollover:** Update `data/seed/moto2.json` and `data/seed/moto3.json` alongside MotoGP calendar updates
- **Owner:** Manual — derive from MotoGP Pulselive API output or `motogp.com/en/calendar`

---

## TheSportsDB Reference

Moto2 and Moto3 are not separately listed in TheSportsDB (only MotoGP at league ID 4407).
