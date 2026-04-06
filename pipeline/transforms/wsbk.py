"""WorldSBK bronze → silver transform.

Handles two input shapes:
  1. Pulselive API format (same structure as MotoGP) — used when API fetch succeeds
  2. Seed format (already silver) — pass-through when falling back to seed data
"""

from pipeline.config import SEASON_YEAR

from .common import (
    build_circuit,
    build_event,
    build_mapped_sessions,
    build_single_session,
    derive_event_dates,
    normalize_alpha2_country_code,
)


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
        date_start, date_end = derive_event_dates(
            sessions,
            event.get("date_start", ""),
            event.get("date_end", ""),
        )

        events.append(
            build_event(
                series_id="wsbk",
                year=year,
                round_number=idx,
                event_name=event.get("name") or event.get("short_name") or f"Round {idx}",
                circuit=build_circuit(
                    name=circuit.get("name", ""),
                    city=circuit.get("place", ""),
                    country=circuit.get("nation", ""),
                    country_code=normalize_alpha2_country_code(country.get("iso", "")),
                    lat=circuit.get("lat"),
                    lng=circuit.get("lng"),
                ),
                sessions=sessions,
                date_start=date_start,
                date_end=date_end,
            )
        )

    return events


def _extract_sessions(event: dict) -> list[dict]:
    """Extract session list from a Pulselive event object."""
    # Pulselive stores full session schedule in event.sessions[] or
    # falls back to just Race on date_end
    raw_sessions = event.get("sessions") or []
    if raw_sessions:
        type_map = {
            "RAC1": "Race 1",
            "RAC2": "Race 2",
            "SPR": "Superpole Race",
            "SUP": "Superpole",
            "FP1": "Practice 1",
            "FP2": "Practice 2",
            "FP3": "Practice 3",
            "WUP": "Warm Up",
        }
        return build_mapped_sessions(raw_sessions, type_map)

    return build_single_session(event.get("date_end") or event.get("date_start"), "Race 1")


