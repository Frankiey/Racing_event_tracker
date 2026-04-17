"""Pipeline configuration and shared constants."""

import os
from pathlib import Path
from datetime import datetime

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
BRONZE_DIR = DATA_DIR / "bronze"
SILVER_DIR = DATA_DIR / "silver"
GOLD_DIR = DATA_DIR / "gold"
SEED_DIR = DATA_DIR / "seed"

# Season
SEASON_YEAR = int(os.environ.get("SEASON_YEAR", datetime.now().year))

# Series identifiers
SERIES_IDS = [
    "f1", "f2", "f3", "fe", "indycar", "nascar",
    "motogp", "moto2", "moto3", "wec",
    "imsa", "dtm", "gtworld", "nls", "wsbk", "superformula", "iomtt",
]

# API endpoints
JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1"
OPENF1_BASE = "https://api.openf1.org/v1"
MOTOGP_BASE = "https://api.motogp.pulselive.com/motogp/v1"
WSBK_BASE = "https://api.worldsbk.pulselive.com/sbk/v1"
NASCAR_CDN = "https://cf.nascar.com/cacher"
