"""End-to-end contract analysis pipeline."""

import time
import uuid
from pathlib import Path
from typing import Optional

from src.ingestion import PDFProcessor
from src.extraction import ClauseExtractor
from src.comparison import ClauseComparator
from src.flagging import RiskFlagger
from src.storage import Database
from src.schemas import ContractAnalysis


class ContractPipeline:
    """Orchestrates the full contract analysis pipeline."""

    def __init__(
        self,
        db_path: str = "contracts.db",
        ocr_enabled: bool = True,
    ):
        self.pdf_processor = PDFProcessor(ocr_enabled=ocr_enabled)
        self.extractor = ClauseExtractor()
        self.comparator = ClauseComparator()
        self.flagger = RiskFlagger()
        self.db = Database(db_path)

    def analyze_file(
        self,
        file_path: str | Path,
        contract_id: Optional[str] = None,
        save_to_db: bool = True,
    ) -> ContractAnalysis:
        """Analyze a single contract file."""
        start_time = time.time()
        path = Path(file_path)

        if path.suffix.lower() == ".pdf":
            text = self.pdf_processor.extract_text(path)
        else:
            text = path.read_text()

        if not text.strip():
            raise ValueError(f"Could not extract text from {path}")

        clauses, metadata = self.extractor.extract(text, path.name)

        comparisons = self.comparator.compare_all(clauses)

        flags, overall_risk = self.flagger.generate_flags(
            clauses,
            comparisons,
            metadata.get("expiry_date"),
        )

        cid = contract_id or f"CONTRACT-{uuid.uuid4().hex[:8].upper()}"
        processing_time = int((time.time() - start_time) * 1000)

        analysis = ContractAnalysis(
            contract_id=cid,
            file_name=path.name,
            vendor_name=metadata.get("vendor_name"),
            contract_type=metadata.get("contract_type"),
            effective_date=metadata.get("effective_date"),
            expiry_date=metadata.get("expiry_date"),
            clauses=clauses,
            comparisons=comparisons,
            risk_flags=flags,
            overall_risk_level=overall_risk,
            confidence=metadata.get("confidence", 0.7),
            processing_time_ms=processing_time,
            raw_text_length=len(text),
        )

        if save_to_db:
            self.db.save(analysis, text)

        return analysis

    def analyze_directory(
        self,
        directory: str | Path,
        pattern: str = "*.pdf",
    ) -> list[ContractAnalysis]:
        """Analyze all contracts in a directory."""
        dir_path = Path(directory)
        results = []

        for file_path in dir_path.glob(pattern):
            try:
                analysis = self.analyze_file(file_path)
                results.append(analysis)
                print(f"[OK] {file_path.name}: {analysis.overall_risk_level.value}")
            except Exception as e:
                print(f"[ERROR] {file_path.name}: {e}")

        return results

    def get_dashboard_data(self) -> dict:
        """Get data formatted for dashboard display."""
        summary = self.db.get_summary()
        contracts = self.db.list_all(limit=100)

        return {
            "summary": summary,
            "contracts": [
                {
                    "contract_id": c.contract_id,
                    "file_name": c.file_name,
                    "vendor_name": c.vendor_name,
                    "contract_type": c.contract_type,
                    "expiry_date": c.expiry_date.isoformat() if c.expiry_date else None,
                    "overall_risk_level": c.overall_risk_level.value,
                    "risk_flags_count": len(c.risk_flags),
                    "confidence": c.confidence,
                }
                for c in contracts
            ],
            "risk_breakdown": self._get_risk_breakdown(contracts),
        }

    def _get_risk_breakdown(self, contracts: list[ContractAnalysis]) -> dict:
        """Get breakdown of risk flags by category."""
        breakdown = {
            "security": {"red": 0, "yellow": 0},
            "royalty": {"red": 0, "yellow": 0},
            "renewal": {"red": 0, "yellow": 0},
            "compliance": {"red": 0, "yellow": 0},
        }

        for contract in contracts:
            for flag in contract.risk_flags:
                if flag.category in breakdown:
                    if flag.level.value in breakdown[flag.category]:
                        breakdown[flag.category][flag.level.value] += 1

        return breakdown
