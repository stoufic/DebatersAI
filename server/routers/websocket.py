from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import uuid
from datetime import datetime

from models.schemas import Message, Stance, RoomStatus
from services.matchmaking import match_service
from services.ai_pipeline import ai_pipeline
from services.database import db


router = APIRouter(prefix="/api/ws", tags=["websocket"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.user_rooms: Dict[str, str] = {}  # user_id -> room_id

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        self.user_rooms[user_id] = room_id

    def disconnect(self, websocket: WebSocket, room_id: str, user_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        if user_id in self.user_rooms:
            del self.user_rooms[user_id]

    async def broadcast(self, room_id: str, message: dict, exclude: WebSocket = None):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection != exclude:
                    try:
                        await connection.send_json(message)
                    except:
                        pass

    async def send_to(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except:
            pass


manager = ConnectionManager()


@router.websocket("/room/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str = None):
    if not user_id:
        user_id = str(uuid.uuid4())[:8]

    await manager.connect(websocket, room_id, user_id)

    try:
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "room_id": room_id,
        })

        room = match_service.get_room(room_id)
        if room:
            await websocket.send_json({
                "type": "room_info",
                "topic": room["topic_name"],
                "user_stance": room["user_stance"],
                "opponent_stance": room["opponent_stance"],
            })

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "message":
                content = data.get("content", "")
                is_voice = data.get("is_voice", False)
                stance = data.get("stance", "pro")

                message = Message(
                    id=str(uuid.uuid4())[:8],
                    user_id=user_id,
                    content=content,
                    timestamp=datetime.now(),
                    stance=Stance(stance),
                    is_voice=is_voice,
                )

                room = match_service.get_room(room_id)
                if room:
                    room["messages"].append(message.model_dump())

                # Broadcast message
                await manager.broadcast(room_id, {
                    "type": "message",
                    "message": message.model_dump(),
                }, exclude=websocket)

                # Run local AI analysis on longer messages
                if len(content) > 20:
                    try:
                        # Check guest calls
                        if not db.can_use_feature(user_id, "debate"):
                            await websocket.send_json({
                                "type": "error",
                                "message": "Guest calls exhausted",
                            })
                        else:
                            # Use local AI pipeline
                            analysis_result = ai_pipeline.analyze_text(content)
                            await websocket.send_json({
                                "type": "analysis",
                                "analysis": analysis_result,
                                "message_id": message.id,
                            })

                            fact_check_result = ai_pipeline.fact_check(content)
                            await manager.broadcast(room_id, {
                                "type": "fact_check",
                                "fact_check": fact_check_result,
                                "message_id": message.id,
                            })
                    except Exception as e:
                        print(f"Analysis error: {e}")

            elif msg_type == "end_debate":
                await manager.broadcast(room_id, {
                    "type": "debate_ended",
                    "reason": data.get("reason", "User ended debate"),
                })
                room = match_service.get_room(room_id)
                if room:
                    room["status"] = RoomStatus.ENDED
                # Increment debate stats for both users
                for uid in room.get("participants", []):
                    db.increment_debates(uid)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id, user_id)
        await manager.broadcast(room_id, {
            "type": "user_disconnected",
            "user_id": user_id,
        })
