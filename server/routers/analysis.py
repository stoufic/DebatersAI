from fastapi import APIRouter, HTTPException
from models.schemas import FactCheckRequest, TextAnalyzeRequest, TranscriptAnalyze
from services.ai_pipeline import ai_pipeline
from services.database import db


router = APIRouter(prefix="/api/analyze", tags=["analysis"])


def check_and_use_call(user_id: str) -> bool:
    """Check if user can use a call, deduct if guest"""
    if not db.can_use_feature(user_id, "debate"):
        return False
    if db.use_guest_call(user_id):
        return True
    # For non-guests, don't deduct
    return True


@router.post("/text")
async def analyze_text(request: TextAnalyzeRequest, user_id: str = None):
    if user_id and not check_and_use_call(user_id):
        raise HTTPException(status_code=403, detail="Guest calls exhausted. Create account for unlimited access.")

    result = ai_pipeline.analyze_text(request.text, request.context)
    return result


@router.post("/factcheck")
async def fact_check(request: FactCheckRequest, user_id: str = None):
    if user_id and not check_and_use_call(user_id):
        raise HTTPException(status_code=403, detail="Guest calls exhausted. Create account for unlimited access.")

    result = ai_pipeline.fact_check(request.claim)
    return result


@router.post("/transcript")
async def analyze_transcript(request: TranscriptAnalyze, user_id: str = None):
    if user_id and not check_and_use_call(user_id):
        raise HTTPException(status_code=403, detail="Guest calls exhausted. Create account for unlimited access.")

    result = ai_pipeline.analyze_transcript(request.text)
    return result


@router.get("/health")
async def health_check():
    return {"status": "ok", "ai": "local_pipeline"}
