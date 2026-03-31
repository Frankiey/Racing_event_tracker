"""Circuit coordinate and city data for series where the API doesn't provide them.

Keyed by canonical circuit name (as it appears in silver data).
Each entry: (lat, lng, city).
"""

CIRCUIT_COORDS: dict[str, tuple[float, float, str]] = {
    # ── MotoGP / Moto2 / Moto3 circuits ──
    "Chang International Circuit":                          (14.9618, 103.0851, "Buriram"),
    "Autódromo Internacional de Goiânia - Ayrton Senna":    (-16.7186, -49.2456, "Goiânia"),
    "Circuit Of The Americas":                              (30.1328, -97.6411, "Austin"),
    "Circuito de Jerez - Ángel Nieto":                      (36.7083, -6.0340, "Jerez de la Frontera"),
    "Le Mans":                                              (47.9560, 0.2075, "Le Mans"),
    "Circuit de Barcelona-Catalunya":                       (41.5700, 2.2611, "Montmeló"),
    "Autodromo Internazionale del Mugello":                  (43.9975, 11.3719, "Scarperia"),
    "Balaton Park Circuit":                                 (46.9192, 17.8853, "Balatonfőkajár"),
    "Automotodrom Brno":                                    (49.2036, 16.4317, "Brno"),
    "TT Circuit Assen":                                     (52.9614, 6.5228, "Assen"),
    "Sachsenring":                                          (50.7911, 12.6886, "Hohenstein-Ernstthal"),
    "Silverstone Circuit":                                  (52.0713, -1.0147, "Silverstone"),
    "Red Bull Ring - Spielberg":                            (47.2197, 14.7647, "Spielberg"),
    "Misano World Circuit Marco Simoncelli":                (43.9628, 12.6836, "Misano Adriatico"),
    "MotorLand Aragón":                                     (40.9417, -0.1688, "Alcañiz"),
    "Pertamina Mandalika Circuit":                          (-8.8950, 116.2975, "Lombok"),
    "Mobility Resort Motegi":                               (36.5322, 140.2281, "Motegi"),
    "Phillip Island":                                       (-38.5006, 145.2319, "Phillip Island"),
    "Petronas Sepang International Circuit":                (2.7606, 101.7381, "Sepang"),
    "Lusail International Circuit":                         (25.4900, 51.4542, "Lusail"),
    "Autódromo Internacional do Algarve":                   (37.2294, -8.6267, "Portimão"),
    "Circuit Ricardo Tormo":                                (39.4886, -0.6268, "Cheste"),

    # ── NASCAR circuits ──
    "Bowman Gray Stadium":                                  (36.0920, -80.2680, "Winston-Salem"),
    "Daytona International Speedway":                       (29.1872, -81.0711, "Daytona Beach"),
    "Atlanta Motor Speedway":                               (33.3847, -84.3131, "Hampton"),
    "Circuit of The Americas":                              (30.1328, -97.6411, "Austin"),
    "Las Vegas Motor Speedway":                             (36.2719, -115.0103, "Las Vegas"),
    "Phoenix Raceway":                                      (33.3753, -112.3108, "Avondale"),
    "Bristol Motor Speedway":                               (36.5158, -82.2569, "Bristol"),
    "Martinsville Speedway":                                (36.6342, -79.8517, "Ridgeway"),
    "Texas Motor Speedway":                                 (33.0372, -97.2822, "Fort Worth"),
    "Talladega Superspeedway":                              (33.5669, -86.0642, "Lincoln"),
    "Darlington Raceway":                                   (34.2953, -79.9056, "Darlington"),
    "Kansas Speedway":                                      (39.1156, -94.8311, "Kansas City"),
    "Charlotte Motor Speedway":                             (35.3522, -80.6831, "Concord"),
    "North Wilkesboro Speedway":                            (36.1611, -81.1022, "North Wilkesboro"),
    "Nashville Superspeedway":                              (36.0467, -86.3861, "Lebanon"),
    "Sonoma Raceway":                                       (38.1611, -122.4553, "Sonoma"),
    "Iowa Speedway":                                        (41.6781, -93.0128, "Newton"),
    "Chicagoland Speedway":                                 (41.4750, -88.0581, "Joliet"),
    "New Hampshire Motor Speedway":                         (43.3628, -71.4606, "Loudon"),
    "Pocono Raceway":                                       (41.0556, -75.5097, "Long Pond"),
    "Indianapolis Motor Speedway":                          (39.7950, -86.2353, "Indianapolis"),
    "Richmond Raceway":                                     (37.5928, -77.4197, "Richmond"),
    "Michigan International Speedway":                      (42.0689, -84.2403, "Brooklyn"),
    "Watkins Glen International":                           (42.3369, -76.9275, "Watkins Glen"),
    "Dover Motor Speedway":                                 (39.1900, -75.5303, "Dover"),
    "World Wide Technology Raceway":                        (38.6258, -90.1306, "Madison"),
    "Homestead-Miami Speedway":                             (25.4517, -80.4083, "Homestead"),
    "San Diego Street Course":                              (32.7069, -117.1628, "San Diego"),
}


def enrich_circuit(circuit: dict) -> dict:
    """Fill in missing lat, lng, and city from the lookup table.

    Mutates and returns the circuit dict.
    """
    name = circuit.get("name", "")
    coords = CIRCUIT_COORDS.get(name)
    if coords is None:
        return circuit

    lat, lng, city = coords
    if circuit.get("lat") is None:
        circuit["lat"] = lat
    if circuit.get("lng") is None:
        circuit["lng"] = lng
    if not circuit.get("city"):
        circuit["city"] = city
    return circuit
