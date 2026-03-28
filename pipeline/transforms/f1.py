"""F1 bronze → silver transform."""

from pipeline.config import SEASON_YEAR


# OpenF1 uses non-standard / alpha-3-like codes; map to ISO 3166-1 alpha-2
_ALPHA3_TO_ALPHA2: dict[str, str] = {
    "AUS": "AU",
    "AUT": "AT",
    "AZE": "AZ",
    "BEL": "BE",
    "BRA": "BR",
    "BRN": "BH",
    "CAN": "CA",
    "CHN": "CN",
    "ESP": "ES",
    "GBR": "GB",
    "HUN": "HU",
    "ITA": "IT",
    "JPN": "JP",
    "KSA": "SA",
    "MEX": "MX",
    "MON": "MC",
    "NED": "NL",
    "QAT": "QA",
    "SGP": "SG",
    "UAE": "AE",
    "USA": "US",
}


SESSION_MAP = [
    ("FirstPractice", "FP1"),
    ("SecondPractice", "FP2"),
    ("ThirdPractice", "FP3"),
    ("SprintQualifying", "Sprint Qualifying"),
    ("Sprint", "Sprint"),
    ("Qualifying", "Qualifying"),
]


def transform(bronze: dict) -> list[dict]:
    """Transform Jolpica + OpenF1 bronze data into silver events."""
    jolpica = bronze["jolpica"]
    openf1_meetings = bronze.get("openf1_meetings", [])

    races = jolpica.get("MRData", {}).get("RaceTable", {}).get("Races", [])
    year = jolpica.get("MRData", {}).get("RaceTable", {}).get("season", SEASON_YEAR)

    # Lookup OpenF1 meetings by location for enrichment
    meeting_by_location = {
        m.get("location", "").lower(): m for m in (openf1_meetings or [])
    }

    events = []
    for race in races:
        sessions = []

        for key, session_type in SESSION_MAP:
            if key in race:
                sessions.append({
                    "type": session_type,
                    "startTimeUTC": f"{race[key]['date']}T{race[key]['time']}",
                })

        # Race itself is top-level date + time
        if race.get("date") and race.get("time"):
            sessions.append({
                "type": "Race",
                "startTimeUTC": f"{race['date']}T{race['time']}",
            })

        sessions.sort(key=lambda s: s["startTimeUTC"])

        locality = (race.get("Circuit", {}).get("Location", {}).get("locality") or "").lower()
        of1 = meeting_by_location.get(locality, {})

        loc = race.get("Circuit", {}).get("Location", {})
        events.append({
            "id": f"f1-{year}-r{int(race['round']):02d}",
            "seriesId": "f1",
            "eventName": race.get("raceName", ""),
            "round": int(race["round"]),
            "circuit": {
                "name": race.get("Circuit", {}).get("circuitName", ""),
                "city": loc.get("locality", ""),
                "country": loc.get("country", ""),
                "countryCode": _ALPHA3_TO_ALPHA2.get(of1.get("country_code", ""), of1.get("country_code", "")),
                "lat": _float(loc.get("lat")),
                "lng": _float(loc.get("long")),
            },
            "circuitImage": of1.get("circuit_image"),
            "sessions": sessions,
            "dateStart": sessions[0]["startTimeUTC"].split("T")[0] if sessions else race.get("date", ""),
            "dateEnd": race.get("date", ""),
        })

    return events


def _float(val) -> float | None:
    try:
        return float(val)
    except (TypeError, ValueError):
        return None
