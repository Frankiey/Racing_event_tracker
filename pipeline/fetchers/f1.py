"""F1 bronze layer — fetch from Jolpica API + OpenF1."""

from pipeline.config import JOLPICA_BASE, OPENF1_BASE, BRONZE_DIR, SEASON_YEAR
from pipeline.utils import fetch_json, write_json


def fetch() -> dict:
    """Fetch F1 schedule data and write to bronze layer."""
    year = SEASON_YEAR
    print(f"[F1] Fetching {year} season...")

    jolpica = fetch_json(f"{JOLPICA_BASE}/{year}/races.json")
    openf1_meetings = fetch_json(f"{OPENF1_BASE}/meetings?year={year}")
    openf1_sessions = fetch_json(f"{OPENF1_BASE}/sessions?year={year}")

    write_json(BRONZE_DIR / f"f1-{year}-jolpica.json", jolpica)
    write_json(BRONZE_DIR / f"f1-{year}-openf1-meetings.json", openf1_meetings)
    write_json(BRONZE_DIR / f"f1-{year}-openf1-sessions.json", openf1_sessions)

    return {
        "jolpica": jolpica,
        "openf1_meetings": openf1_meetings,
        "openf1_sessions": openf1_sessions,
    }
