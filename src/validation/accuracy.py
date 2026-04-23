"""Ground-truth validation for extraction accuracy."""

import json
from datetime import date
from pathlib import Path
from typing import Optional

from src.schemas import ContractAnalysis


class AccuracyValidator:
    """Validate extracted data against ground-truth from contract_index.json."""

    def __init__(self, ground_truth_path: Optional[str] = None):
        if ground_truth_path:
            self.ground_truth = self._load_ground_truth(ground_truth_path)
        else:
            default_path = Path(__file__).parent.parent.parent / "contracts_data" / "dummy_contracts" / "contract_index.json"
            self.ground_truth = self._load_ground_truth(str(default_path))

        self.gt_by_id = {c["contract_id"]: c for c in self.ground_truth}

    def _load_ground_truth(self, path: str) -> list[dict]:
        """Load ground-truth contract metadata."""
        try:
            with open(path) as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def validate(self, analysis: ContractAnalysis) -> dict:
        """Validate extraction against ground-truth.

        Returns dict with:
            - matches: fields that match ground-truth
            - mismatches: fields that differ
            - accuracy_score: 0.0-1.0 based on key field accuracy
            - ground_truth: the expected values
        """
        contract_id = self._extract_contract_id(analysis.file_name)
        gt = self.gt_by_id.get(contract_id)

        if not gt:
            return {
                "contract_id": contract_id,
                "has_ground_truth": False,
                "accuracy_score": None,
                "message": f"No ground-truth found for {contract_id}",
            }

        matches = []
        mismatches = []

        checks = [
            ("vendor_name", analysis.vendor_name, gt.get("vendor_name")),
            ("effective_date", str(analysis.effective_date) if analysis.effective_date else None, gt.get("effective_date")),
            ("expiry_date", str(analysis.expiry_date) if analysis.expiry_date else None, gt.get("expiry_date")),
            ("auto_renew", analysis.clauses.renewal.auto_renew, "auto" in gt.get("auto_renewal", "").lower()),
            ("has_royalty", analysis.clauses.royalty.has_royalty, "royalty" in gt.get("commercial_model", "").lower() or "fee" in gt.get("commercial_model", "").lower()),
        ]

        for field, extracted, expected in checks:
            if self._values_match(extracted, expected):
                matches.append({"field": field, "value": extracted})
            else:
                mismatches.append({
                    "field": field,
                    "extracted": extracted,
                    "expected": expected,
                })

        accuracy = len(matches) / len(checks) if checks else 0.0

        return {
            "contract_id": contract_id,
            "has_ground_truth": True,
            "accuracy_score": round(accuracy, 3),
            "matches": matches,
            "mismatches": mismatches,
            "ground_truth": gt,
            "model_confidence": analysis.confidence,
            "confidence_calibration": self._calibration_check(analysis.confidence, accuracy),
        }

    def _extract_contract_id(self, file_name: str) -> str:
        """Extract contract ID from filename (e.g., dummy-001_... -> DUMMY-001)."""
        if file_name.startswith("dummy-"):
            parts = file_name.split("_")
            if parts:
                return parts[0].upper().replace("DUMMY-", "DUMMY-")
        return file_name

    def _values_match(self, extracted, expected) -> bool:
        """Check if extracted value matches expected."""
        if extracted is None and expected is None:
            return True
        if extracted is None or expected is None:
            return False

        if isinstance(extracted, bool) and isinstance(expected, bool):
            return extracted == expected

        str_extracted = str(extracted).lower().strip()
        str_expected = str(expected).lower().strip()

        return str_extracted == str_expected

    def _calibration_check(self, model_confidence: float, actual_accuracy: float) -> str:
        """Check if model confidence is well-calibrated."""
        diff = abs(model_confidence - actual_accuracy)

        if diff <= 0.1:
            return "well_calibrated"
        elif model_confidence > actual_accuracy:
            return "overconfident"
        else:
            return "underconfident"

    def validate_batch(self, analyses: list[ContractAnalysis]) -> dict:
        """Validate a batch of analyses."""
        results = [self.validate(a) for a in analyses]

        valid_results = [r for r in results if r.get("has_ground_truth")]
        accuracies = [r["accuracy_score"] for r in valid_results if r["accuracy_score"] is not None]

        return {
            "total_analyzed": len(analyses),
            "with_ground_truth": len(valid_results),
            "average_accuracy": round(sum(accuracies) / len(accuracies), 3) if accuracies else None,
            "accuracy_distribution": {
                "high (>0.8)": len([a for a in accuracies if a > 0.8]),
                "medium (0.5-0.8)": len([a for a in accuracies if 0.5 <= a <= 0.8]),
                "low (<0.5)": len([a for a in accuracies if a < 0.5]),
            },
            "calibration_summary": {
                "well_calibrated": len([r for r in valid_results if r.get("confidence_calibration") == "well_calibrated"]),
                "overconfident": len([r for r in valid_results if r.get("confidence_calibration") == "overconfident"]),
                "underconfident": len([r for r in valid_results if r.get("confidence_calibration") == "underconfident"]),
            },
            "results": results,
        }
