# Data Source Research — IMSA WeatherTech SportsCar Championship

**Series ID:** `imsa`
**Status:** `integrated`
**Integration path:** seed
**Last reviewed:** 2026-03-28

---

## Series Overview

America's premier sports car endurance series, run by IMSA (owned by NASCAR). ~11 rounds per season featuring a mix of endurance classics (Rolex 24 at Daytona, 12h Sebring, Petit Le Mans) and sprint races. Multi-class: GTP, GTD Pro, GTD. Shares some rounds with WEC (Sebring, Petit Le Mans are WEC/IMSA combined events).

---

## APIs & Sources Researched

### IMSA.com
- **URL:** `https://www.imsa.com/schedule/`
- **Status:** No public API. Schedule is rendered client-side from internal data.
- **Notes:** IMSA is NASCAR-owned — the NASCAR CDN (`cf.nascar.com/cacher`) may carry IMSA data in future but currently does not.

### NASCAR CDN (same owner)
- **URL:** `https://cf.nascar.com/cacher`
- **Status:** Only serves NASCAR Cup, Xfinity, Craftsman Truck series. No IMSA data found.

### TheSportsDB
- **Status:** IMSA not listed in TheSportsDB.

---

## Decision

**Integration path:** Seed file (`data/seed/imsa.json`)

**Rationale:** No free public API exists. Seed data is manually curated from the official IMSA schedule. IMSA schedules are stable and only change at the start of each season.

**Trade-offs accepted:**
- Manual update required each season (typically November/December)
- Session times are approximate for some rounds — exact broadcast times vary
- Daytona 24h and Petit Le Mans race durations are not modelled (no `endTimeUTC`)

---

## Data Mapping

Manually entered following the silver schema. All times in UTC.

| Field | Notes |
|-------|-------|
| `countryCode` | All rounds are US (`US`) |
| `sessions` | Practice, Qualifying, Race. Endurance rounds have longer race sessions. |
| `dateStart` / `dateEnd` | Weekend span |

---

## Maintenance

- **Update frequency:** Once per season (new seed file each year)
- **Season rollover:** Replace `data/seed/imsa.json` with new schedule, update year in IDs
- **Key dates to verify:** Daytona 24h (January), Sebring 12h (March), Petit Le Mans (October)
- **WEC overlap:** Sebring and Petit Le Mans appear in both IMSA and WEC seed files

---

## TheSportsDB Reference

- **League ID:** Not available
