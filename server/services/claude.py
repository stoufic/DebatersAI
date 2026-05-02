import os
import aiohttp
from typing import Optional
import json


class ClaudeProxyClient:
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "")

    async def analyze_text(
        self, text: str, context: Optional[str] = None
    ) -> dict:
        prompt = f"""Analyze this debate text and provide:
1. Topic identification (main topic and sub-topics)
2. Sentiment analysis (positive/negative/neutral, -1 to 1 scale)
3. Key claims extraction (the main arguments being made)
4. Argument flow (how the argument is structured)

Text to analyze:
{text}

{f'Context: {context}' if context else ''}

Respond in JSON format:
{{
  "topic": "main topic",
  "sub_topics": ["sub-topic1", "sub-topic2"],
  "sentiment": 0.0,
  "key_claims": [
    {{"claim": "text", "stance": "pro/con", "importance": 0.0-1.0}}
  ],
  "argument_flow": ["step1", "step2", ...]
}}"""

        return await self._call_claude(prompt)

    async def fact_check(self, claim: str) -> dict:
        prompt = f"""Fact-check this claim. Determine if it's verified (supported by evidence), disputed (controversial/mixed evidence), or unverified (no strong evidence either way).

Claim: "{claim}"

Respond in JSON format:
{{
  "verdict": "verified|disputed|unverified",
  "confidence": 0.0-1.0,
  "sources": ["source1", "source2"],
  "explanation": "brief explanation"
}}"""

        return await self._call_claude(prompt)

    async def analyze_transcript(self, text: str) -> dict:
        prompt = f"""Analyze this full debate transcript and provide a comprehensive summary:

1. Overall topic and sub-topics
2. Sentiment for each participant (positive/negative, -1 to 1)
3. All key claims from both sides
4. Emotional moments (points where emotion ran high)
5. Argument progression

Transcript:
{text}

Respond in JSON format:
{{
  "topic": "main topic",
  "sub_topics": ["sub1", "sub2"],
  "sentiment_user": 0.0,
  "sentiment_opponent": 0.0,
  "key_claims": [
    {{"claim": "text", "stance": "pro|con", "topic": "sub-topic", "importance": 0.0-1.0}}
  ],
  "argument_flow": ["point1", "point2", ...],
  "emotional_moments": [
    {{"text": "quote", "intensity": 0.0-1.0, "participant": "user|opponent"}}
  ]
}}"""

        return await self._call_claude(prompt)

    async def _call_claude(self, prompt: str) -> dict:
        if not self.api_key:
            return self._mock_response(prompt)

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1024,
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=aiohttp.ClientTimeout(total=30),
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    content = data.get("content", [])
                    if content and isinstance(content, list):
                        text = content[0].get("text", "{}")
                        try:
                            return json.loads(text)
                        except json.JSONDecodeError:
                            return self._parse_json_from_text(text)
                return self._mock_response(prompt)

    def _mock_response(self, prompt: str) -> dict:
        if "fact-check" in prompt.lower():
            return {
                "verdict": "unverified",
                "confidence": 0.5,
                "sources": [],
                "explanation": "Unable to verify this claim with available data.",
            }
        elif "transcript" in prompt.lower():
            return {
                "topic": "General Debate",
                "sub_topics": ["Discussion"],
                "sentiment_user": 0.0,
                "sentiment_opponent": 0.0,
                "key_claims": [],
                "argument_flow": [],
                "emotional_moments": [],
            }
        else:
            return {
                "topic": "General Discussion",
                "sub_topics": [],
                "sentiment": 0.0,
                "key_claims": [],
                "argument_flow": [],
            }

    def _parse_json_from_text(self, text: str) -> dict:
        import re

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        return {}


claude_client = ClaudeProxyClient()
