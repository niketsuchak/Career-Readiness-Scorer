import json
import uuid
from datetime import datetime
from pathlib import Path

DB_FILE = Path(__file__).parent / "history.json"


def _load() -> list:
    if not DB_FILE.exists():
        return []
    try:
        return json.loads(DB_FILE.read_text())
    except (json.JSONDecodeError, IOError):
        return []


def _save(records: list) -> None:
    DB_FILE.write_text(json.dumps(records, indent=2))


def save_analysis(result: dict) -> dict:
    records = _load()
    result["id"] = str(uuid.uuid4())[:8]
    result["timestamp"] = datetime.utcnow().isoformat() + "Z"
    records.insert(0, result)
    _save(records)
    return result


def get_history() -> list:
    return _load()


def clear_history() -> None:
    _save([])
