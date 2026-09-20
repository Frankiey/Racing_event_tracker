"""Unit tests for pipeline/transforms/common.py."""

import json
import unittest

from pipeline.config import SILVER_DIR
from pipeline.transforms.common import COUNTRY_TIMEZONES, derive_event_dates, local_time_to_utc


# Only these transforms route session times through convert_sessions_from_local_time
# (Pulselive API times are mislabeled local time). Other series' silver data is
# already correct UTC and isn't expected to have COUNTRY_TIMEZONES coverage.
_LOCAL_TIME_CONVERTED_SILVER_FILES = ("motogp.json", "moto2.json", "moto3.json")


class CountryTimezoneCoverageTest(unittest.TestCase):
    """Every countryCode used by a local-time-converted series must have a timezone entry.

    A missing entry silently skips local->UTC conversion for that country's
    sessions, which produced a 2-hour display error for Austria (AT) — see
    the Moto2/Moto3/MotoGP Red Bull Ring round.
    """

    def test_motogp_family_country_codes_have_a_timezone(self):
        missing = set()
        for filename in _LOCAL_TIME_CONVERTED_SILVER_FILES:
            events = json.loads((SILVER_DIR / filename).read_text())
            for event in events:
                code = (event.get("circuit") or {}).get("countryCode")
                if code and code not in COUNTRY_TIMEZONES:
                    missing.add(code)
        self.assertEqual(missing, set(), f"countryCode(s) missing from COUNTRY_TIMEZONES: {missing}")


class LocalTimeToUtcTest(unittest.TestCase):
    def test_austria_cest_offset(self):
        # Red Bull Ring Moto3 race: API reports 11:00 local (mislabeled +00:00).
        result = local_time_to_utc("2026-09-20T11:00:00+00:00", COUNTRY_TIMEZONES["AT"])
        self.assertEqual(result, "2026-09-20T09:00:00Z")

    def test_indonesia_uses_wita_not_wib(self):
        # Mandalika (Lombok) is WITA (UTC+8), not Jakarta's WIB (UTC+7).
        result = local_time_to_utc("2026-10-09T09:00:00+00:00", COUNTRY_TIMEZONES["ID"])
        self.assertEqual(result, "2026-10-09T01:00:00Z")


class DeriveEventDatesTest(unittest.TestCase):
    """A UTC timestamp's calendar date can differ from the circuit's local
    calendar date near midnight — the Phillip Island Moto3/Moto2/MotoGP round
    18 dateStart was off by one day (2026-10-22 instead of 2026-10-23) because
    an early-morning AEDT (UTC+11) session lands on the previous UTC day.
    """

    def test_phillip_island_date_range_uses_local_not_utc_date(self):
        sessions = [
            {"type": "FP1", "startTimeUTC": "2026-10-22T23:45:00Z"},  # Fri 10:45am AEDT
            {"type": "Race", "startTimeUTC": "2026-10-25T03:00:00Z"},  # Sun 2:00pm AEDT
        ]
        date_start, date_end = derive_event_dates(sessions, country_code="AU")
        self.assertEqual(date_start, "2026-10-23")
        self.assertEqual(date_end, "2026-10-25")

    def test_unmapped_country_falls_back_to_raw_utc_date(self):
        sessions = [{"type": "Race", "startTimeUTC": "2026-10-22T23:45:00Z"}]
        date_start, date_end = derive_event_dates(sessions, country_code="ZZ")
        self.assertEqual(date_start, "2026-10-22")
        self.assertEqual(date_end, "2026-10-22")


if __name__ == "__main__":
    unittest.main()
