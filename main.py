import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from src.api import router
from src.pipeline import ContractPipeline


def auto_seed_database():
    """Auto-seed database with sample contracts on startup if empty."""
    from src.storage import Database
    db = Database()
    summary = db.get_summary()

    if summary["total_contracts"] == 0:
        print("Database empty, auto-seeding...")
        contracts_dir = Path(__file__).parent / "contracts_data" / "dummy_contracts"
        if contracts_dir.exists():
            pipeline = ContractPipeline()
            for file_path in sorted(contracts_dir.glob("dummy-*.md"))[:5]:
                try:
                    analysis = pipeline.analyze_file(file_path)
                    print(f"  Seeded: {file_path.name} -> {analysis.overall_risk_level.value}")
                except Exception as e:
                    print(f"  Failed: {file_path.name} -> {e}")
            print("Auto-seed complete (5 contracts for fast startup)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    auto_seed_database()
    yield


app = FastAPI(
    title="Contract Intelligence API",
    description="AI-powered contract analysis for Cisco CDP",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
