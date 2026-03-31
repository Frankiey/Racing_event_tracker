"""WorldSBK bronze → silver transform.

Handles two input shapes:
  1. Pulselive API format (same structure as MotoGP) — used when API fetch succeeds
  2. Seed format (already silver) — pass-through when falling back to seed data
"""

from pipeline.config import SEASON_YEAR
from pipeline.utils import to_iso as _to_iso, to_date as _to_date


_SILVER_KEYS = {"id", "seriesId", "eventName", "round", "circuit", "sessions", "dateStart", "dateEnd"}


def transform(bronze_events: list) -> list[dict]:
    """Transform WSBK API events into silver-layer format.

    If the input already looks like silver data (seed fallback), return as-is.
    """
    if not bronze_events:
        return []

    # Detect seed passthrough: first item has silver-layer keys
    if _SILVER_KEYS.issubset(bronze_events[0].keys()):
        return bronze_events

    return _transform_api(bronze_events)


def _transform_api(bronze_events: list) -> list[dict]:
    """Transform Pulselive API response to silver format."""
    year = SEASON_YEAR
    events = []

    # Filter out test/pre-season events
    race_events = [e for e in bronze_events if not e.get("test")]

    for idx, event in enumerate(race_events, start=1):
        sessions = _extract_sessions(event)

        circuit = event.get("circuit") or {}
        country = event.get("country") or {}

        events.append({
            "id": f"wsbk-{year}-r{idx:02d}",
            "seriesId": "wsbk",
            "eventName": event.get("name") or event.get("short_name") or f"Round {idx}",
            "round": idx,
            "circuit": {
                "name": circuit.get("name", ""),
                "city": circuit.get("place", ""),
                "country": circuit.get("nation", ""),
                "countryCode": _normalize_country_code(country.get("iso", "")),
                "lat": circuit.get("lat"),
                "lng": circuit.get("lng"),
            },
            "sessions": sessions,
            "dateStart": _to_date(event.get("date_start", "")),
            "dateEnd": _to_date(event.get("date_end", "")),
        })

    return events


def _extract_sessions(event: dict) -> list[dict]:
    """Extract session list from a Pulselive event object."""
    sessions = []

    # Pulselive stores full session schedule in event.sessions[] or
    # falls back to just Race on date_end
    raw_sessions = event.get("sessions") or []
    if raw_sessions:
        type_map = {
            "RAC1": "Race 1",
            "RAC2": "Race 2",
            "SPR":  "Superpole Race",
            "SUP":  "Superpole",
            "FP1":  "Practice 1",
            "FP2":  "Practice 2",
            "FP3":  "Practice 3",
            "WUP":  "Warm Up",
        }
        for s in raw_sessions:
            s_type = s.get("type", "")
            label = type_map.get(s_type, s_type)
            start = s.get("date") or s.get("dateStart") or s.get("date_start", "")
            if start:
                sessions.append({"type": label, "startTimeUTC": _to_iso(start)})
    else:
        # Minimal fallback: just the race day
        race_time = event.get("date_end") or event.get("date_start")
        if race_time:
            sessions.append({"type": "Race 1", "startTimeUTC": _to_iso(race_time)})

    return sessions


def _normalize_country_code(code: str) -> str:
    """Ensure we return alpha-2 codes; strip alpha-3 if needed."""
    if len(code) == 2:
        return code.upper()
    # Alpha-3 fallback — return empty so countryFlag() doesn't silently fail
    return ""


