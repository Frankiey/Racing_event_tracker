"""Shared helpers for bronze-to-silver transforms."""

from collections.abc import Iterable, Sequence
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from pipeline.utils import to_date, to_iso


COUNTRY_TIMEZONES = {
    "AR": "America/Argentina/Buenos_Aires",
    "AT": "Europe/Vienna",
    "AU": "Australia/Melbourne",
    "BR": "America/Sao_Paulo",
    "CZ": "Europe/Prague",
    "DE": "Europe/Berlin",
    "ES": "Europe/Madrid",
    "FR": "Europe/Paris",
    "GB": "Europe/London",
    "HU": "Europe/Budapest",
    # Mandalika (Lombok) is the only Indonesian circuit on the calendar and sits
    # in WITA (UTC+8), not WIB/Jakarta (UTC+7) — revisit if a Java-based round
    # (WIB) is ever added, since this country-level mapping can't serve both.
    "ID": "Asia/Makassar",
    "IN": "Asia/Kolkata",
    "IT": "Europe/Rome",
    "JP": "Asia/Tokyo",
    "KZ": "Asia/Almaty",
    "MY": "Asia/Kuala_Lumpur",
    "NL": "Europe/Amsterdam",
    "PT": "Europe/Lisbon",
    "QA": "Asia/Qatar",
    "SM": "Europe/Rome",
    "TH": "Asia/Bangkok",
    "US": "America/Chicago",
}


def build_circuit(
    *,
    name: str = "",
    city: str = "",
    country: str = "",
    country_code: str = "",
    lat=None,
    lng=None,
) -> dict:
    """Build the normalized silver-layer circuit payload."""
    return {
        "name": name,
        "city": city,
        "country": country,
        "countryCode": country_code,
        "lat": coerce_float(lat),
        "lng": coerce_float(lng),
    }


def build_event(
    *,
    series_id: str,
    year: int | str,
    round_number: int,
    event_name: str,
    circuit: dict,
    sessions: list[dict],
    date_start: str,
    date_end: str,
    **extra,
) -> dict:
    """Build the normalized silver-layer event payload."""
    return {
        "id": f"{series_id}-{year}-r{round_number:02d}",
        "seriesId": series_id,
        "eventName": event_name,
        "round": round_number,
        "circuit": circuit,
        "sessions": sessions,
        "dateStart": date_start,
        "dateEnd": date_end,
        **extra,
    }


def build_mapped_sessions(
    raw_sessions: Sequence[dict],
    type_map: dict[str, str],
    *,
    number_repeats: bool = False,
    start_keys: Iterable[str] = ("date", "dateStart", "date_start"),
) -> list[dict]:
    """Map raw session rows into the silver-layer session format."""
    labels = [type_map.get(session.get("type", ""), session.get("type", "")) for session in raw_sessions]
    counts: dict[str, int] = {}
    for label in labels:
        counts[label] = counts.get(label, 0) + 1

    numbered: dict[str, int] = {}
    sessions: list[dict] = []
    for raw_session in raw_sessions:
        label = type_map.get(raw_session.get("type", ""), raw_session.get("type", ""))
        start = next((raw_session.get(key) for key in start_keys if raw_session.get(key)), "")
        if not start:
            continue

        if number_repeats and counts.get(label, 0) > 1:
            numbered[label] = numbered.get(label, 0) + 1
            label = f"{label}{numbered[label]}"

        sessions.append({"type": label, "startTimeUTC": to_iso(start)})

    sessions.sort(key=lambda session: session["startTimeUTC"])
    return sessions


def build_single_session(start: str | None, label: str = "Race") -> list[dict]:
    """Build a single-session list when only one fallback timestamp exists."""
    if not start:
        return []
    return [{"type": label, "startTimeUTC": to_iso(start)}]


def convert_sessions_from_local_time(
    sessions: Sequence[dict],
    country_code: str,
    *,
    start_key: str = "date",
) -> list[dict]:
    timezone_name = COUNTRY_TIMEZONES.get(country_code)
    if not timezone_name:
        return [dict(session) for session in sessions]

    converted: list[dict] = []
    for session in sessions:
        converted_session = dict(session)
        start_time = converted_session.get(start_key)
        if start_time:
            converted_session[start_key] = local_time_to_utc(start_time, timezone_name)
        converted.append(converted_session)
    return converted


def local_time_to_utc(dt_str: str, timezone_name: str) -> str:
    try:
        local_time = datetime.fromisoformat(dt_str.replace("Z", "").replace("+00:00", ""))
    except ValueError:
        return dt_str

    return local_time.replace(tzinfo=ZoneInfo(timezone_name)).astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def local_date_from_utc(utc_dt_str: str, country_code: str | None) -> str:
    """Return the calendar date a UTC timestamp falls on in the circuit's local timezone.

    Falls back to the raw UTC date when no timezone is known for the country,
    which matches the previous (timezone-naive) behavior for unmapped countries.
    """
    timezone_name = COUNTRY_TIMEZONES.get(country_code or "")
    if not timezone_name:
        return utc_dt_str[:10]

    utc_time = datetime.fromisoformat(utc_dt_str.replace("Z", "+00:00")).replace(tzinfo=timezone.utc)
    return utc_time.astimezone(ZoneInfo(timezone_name)).strftime("%Y-%m-%d")


def derive_event_dates(
    sessions: Sequence[dict],
    fallback_start: str = "",
    fallback_end: str = "",
    country_code: str | None = None,
) -> tuple[str, str]:
    """Derive event start/end dates from real sessions, with event-level fallback.

    A UTC timestamp's calendar date can differ from the circuit's local calendar
    date near midnight (e.g. an early-morning local session at a circuit far
    ahead of UTC, like Phillip Island at UTC+11, lands on the *previous* UTC
    day). Pass country_code so the date is taken from local time, not raw UTC.
    """
    session_dates = [
        local_date_from_utc(session["startTimeUTC"], country_code)
        for session in sessions
        if session.get("startTimeUTC") and not session["startTimeUTC"].startswith("1900-")
    ]
    if session_dates:
        return min(session_dates), max(session_dates)
    return to_date(fallback_start), to_date(fallback_end)


def normalize_alpha2_country_code(code: str) -> str:
    """Return alpha-2 codes only so frontend flag rendering stays predictable."""
    return code.upper() if len(code) == 2 else ""


def coerce_float(value):
    """Convert numeric-looking values to floats, preserving nullish inputs."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return None