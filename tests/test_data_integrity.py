"""
Data integrity tests — validate the committed gold files reflect correct
real-world state. These run against data/gold/upcoming.json and
data/gold/calendar.json directly. See docs/test-strategy.md Layer 3.
"""

import json
import unittest
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent.parent
GOLD_DIR = ROOT / "data" / "gold"


def load_gold(filename: str) -> dict:
    path = GOLD_DIR / filename
    return json.loads(path.read_text(encoding="utf-8"))


class UpcomingIntegrityTests(unittest.TestCase):
    """Tests against data/gold/upcoming.json."""

    @classmethod
    def setUpClass(cls):
        cls.data = load_gold("upcoming.json")
        cls.events = cls.data.get("events", [])

    def test_events_sorted_ascending_by_date_start(self):
        """upcoming.json events must be sorted ascending by dateStart."""
        dates = [ev["dateStart"] for ev in self.events]
        self.assertEqual(dates, sorted(dates), "Events are not sorted by dateStart")

    def test_no_event_has_date_end_before_today(self):
        """No event in upcoming.json should have dateEnd before today."""
        today = date.today().isoformat()
        stale = [
            ev["id"] for ev in self.events if ev.get("dateEnd", "") < today
        ]
        self.assertEqual(
            stale,
            [],
            f"Events with dateEnd before today ({today}): {stale}",
        )

    def test_major_series_represented(self):
        """At least one event per major series (f1, motogp, nascar) must be present."""
        series_ids = {ev["seriesId"] for ev in self.events}
        for series in ("f1", "motogp", "nascar"):
            self.assertIn(
                series,
                series_ids,
                f"No upcoming events found for series '{series}'",
            )

    def test_no_placeholder_times_on_upcoming_sessions(self):
        """No upcoming event should have a placeholder session time (year 1900)."""
        bad = []
        for ev in self.events:
            for session in ev.get("sessions", []):
                utc = session.get("startTimeUTC", "")
                if utc.startswith("1900-"):
                    bad.append((ev["id"], session["type"], utc))
        self.assertEqual(
            bad,
            [],
            f"Upcoming events with placeholder session times: {bad}",
        )

    def test_event_count_matches_metadata(self):
        """upcoming.json eventCount must match the actual number of events."""
        declared = self.data.get("eventCount", -1)
        actual = len(self.events)
        self.assertEqual(declared, actual, f"eventCount={declared} but found {actual} events")

    def test_all_events_have_required_fields(self):
        """Every upcoming event must have id, seriesId, eventName, dateStart, dateEnd."""
        required = ("id", "seriesId", "eventName", "dateStart", "dateEnd")
        for ev in self.events:
            for field in required:
                self.assertIn(field, ev, f"Event {ev.get('id', '?')} missing field '{field}'")

    def test_date_start_not_after_date_end(self):
        """dateStart must not be after dateEnd for any upcoming event."""
        bad = [
            ev["id"]
            for ev in self.events
            if ev.get("dateStart", "") > ev.get("dateEnd", "")
        ]
        self.assertEqual(bad, [], f"Events with dateStart > dateEnd: {bad}")


class CalendarIntegrityTests(unittest.TestCase):
    """Tests against data/gold/calendar.json."""

    @classmethod
    def setUpClass(cls):
        cls.data = load_gold("calendar.json")
        cls.events = cls.data.get("events", [])

    def test_event_ids_are_unique(self):
        """All event IDs in calendar.json must be unique."""
        ids = [ev["id"] for ev in self.events]
        duplicates = [ev_id for ev_id in set(ids) if ids.count(ev_id) > 1]
        self.assertEqual(duplicates, [], f"Duplicate event IDs: {duplicates}")

    def test_event_count_matches_metadata(self):
        """calendar.json eventCount must match the actual number of events."""
        declared = self.data.get("eventCount", -1)
        actual = len(self.events)
        self.assertEqual(declared, actual, f"eventCount={declared} but found {actual} events")

    def test_calendar_has_multiple_series(self):
        """Calendar must contain events from at least 6 different series."""
        series_ids = {ev["seriesId"] for ev in self.events}
        self.assertGreaterEqual(
            len(series_ids),
            6,
            f"Only {len(series_ids)} series found; expected ≥6: {series_ids}",
        )

    def test_all_country_codes_are_alpha2(self):
        """All countryCode values must be exactly 2 characters (alpha-2)."""
        bad = []
        for ev in self.events:
            cc = ev.get("circuit", {}).get("countryCode", "")
            if cc and len(cc) != 2:
                bad.append((ev["id"], cc))
        self.assertEqual(bad, [], f"Non-alpha-2 country codes: {bad}")

    def test_all_date_formats_are_iso(self):
        """dateStart and dateEnd must be ISO 8601 date strings (YYYY-MM-DD)."""
        import re

        pattern = re.compile(r"^\d{4}-\d{2}-\d{2}$")
        bad = []
        for ev in self.events:
            for field in ("dateStart", "dateEnd"):
                val = ev.get(field, "")
                if val and not pattern.match(val):
                    bad.append((ev["id"], field, val))
        self.assertEqual(bad, [], f"Invalid date formats: {bad}")


if __name__ == "__main__":
    unittest.main()
