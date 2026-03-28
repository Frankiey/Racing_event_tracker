# Data Source Research — World Superbike Championship (WorldSBK)

**Series ID:** `wsbk`
**Status:** `integrated`
**Integration path:** API (Pulselive) with seed fallback
**Last reviewed:** 2026-03-28

---

## Series Overview

The FIM Superbike World Championship (WorldSBK) — premier production-derived motorcycle racing series. Run by Dorna Sports (same as MotoGP). ~11–13 rounds per season across Europe, Asia, and Australia. Each round has a distinctive 3-race format: Race 1 (Saturday), Superpole Race (Sunday morning sprint), Race 2 (Sunday afternoon).

---

## APIs & Sources Researched

### WorldSBK Pulselive API
- **URL:** `https://api.worldsbk.pulselive.com/sbk/v1`
- **Auth required:** Likely JWT (confirmed 401 on unauthenticated request)
- **Status:** JWT-gated — not publicly accessible without a token
- **Notes:** Dorna operates WorldSBK on the same Pulselive infrastructure as MotoGP. The endpoint pattern mirrors MotoGP exactly (`/results/seasons`, `/results/events?seasonUuid=UUID`). A public token may exist — needs browser devtools investigation on `worldsbk.com/en/calendar/2026`.

**How to confirm the endpoint:**
1. Open `worldsbk.com/en/calendar/2026` in Chrome DevTools → Network → XHR/Fetch
2. Look for calls to `pulselive.com` or `worldsbk.com/api`
3. Copy the request URL and check if it includes an auth header

### Alternative base tested
- **URL:** `https://api.worldsbk.com/sbk/v1`
- **Status:** 401 returned — JWT required

---

## Decision

**Integration path:** API fetcher (`pipeline/fetchers/wsbk.py`) with automatic seed fallback

**Rationale:** WorldSBK uses the same Pulselive stack as MotoGP — the fetcher and transform are already written and tested. The API currently requires JWT auth, so the fallback to `data/seed/wsbk.json` keeps the pipeline healthy until/if the API becomes publicly accessible.

**Trade-offs accepted:**
- Seed data used until JWT auth is resolved
- Seed session times are approximate (based on typical WorldSBK weekend schedule)

---

## Session Type Mapping (Pulselive API)

| API code | Display label |
|----------|--------------|
| `FP1` | Practice 1 |
| `FP2` | Practice 2 |
| `FP3` | Practice 3 |
| `SUP` | Superpole |
| `RAC1` | Race 1 |
| `SPR` | Superpole Race |
| `RAC2` | Race 2 |
| `WUP` | Warm Up |

---

## Data Mapping (API path)

| API field | Silver field | Notes |
|-----------|-------------|-------|
| `event.name` | `eventName` | |
| `event.country.iso` | `circuit.countryCode` | Must be alpha-2 — transform enforces this |
| `event.circuit.name` | `circuit.name` | |
| `event.circuit.place` | `circuit.city` | |
| `event.sessions[].type` | `sessions[].type` | Mapped via type_map dict |
| `event.sessions[].date` | `sessions[].startTimeUTC` | |

---

## Maintenance

- **Update frequency:** Nightly via GitHub Action (when API is accessible)
- **Seed fallback:** Update `data/seed/wsbk.json` at season start each year
- **Season rollover:** Seed file update is sufficient until API auth is resolved
- **API token:** Monitor WorldSBK devtools for unauthenticated endpoints — Pulselive sometimes provides public read-only access

---

## TheSportsDB Reference

- **League ID:** Not confirmed
