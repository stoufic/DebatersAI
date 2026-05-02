from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import websocket, match, analysis, auth, lobby, membership
import uvicorn

app = FastAPI(
    title="Debaters.AI API",
    description="Backend API for Debaters.AI - Connect debaters with opposing views",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(websocket.router)
app.include_router(match.router)
app.include_router(analysis.router)
app.include_router(auth.router)
app.include_router(lobby.router)
app.include_router(membership.router)


@app.get("/")
async def root():
    return {
        "name": "Debaters.AI API",
        "version": "2.0.0",
        "status": "running",
        "features": [
            "User authentication",
            "Preferences system",
            "Lobby chat rooms",
            "Local AI pipeline",
            "Membership system"
        ]
    }


@app.get("/api/health")
async def health():
    return {"status": "healthy", "ai": "local"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
