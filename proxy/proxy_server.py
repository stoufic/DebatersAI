#!/usr/bin/env python3
"""
Claude Proxy Server
Forwards requests to Anthropic API while protecting API keys.
Run on port 8080.
"""

import os
import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import uvicorn

app = FastAPI(title="Claude Proxy", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_BASE = "https://api.anthropic.com/v1"


@app.post("/v1/messages")
async def proxy_messages(request: Request):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    body = await request.json()

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{ANTHROPIC_BASE}/messages",
            headers={
                "x-api-key": API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json=body,
        )

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()


@app.get("/v1/models")
async def proxy_models():
    return {
        "models": [
            {"id": "claude-sonnet-4-20250514", "name": "Claude Sonnet 4"},
            {"id": "claude-opus-4-20250514", "name": "Claude Opus 4"},
            {"id": "claude-haiku-4-20250514", "name": "Claude Haiku 4"},
        ]
    }


@app.get("/health")
async def health():
    return {"status": "ok", "api_key_configured": bool(API_KEY)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
