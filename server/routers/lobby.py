from fastapi import APIRouter, HTTPException
from models.schemas import LobbyPost, Stance, MatchRequest, MatchResponse
from services.database import db
from services.matchmaking import match_service, TOPICS
import uuid


router = APIRouter(prefix="/api/lobby", tags=["lobby"])


@router.get("/posts")
async def get_lobby_posts(topic_id: str = None, session_id: str = None):
    """Get all live lobby posts, optionally filtered by topic"""
    posts = db.get_lobby_posts(topic_id)

    # Hide opponent info from listing
    return {
        "posts": [
            {
                "id": p.id,
                "username": p.username,
                "topic_id": p.topic_id,
                "topic_name": p.topic_name,
                "stance": p.stance,
                "title": p.title,
                "argument": p.argument,
                "created_at": p.created_at.isoformat(),
                "views": p.views,
            }
            for p in posts
        ]
    }


@router.get("/posts/{post_id}")
async def get_lobby_post(post_id: str):
    """Get a specific lobby post"""
    post = db.get_lobby_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    db.increment_views(post_id)

    return {
        "post": {
            "id": post.id,
            "user_id": post.user_id,
            "username": post.username,
            "topic_id": post.topic_id,
            "topic_name": post.topic_name,
            "stance": post.stance,
            "title": post.title,
            "argument": post.argument,
            "created_at": post.created_at.isoformat(),
            "views": post.views,
            "is_live": post.is_live,
        }
    }


@router.post("/posts")
async def create_lobby_post(
    session_id: str,
    topic_id: str,
    title: str,
    argument: str,
    stance: Stance
):
    """Create a new lobby post"""
    user = db.get_session_user(session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")

    if topic_id not in TOPICS:
        raise HTTPException(status_code=400, detail="Invalid topic")

    topic = TOPICS[topic_id]
    post = db.create_lobby_post(
        user_id=user.id,
        username=user.username,
        topic_id=topic_id,
        topic_name=topic.name,
        stance=stance,
        title=title,
        argument=argument,
    )

    return {"post": post.model_dump()}


@router.post("/posts/{post_id}/join")
async def join_lobby_post(post_id: str, session_id: str):
    """Join a lobby post as opponent"""
    user = db.get_session_user(session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")

    post = db.get_lobby_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if not post.is_live:
        raise HTTPException(status_code=400, detail="This debate is already in progress")

    if post.user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot join your own post")

    # Update post
    db.join_lobby_post(post_id, user.id)

    # Create room for them
    room_id = str(uuid.uuid4())[:8]
    room = {
        "id": room_id,
        "topic_id": post.topic_id,
        "topic_name": post.topic_name,
        "participants": [post.user_id, user.id],
        "status": "active",
        "created_at": post.created_at,
        "messages": [],
        "analysis": None,
        "user_stance": post.stance,
        "opponent_stance": Stance.CON if post.stance == Stance.PRO else Stance.PRO,
    }

    from services.matchmaking import match_service
    match_service.rooms[room_id] = room

    return {
        "room_id": room_id,
        "post": {
            "id": post.id,
            "username": post.username,
            "title": post.title,
            "argument": post.argument,
            "topic_name": post.topic_name,
        }
    }


@router.delete("/posts/{post_id}")
async def leave_lobby(post_id: str, session_id: str):
    """Leave/delete a lobby post"""
    user = db.get_session_user(session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")

    success = db.leave_lobby(post_id, user.id)
    return {"success": success}


@router.get("/online-count")
async def get_online_count():
    """Get count of online users waiting in lobby"""
    posts = db.get_lobby_posts()
    return {"count": len(posts)}
