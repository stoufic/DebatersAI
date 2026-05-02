import uuid
from datetime import datetime
from typing import Dict, List, Optional
from models.schemas import Topic, Stance, RoomStatus


TOPICS: Dict[str, Topic] = {
    "politics": Topic(
        id="politics",
        name="Politics",
        category="Political",
        description="Debate political systems, policies, and governance",
        icon="🏛️",
        pro_claims=[
            "Democracy is the best form of government",
            "Government regulation is necessary for public welfare",
            "Universal healthcare should be provided by the state",
        ],
        con_claims=[
            "Free markets are more efficient than government control",
            "Less government regulation leads to more innovation",
            "Private healthcare provides better quality care",
        ],
    ),
    "philosophy": Topic(
        id="philosophy",
        name="Philosophy",
        category="Philosophical",
        description="Explore fundamental questions about existence and knowledge",
        icon="🧠",
        pro_claims=[
            "Objective moral truths exist",
            "Free will is an illusion determined by physics",
            "Consciousness is more than mere computation",
        ],
        con_claims=[
            "Morality is entirely relative to cultures",
            "We have genuine free will to make choices",
            "Artificial intelligence can achieve consciousness",
        ],
    ),
    "ethics": Topic(
        id="ethics",
        name="Ethics",
        category="Moral",
        description="Discuss ethical dilemmas and moral reasoning",
        icon="⚖️",
        pro_claims=[
            "Euthanasia should be legally permitted",
            "Capital punishment is never justified",
            "Animal testing for medical research is acceptable",
        ],
        con_claims=[
            "Euthanasia fundamentally violates the sanctity of life",
            "Some crimes deserve capital punishment as justice",
            "Animal testing is ethically unacceptable",
        ],
    ),
    "science": Topic(
        id="science",
        name="Science",
        category="Scientific",
        description="Debate scientific theories and technological advances",
        icon="🔬",
        pro_claims=[
            "Genetic modification of humans should be allowed",
            "Space exploration is worth the investment",
            "Nuclear energy is safe and necessary",
        ],
        con_claims=[
            "Genetic modification crosses ethical boundaries",
            "Space exploration funding should go to earthly problems",
            "Nuclear energy is too dangerous to rely on",
        ],
    ),
    "religion": Topic(
        id="religion",
        name="Religion",
        category="Spiritual",
        description="Discuss religious beliefs and secularism",
        icon="⛪",
        pro_claims=[
            "Religious faith provides genuine meaning to life",
            "God exists as described by major religions",
            "Religious education in schools is beneficial",
        ],
        con_claims=[
            "Secularism is the only fair approach in society",
            "atheism is the default position without evidence",
            "Religion has no place in modern education",
        ],
    ),
    "social": Topic(
        id="social",
        name="Social Issues",
        category="Social",
        description="Debate societal challenges and cultural topics",
        icon="👥",
        pro_claims=[
            "Affirmative action is necessary to address inequality",
            "Universal basic income can solve poverty",
            "Immigration strengthens economies and cultures",
        ],
        con_claims=[
            "Affirmative action is reverse discrimination",
            "Universal basic income discourages work",
            "Immigration controls are necessary for security",
        ],
    ),
    "technology": Topic(
        id="technology",
        name="Technology",
        category="Tech",
        description="Debate technological progress and its impact",
        icon="💻",
        pro_claims=[
            "Social media has net positive effects on society",
            "AI will create more jobs than it displaces",
            "Tech companies should be heavily regulated",
        ],
        con_claims=[
            "Social media is harmful to mental health",
            "AI will cause widespread job displacement",
            "Government regulation stifles innovation",
        ],
    ),
    "culture": Topic(
        id="culture",
        name="Culture",
        category="Cultural",
        description="Discuss arts, media, and cultural phenomena",
        icon="🎭",
        pro_claims=[
            "Cancel culture protects marginalized groups",
            "Art should be controversial and push boundaries",
            "Cultural appropriation is a legitimate concern",
        ],
        con_claims=[
            "Cancel culture silences legitimate debate",
            "Some art should remain within traditional bounds",
            "Cultural appropriation claims are often overstated",
        ],
    ),
}


class MatchmakingService:
    def __init__(self):
        self.queues: Dict[str, Dict[str, dict]] = {
            topic_id: {} for topic_id in TOPICS.keys()
        }
        self.rooms: Dict[str, dict] = {}

    def find_match(self, user_id: str, topic_id: str, stance: Stance) -> dict:
        queue = self.queues[topic_id]

        opposite_stance = Stance.CON if stance == Stance.PRO else Stance.PRO

        for waiting_id, data in queue.items():
            if data["stance"] == opposite_stance:
                room_id = str(uuid.uuid4())[:8]
                room = {
                    "id": room_id,
                    "topic_id": topic_id,
                    "topic_name": TOPICS[topic_id].name,
                    "participants": [waiting_id, user_id],
                    "status": RoomStatus.ACTIVE,
                    "created_at": datetime.now(),
                    "messages": [],
                    "analysis": None,
                    "user_stance": opposite_stance,
                    "opponent_stance": stance,
                }
                self.rooms[room_id] = room
                del queue[waiting_id]
                return {"matched": True, "room_id": room_id}

        queue[user_id] = {
            "user_id": user_id,
            "topic_id": topic_id,
            "stance": stance,
            "joined_at": datetime.now(),
        }
        position = len(queue)
        return {
            "matched": False,
            "position": position,
            "estimated_wait": position * 30,
        }

    def cancel_match(self, user_id: str) -> bool:
        for queue in self.queues.values():
            if user_id in queue:
                del queue[user_id]
                return True
        return False

    def get_room(self, room_id: str) -> Optional[dict]:
        return self.rooms.get(room_id)

    def get_user_room(self, user_id: str) -> Optional[dict]:
        for room in self.rooms.values():
            if user_id in room["participants"]:
                return room
        return None


match_service = MatchmakingService()
