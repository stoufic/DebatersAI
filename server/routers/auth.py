from fastapi import APIRouter, HTTPException
from models.schemas import RegisterRequest, LoginRequest, PreferencesRequest, User
from services.database import db
import uuid


router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/register")
async def register(request: RegisterRequest):
    # Check if username exists
    if db.get_user_by_username(request.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    user = db.create_user(request.username, request.email, request.password)
    session_id = db.create_session(user.id)

    return {
        "user": user.model_dump(),
        "session_id": session_id,
        "message": "Account created! You have a 7-day free trial."
    }


@router.post("/login")
async def login(request: LoginRequest):
    user = db.authenticate(request.username, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    session_id = db.create_session(user.id)
    return {
        "user": user.model_dump(),
        "session_id": session_id
    }


@router.post("/guest")
async def guest_login():
    """Create a guest session - 10 free calls before blocking"""
    user, session = db.create_guest()

    return {
        "user": user.model_dump(),
        "session_id": session.id,
        "guest_calls_remaining": user.guest_calls_remaining,
        "message": "Guest access: 10 free calls remaining"
    }


@router.get("/me")
async def get_current_user(x_session_id: str):
    user = db.get_session_user(x_session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")

    membership_status = db.check_membership(user.id)
    can_use = db.can_use_feature(user.id, "debate")

    return {
        "user": user.model_dump(),
        "membership_status": membership_status,
        "can_use_feature": can_use,
        "guest_calls_remaining": user.guest_calls_remaining if user.is_guest else None
    }


@router.put("/preferences")
async def update_preferences(x_session_id: str, request: PreferencesRequest):
    user = db.get_session_user(x_session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")

    prefs = request.model_dump(exclude_none=True)
    updated_user = db.update_preferences(user.id, prefs)

    return {
        "user": updated_user.model_dump(),
        "message": "Preferences updated"
    }


@router.get("/preferences")
async def get_preferences(x_session_id: str):
    user = db.get_session_user(x_session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")

    return {
        "political_views": user.political_views,
        "political_scale": user.political_scale,
        "philosophical_views": user.philosophical_views,
        "religious_views": user.religious_views,
        "ethical_stances": user.ethical_stances,
        "bio": user.bio,
        "topics_of_interest": user.topics_of_interest,
    }
