"""Moto2 and Moto3 bronze → silver transform."""

from pipeline.config import SEASON_YEAR
from pipeline.session_taxonomy import get_session_type_map

from .common import build_circuit, build_event, build_mapped_sessions, derive_event_dates


_SESSION_TYPES = get_session_type_map("motogp")
_SERIES_LABELS = {
    "moto2": "Moto2",
    "moto3": "Moto3",
}


def transform(bronze_events: list, series_id: str) -> list[dict]:
    """Transform Pulselive support-class events into silver-layer format."""
    year = SEASON_YEAR
    label = _SERIES_LABELS[series_id]
    events: list[dict] = []

    for index, event in enumerate(bronze_events or [], start=1):
        raw_sessions = event.get("_sessions", [])
        sessions = build_mapped_sessions(
            raw_sessions,
            _SESSION_TYPES,
            number_repeats=True,
        )

        circuit = event.get("circuit") or {}
        country = event.get("country") or {}
        date_start, date_end = derive_event_dates(
            sessions,
            event.get("date_start", ""),
            event.get("date_end", ""),
        )

        events.append(
            build_event(
                series_id=series_id,
                year=year,
                round_number=index,
                event_name=_build_event_name(label, event.get("name") or event.get("short_name") or f"Round {index}"),
                circuit=build_circuit(
                    name=circuit.get("name", ""),
                    city=(circuit.get("place") or "").strip(),
                    country=circuit.get("nation", ""),
                    country_code=country.get("iso", ""),
                    lat=circuit.get("lat"),
                    lng=circuit.get("lng"),
                ),
                sessions=sessions,
                date_start=date_start,
                date_end=date_end,
            )
        )

    return events


def _build_event_name(series_label: str, motogp_event_name: str) -> str:
    return f"{series_label} {motogp_event_name.title()}".strip()