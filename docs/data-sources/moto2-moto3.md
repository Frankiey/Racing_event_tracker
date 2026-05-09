# Data Source Research — Moto2 & Moto3

**Series IDs:** `moto2`, `moto3`
**Status:** `integrated`
**Integration path:** `api`
**Last reviewed:** 2026-05-09

---

## Series Overview

Moto2 and Moto3 are the two support series that race at every MotoGP round. Same venues, same weekends. The pipeline now fetches their real support-class sessions directly from the Pulselive API using the Moto2 and Moto3 category UUIDs, so Friday practice, Saturday qualifying, and Sunday race timing are taken from the source rather than inferred.

---

## APIs & Sources Researched

### Source 1 — MotoGP Pulselive API (direct support categories)

- **URL:** `https://api.motogp.pulselive.com/motogp/v1/results/events?seasonUuid={UUID}`
- **Status:** Working (same API as MotoGP)
- **Coverage:** The events endpoint covers the full MotoGP calendar — Moto2 and Moto3 race at all the same rounds
- **Session times:** Returned by the same Pulselive sessions endpoint used for MotoGP when queried with the support-class category UUID.
- **Category UUIDs:**
	- **Moto2:** `549640b8-fd9c-4245-acfd-60e4bc38b25c`
	- **Moto3:** `954f7e65-2ef2-4423-b949-4961cc603e45`
- **Notes:** The `results/categories?seasonUuid=...` endpoint exposes all three class IDs, and `results/sessions?eventUuid=...&categoryUuid=...` returns the exact support-class timetable.

---

## Decision

**Chosen source:** Pulselive API (direct)
**Integration path:** API fetcher (`pipeline/fetchers/moto_support.py`)

**Rationale:**
Moto2 and Moto3 always race at the same venues and on the same weekends as MotoGP, but their intra-weekend session timing is not stable enough for offset-based modeling. Pulling the real support-class sessions from Pulselive removes that drift and keeps the site aligned with live weekends.

**Trade-offs accepted:**
- The implementation still depends on Pulselive’s current category UUIDs remaining stable
- The events endpoint is shared with MotoGP, so support classes still inherit the same venue/date shell from that source

---

## Data Mapping

Fetched events are written directly in silver schema:
- `seriesId`: `"moto2"` or `"moto3"`
- Session types: `"FP1"`, `"Practice"`, `"FP2"`, `"Q1"`, `"Q2"`, `"Race"` when the source splits qualifying into two segments
- Circuits are identical to MotoGP — same `circuit` objects
- `countryCode` must match MotoGP entries (alpha-2)

---

## Future Option: Share MotoGP event fetches

Moto2 and Moto3 currently make their own Pulselive event requests even though the event shells match MotoGP. A future cleanup could centralize the shared events fetch while still querying sessions separately per category.

---

## Maintenance

- **Update frequency:** Once per season (MotoGP calendar is the source of truth for venues/dates)
- **Season rollover:** Confirm the categories endpoint still returns the same support-class UUIDs when a new season opens
- **Owner:** Automated — Pulselive support-category fetch

---

## TheSportsDB Reference

Moto2 and Moto3 are not separately listed in TheSportsDB (only MotoGP at league ID 4407).
