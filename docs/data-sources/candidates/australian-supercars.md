# Data Source Research — Australian Supercars Championship

**Series ID (proposed):** `supercars`
**Status:** `candidate`
**Integration path:** TBD — TheSportsDB likely viable
**Last reviewed:** 2026-03-22

---

## Series Overview

The Repco Supercars Championship — Australia's premier motorsport series. ~14 rounds per season. High-performance V8 touring cars on a mix of street circuits (Surfers Paradise, Adelaide), permanent tracks, and the Bathurst 1000 (endurance). Very popular in Australia and NZ.

---

## APIs & Sources Researched

### Source 1 — TheSportsDB

- **URL:** `https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4489&s=2025`
- **Auth required:** No (free tier)
- **Status:** Confirmed in TheSportsDB league list — needs endpoint testing
- **Data quality:** Unknown — needs research
- **Rate limiting:** ~10-15 req then blocked ~15 seconds
- **Notes:** League ID 4489 confirmed in TheSportsDB motorsport database

**TODO:**
- [ ] Test the endpoint and check data quality
- [ ] Check `supercars.com` for official calendar API or ICS feed
- [ ] Note: Bathurst 1000 is an endurance event — `endTimeUTC` needed

---

## Decision

**Status:** Not yet decided — endpoint testing required

TheSportsDB (ID: 4489) is the most promising lead.

---

## TheSportsDB Reference

- **League ID:** 4489
- **Available data:** To be confirmed by testing
