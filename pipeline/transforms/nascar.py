"""NASCAR bronze → silver transform."""

from pipeline.config import SEASON_YEAR

from .common import build_circuit, build_event, build_single_session, derive_event_dates
from pipeline.utils import to_date, to_iso


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
    prev_date_start: str | None = None

    for idx, race in enumerate(races, start=1):
        sessions = []

        race_time = _find_schedule_time(race, run_type=3, keywords=("race",))
        qualifying_time = _find_schedule_time(race, run_type=2, keywords=("qualif",))

        # Duel/heat races (e.g. Daytona Duels) have no run_type=3 entry — the
        # "Qualifying Race N" schedule item under run_type=2 IS the actual race.
        # Without this, we'd fall back to the pre-race ceremony time as a fake
        # "Race" session while also emitting the real race time as "Qualifying",
        # putting qualifying after the race.
        if not race_time and qualifying_time:
            race_time, qualifying_time = qualifying_time, None

        # Fallback to the race-level fields only when schedule UTC entries are missing.
        race_date = race_time or race.get("date_scheduled") or race.get("race_date")

        # The Daytona 500's standalone time-trial qualifying (which sets the
        # front row and, in turn, the lineups for the Duel "races") runs several
        # days before the race — earlier, in fact, than the Duels themselves,
        # which are numbered as earlier rounds in the upstream schedule. Round
        # order here mirrors that upstream/broadcast sequence (Clash, Duel 1,
        # Duel 2, Daytona 500, ...), which is correct; it's only this one
        # multi-day-early qualifying date that would otherwise push the 500's
        # round before the Duels it precedes. When that would happen, drop the
        # anomalous qualifying session so the round's dates anchor to race day.
        if qualifying_time and prev_date_start and to_date(qualifying_time) < prev_date_start:
            qualifying_time = None

        if qualifying_time:
            sessions.append({
                "type": "Qualifying",
                "startTimeUTC": qualifying_time,
            })
        sessions.extend(build_single_session(race_date))

        date_start, date_end = derive_event_dates(sessions, race_date or "", race_date or "")
        prev_date_start = date_start

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
        if schedule_item.get("run_type") != run_type or not any(keyword in event_name for keyword in keywords):
            continue

        start_time = schedule_item.get("start_time_utc")
        if start_time:
            return to_iso(start_time)

    return None


