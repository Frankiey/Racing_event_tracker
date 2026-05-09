"""Shared session taxonomy loader for pipeline transforms."""

from functools import lru_cache
import json
from pathlib import Path


_TAXONOMY_PATH = Path(__file__).resolve().parents[1] / "src" / "lib" / "session-taxonomy.json"


@lru_cache(maxsize=1)
def load_session_taxonomy() -> dict:
    return json.loads(_TAXONOMY_PATH.read_text(encoding="utf-8"))


def get_session_type_map(source: str) -> dict[str, str]:
    taxonomy = load_session_taxonomy()
    return taxonomy.get("sourceMaps", {}).get(source, {})
