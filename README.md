# Cisco Contract Intelligence Platform

AI-powered contract analysis system for Cisco's Contract Digitization Platform (CDP). Built for the Cisco internal hackathon.

## Problem

Cisco has tens of thousands of vendor contracts (software, hardware, licensing) stored as PDFs. Currently:
- No deep interrogation of contract content
- Manual legal review is slow and expensive
- No automated alerts for renewals, compliance gaps, or risks

## Solution

An AI-powered pipeline that:
1. **Ingests** contract PDFs (digital or scanned with OCR)
2. **Extracts** key clauses using Claude LLM
3. **Compares** against Cisco standard clauses
4. **Flags** risks with severity levels
5. **Serves** structured data via REST API

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer (FastAPI)                       │
├─────────────────────────────────────────────────────────────────┤
│  POST /contracts/analyze   │  GET /contracts/summary            │
│  POST /contracts/analyze-batch  │  GET /contracts/{id}          │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     Pipeline Orchestrator                        │
├──────────┬──────────┬──────────┬──────────┬─────────────────────┤
│ Ingestion│Extraction│Comparison│ Flagging │    Validation       │
│ (PDF→txt)│(Claude)  │(vs std)  │ (rules)  │  (ground-truth)     │
└──────────┴──────────┴──────────┴──────────┴─────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Storage Layer (SQLite)                        │
│              ┌─────────────┬─────────────┐                       │
│              │  contracts  │    cache    │                       │
│              └─────────────┴─────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

| Feature | Description |
|---------|-------------|
| PDF Extraction | pdfplumber + pytesseract OCR fallback |
| Clause Extraction | Claude-powered structured output |
| Security Compliance | Compare against Cisco standard clauses |
| Risk Flagging | Red/Yellow/Green severity levels |
| Content Caching | SHA-256 hash-based deduplication |
| Ground-truth Validation | Accuracy metrics vs known data |

## Quick Start

```bash
# Install dependencies
python -m venv .venv
source .venv/bin/activate
pip install -e .

# Set API key
echo "ANTHROPIC_API_KEY=your-key" > .env

# Analyze a single contract
python cli.py analyze contracts_data/dummy_contracts/dummy-001_*.md

# Batch analyze all contracts
python cli.py batch contracts_data/dummy_contracts --pattern "dummy-*.md"

# Start API server
python main.py
# API available at http://localhost:8000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/contracts/analyze` | POST | Analyze single contract (upload file) |
| `/api/v1/contracts/analyze-batch` | POST | Analyze multiple contracts |
| `/api/v1/contracts/summary` | GET | Dashboard statistics |
| `/api/v1/contracts` | GET | List all analyzed contracts |
| `/api/v1/contracts/{id}` | GET | Get specific contract analysis |
| `/api/v1/health` | GET | Health check |

## Output Schema

```json
{
  "contract_id": "CONTRACT-8EC9FA0C",
  "vendor_name": "Northstar Interface Labs, Inc.",
  "contract_type": "Master OEM Software License Agreement",
  "effective_date": "2014-02-15",
  "expiry_date": "2027-02-14",
  "clauses": {
    "security": {
      "status": "needs_review",
      "has_incident_notification": true,
      "has_audit_rights": true,
      "gaps": ["No specific compliance standards"]
    },
    "royalty": {
      "has_royalty": true,
      "royalty_type": "per-device",
      "royalty_amount": "USD 1.85 per shipped endpoint"
    },
    "renewal": {
      "auto_renew": true,
      "notice_period_days": 90,
      "renewal_term_months": 12
    }
  },
  "risk_flags": [...],
  "overall_risk_level": "yellow",
  "confidence": 0.9
}
```

---

## Architecture Decisions & Challenges

### Challenge 1: Double LLM Calls (Extraction + Comparison)

**Problem:** Original architecture called Claude twice per contract:
1. First call: Extract clauses
2. Second call: Compare against standards

This doubled API costs and latency (~30s per contract).

**Solution:** Unified single-call extraction (`src/extraction/unified_extractor.py`)
- Combined extraction AND comparison into one prompt
- Single LLM call returns both structured clauses and comparison results
- **Result:** 50% reduction in API calls and tokens

```python
# Before: Two calls
clauses = extractor.extract(text)
comparison = comparator.compare(clauses)

# After: One call
clauses, comparisons, metadata = unified_extractor.extract_and_compare(text)
```

### Challenge 2: No Caching (Duplicate Analysis)

**Problem:** Same contract uploaded twice = full re-analysis. Wasteful for:
- Development/testing cycles
- Re-uploads by users
- Batch re-runs

**Solution:** Content-based caching (`src/storage/cache.py`)
- SHA-256 hash of normalized contract text
- Cache lookup before LLM call
- Cache stats for monitoring

```python
# Content hash as cache key
content_hash = hashlib.sha256(text.strip().lower().encode()).hexdigest()

# Check cache first
cached = cache.get(text)
if cached:
    return cached  # Skip LLM call entirely
```

### Challenge 3: Unvalidated Confidence Scores

**Problem:** Model-reported confidence (0.9, 0.85, etc.) is self-assessed. No way to know if the model is actually right.

**Solution:** Ground-truth validation (`src/validation/accuracy.py`)
- Compare extracted data against `contract_index.json` (known correct values)
- Calculate actual accuracy per contract
- Check calibration: is the model overconfident or underconfident?

```python
# Validate against known data
validator = AccuracyValidator()
result = validator.validate(analysis)
# {
#   "accuracy_score": 0.8,
#   "model_confidence": 0.9,
#   "confidence_calibration": "overconfident"
# }
```

### Challenge 4: README.md in Batch Analysis

**Problem:** Batch pattern `*.md` accidentally caught `README.md` and analyzed it as a contract.

**Solution:** Changed default pattern to `dummy-*.md` to filter only actual contracts.

---

## Sample Results

Analyzed 20 dummy contracts:

| Risk Level | Count | Examples |
|------------|-------|----------|
| Red | 6 | Expired contracts, missing security clauses |
| Yellow | 14 | Incomplete security terms, unmonitored auto-renewal |
| Green | 0 | - |

**Expiring in 90 days:** 2 contracts

---

## Tech Stack

- **Runtime:** Python 3.12
- **API:** FastAPI + Uvicorn
- **LLM:** Claude Sonnet (Anthropic API)
- **PDF:** pdfplumber + pytesseract
- **Storage:** SQLite
- **Validation:** Pydantic v2

---

## Project Structure

```
cisco-solution/
├── src/
│   ├── api/              # FastAPI routes
│   ├── ingestion/        # PDF text extraction
│   ├── extraction/       # LLM clause extraction
│   │   ├── llm_extractor.py      # Original (2-call)
│   │   └── unified_extractor.py  # Optimized (1-call)
│   ├── comparison/       # Standard clause comparison
│   ├── flagging/         # Risk assessment rules
│   ├── storage/          # SQLite + caching
│   │   ├── database.py
│   │   └── cache.py
│   ├── validation/       # Ground-truth accuracy
│   ├── schemas/          # Pydantic models
│   └── pipeline.py       # Orchestrator
├── standards/            # Cisco standard clauses
├── prompts/              # LLM prompt templates
├── contracts_data/       # Sample contracts
├── main.py               # FastAPI app
└── cli.py                # Command-line interface
```

---

## Future Improvements

1. **Parallel Processing:** `asyncio.gather()` for batch analysis
2. **Vector Search:** Semantic search across contract corpus
3. **Dashboard UI:** Next.js + shadcn/ui frontend
4. **Notifications:** Slack/email alerts for expiring contracts
5. **Multi-tenant:** Support for different Cisco entities

---

## License

Internal Cisco Hackathon Project - Not for external distribution.
