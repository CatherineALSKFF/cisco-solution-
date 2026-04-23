import time
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from src.ingestion import PDFProcessor
from src.extraction import ClauseExtractor
from src.comparison import ClauseComparator
from src.flagging import RiskFlagger
from src.storage import Database
from src.schemas import ContractAnalysis, RiskLevel


router = APIRouter(prefix="/api/v1", tags=["contracts"])

pdf_processor = PDFProcessor()
extractor = ClauseExtractor()
comparator = ClauseComparator()
flagger = RiskFlagger()
db = Database()


@router.post("/contracts/analyze", response_model=ContractAnalysis)
async def analyze_contract(
    file: UploadFile = File(...),
    contract_id: Optional[str] = None,
):
    """Analyze a contract PDF and extract structured data."""
    start_time = time.time()

    if not file.filename.lower().endswith((".pdf", ".md", ".txt")):
        raise HTTPException(400, "File must be PDF, MD, or TXT")

    content = await file.read()

    if file.filename.lower().endswith(".pdf"):
        text = pdf_processor.extract_text_from_bytes(content)
    else:
        text = content.decode("utf-8")

    if not text.strip():
        raise HTTPException(400, "Could not extract text from file")

    clauses, metadata = extractor.extract(text, file.filename)

    comparisons = comparator.compare_all(clauses)

    flags, overall_risk = flagger.generate_flags(
        clauses,
        comparisons,
        metadata.get("expiry_date"),
    )

    cid = contract_id or f"CONTRACT-{uuid.uuid4().hex[:8].upper()}"
    processing_time = int((time.time() - start_time) * 1000)

    analysis = ContractAnalysis(
        contract_id=cid,
        file_name=file.filename,
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

    db.save(analysis, text)

    return analysis


@router.post("/contracts/analyze-batch")
async def analyze_batch(
    files: list[UploadFile] = File(...),
):
    """Analyze multiple contracts in batch."""
    results = []
    errors = []

    for file in files:
        try:
            result = await analyze_contract(file)
            results.append({
                "file_name": file.filename,
                "contract_id": result.contract_id,
                "status": "success",
                "overall_risk_level": result.overall_risk_level.value,
            })
        except Exception as e:
            errors.append({
                "file_name": file.filename,
                "status": "error",
                "error": str(e),
            })

    return {
        "processed": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors,
    }


@router.get("/contracts/summary")
async def get_summary():
    """Get summary statistics across all contracts."""
    return db.get_summary()


@router.get("/contracts", response_model=list[ContractAnalysis])
async def list_contracts(
    risk_level: Optional[RiskLevel] = Query(None, description="Filter by risk level"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """List all analyzed contracts."""
    return db.list_all(risk_level=risk_level, limit=limit, offset=offset)


@router.get("/contracts/{contract_id}", response_model=ContractAnalysis)
async def get_contract(contract_id: str):
    """Get analysis for a specific contract."""
    analysis = db.get(contract_id)
    if not analysis:
        raise HTTPException(404, f"Contract {contract_id} not found")
    return analysis


@router.delete("/contracts/{contract_id}")
async def delete_contract(contract_id: str):
    """Delete a contract analysis."""
    if not db.delete(contract_id):
        raise HTTPException(404, f"Contract {contract_id} not found")
    return {"status": "deleted", "contract_id": contract_id}


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}
