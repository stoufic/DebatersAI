import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from models.schemas import User, GuestSession, LobbyPost, Topic, Stance


class DatabaseService:
    def __init__(self):
        self.users: Dict[str, User] = {}
        self.sessions: Dict[str, str] = {}  # session_token -> user_id
        self.guest_sessions: Dict[str, GuestSession] = {}
        self.lobby_posts: Dict[str, LobbyPost] = {}

    # ============ USER MANAGEMENT ============

    def create_user(self, username: str, email: str, password: str) -> User:
        user_id = str(uuid.uuid4())[:12]
        hashed = self._hash_password(password)
        user = User(
            id=user_id,
            username=username,
            email=email,
            password=hashed,
            created_at=datetime.now(),
            is_guest=False,
            guest_calls_remaining=10,
            membership_tier="trial",  # Start with trial
            membership_expires=datetime.now() + timedelta(days=7),
            member_since=datetime.now(),
        )
        self.users[user_id] = user
        return user

    def create_guest(self) -> tuple[User, GuestSession]:
        user_id = str(uuid.uuid4())[:12]
        session_id = str(uuid.uuid4())[:16]
        username = f"Guest_{user_id[:6]}"

        user = User(
            id=user_id,
            username=username,
            password="",
            created_at=datetime.now(),
            is_guest=True,
            guest_calls_remaining=10,
            membership_tier="free",
        )
        guest_session = GuestSession(
            id=session_id,
            created_at=datetime.now(),
            calls_used=0,
            max_calls=10,
        )

        self.users[user_id] = user
        self.guest_sessions[session_id] = guest_session
        self.sessions[session_id] = user_id

        return user, guest_session

    def get_user(self, user_id: str) -> Optional[User]:
        return self.users.get(user_id)

    def get_user_by_username(self, username: str) -> Optional[User]:
        for user in self.users.values():
            if user.username == username:
                return user
        return None

    def authenticate(self, username: str, password: str) -> Optional[User]:
        user = self.get_user_by_username(username)
        if user and self._hash_password(password) == user.password:
            return user
        return None

    def create_session(self, user_id: str) -> str:
        session_id = str(uuid.uuid4())[:16]
        self.sessions[session_id] = user_id
        return session_id

    def get_session_user(self, session_id: str) -> Optional[User]:
        user_id = self.sessions.get(session_id)
        if user_id:
            return self.users.get(user_id)
        return None

    def _hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

    # ============ PREFERENCES ============

    def update_preferences(self, user_id: str, prefs: dict) -> Optional[User]:
        user = self.users.get(user_id)
        if not user:
            return None

        for key, value in prefs.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)

        return user

    # ============ GUEST CALLS ============

    def use_guest_call(self, user_id: str) -> bool:
        user = self.users.get(user_id)
        if not user or not user.is_guest:
            return False
        if user.guest_calls_remaining <= 0:
            return False
        user.guest_calls_remaining -= 1
        return True

    def get_guest_calls(self, user_id: str) -> int:
        user = self.users.get(user_id)
        return user.guest_calls_remaining if user else 0

    # ============ MEMBERSHIP ============

    def check_membership(self, user_id: str) -> str:
        user = self.users.get(user_id)
        if not user:
            return "free"

        if user.membership_expires and user.membership_expires < datetime.now():
            user.membership_tier = "free"
            user.membership_expires = None

        return user.membership_tier

    def activate_trial(self, user_id: str) -> bool:
        user = self.users.get(user_id)
        if not user:
            return False
        user.membership_tier = "trial"
        user.membership_expires = datetime.now() + timedelta(days=7)
        return True

    def upgrade_membership(self, user_id: str, tier: str = "premium") -> bool:
        user = self.users.get(user_id)
        if not user:
            return False
        user.membership_tier = tier
        user.membership_expires = None  # In production, set to billing period
        return True

    def can_use_feature(self, user_id: str, feature: str) -> bool:
        tier = self.check_membership(user_id)

        if tier in ("trial", "premium"):
            return True

        # Free tier - check guest calls
        user = self.users.get(user_id)
        if user and user.is_guest:
            return user.guest_calls_remaining > 0

        return False

    # ============ LOBBY SYSTEM ============

    def create_lobby_post(
        self,
        user_id: str,
        username: str,
        topic_id: str,
        topic_name: str,
        stance: Stance,
        title: str,
        argument: str,
    ) -> LobbyPost:
        post_id = str(uuid.uuid4())[:12]
        post = LobbyPost(
            id=post_id,
            user_id=user_id,
            username=username,
            topic_id=topic_id,
            topic_name=topic_name,
            stance=stance,
            title=title,
            argument=argument,
            created_at=datetime.now(),
            is_live=True,
        )
        self.lobby_posts[post_id] = post
        return post

    def get_lobby_posts(self, topic_id: Optional[str] = None) -> List[LobbyPost]:
        posts = [p for p in self.lobby_posts.values() if p.is_live]
        if topic_id:
            posts = [p for p in posts if p.topic_id == topic_id]
        return sorted(posts, key=lambda x: x.created_at, reverse=True)

    def get_lobby_post(self, post_id: str) -> Optional[LobbyPost]:
        return self.lobby_posts.get(post_id)

    def join_lobby_post(self, post_id: str, opponent_id: str) -> bool:
        post = self.lobby_posts.get(post_id)
        if not post or not post.is_live or post.opponent_id:
            return False
        post.opponent_id = opponent_id
        post.is_live = False
        return True

    def leave_lobby(self, post_id: str, user_id: str) -> bool:
        post = self.lobby_posts.get(post_id)
        if not post:
            return False
        if post.user_id == user_id:
            del self.lobby_posts[post_id]
        else:
            post.opponent_id = None
        return True

    def increment_views(self, post_id: str) -> None:
        post = self.lobby_posts.get(post_id)
        if post:
            post.views += 1

    # ============ STATS ============

    def increment_debates(self, user_id: str) -> None:
        user = self.users.get(user_id)
        if user:
            user.debates_completed += 1


db = DatabaseService()
