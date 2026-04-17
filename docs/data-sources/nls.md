# Data Source Research — NLS (Nürburgring-Langstrecken-Serie)

**Series ID:** `nls`
**Status:** `integrated`
**Integration path:** seed
**Last reviewed:** 2026-04-12

---

## Series Overview

The Nürburgring-Langstrecken-Serie (formerly VLN) — an endurance racing series held exclusively on the Nürburgring Nordschleife (and combined Gesamtstrecke for the 24h). ~8–10 rounds per season from March to October. The highlight is the ADAC RAVENOL 24h Nürburgring in May, one of the world's largest motorsport events by entrant count.

**Season structure (2026):**
- NLS 1–3: March–April sprint rounds (single day)
- ADAC 24h Qualifiers: April (2-day qualifier weekend, NLS4)
- ADAC RAVENOL 24h Nürburgring: May 14–17 (the 24h race itself, Gesamtstrecke)
- NLS 6–10: June–October sprint rounds

---

## APIs & Sources Researched

### NLS Official (nuerburgring.de / nls.de)
- **URL:** `https://nls.de/en/calendar/`
- **Status:** No public API. Schedule is published as a PDF and on the website.
- **Notes:** Official schedule confirmed for 2026 via event organiser (ADAC).

### ADAC Motorsport
- **URL:** `https://www.adac.de/motorsport/`
- **Status:** No structured API.

---

## Decision

**Integration path:** Seed file (`data/seed/nls.json`)

**Rationale:** No API exists. Dates come directly from the official ADAC/NLS published schedule. The calendar is small (8–9 entries) and very stable.

**Trade-offs accepted:**
- Manual update each season
- Standard NLS round timings are approximated from the published 2026 weekend pattern used by broadcasters and event coverage: qualifying at 08:30 local and race start at 12:00 local
- The 24h race has precise session times from the official event timetable
- The 24h Qualifiers weekend currently mirrors the same 08:30 / 12:00 local timing pattern until the official 2026 qualifiers timetable is published

---

## Data Mapping

| Field | Notes |
|-------|-------|
| `countryCode` | Always `DE` |
| `circuit.name` | `"Nürburgring Nordschleife"` for regular rounds; `"Nürburgring Gesamtstrecke"` for the 24h |
| `sessions` | Regular rounds: Qualifying + Race. 24h Qualifiers: Qualifying 1/2 + Race 1/2. 24h: Qualifying 1/2/3, Top Quali 1/2/3, Warm Up, Race. |

---

## 24h Race Session Times (2026 — from official timetable)

All times CEST (UTC+2):

| Session | Date | Local | UTC |
|---------|------|-------|-----|
| Qualifying 1 | Thu 14 May | 13:15 | 11:15 |
| Qualifying 2 | Thu 14 May | 20:00 | 18:00 |
| Top Quali 1 | Fri 15 May | 08:50 | 06:50 |
| Top Quali 2 | Fri 15 May | 09:45 | 07:45 |
| Qualifying 3 | Fri 15 May | 10:35 | 08:35 |
| Top Quali 3 | Fri 15 May | 13:35 | 11:35 |
| Warm Up | Sat 16 May | 10:00 | 08:00 |
| **Race Start** | **Sat 16 May** | **15:00** | **13:00** |
| Race Finish | Sun 17 May | 15:00 | 13:00 |

Source: Official ADAC RAVENOL 24h Nürburgring timetable v0, dated 10 November 2025.

---

## Maintenance

- **Update frequency:** Once per season + when official timetable is published (usually Nov/Dec)
- **Season rollover:** Update `data/seed/nls.json`. Pay attention to DST transitions (CET in March, CEST from late March onwards).
- **24h timetable:** Monitor `nurburgring.de` for updated versions — subject to change up to race week.

---

## TheSportsDB Reference

- **League ID:** Not available
