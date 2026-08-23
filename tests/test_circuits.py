"""Unit tests for pipeline/circuits.py."""

import unittest

from pipeline.circuits import enrich_circuit


class TestEnrichCircuit(unittest.TestCase):
    def test_fills_missing_lat_lng_city_from_lookup(self):
        circuit = {"name": "Sachsenring", "city": "", "lat": None, "lng": None}
        enrich_circuit(circuit)
        self.assertEqual(circuit["lat"], 50.7911)
        self.assertEqual(circuit["lng"], 12.6886)
        self.assertEqual(circuit["city"], "Hohenstein-Ernstthal")

    def test_does_not_overwrite_existing_values(self):
        circuit = {"name": "Sachsenring", "city": "Custom City", "lat": 1.0, "lng": 2.0}
        enrich_circuit(circuit)
        self.assertEqual(circuit["lat"], 1.0)
        self.assertEqual(circuit["lng"], 2.0)
        self.assertEqual(circuit["city"], "Custom City")

    def test_unknown_circuit_name_is_untouched(self):
        circuit = {"name": "Nonexistent Speedway", "lat": None, "lng": None}
        result = enrich_circuit(circuit)
        self.assertIsNone(result["lat"])
        self.assertIsNone(result["lng"])

    def test_brno_alias_resolves_to_same_coordinates(self):
        standard = {"name": "Automotodrom Brno", "lat": None, "lng": None}
        api_variant = {"name": "CREDITAS Autodrom Brno", "lat": None, "lng": None}
        enrich_circuit(standard)
        enrich_circuit(api_variant)
        self.assertEqual(standard["lat"], api_variant["lat"])
        self.assertEqual(standard["lng"], api_variant["lng"])
        self.assertIsNotNone(standard["lat"])


if __name__ == "__main__":
    unittest.main()
