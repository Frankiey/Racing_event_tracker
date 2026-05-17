"""Unit tests for pipeline/transforms/f1.py."""

import unittest

from pipeline.transforms.f1 import transform


def _make_bronze(races, openf1_meetings=None):
    return {
        "jolpica": {
            "MRData": {
                "RaceTable": {
                    "season": "2026",
                    "Races": races,
                }
            }
        },
        "openf1_meetings": openf1_meetings or [],
    }


def _make_race(
    round_num="1",
    race_name="Australian Grand Prix",
    date="2026-03-15",
    time="05:00:00Z",
    locality="Melbourne",
    country="Australia",
    circuit_name="Albert Park Grand Prix Circuit",
    lat="-37.849",
    lng="144.968",
    **extra_sessions,
):
    race = {
        "round": round_num,
        "raceName": race_name,
        "date": date,
        "time": time,
        "Circuit": {
            "circuitName": circuit_name,
            "Location": {
                "locality": locality,
                "country": country,
                "lat": lat,
                "long": lng,
            },
        },
    }
    race.update(extra_sessions)
    return race


class TestF1Transform(unittest.TestCase):

    # ── 1. Empty races ────────────────────────────────────────────────────────

    def test_empty_races_returns_empty_list(self):
        result = transform(_make_bronze([]))
        self.assertEqual(result, [])

    # ── 2. Single race produces correct event ─────────────────────────────────

    def test_single_race_produces_correct_event(self):
        race = _make_race(
            FirstPractice={"date": "2026-03-13", "time": "01:30:00Z"},
            Qualifying={"date": "2026-03-14", "time": "05:00:00Z"},
        )
        result = transform(_make_bronze([race]))
        self.assertEqual(len(result), 1)
        event = result[0]

        self.assertEqual(event["id"], "f1-2026-r01")
        self.assertEqual(event["seriesId"], "f1")
        self.assertEqual(event["eventName"], "Australian Grand Prix")
        self.assertEqual(event["round"], 1)
        # Three sessions: FP1, Qualifying, Race
        session_types = [s["type"] for s in event["sessions"]]
        self.assertIn("FP1", session_types)
        self.assertIn("Qualifying", session_types)
        self.assertIn("Race", session_types)
        # dateStart / dateEnd present
        self.assertIn("dateStart", event)
        self.assertIn("dateEnd", event)

    # ── 3. Sessions sorted ascending by startTimeUTC ──────────────────────────

    def test_sessions_sorted_by_start_time(self):
        # Qualifying key before FirstPractice key — output must still be sorted
        race = _make_race(
            Qualifying={"date": "2026-03-14", "time": "05:00:00Z"},
            FirstPractice={"date": "2026-03-13", "time": "01:30:00Z"},
        )
        result = transform(_make_bronze([race]))
        sessions = result[0]["sessions"]
        times = [s["startTimeUTC"] for s in sessions]
        self.assertEqual(times, sorted(times))

    # ── 4. Alpha-3 country code converted to alpha-2 ─────────────────────────

    def test_alpha3_country_code_converted_to_alpha2(self):
        meeting = {"location": "Melbourne", "country_code": "AUS"}
        race = _make_race()
        result = transform(_make_bronze([race], openf1_meetings=[meeting]))
        self.assertEqual(result[0]["circuit"]["countryCode"], "AU")

    # ── 5. Country name fallback when no OpenF1 match ─────────────────────────

    def test_country_name_fallback_when_no_openf1_match(self):
        # No OpenF1 meetings provided; fallback via COUNTRY_NAME_TO_ALPHA2
        race = _make_race(locality="Melbourne", country="Australia")
        result = transform(_make_bronze([race], openf1_meetings=[]))
        self.assertEqual(result[0]["circuit"]["countryCode"], "AU")

    # ── 6. OpenF1 circuit image enrichment ───────────────────────────────────

    def test_openf1_circuit_image_enrichment(self):
        url = "https://example.com/img.png"
        meeting = {"location": "Melbourne", "country_code": "AUS", "circuit_image": url}
        race = _make_race()
        result = transform(_make_bronze([race], openf1_meetings=[meeting]))
        self.assertEqual(result[0].get("circuitImage"), url)

    # ── 7. Sprint weekend includes Sprint session ─────────────────────────────

    def test_sprint_weekend_includes_sprint_session(self):
        race = _make_race(
            FirstPractice={"date": "2026-04-10", "time": "10:30:00Z"},
            Sprint={"date": "2026-04-11", "time": "10:00:00Z"},
            Qualifying={"date": "2026-04-12", "time": "13:00:00Z"},
        )
        result = transform(_make_bronze([race]))
        session_types = [s["type"] for s in result[0]["sessions"]]
        self.assertIn("Sprint", session_types)

    # ── 8. dateStart/dateEnd derived from sessions ────────────────────────────

    def test_date_start_end_derived_from_sessions(self):
        race = _make_race(
            date="2026-03-15",
            time="05:00:00Z",
            FirstPractice={"date": "2026-03-13", "time": "01:30:00Z"},
            SecondPractice={"date": "2026-03-13", "time": "05:00:00Z"},
            Qualifying={"date": "2026-03-14", "time": "05:00:00Z"},
        )
        result = transform(_make_bronze([race]))
        event = result[0]
        # Earliest session is FP1 on 2026-03-13, latest is Race on 2026-03-15
        self.assertEqual(event["dateStart"], "2026-03-13")
        self.assertEqual(event["dateEnd"], "2026-03-15")


if __name__ == "__main__":
    unittest.main()
