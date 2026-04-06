"""NASCAR bronze → silver transform."""

from pipeline.config import SEASON_YEAR

from .common import build_circuit, build_event, build_single_session, derive_event_dates


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

        # NASCAR uses date_scheduled for the event date, race_date for actual race
        race_date = race.get("date_scheduled") or race.get("race_date")
        qualifying_date = race.get("qualifying_date")

        if qualifying_date:
            sessions.append({
                "type": "Qualifying",
                "startTimeUTC": build_single_session(qualifying_date, "Qualifying")[0]["startTimeUTC"],
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


