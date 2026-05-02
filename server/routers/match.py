from fastapi import APIRouter, HTTPException
from models.schemas import MatchRequest, MatchResponse, Stance
from services.matchmaking import match_service, TOPICS
import uuid


router = APIRouter(prefix="/api/match", tags=["matching"])


@router.post("/find", response_model=MatchResponse)
async def find_match(request: MatchRequest, user_id: str = None):
    if not user_id:
        user_id = str(uuid.uuid4())[:8]

    if request.topic_id not in TOPICS:
        raise HTTPException(status_code=400, detail="Invalid topic ID")

    result = match_service.find_match(user_id, request.topic_id, request.stance)

    if result["matched"]:
        return MatchResponse(
            room_id=result["room_id"],
            position=None,
            estimated_wait=None,
        )
    else:
        return MatchResponse(
            room_id=None,
            position=result["position"],
            estimated_wait=result["estimated_wait"],
        )


@router.delete("/cancel")
async def cancel_match(user_id: str):
    success = match_service.cancel_match(user_id)
    return {"success": success}


@router.get("/status")
async def get_status(user_id: str):
    room = match_service.get_user_room(user_id)
    if room:
        return {
            "status": "matched",
            "room_id": room["id"],
            "topic": room["topic_name"],
        }

    for topic_id, queue in match_service.queues.items():
        if user_id in queue:
            return {
                "status": "waiting",
                "topic_id": topic_id,
                "position": len(queue),
            }

    raise HTTPException(status_code=404, detail="User not in queue or room")


@router.get("/topics")
async def get_topics():
    return {"topics": list(TOPICS.values())}
