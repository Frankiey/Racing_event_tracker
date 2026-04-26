"""NASCAR bronze → silver transform."""

from pipeline.config import SEASON_YEAR

from .common import build_circuit, build_event, build_single_session, derive_event_dates
from pipeline.utils import to_iso


def transform(bronze_data: dict | list) -> list[dict]:
    """Transform NASCAR CDN data into silver-layer format.

    CDN returns {"series_1": [...], "series_2": [...], "series_3": [...]}.
    We use series_1 (Cup Series).
    """
    year = SEASON_YEAR

    # Handle both dict (actual) and list (legacy) formats
    if isinstance(bronze_data, dict):
        races = bronze_data.get("series_1", [])
    else:
        races = [r for r in (bronze_data or []) if r.get("series_id") == 1]

    events = []

    for idx, race in enumerate(races, start=1):
        sessions = []

        race_time = _find_schedule_time(race, run_type=3, keywords=("race",))
        qualifying_time = _find_schedule_time(race, run_type=2, keywords=("qualif",))

        # Fallback to the race-level fields only when schedule UTC entries are missing.
        race_date = race_time or race.get("date_scheduled") or race.get("race_date")

        if qualifying_time:
            sessions.append({
                "type": "Qualifying",
                "startTimeUTC": qualifying_time,
            })
        sessions.extend(build_single_session(race_date))

        date_start, date_end = derive_event_dates(sessions, race_date or "", race_date or "")

        events.append(
            build_event(
                series_id="nascar",
                year=year,
                round_number=idx,
                event_name=race.get("race_name", f"Race {idx}"),
                circuit=build_circuit(
                    name=race.get("track_name", ""),
                    country="United States",
                    country_code="US",
                ),
                sessions=sessions,
                date_start=date_start,
                date_end=date_end,
            )
        )

    return events


def _find_schedule_time(race: dict, *, run_type: int, keywords: tuple[str, ...]) -> str | None:
    for schedule_item in race.get("schedule", []):
        event_name = (schedule_item.get("event_name") or "").lower()
        if schedule_item.get("run_type") != run_type and not any(keyword in event_name for keyword in keywords):
            continue

        start_time = schedule_item.get("start_time_utc")
        if start_time:
            return to_iso(start_time)

    return None


