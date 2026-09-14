import unittest

from pipeline.validate import validate_series_calendar


def round_event(number: int, date_start: str, times: list[str]) -> dict:
    """One F3-shaped round: Practice/Qualifying Friday, Sprint Saturday, Feature Sunday."""
    types = ["Practice", "Qualifying", "Sprint Race", "Feature Race"]
    return {
        "id": f"f3-2026-r{number:02d}",
        "seriesId": "f3",
        "round": number,
        "dateStart": date_start,
        "sessions": [{"type": t, "startTimeUTC": s} for t, s in zip(types, times)],
    }


# The exact template that shipped: rounds 6-9 of data/seed/f3.json all carried
# 07:00/11:00 Friday, 08:00 Saturday, 08:30 Sunday, whatever weekend they landed on.
TEMPLATE = ["{d0}T07:00:00Z", "{d0}T11:00:00Z", "{d1}T08:00:00Z", "{d2}T08:30:00Z"]


def templated(number: int, days: tuple[str, str, str]) -> dict:
    d0, d1, d2 = days
    return round_event(number, d0, [t.format(d0=d0, d1=d1, d2=d2) for t in TEMPLATE])


class TemplatedSessionTimes(unittest.TestCase):
    def test_reports_the_f3_template_that_shipped(self):
        events = [
            templated(1, ("2026-07-17", "2026-07-18", "2026-07-19")),
            templated(2, ("2026-07-24", "2026-07-25", "2026-07-26")),
            templated(3, ("2026-09-04", "2026-09-05", "2026-09-06")),
        ]
        errors = validate_series_calendar(events, "f3.json")
        self.assertTrue(any("identical session times" in e for e in errors), errors)

    def test_repeated_times_never_block_the_build(self):
        """Standardised support-race slots repeat legitimately — F3 rounds 3/4/7 share a
        signature with every value independently verified, and moto2 repeats across 15
        API-sourced rounds. Repetition is a smell to print, never a reason to fail."""
        events = [
            templated(1, ("2026-07-17", "2026-07-18", "2026-07-19")),
            templated(2, ("2026-07-24", "2026-07-25", "2026-07-26")),
            templated(3, ("2026-09-04", "2026-09-05", "2026-09-06")),
            templated(4, ("2026-09-11", "2026-09-12", "2026-09-13")),
        ]
        errors = validate_series_calendar(events, "f3.json")
        self.assertTrue(any("identical session times" in e for e in errors))
        self.assertFalse([e for e in errors if e.startswith("ERROR")], errors)

    def test_real_schedules_pass(self):
        """Verified Monza and Spa timetables differ per weekend, as real ones do."""
        events = [
            round_event(1, "2026-07-17", [
                "2026-07-17T09:05:00Z", "2026-07-17T13:55:00Z",
                "2026-07-18T12:15:00Z", "2026-07-19T08:00:00Z",
            ]),
            round_event(2, "2026-09-04", [
                "2026-09-04T06:35:00Z", "2026-09-04T12:00:00Z",
                "2026-09-05T07:30:00Z", "2026-09-06T06:15:00Z",
            ]),
        ]
        self.assertEqual(validate_series_calendar(events, "f3.json"), [])


class CalendarStructure(unittest.TestCase):
    def base(self):
        return [
            round_event(1, "2026-03-06", ["2026-03-06T01:30:00Z", "2026-03-06T04:30:00Z",
                                          "2026-03-07T20:30:00Z", "2026-03-08T19:30:00Z"]),
            round_event(2, "2026-06-05", ["2026-06-05T06:00:00Z", "2026-06-05T09:30:00Z",
                                          "2026-06-06T06:10:00Z", "2026-06-07T06:20:00Z"]),
        ]

    def test_duplicate_round_numbers(self):
        events = self.base()
        events[1]["round"] = 1
        errors = validate_series_calendar(events, "f3.json")
        self.assertTrue(any("duplicate round numbers" in e for e in errors), errors)

    def test_gap_in_round_numbers(self):
        events = self.base()
        events[1]["round"] = 3
        errors = validate_series_calendar(events, "f3.json")
        self.assertTrue(any("not contiguous" in e for e in errors), errors)

    def test_rounds_out_of_date_order(self):
        events = self.base()
        events[0]["dateStart"], events[1]["dateStart"] = events[1]["dateStart"], events[0]["dateStart"]
        errors = validate_series_calendar(events, "f3.json")
        self.assertTrue(any("not ordered by dateStart" in e for e in errors), errors)

    def test_clean_calendar_has_no_errors(self):
        self.assertEqual(validate_series_calendar(self.base(), "f3.json"), [])


if __name__ == "__main__":
    unittest.main()
