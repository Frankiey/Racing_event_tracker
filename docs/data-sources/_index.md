# Data Sources — Master Index

This folder documents the research and decisions behind every data source in RaceTrack.
Each series has its own file. Use `_template.md` when researching a new series.

**How to add a new series:**
1. Copy `_template.md` → `docs/data-sources/<series-id>.md`
2. Fill in all sections (document failed attempts — saves future research time)
3. Update the table below with the decision
4. Follow the implementation steps in `docs/architecture.md`

---

## Integrated Series

| Series | ID | Path | Source | File | Last Reviewed |
|--------|----|------|--------|------|---------------|
| Formula 1 | `f1` | API | Jolpica + OpenF1 | [f1.md](f1.md) | 2026-03-22 |
| Formula 2 | `f2` | Seed | Manual | [f2-f3.md](f2-f3.md) | 2026-03-22 |
| Formula 3 | `f3` | Seed | Manual | [f2-f3.md](f2-f3.md) | 2026-03-22 |
| Formula E | `fe` | Seed | Manual | [fe.md](fe.md) | 2026-03-22 |
| IndyCar | `indycar` | Seed | Manual | [indycar.md](indycar.md) | 2026-03-22 |
| NASCAR Cup | `nascar` | API | NASCAR CDN | [nascar.md](nascar.md) | 2026-03-22 |
| MotoGP | `motogp` | API | Pulselive API | [motogp.md](motogp.md) | 2026-03-22 |
| Moto2 | `moto2` | Seed | Manual (MotoGP offset) | [moto2-moto3.md](moto2-moto3.md) | 2026-03-22 |
| Moto3 | `moto3` | Seed | Manual (MotoGP offset) | [moto2-moto3.md](moto2-moto3.md) | 2026-03-22 |
| WEC | `wec` | Seed | Manual | [wec.md](wec.md) | 2026-03-22 |
| IMSA WeatherTech | `imsa` | Seed | Manual | [imsa.md](imsa.md) | 2026-03-28 |
| DTM | `dtm` | Seed | Manual | [dtm.md](dtm.md) | 2026-03-28 |
| NLS | `nls` | Seed | Official schedule | [nls.md](nls.md) | 2026-03-28 |
| World Superbike | `wsbk` | API + Seed fallback | WorldSBK Pulselive | [wsbk.md](wsbk.md) | 2026-03-28 |
| Super Formula | `superformula` | Seed | Manual | [superformula.md](superformula.md) | 2026-03-28 |

---

## Candidate Series (not yet integrated)

| Series | Priority | Blocker | File |
|--------|----------|---------|------|
| BTCC | Low | TheSportsDB available (ID: 4372) | [candidates/btcc.md](candidates/btcc.md) |
| Australian Supercars | Low | TheSportsDB available (ID: 4489) | [candidates/australian-supercars.md](candidates/australian-supercars.md) |

---

## Shared Data Enrichment Sources

These are not primary sources but can supplement any series with images, results text, and highlights.

| Source | Free? | What it adds | Notes |
|--------|-------|-------------|-------|
| TheSportsDB | Yes (rate limited) | Poster/thumb images, YouTube highlights, results text | ~10-15 req then 15s block. Cache aggressively. |
| SportsData.io | No (paid) | Detailed stats | HTTP 401 without key |
| API-Sports | No (paid) | F1-focused | Requires key |

TheSportsDB motorsport league IDs confirmed working:

| ID | Series |
|----|--------|
| 4407 | MotoGP |
| 4393 | NASCAR Cup Series |
| 4489 | Australian Supercars |
| 4372 | BTCC |
| 4410 | British GT Championship |
| 4730 | World Rallycross |
| 4412 | Super GT |
| 4447 | Dakar Rally |

**Not in TheSportsDB:** Formula E, IndyCar, WEC, DTM, IMSA, F1
