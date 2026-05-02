from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class Stance(str, Enum):
    PRO = "pro"
    CON = "con"


class RoomStatus(str, Enum):
    WAITING = "waiting"
    ACTIVE = "active"
    ENDED = "ended"


class User(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    password: str = ""
    created_at: datetime
    is_guest: bool = False
    guest_calls_remaining: int = 10
    membership_tier: str = "free"  # free, trial, premium
    membership_expires: Optional[datetime] = None

    # Preferences
    political_views: Optional[str] = None
    political_scale: Optional[str] = None  # 1-10 scale
    philosophical_views: Optional[str] = None
    religious_views: Optional[str] = None
    ethical_stances: Dict[str, str] = {}
    bio: Optional[str] = None
    topics_of_interest: List[str] = []

    # Stats
    debates_completed: int = 0
    member_since: Optional[datetime] = None


class GuestSession(BaseModel):
    id: str
    created_at: datetime
    calls_used: int = 0
    max_calls: int = 10


class Topic(BaseModel):
    id: str
    name: str
    category: str
    description: str
    icon: str
    pro_claims: List[str] = []
    con_claims: List[str] = []


class Message(BaseModel):
    id: str
    user_id: str
    content: str
    timestamp: datetime
    stance: Stance
    is_voice: bool = False


class FactCheck(BaseModel):
    claim: str
    verdict: str  # "verified" | "disputed" | "unverified"
    confidence: float
    sources: List[str] = []
    explanation: str


class KeyClaim(BaseModel):
    claim: str
    stance: Stance
    topic: str
    importance: float


class Analysis(BaseModel):
    topic: str
    sub_topics: List[str] = []
    sentiment_user: float
    sentiment_opponent: float
    key_claims: List[KeyClaim] = []
    argument_flow: List[str] = []
    emotional_moments: List[dict] = []


class DebateRoom(BaseModel):
    id: str
    topic_id: str
    topic_name: str
    participants: List[str] = []
    status: RoomStatus
    created_at: datetime
    messages: List[Message] = []
    analysis: Optional[Analysis] = None
    user_stance: Optional[Stance] = None
    opponent_stance: Optional[Stance] = None


class LobbyPost(BaseModel):
    id: str
    user_id: str
    username: str
    topic_id: str
    topic_name: str
    stance: Stance
    title: str
    argument: str
    created_at: datetime
    is_live: bool = True
    opponent_id: Optional[str] = None
    views: int = 0


class MatchRequest(BaseModel):
    topic_id: str
    stance: Stance
    match_type: str = "random"  # random or lobby


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class PreferencesRequest(BaseModel):
    political_views: Optional[str] = None
    political_scale: Optional[str] = None
    philosophical_views: Optional[str] = None
    religious_views: Optional[str] = None
    ethical_stances: Optional[Dict[str, str]] = None
    bio: Optional[str] = None
    topics_of_interest: Optional[List[str]] = None


class MembershipRequest(BaseModel):
    tier: str = "premium"
    payment_token: Optional[str] = None  # In production, this would be Stripe token
