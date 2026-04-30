import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from pipeline.transforms import motogp as motogp_transform
from pipeline.transforms import nascar as nascar_transform
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


if __name__ == "__main__":
    unittest.main()