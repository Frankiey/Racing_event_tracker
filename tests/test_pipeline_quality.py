import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from pipeline.transforms import motogp as motogp_transform
from pipeline.transforms import moto_support_api as moto_support_transform
from pipeline.transforms import nascar as nascar_transform
from pipeline.transforms import f1 as f1_transform
from pipeline.transforms.gold import build_calendar, build_upcoming
from pipeline.validate import validate_event, validate_file


class FrozenDateTime(datetime):
    @classmethod
    def now(cls, tz=None):
        return cls(2026, 5, 1, 12, 0, 0, tzinfo=tz or timezone.utc)


def make_event(event_id: str, session_time: str, *, end_date: str | None = None) -> dict:
    return {
        "id": event_id,
        "seriesId": "f1",
        "eventName": f"Event {event_id}",
        "dateStart": session_time[:10],
        "dateEnd": end_date or session_time[:10],
        "circuit": {
            "name": "Test Circuit",
            "country": "Testland",
            "countryCode": "TL",
        },
        "sessions": [
            {
                "type": "Race",
                "startTimeUTC": session_time,
            }
        ],
    }


class GoldTransformTests(unittest.TestCase):
    def test_build_calendar_sorts_and_sets_event_count(self):
        events = [
            make_event("late", "2026-06-01T10:00:00Z"),
            make_event("early", "2026-05-01T10:00:00Z"),
        ]

        calendar = build_calendar(events, sources=["motogp", "f1"])

        self.assertEqual(calendar["eventCount"], 2)
        self.assertEqual(calendar["sources"], ["f1", "motogp"])
        self.assertEqual([event["id"] for event in calendar["events"]], ["early", "late"])

    def test_build_upcoming_filters_past_events(self):
        events = [
            make_event("past", "2026-04-01T10:00:00Z"),
            make_event("future", "2026-06-01T10:00:00Z"),
        ]

        with patch("pipeline.transforms.gold.datetime", FrozenDateTime):
            upcoming = build_upcoming(events)

        self.assertEqual(upcoming["eventCount"], 1)
        self.assertEqual([event["id"] for event in upcoming["events"]], ["future"])

    def test_build_upcoming_respects_limit(self):
        events = [
            make_event("future-a", "2026-06-01T10:00:00Z"),
            make_event("future-b", "2026-06-02T10:00:00Z"),
        ]

        with patch("pipeline.transforms.gold.datetime", FrozenDateTime):
            upcoming = build_upcoming(events, limit=1)

        self.assertEqual(upcoming["eventCount"], 1)
        self.assertEqual([event["id"] for event in upcoming["events"]], ["future-a"])


class ValidationTests(unittest.TestCase):
    def test_validate_event_reports_invalid_formats(self):
        event = {
            "id": "bad",
            "seriesId": "unknown",
            "eventName": "Broken Event",
            "dateStart": "2026/05/01",
            "dateEnd": "2026-04-30",
            "circuit": {
                "name": "Test Circuit",
                "country": "Testland",
                "countryCode": "USA",
            },
            "sessions": [{"type": "Race", "startTimeUTC": "not-a-time"}],
        }

        errors = validate_event(event, "broken.json", 0)

        self.assertTrue(any("unknown seriesId 'unknown'" in error for error in errors))
        self.assertTrue(any("invalid date format '2026/05/01'" in error for error in errors))
        self.assertTrue(any("dateStart '2026/05/01' > dateEnd '2026-04-30'" in error for error in errors))
        self.assertTrue(any("countryCode 'USA' is alpha-3" in error for error in errors))
        self.assertTrue(any("invalid time format 'not-a-time'" in error for error in errors))

    def test_validate_file_checks_event_count_mismatch(self):
        payload = {
            "generated": "2026-05-01T12:00:00Z",
            "season": 2026,
            "eventCount": 2,
            "events": [make_event("one", "2026-05-01T10:00:00Z")],
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "calendar.json"
            path.write_text(json.dumps(payload), encoding="utf-8")

            errors = validate_file(path)

        self.assertTrue(any("eventCount '2' does not match actual event total '1'" in error for error in errors))

    def test_validate_event_checks_session_date_range(self):
        event = make_event("range", "2026-05-02T10:00:00Z", end_date="2026-05-04")
        event["dateStart"] = "2026-05-01"

        errors = validate_event(event, "range.json", 0)

        self.assertTrue(any("dateStart '2026-05-01' does not match earliest session date '2026-05-02'" in error for error in errors))
        self.assertTrue(any("dateEnd '2026-05-04' does not match latest session date '2026-05-02'" in error for error in errors))


class SeriesTransformTests(unittest.TestCase):
    def test_motogp_transform_converts_circuit_local_times_to_utc(self):
        bronze_events = [
            {
                "name": "GRAND PRIX OF SPAIN",
                "short_name": "SPA",
                "date_start": "2026-04-24",
                "date_end": "2026-04-26",
                "country": {"iso": "ES"},
                "circuit": {
                    "name": "Circuito de Jerez - Ángel Nieto",
                    "place": "Jerez de la Frontera",
                    "nation": "SPA",
                },
                "_sessions": [
                    {"type": "RAC", "date": "2026-04-26T14:00:00+00:00"},
                ],
            }
        ]

        events = motogp_transform.transform(bronze_events)

        self.assertEqual(events[0]["sessions"][0]["startTimeUTC"], "2026-04-26T12:00:00Z")

    def test_moto_support_transform_converts_circuit_local_times_to_utc(self):
        support_events = [
            {
                "id": "edcfdba3-7a1f-44f3-8fe8-1f8a6609770c",
                "eventName": "GRAND PRIX DE FRANCE",
                "name": "GRAND PRIX DE FRANCE",
                "circuit": {
                    "name": "Le Mans",
                    "place": "Le Mans",
                    "nation": "FRA",
                },
                "country": {"iso": "FR"},
                "sessions": [
                    {"type": "Race", "startTimeUTC": "2026-05-10T12:00:00Z"},
                ],
                "date_start": "2026-05-09",
                "date_end": "2026-05-10",
                "_sessions": [
                    {"type": "FP", "date": "2026-05-08T09:50:00+00:00"},
                    {"type": "PR", "date": "2026-05-08T14:05:00+00:00"},
                    {"type": "FP", "date": "2026-05-09T09:25:00+00:00"},
                    {"type": "Q", "date": "2026-05-09T13:40:00+00:00"},
                    {"type": "Q", "date": "2026-05-09T14:05:00+00:00"},
                    {"type": "RAC", "date": "2026-05-10T12:15:00+00:00"},
                ],
            }
        ]

        moto2_events = moto_support_transform.transform(support_events, "moto2")

        self.assertEqual(
            moto2_events[0]["sessions"],
            [
                {"type": "FP1", "startTimeUTC": "2026-05-08T07:50:00Z"},
                {"type": "Practice", "startTimeUTC": "2026-05-08T12:05:00Z"},
                {"type": "FP2", "startTimeUTC": "2026-05-09T07:25:00Z"},
                {"type": "Q1", "startTimeUTC": "2026-05-09T11:40:00Z"},
                {"type": "Q2", "startTimeUTC": "2026-05-09T12:05:00Z"},
                {"type": "Race", "startTimeUTC": "2026-05-10T10:15:00Z"},
            ],
        )
        self.assertEqual(moto2_events[0]["dateStart"], "2026-05-08")
        self.assertEqual(moto2_events[0]["dateEnd"], "2026-05-10")

    def test_nascar_transform_prefers_schedule_utc_times(self):
        bronze_data = {
            "series_1": [
                {
                    "race_name": "Jack Link's 500",
                    "track_name": "Talladega Superspeedway",
                    "date_scheduled": "2026-04-26T15:00:00",
                    "qualifying_date": "1900-01-01T00:00:00",
                    "schedule": [
                        {
                            "event_name": "Qualifying",
                            "start_time_utc": "2026-04-25T14:00:00",
                            "run_type": 2,
                        },
                        {
                            "event_name": "Race",
                            "start_time_utc": "2026-04-26T19:00:00",
                            "run_type": 3,
                        },
                    ],
                }
            ]
        }

        events = nascar_transform.transform(bronze_data)

        self.assertEqual(
            events[0]["sessions"],
            [
                {"type": "Qualifying", "startTimeUTC": "2026-04-25T14:00:00Z"},
                {"type": "Race", "startTimeUTC": "2026-04-26T19:00:00Z"},
            ],
        )


class F1TransformTests(unittest.TestCase):
    """Tests for pipeline/transforms/f1.py — F1 bronze → silver transform."""

    def _make_bronze(self, races: list[dict]) -> dict:
        return {
            "jolpica": {
                "MRData": {
                    "RaceTable": {
                        "season": "2026",
                        "Races": races,
                    }
                }
            },
            "openf1_meetings": [],
        }

    def _make_race(self, round_num: int = 1, **sessions) -> dict:
        """Build a minimal Jolpica race entry. Extra kwargs add session keys."""
        base = {
            "round": str(round_num),
            "raceName": "Test Grand Prix",
            "date": "2026-07-05",
            "time": "14:00:00Z",
            "Circuit": {
                "circuitName": "Test Circuit",
                "Location": {
                    "locality": "Testville",
                    "country": "Australia",
                    "lat": "-27.5",
                    "long": "153.1",
                },
            },
        }
        base.update(sessions)
        return base

    def test_session_types_map_correctly(self):
        """FP1/FP2/FP3, Qualifying, Sprint, Race all map to canonical types."""
        race = self._make_race(
            FirstPractice={"date": "2026-07-03", "time": "11:30:00Z"},
            SecondPractice={"date": "2026-07-03", "time": "15:00:00Z"},
            ThirdPractice={"date": "2026-07-04", "time": "11:30:00Z"},
            Qualifying={"date": "2026-07-04", "time": "15:00:00Z"},
        )
        events = f1_transform.transform(self._make_bronze([race]))
        session_types = [s["type"] for s in events[0]["sessions"]]

        self.assertIn("FP1", session_types)
        self.assertIn("FP2", session_types)
        self.assertIn("FP3", session_types)
        self.assertIn("Qualifying", session_types)
        self.assertIn("Race", session_types)

    def test_sprint_weekend_maps_sprint_and_sprint_qualifying(self):
        """Sprint weekends produce Sprint Qualifying and Sprint session types."""
        race = self._make_race(
            SprintQualifying={"date": "2026-06-14", "time": "12:00:00Z"},
            Sprint={"date": "2026-06-14", "time": "16:00:00Z"},
            Qualifying={"date": "2026-06-15", "time": "15:00:00Z"},
        )
        events = f1_transform.transform(self._make_bronze([race]))
        session_types = [s["type"] for s in events[0]["sessions"]]

        self.assertIn("Sprint Qualifying", session_types)
        self.assertIn("Sprint", session_types)

    def test_country_code_alpha2_from_openf1(self):
        """OpenF1 alpha-3 country codes are converted to alpha-2."""
        race = self._make_race()
        bronze = {
            "jolpica": {
                "MRData": {
                    "RaceTable": {
                        "season": "2026",
                        "Races": [race],
                    }
                }
            },
            "openf1_meetings": [
                {
                    "location": "testville",
                    "country_code": "AUS",  # alpha-3
                    "circuit_image": None,
                }
            ],
        }
        events = f1_transform.transform(bronze)
        self.assertEqual(events[0]["circuit"]["countryCode"], "AU")

    def test_country_code_falls_back_to_name_lookup(self):
        """When no OpenF1 match, country name is used to derive alpha-2."""
        race = self._make_race()  # country = "Australia" in Location
        events = f1_transform.transform(self._make_bronze([race]))
        self.assertEqual(events[0]["circuit"]["countryCode"], "AU")

    def test_date_start_end_derived_from_sessions(self):
        """dateStart and dateEnd span the full range of real sessions."""
        race = self._make_race(
            FirstPractice={"date": "2026-07-03", "time": "11:30:00Z"},
            Qualifying={"date": "2026-07-04", "time": "15:00:00Z"},
        )
        events = f1_transform.transform(self._make_bronze([race]))
        self.assertEqual(events[0]["dateStart"], "2026-07-03")
        self.assertEqual(events[0]["dateEnd"], "2026-07-05")  # race day

    def test_placeholder_sessions_excluded_from_date_derivation(self):
        """Sessions with 1900-01-01 dates do not affect dateStart/dateEnd."""
        race = {
            "round": "1",
            "raceName": "Placeholder GP",
            "date": "2026-09-13",
            "time": "14:00:00Z",
            "Circuit": {
                "circuitName": "TBD",
                "Location": {
                    "locality": "tbd",
                    "country": "TBD",
                    "lat": "0",
                    "long": "0",
                },
            },
            "Qualifying": {"date": "1900-01-01", "time": "00:00:00Z"},
        }
        events = f1_transform.transform(self._make_bronze([race]))
        # dateStart should be the race day, not 1900
        self.assertEqual(events[0]["dateStart"], "2026-09-13")

    def test_event_id_format(self):
        """Event ID follows the f1-YYYY-rNN pattern."""
        events = f1_transform.transform(self._make_bronze([self._make_race(round_num=3)]))
        self.assertEqual(events[0]["id"], "f1-2026-r03")

    def test_sessions_sorted_chronologically(self):
        """Sessions within an event are sorted by startTimeUTC."""
        race = self._make_race(
            Qualifying={"date": "2026-07-04", "time": "15:00:00Z"},
            FirstPractice={"date": "2026-07-03", "time": "11:30:00Z"},
        )
        events = f1_transform.transform(self._make_bronze([race]))
        times = [s["startTimeUTC"] for s in events[0]["sessions"]]
        self.assertEqual(times, sorted(times))


if __name__ == "__main__":
    unittest.main()