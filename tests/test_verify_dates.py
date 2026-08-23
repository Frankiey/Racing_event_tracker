"""Unit tests for pipeline/verify_dates.py."""

import unittest

from pipeline.verify_dates import check_events


def _event(eid, round_num, ds, de, sessions, cc="US"):
    return {
        "id": eid,
        "round": round_num,
        "dateStart": ds,
        "dateEnd": de,
        "circuit": {"countryCode": cc},
        "sessions": sessions,
    }


class TestVerifyDates(unittest.TestCase):
    def test_clean_event_has_no_issues(self):
        events = [
            _event("e1", 1, "2026-01-10", "2026-01-11", [
                {"type": "Qualifying", "startTimeUTC": "2026-01-10T14:00:00Z"},
                {"type": "Race", "startTimeUTC": "2026-01-11T14:00:00Z"},
            ])
        ]
        self.assertEqual(check_events(events, "test.json", today="2026-06-01"), [])

    def test_envelope_mismatch_detected(self):
        events = [
            _event("e1", 1, "2026-01-09", "2026-01-11", [
                {"type": "Race", "startTimeUTC": "2026-01-11T14:00:00Z"},
            ])
        ]
        issues = check_events(events, "test.json", today="2026-06-01")
        self.assertTrue(any(i["type"] == "envelope_mismatch" for i in issues))

    def test_placeholder_time_flagged_only_when_upcoming(self):
        upcoming = [
            _event("e1", 1, "2026-07-01", "2026-07-02", [
                {"type": "Race", "startTimeUTC": "1900-01-01T00:00:00Z"},
            ])
        ]
        past = [
            _event("e1", 1, "2026-01-01", "2026-01-02", [
                {"type": "Race", "startTimeUTC": "1900-01-01T00:00:00Z"},
            ])
        ]
        self.assertTrue(any(
            i["type"] == "placeholder_time"
            for i in check_events(upcoming, "test.json", today="2026-06-01")
        ))
        self.assertFalse(any(
            i["type"] == "placeholder_time"
            for i in check_events(past, "test.json", today="2026-06-01")
        ))

    def test_bad_country_code_detected(self):
        events = [_event("e1", 1, "2026-01-10", "2026-01-11", [], cc="USA")]
        issues = check_events(events, "test.json", today="2026-06-01")
        self.assertTrue(any(i["type"] == "bad_country_code" for i in issues))

    def test_sessions_out_of_order_detected(self):
        events = [
            _event("e1", 1, "2026-01-10", "2026-01-11", [
                {"type": "Race", "startTimeUTC": "2026-01-11T14:00:00Z"},
                {"type": "Qualifying", "startTimeUTC": "2026-01-10T14:00:00Z"},
            ])
        ]
        issues = check_events(events, "test.json", today="2026-06-01")
        self.assertTrue(any(i["type"] == "sessions_out_of_order" for i in issues))

    def test_non_sequential_rounds_detected(self):
        events = [
            _event("e1", 1, "2026-01-10", "2026-01-10", []),
            _event("e2", 3, "2026-02-10", "2026-02-10", []),
        ]
        issues = check_events(events, "test.json", today="2026-06-01")
        self.assertTrue(any(i["type"] == "non_sequential_rounds" for i in issues))

    def test_rounds_out_of_chronological_order_detected(self):
        events = [
            _event("e1", 1, "2026-03-10", "2026-03-10", []),
            _event("e2", 2, "2026-02-10", "2026-02-10", []),
        ]
        issues = check_events(events, "test.json", today="2026-06-01")
        self.assertTrue(any(i["type"] == "rounds_out_of_chronological_order" for i in issues))


if __name__ == "__main__":
    unittest.main()
