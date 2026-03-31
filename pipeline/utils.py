"""Shared utilities for the data pipeline."""

import json
from datetime import datetime
from pathlib import Path

import httpx

CLIENT = httpx.Client(timeout=30, follow_redirects=True)


def fetch_json(url: str, retries: int = 2) -> dict | list:
    """Fetch JSON from a URL with retries."""
    last_err = None
    for attempt in range(retries + 1):
        try:
            resp = CLIENT.get(url)
            resp.raise_for_status()
            return resp.json()
        except (httpx.HTTPError, json.JSONDecodeError) as e:
            last_err = e
            if attempt < retries:
                print(f"  Retry {attempt + 1} for {url}: {e}")
    raise last_err


def write_json(path: Path, data) -> None:
    """Write data as formatted JSON."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"  Wrote {path}")


def read_json(path: Path):
    """Read a JSON file."""
    return json.loads(path.read_text())


def to_iso(dt_str: str) -> str:
    """Parse various date formats to ISO 8601 UTC string."""
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except (ValueError, AttributeError):
        return dt_str


def to_date(dt_str: str) -> str:
    """Extract date portion from a datetime string."""
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d")
    except (ValueError, AttributeError):
        return dt_str
