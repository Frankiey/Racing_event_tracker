# Data Source Research — BTCC (British Touring Car Championship)

**Series ID (proposed):** `btcc`
**Status:** `candidate`
**Integration path:** TBD — TheSportsDB likely viable
**Last reviewed:** 2026-03-22

---

## Series Overview

The Dunlop British Touring Car Championship — the UK's premier touring car series. ~10 rounds per season at UK circuits, 3 races per round. Very popular in the UK. All-day events on Sundays.

---

## APIs & Sources Researched

### Source 1 — TheSportsDB

- **URL:** `https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4372&s=2025`
- **Auth required:** No (free tier)
- **Status:** Confirmed in TheSportsDB league list — needs endpoint testing
- **Data quality:** Unknown — needs research
- **Rate limiting:** ~10-15 req then blocked ~15 seconds
- **Notes:** League ID 4372 confirmed in TheSportsDB motorsport database

**TODO:**
- [ ] Test the endpoint and check data quality (field completeness, session times)
- [ ] Check `btcc.net` for any official API or ICS feed
- [ ] Check if TheSportsDB returns all 3 races per round or just the round

---

## Decision

**Status:** Not yet decided — endpoint testing required

TheSportsDB (ID: 4372) is the most promising lead. If data quality is sufficient, this could be an API-backed series.

---

## TheSportsDB Reference

- **League ID:** 4372
- **Available data:** To be confirmed by testing
