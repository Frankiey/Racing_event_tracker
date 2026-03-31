"""NASCAR bronze → silver transform."""

from pipeline.config import SEASON_YEAR
from pipeline.utils import to_iso as _to_iso, to_date as _to_date


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
                "startTimeUTC": _to_iso(qualifying_date),
            })
        if race_date:
            sessions.append({
                "type": "Race",
                "startTimeUTC": _to_iso(race_date),
            })

        events.append({
            "id": f"nascar-{year}-r{idx:02d}",
            "seriesId": "nascar",
            "eventName": race.get("race_name", f"Race {idx}"),
            "round": idx,
            "circuit": {
                "name": race.get("track_name", ""),
                "city": "",
                "country": "United States",
                "countryCode": "US",
                "lat": None,
                "lng": None,
            },
            "sessions": sessions,
            "dateStart": _to_date(race_date) if race_date else "",
            "dateEnd": _to_date(race_date) if race_date else "",
        })

    return events


