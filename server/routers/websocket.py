from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
import uuid
from datetime import datetime

from services.ai_pipeline import ai_pipeline


router = APIRouter(prefix="/api/ws", tags=["websocket"])


class MatchSocket:
    def __init__(self, websocket: WebSocket, user_id: str, name: str, topic: str, stance: str):
        self.websocket = websocket
        self.user_id = user_id
        self.name = name
        self.topic = topic
        self.stance = stance
        self.room_id: Optional[str] = None
        self.is_host = False


class FaceToFaceManager:
    def __init__(self):
        self.waiting: List[MatchSocket] = []
        self.connected: Dict[str, MatchSocket] = {}
        self.rooms: Dict[str, List[str]] = {}
        self.transcripts: Dict[str, List[dict]] = {}

    async def connect(self, client: MatchSocket):
        await client.websocket.accept()
        self.connected[client.user_id] = client
        await self.enqueue(client)

    async def enqueue(self, client: MatchSocket):
        opponent = self._find_opponent(client)

        if opponent:
            room_id = f"room-{uuid.uuid4().hex[:10]}"
            client.room_id = room_id
            opponent.room_id = room_id
            opponent.is_host = True
            client.is_host = False
            self.rooms[room_id] = [opponent.user_id, client.user_id]
            self.transcripts[room_id] = []

            await self._send(opponent.user_id, {
                "type": "matched",
                "roomId": room_id,
                "peerId": client.user_id,
                "peerName": client.name,
                "peerStance": client.stance,
                "topic": opponent.topic,
                "isHost": True,
            })
            await self._send(client.user_id, {
                "type": "matched",
                "roomId": room_id,
                "peerId": opponent.user_id,
                "peerName": opponent.name,
                "peerStance": opponent.stance,
                "topic": opponent.topic,
                "isHost": False,
            })
        else:
            if client not in self.waiting:
                self.waiting.append(client)
            await self._send(client.user_id, {
                "type": "waiting",
                "position": len(self.waiting),
                "topic": client.topic,
            })

    def _find_opponent(self, client: MatchSocket) -> Optional[MatchSocket]:
        for index, candidate in enumerate(self.waiting):
            same_topic = candidate.topic == client.topic
            opposing_stance = candidate.stance != client.stance
            broad_match = client.topic == "Random broad topic" or candidate.topic == "Random broad topic"
            if (same_topic or broad_match) and opposing_stance:
                return self.waiting.pop(index)
        for index, candidate in enumerate(self.waiting):
            if candidate.stance != client.stance:
                return self.waiting.pop(index)
        return None

    async def relay(self, sender_id: str, payload: dict):
        client = self.connected.get(sender_id)
        if not client or not client.room_id:
            return
        for peer_id in self.rooms.get(client.room_id, []):
            if peer_id != sender_id:
                await self._send(peer_id, {
                    **payload,
                    "from": sender_id,
                })

    async def chat(self, sender_id: str, text: str):
        client = self.connected.get(sender_id)
        if not client or not client.room_id or not text.strip():
            return

        message = {
            "id": f"msg-{uuid.uuid4().hex[:10]}",
            "userId": sender_id,
            "name": client.name,
            "stance": client.stance,
            "text": text.strip(),
            "createdAt": datetime.utcnow().isoformat() + "Z",
        }
        self.transcripts.setdefault(client.room_id, []).append(message)
        await self._broadcast(client.room_id, {"type": "chat", "message": message})

        transcript = "\n".join(
            f"{item['stance'].upper()} {item['name']}: {item['text']}"
            for item in self.transcripts.get(client.room_id, [])[-12:]
        )
        try:
            analysis = ai_pipeline.analyze_transcript(transcript)
            fact_check = ai_pipeline.fact_check(text)
        except Exception as exc:
            analysis = {"topic": client.topic, "error": str(exc)}
            fact_check = None

        await self._broadcast(client.room_id, {
            "type": "analysis",
            "analysis": analysis,
            "factCheck": fact_check,
        })

    async def next_match(self, user_id: str):
        client = self.connected.get(user_id)
        if not client:
            return
        old_room = client.room_id
        if old_room:
            await self._broadcast(old_room, {
                "type": "peer_left",
                "message": "Your debate partner requested the next match.",
            }, exclude=user_id)
            self._remove_from_room(user_id)
        client.room_id = None
        client.is_host = False
        await self.enqueue(client)

    def disconnect(self, user_id: str):
        self.waiting = [client for client in self.waiting if client.user_id != user_id]
        client = self.connected.pop(user_id, None)
        if client and client.room_id:
            self._remove_from_room(user_id)
        return client

    def _remove_from_room(self, user_id: str):
        for room_id, users in list(self.rooms.items()):
            if user_id in users:
                users.remove(user_id)
                if not users:
                    self.rooms.pop(room_id, None)
                    self.transcripts.pop(room_id, None)

    async def _send(self, user_id: str, payload: dict):
        client = self.connected.get(user_id)
        if client:
            await client.websocket.send_json(payload)

    async def _broadcast(self, room_id: str, payload: dict, exclude: Optional[str] = None):
        for user_id in self.rooms.get(room_id, []):
            if user_id != exclude:
                await self._send(user_id, payload)


manager = FaceToFaceManager()


@router.websocket("/match")
async def match_socket(
    websocket: WebSocket,
    user_id: Optional[str] = None,
    name: str = "Debater",
    topic: str = "Random broad topic",
    stance: str = "pro",
):
    user_id = user_id or f"user-{uuid.uuid4().hex[:10]}"
    client = MatchSocket(websocket, user_id, name, topic, stance)
    await manager.connect(client)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type in {"offer", "answer", "ice"}:
                await manager.relay(user_id, data)
            elif msg_type == "chat":
                await manager.chat(user_id, data.get("text", ""))
            elif msg_type == "next":
                await manager.next_match(user_id)
            elif msg_type == "leave":
                break
    except WebSocketDisconnect:
        pass
    finally:
        client = manager.connected.get(user_id)
        room_id = client.room_id if client else None
        if room_id:
            await manager._broadcast(room_id, {
                "type": "peer_left",
                "message": "Your debate partner disconnected.",
            }, exclude=user_id)
        manager.disconnect(user_id)
