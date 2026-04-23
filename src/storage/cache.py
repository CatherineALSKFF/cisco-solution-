"""Content-based caching for contract analysis."""

import hashlib
import json
import sqlite3
from datetime import datetime
from typing import Optional

from src.schemas import ContractAnalysis


class AnalysisCache:
    """Cache contract analyses by content hash to avoid re-processing identical documents."""

    def __init__(self, db_path: str = "contracts.db"):
        self.db_path = db_path
        self._init_cache_table()

    def _init_cache_table(self):
        """Create cache table if not exists."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS analysis_cache (
                    content_hash TEXT PRIMARY KEY,
                    contract_id TEXT NOT NULL,
                    analysis_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    hit_count INTEGER DEFAULT 1
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_cache_contract
                ON analysis_cache(contract_id)
            """)

    @staticmethod
    def hash_content(content: str) -> str:
        """Generate SHA-256 hash of contract content."""
        normalized = content.strip().lower()
        return hashlib.sha256(normalized.encode()).hexdigest()

    def get(self, content: str) -> Optional[ContractAnalysis]:
        """Check cache for existing analysis of this content."""
        content_hash = self.hash_content(content)

        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute(
                "SELECT analysis_json FROM analysis_cache WHERE content_hash = ?",
                (content_hash,)
            ).fetchone()

            if row:
                conn.execute(
                    "UPDATE analysis_cache SET hit_count = hit_count + 1 WHERE content_hash = ?",
                    (content_hash,)
                )
                return ContractAnalysis.model_validate_json(row["analysis_json"])

        return None

    def set(self, content: str, analysis: ContractAnalysis):
        """Cache an analysis result."""
        content_hash = self.hash_content(content)
        now = datetime.utcnow().isoformat()

        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO analysis_cache (content_hash, contract_id, analysis_json, created_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(content_hash) DO UPDATE SET
                    analysis_json = excluded.analysis_json,
                    hit_count = hit_count + 1
            """, (
                content_hash,
                analysis.contract_id,
                analysis.model_dump_json(),
                now,
            ))

    def get_stats(self) -> dict:
        """Get cache statistics."""
        with sqlite3.connect(self.db_path) as conn:
            total = conn.execute("SELECT COUNT(*) FROM analysis_cache").fetchone()[0]
            total_hits = conn.execute("SELECT SUM(hit_count) FROM analysis_cache").fetchone()[0] or 0

        return {
            "cached_analyses": total,
            "total_cache_hits": total_hits,
            "cache_hit_ratio": (total_hits - total) / max(total_hits, 1),
        }

    def invalidate(self, contract_id: str):
        """Invalidate cache entries for a contract."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "DELETE FROM analysis_cache WHERE contract_id = ?",
                (contract_id,)
            )

    def clear(self):
        """Clear entire cache."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("DELETE FROM analysis_cache")
