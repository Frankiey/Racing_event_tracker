import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

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


if __name__ == "__main__":
    unittest.main()