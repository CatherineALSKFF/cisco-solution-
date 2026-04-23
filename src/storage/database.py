import json
import os
import sqlite3
from datetime import date, datetime
from pathlib import Path
from typing import Optional

from src.schemas import ContractAnalysis, RiskLevel


class Database:
    """SQLite storage for contract analyses."""

    def __init__(self, db_path: str = "contracts.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize database schema."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS contracts (
                    contract_id TEXT PRIMARY KEY,
                    file_name TEXT NOT NULL,
                    vendor_name TEXT,
                    contract_type TEXT,
                    effective_date TEXT,
                    expiry_date TEXT,
                    overall_risk_level TEXT,
                    confidence REAL,
                    analysis_json TEXT NOT NULL,
                    raw_text TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_risk_level
                ON contracts(overall_risk_level)
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_expiry_date
                ON contracts(expiry_date)
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_vendor
                ON contracts(vendor_name)
            """)

    def save(self, analysis: ContractAnalysis, raw_text: Optional[str] = None):
        """Save or update a contract analysis."""
        now = datetime.utcnow().isoformat()

        analysis_dict = analysis.model_dump(mode="json")

        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO contracts (
                    contract_id, file_name, vendor_name, contract_type,
                    effective_date, expiry_date, overall_risk_level,
                    confidence, analysis_json, raw_text, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(contract_id) DO UPDATE SET
                    file_name = excluded.file_name,
                    vendor_name = excluded.vendor_name,
                    contract_type = excluded.contract_type,
                    effective_date = excluded.effective_date,
                    expiry_date = excluded.expiry_date,
                    overall_risk_level = excluded.overall_risk_level,
                    confidence = excluded.confidence,
                    analysis_json = excluded.analysis_json,
                    raw_text = excluded.raw_text,
                    updated_at = excluded.updated_at
            """, (
                analysis.contract_id,
                analysis.file_name,
                analysis.vendor_name,
                analysis.contract_type,
                analysis.effective_date.isoformat() if analysis.effective_date else None,
                analysis.expiry_date.isoformat() if analysis.expiry_date else None,
                analysis.overall_risk_level.value,
                analysis.confidence,
                json.dumps(analysis_dict),
                raw_text,
                now,
                now,
            ))

    def get(self, contract_id: str) -> Optional[ContractAnalysis]:
        """Get a contract analysis by ID."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute(
                "SELECT analysis_json FROM contracts WHERE contract_id = ?",
                (contract_id,)
            ).fetchone()

            if row:
                return ContractAnalysis.model_validate_json(row["analysis_json"])
            return None

    def get_raw_text(self, contract_id: str) -> Optional[str]:
        """Get raw text for a contract."""
        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute(
                "SELECT raw_text FROM contracts WHERE contract_id = ?",
                (contract_id,)
            ).fetchone()
            return row[0] if row else None

    def list_all(
        self,
        risk_level: Optional[RiskLevel] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[ContractAnalysis]:
        """List all contract analyses with optional filtering."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row

            if risk_level:
                rows = conn.execute(
                    """SELECT analysis_json FROM contracts
                       WHERE overall_risk_level = ?
                       ORDER BY expiry_date ASC
                       LIMIT ? OFFSET ?""",
                    (risk_level.value, limit, offset)
                ).fetchall()
            else:
                rows = conn.execute(
                    """SELECT analysis_json FROM contracts
                       ORDER BY expiry_date ASC
                       LIMIT ? OFFSET ?""",
                    (limit, offset)
                ).fetchall()

            return [
                ContractAnalysis.model_validate_json(row["analysis_json"])
                for row in rows
            ]

    def get_summary(self) -> dict:
        """Get summary statistics."""
        with sqlite3.connect(self.db_path) as conn:
            total = conn.execute("SELECT COUNT(*) FROM contracts").fetchone()[0]

            red = conn.execute(
                "SELECT COUNT(*) FROM contracts WHERE overall_risk_level = 'red'"
            ).fetchone()[0]

            yellow = conn.execute(
                "SELECT COUNT(*) FROM contracts WHERE overall_risk_level = 'yellow'"
            ).fetchone()[0]

            green = conn.execute(
                "SELECT COUNT(*) FROM contracts WHERE overall_risk_level = 'green'"
            ).fetchone()[0]

            today = date.today().isoformat()
            expiring_90 = conn.execute(
                """SELECT COUNT(*) FROM contracts
                   WHERE expiry_date IS NOT NULL
                   AND expiry_date <= date(?, '+90 days')
                   AND expiry_date >= ?""",
                (today, today)
            ).fetchone()[0]

            return {
                "total_contracts": total,
                "by_risk_level": {
                    "red": red,
                    "yellow": yellow,
                    "green": green,
                },
                "expiring_in_90_days": expiring_90,
            }

    def delete(self, contract_id: str) -> bool:
        """Delete a contract analysis."""
        with sqlite3.connect(self.db_path) as conn:
            result = conn.execute(
                "DELETE FROM contracts WHERE contract_id = ?",
                (contract_id,)
            )
            return result.rowcount > 0
