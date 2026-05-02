from fastapi import APIRouter, HTTPException
from models.schemas import MembershipRequest
from services.database import db


router = APIRouter(prefix="/api/membership", tags=["membership"])


@router.get("/status")
async def get_membership_status(x_session_id: str):
    """Get current membership status"""
    user = db.get_session_user(x_session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")

    tier = db.check_membership(user.id)
    can_use = db.can_use_feature(user.id, "debate")

    return {
        "tier": tier,
        "membership_expires": user.membership_expires.isoformat() if user.membership_expires else None,
        "can_use_feature": can_use,
        "guest_calls_remaining": user.guest_calls_remaining if user.is_guest else None,
        "debates_completed": user.debates_completed,
        "pricing": {
            "premium": {
                "monthly": 10.00,
                "features": [
                    "Unlimited debates",
                    "Priority matching",
                    "Advanced analysis",
                    "No ads"
                ]
            },
            "trial": {
                "duration": "7 days",
                "features": [
                    "Unlimited debates",
                    "Full analysis access"
                ]
            }
        }
    }


@router.post("/trial")
async def start_trial(x_session_id: str):
    """Start 7-day free trial"""
    user = db.get_session_user(x_session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")

    if user.membership_tier == "trial":
        raise HTTPException(status_code=400, detail="Trial already started")

    if user.membership_tier == "premium":
        raise HTTPException(status_code=400, detail="Already a premium member")

    success = db.activate_trial(user.id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to start trial")

    return {
        "tier": "trial",
        "expires": user.membership_expires.isoformat(),
        "message": "7-day free trial started! Enjoy unlimited access."
    }


@router.post("/upgrade")
async def upgrade_membership(x_session_id: str, request: MembershipRequest):
    """Upgrade to premium ($10/month)"""
    user = db.get_session_user(x_session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")

    # In production, this would:
    # 1. Validate payment token with Stripe
    # 2. Create subscription
    # 3. Update user tier

    # For demo, we just upgrade
    success = db.upgrade_membership(user.id, "premium")

    return {
        "tier": "premium",
        "message": "Upgraded to Premium! $10/month.",
        "next_billing": "In 30 days"
    }


@router.post("/cancel")
async def cancel_membership(x_session_id: str):
    """Cancel premium subscription"""
    user = db.get_session_user(x_session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")

    if user.membership_tier != "premium":
        raise HTTPException(status_code=400, detail="No premium subscription to cancel")

    # In production, cancel Stripe subscription
    user.membership_tier = "free"
    user.membership_expires = None

    return {
        "tier": "free",
        "message": "Premium cancelled. You'll keep access until end of billing period."
    }


@router.get("/features")
async def get_features():
    """Get feature comparison"""
    return {
        "features": {
            "free": {
                "name": "Free",
                "price": 0,
                "calls": 10,
                "can_create_lobby": False,
                "can_join_lobby": True,
                "unlimited_debates": False,
                "advanced_analysis": False,
                "priority_matching": False,
            },
            "trial": {
                "name": "7-Day Trial",
                "price": 0,
                "calls": "Unlimited",
                "can_create_lobby": True,
                "can_join_lobby": True,
                "unlimited_debates": True,
                "advanced_analysis": True,
                "priority_matching": False,
            },
            "premium": {
                "name": "Premium",
                "price": 10,
                "billing": "Monthly",
                "calls": "Unlimited",
                "can_create_lobby": True,
                "can_join_lobby": True,
                "unlimited_debates": True,
                "advanced_analysis": True,
                "priority_matching": True,
            }
        }
    }
