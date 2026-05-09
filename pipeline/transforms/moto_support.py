"""Generate Moto2 and Moto3 support-series events from MotoGP silver data."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from .common import build_event, derive_event_dates
from .motogp import _COUNTRY_TIMEZONES


_SUPPORT_SERIES_CONFIG = {
    "moto2": {
        "label": "Moto2",
        "sessions": [
            {"type": "FP1", "reference": "FP1", "offset_minutes": -55},
            {"type": "Practice", "reference": "Practice", "offset_minutes": -55},
            {"type": "FP2", "reference": "FP2", "offset_minutes": -45},
            {"type": "Qualifying", "reference": "Sprint", "offset_minutes": -75},
            {"type": "Race", "reference": "Race", "offset_minutes": -100},
        ],
    },
    "moto3": {
        "label": "Moto3",
        "sessions": [
            {"type": "FP1", "reference": "FP1", "offset_minutes": -105},
            {"type": "Practice", "reference": "Practice", "offset_minutes": -105},
            {"type": "FP2", "reference": "FP2", "offset_minutes": -90},
            {"type": "Qualifying", "reference": "Sprint", "offset_minutes": -135},
            {"type": "Race", "reference": "Race", "offset_minutes": -180},
        ],
    },
}


def transform(motogp_events: list[dict], series_id: str) -> list[dict]:
    """Build Moto2 or Moto3 events from MotoGP silver events."""
    config = _SUPPORT_SERIES_CONFIG[series_id]
    generated_events: list[dict] = []

    for motogp_event in motogp_events:
        sessions = _build_support_sessions(motogp_event, config["sessions"])
        date_start, date_end = derive_event_dates(
            sessions,
            motogp_event.get("dateStart", ""),
            motogp_event.get("dateEnd", ""),
        )

        generated_events.append(
            build_event(
                series_id=series_id,
                year=motogp_event.get("id", "").split("-")[1],
                round_number=motogp_event.get("round", 0),
                event_name=_build_event_name(config["label"], motogp_event.get("eventName", "")),
                circuit=dict(motogp_event.get("circuit", {})),
                sessions=sessions,
                date_start=date_start,
                date_end=date_end,
            )
        )

    return generated_events


def _build_support_sessions(motogp_event: dict, session_plan: list[dict]) -> list[dict]:
    country_code = (motogp_event.get("circuit", {}) or {}).get("countryCode", "")
    motogp_sessions = {
        session.get("type"): session.get("startTimeUTC")
        for session in motogp_event.get("sessions", [])
        if session.get("type") and session.get("startTimeUTC")
    }

    sessions: list[dict] = []
    for plan in session_plan:
        reference_time = motogp_sessions.get(plan["reference"])
        if not reference_time:
            continue
        sessions.append(
            {
                "type": plan["type"],
                "startTimeUTC": _shift_in_local_time(
                    reference_time,
                    country_code,
                    plan["offset_minutes"],
                ),
            }
        )

    sessions.sort(key=lambda session: session["startTimeUTC"])
    return sessions


def _shift_in_local_time(start_time_utc: str, country_code: str, offset_minutes: int) -> str:
    start_time = datetime.fromisoformat(start_time_utc.replace("Z", "+00:00"))
    timezone_name = _COUNTRY_TIMEZONES.get(country_code)
    if not timezone_name:
        return (start_time + timedelta(minutes=offset_minutes)).astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    shifted_local = start_time.astimezone(ZoneInfo(timezone_name)) + timedelta(minutes=offset_minutes)
    return shifted_local.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _build_event_name(series_label: str, motogp_event_name: str) -> str:
    titled_name = motogp_event_name.title()
    if titled_name.startswith("Grand Prix"):
        return f"{series_label} {titled_name}"
    return f"{series_label} {titled_name}".strip()