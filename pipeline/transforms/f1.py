"""F1 bronze → silver transform."""

from pipeline.config import SEASON_YEAR


# OpenF1 returns ISO 3166-1 alpha-3 codes; convert to alpha-2
ALPHA3_TO_ALPHA2: dict[str, str] = {
    "AUS": "AU", "CHN": "CN", "JPN": "JP", "BHR": "BH", "SAU": "SA",
    "MON": "MC", "ESP": "ES", "AUT": "AT", "GBR": "GB", "HUN": "HU",
    "NED": "NL", "ITA": "IT", "AZE": "AZ", "SGP": "SG", "USA": "US",
    "MEX": "MX", "BRA": "BR", "QAT": "QA", "ARE": "AE", "CAN": "CA",
    "BEL": "BE",
}

# Fallback: Jolpica country name → alpha-2 (for events with no OpenF1 match)
COUNTRY_NAME_TO_ALPHA2: dict[str, str] = {
    "Australia": "AU", "China": "CN", "Japan": "JP", "Bahrain": "BH",
    "Saudi Arabia": "SA", "Monaco": "MC", "Spain": "ES", "Austria": "AT",
    "UK": "GB", "Hungary": "HU", "Netherlands": "NL", "Belgium": "BE",
    "Italy": "IT", "Azerbaijan": "AZ", "Singapore": "SG", "USA": "US",
    "Mexico": "MX", "Brazil": "BR", "Qatar": "QA", "UAE": "AE",
    "Canada": "CA",
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
        country_name = loc.get("country", "")
        raw_cc = of1.get("country_code", "")
        country_code = (
            ALPHA3_TO_ALPHA2.get(raw_cc, raw_cc)
            or COUNTRY_NAME_TO_ALPHA2.get(country_name, "")
        )
        events.append({
            "id": f"f1-{year}-r{int(race['round']):02d}",
            "seriesId": "f1",
            "eventName": race.get("raceName", ""),
            "round": int(race["round"]),
            "circuit": {
                "name": race.get("Circuit", {}).get("circuitName", ""),
                "city": loc.get("locality", ""),
                "country": country_name,
                "countryCode": country_code,
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
