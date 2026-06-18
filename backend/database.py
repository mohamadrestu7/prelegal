import json
import sqlite3
from pathlib import Path
from typing import Any

DB_PATH = Path("prelegal.db")


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create the database fresh on every startup."""
    DB_PATH.unlink(missing_ok=True)
    conn = _conn()
    conn.executescript("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            doc_type TEXT NOT NULL,
            doc_name TEXT NOT NULL,
            fields_json TEXT NOT NULL DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, doc_type)
        );
    """)
    conn.commit()
    conn.close()


# ── User helpers ────────────────────────────────────────────────────────────

def create_user(email: str, name: str, password_hash: str) -> dict:
    with _conn() as conn:
        cur = conn.execute(
            "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
            (email, name, password_hash),
        )
        conn.commit()
        return {"id": cur.lastrowid, "email": email, "name": name}


def get_user_by_email(email: str) -> dict | None:
    with _conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row) if row else None


# ── Document helpers ────────────────────────────────────────────────────────

def save_document(user_id: int, doc_type: str, doc_name: str, fields: dict) -> dict:
    """Upsert a document for this user+docType combination (atomic)."""
    fields_json = json.dumps(fields)
    with _conn() as conn:
        conn.execute(
            """INSERT INTO documents (user_id, doc_type, doc_name, fields_json)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(user_id, doc_type)
               DO UPDATE SET doc_name = excluded.doc_name,
                             fields_json = excluded.fields_json,
                             updated_at = CURRENT_TIMESTAMP""",
            (user_id, doc_type, doc_name, fields_json),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id FROM documents WHERE user_id = ? AND doc_type = ?",
            (user_id, doc_type),
        ).fetchone()
        return {"id": row["id"], "doc_type": doc_type, "doc_name": doc_name}


def list_documents(user_id: int) -> list[dict]:
    with _conn() as conn:
        rows = conn.execute(
            "SELECT id, doc_type, doc_name, fields_json, updated_at FROM documents "
            "WHERE user_id = ? ORDER BY updated_at DESC",
            (user_id,),
        ).fetchall()
        return [
            {
                "id": row["id"],
                "doc_type": row["doc_type"],
                "doc_name": row["doc_name"],
                "fields": json.loads(row["fields_json"]),
                "updated_at": row["updated_at"],
            }
            for row in rows
        ]
