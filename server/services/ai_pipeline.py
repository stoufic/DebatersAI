"""
Local AI Pipeline for Debaters.AI
Provides NLP-based analysis without external API dependencies.
Features: Sentiment analysis, claim extraction, fact-checking, topic detection
"""

import re
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class Claim:
    text: str
    stance: str  # pro, con, neutral
    claim_type: str  # factual, opinion, value
    topics: List[str]
    confidence: float
    is_verifiable: bool


@dataclass
class SentimentResult:
    score: float  # -1 to 1
    label: str  # positive, negative, neutral
    emotions: List[str]
    intensity: float  # 0 to 1


class LocalAIPipeline:
    """
    Local AI pipeline for debate analysis.
    Uses rule-based NLP with pattern matching and keyword analysis.
    No external API required.
    """

    # ============ SENTIMENT ANALYSIS ============

    POSITIVE_WORDS = {
        # Strong positive
        "excellent", "amazing", "wonderful", "fantastic", "love", "best", "perfect",
        "outstanding", "brilliant", "genius", "superb", "magnificent",
        # Moderate positive
        "good", "great", "nice", "happy", "glad", "pleased", "joy", "success",
        "successful", "effective", "beneficial", "helpful", "useful",
        # Mild positive
        "fair", "reasonable", "acceptable", "okay", "decent", "proper",
        # Agreement words
        "agree", "correct", "right", "true", "accurate", "valid", "sound",
        "logical", "rational", "reasonable", "justified",
    }

    NEGATIVE_WORDS = {
        # Strong negative
        "terrible", "awful", "horrible", "hate", "worst", "disaster", " catastrophe",
        "appalling", "atrocious", "abysmal", "dreadful",
        # Moderate negative
        "bad", "wrong", "poor", "sad", "angry", "failed", "failure", "wrong",
        "incorrect", "false", "invalid", "harmful", "dangerous", "damaging",
        # Mild negative
        "concerning", "troubling", "worrying", "unfortunate", "disappointing",
        # Disagreement words
        "disagree", "incorrect", "false", "wrong", "mistaken", "invalid",
        "unreasonable", "irrational", "illogical", "unsound",
    }

    INTENSIFIERS = {
        "extremely": 1.5, "very": 1.4, "really": 1.3, "quite": 1.2,
        "somewhat": 0.8, "slightly": 0.6, "a little": 0.5,
    }

    NEGATORS = {"not", "no", "never", "neither", "nor", "none", "don't", "doesn't",
                "didn't", "won't", "wouldn't", "couldn't", "shouldn't", "isn't", "aren't"}

    EMOTION_KEYWORDS = {
        "anger": ["angry", "furious", "outraged", "livid", "rage", "frustrated", "annoyed"],
        "fear": ["afraid", "scared", "terrified", "worried", "anxious", "concerned", "nervous"],
        "joy": ["happy", "joyful", "delighted", "pleased", "excited", "thrilled", "glad"],
        "sadness": ["sad", "unhappy", "depressed", "disappointed", "upset", "miserable", "gloomy"],
        "surprise": ["surprised", "amazed", "shocked", "astonished", "stunned", "astonishing"],
        "disgust": ["disgusted", "repulsed", "revolted", "sickened", "gross", "disgusting"],
        "contempt": ["despise", "scorn", "contempt", "disdain", "disrespect", "mock"],
        "pride": ["proud", "pride", "accomplished", "triumphant", "confident", "superior"],
    }

    # ============ FACT-CHECKING PATTERNS ============

    FACT_PATTERNS = [
        # Statistical claims
        r"(\d+%|\d+\s*(million|billion|thousand|percent))",
        r"(studies?|research|data|evidence)\s+(shows?|suggests?|indicates?)",
        r"(according to|in|on)\s+(the\s+)?(research|study|report|data)",
        # Expert/Authority claims
        r"(experts?|scientists?|researchers?|doctors?|professionals?)\s+(say|state|believe|agree)",
        r"(studies?|trials?|research)\s+(have\s+)?(found|shown|demonstrated|proven)",
        # Common knowledge patterns
        r"(history|history shows?|historically)",
        r"(proven|proven\s+to\s+be|is\s+known\s+to\s+be)",
    ]

    VERIFICATION_KEYWORDS = {
        "verified": ["confirmed", "proven", "established", "verified", "documented", "demonstrated"],
        "disputed": ["disputed", "controversial", "debated", "questionable", "uncertain", "unclear"],
        "unverified": ["alleged", "claims", "supposedly", "apparently", "reportedly", "purported"],
    }

    # Common factual claims for local verification
    KNOWN_FACTS: Dict[str, Tuple[str, float, List[str]]] = {
        # (claim_pattern, verdict, confidence, sources)
        "climate change": ("verified", 0.95, ["IPCC Reports", "97% consensus study"]),
        "vaccines are safe": ("verified", 0.92, ["WHO", "CDC", "Medical consensus"]),
        "democracy": ("disputed", 0.6, ["Political theory debate"]),
        "free market": ("disputed", 0.5, ["Economic debate"]),
        "earth is round": ("verified", 0.99, ["Science consensus"]),
        "evolution": ("verified", 0.95, ["Scientific consensus"]),
        "gravity": ("verified", 0.99, ["Scientific consensus"]),
    }

    # ============ CLAIM EXTRACTION ============

    CLAIM_INDICATORS = {
        "factual": [
            r"^the\s+(fact|truth|reality)\s+is\s+",
            r"^(studies?|research|data|evidence)\s+",
            r"(shows?|proves?|demonstrates?|confirms?)",
            r"^(statistics?|numbers?|figures?|percentages?)\s+",
        ],
        "opinion": [
            r"^i\s+(believe|think|feel|guess|suppose)",
            r"^in\s+my\s+(opinion|view|judgment|mind)",
            r"^it\s+seems\s+to\s+me",
            r"^personally",
            r"^i\s+(would\s+)?(say|argue|contend|claim)",
        ],
        "value": [
            r"^(right|wrong|good|bad|better|worse)",
            r"^(moral|ethical|just|unjust)",
            r"^(should|shouldn't|ought|must)",
            r"^(important|critical|essential|vital)",
        ],
    }

    # ============ TOPIC DETECTION ============

    TOPIC_KEYWORDS = {
        "politics": {
            "government": ["government", "state", "policy", "politics", "political", "law", "legislation", "congress", "parliament", "democracy", "republic", "monarchy"],
            "economics": ["economy", "economic", "market", "capitalism", "socialism", "trade", "tax", "fiscal", "monetary", "gdp", "jobs", "employment", "wage", "inflation"],
            "immigration": ["immigration", "immigrant", "border", "migration", "refugee", "asylum", "citizen", "visa"],
            "healthcare": ["healthcare", "medical", "hospital", "insurance", "medicare", "medicaid", "health", "doctor", "treatment"],
        },
        "philosophy": {
            "ethics": ["moral", "ethics", "right", "wrong", "good", "evil", "virtue", "vice", "duty", "obligation"],
            "metaphysics": ["reality", "existence", "being", "universe", "consciousness", "soul", "spirit", "mind", "body"],
            "epistemology": ["knowledge", "truth", "belief", "evidence", "reason", "proof", "certainty", "skepticism"],
            "logic": ["logic", "reasoning", "argument", "premise", "conclusion", "deduction", "induction"],
        },
        "religion": {
            "theism": ["god", "faith", "belief", "religion", "spiritual", "creator", "worship", "prayer", "soul"],
            "atheism": ["atheist", "atheism", "secular", "reason", "evidence", "science"],
            "comparative": ["christian", "islam", "jewish", "hindu", "buddhist", "bible", "quran", "torah"],
        },
        "science": {
            "climate": ["climate", "environment", "carbon", "emissions", "warming", "pollution", "sustainability"],
            "technology": ["ai", "technology", "digital", "computer", "internet", "automation", "robotics"],
            "medicine": ["medicine", "medical", "treatment", "drug", "therapy", "vaccine", "cure"],
            "space": ["space", "cosmos", "universe", "planet", "mars", "moon", "nasa", "exploration"],
        },
        "social": {
            "equality": ["equality", "inequality", "discrimination", "racism", "sexism", "prejudice", "bias"],
            "justice": ["justice", "rights", "law", "court", "prison", "crime", "legal", "police"],
            "education": ["education", "school", "university", "learning", "teaching", "student", "teacher"],
            "family": ["family", "marriage", "children", "parent", "parenting", "divorce", "traditional"],
        },
        "culture": {
            "arts": ["art", "music", "film", "culture", "entertainment", "creative", "artist"],
            "media": ["media", "news", "journalism", "press", "social media", "information"],
            "identity": ["identity", "culture", "tradition", "heritage", "values", "norms"],
        },
    }

    # ============ MAIN ANALYSIS METHODS ============

    def analyze_sentiment(self, text: str) -> SentimentResult:
        """Analyze sentiment of text, returns score from -1 to 1"""
        words = re.findall(r'\b\w+\b', text.lower())
        if not words:
            return SentimentResult(0.0, "neutral", [], 0.0)

        pos_count = 0
        neg_count = 0
        total_count = 0
        intensifier = 1.0
        negated = False
        emotions: List[str] = []

        for i, word in enumerate(words):
            # Check for intensifiers
            if word in self.INTENSIFIERS:
                intensifier = self.INTENSIFIERS[word]
                continue

            # Check for negators
            if word in self.NEGATORS:
                negated = True
                continue

            # Check emotion keywords
            for emotion, keywords in self.EMOTION_KEYWORDS.items():
                if word in keywords and emotion not in emotions:
                    emotions.append(emotion)

            if word in self.POSITIVE_WORDS:
                if negated:
                    neg_count += intensifier
                else:
                    pos_count += intensifier
                total_count += intensifier
            elif word in self.NEGATIVE_WORDS:
                if negated:
                    pos_count += intensifier
                else:
                    neg_count += intensifier
                total_count += intensifier

            # Reset negator after use
            if word not in self.NEGATORS and negated and word not in self.INTENSIFIERS:
                negated = False

        if total_count == 0:
            return SentimentResult(0.0, "neutral", emotions, 0.0)

        # Calculate score
        diff = pos_count - neg_count
        score = diff / total_count

        # Normalize to -1 to 1
        score = max(-1.0, min(1.0, score))

        if score > 0.2:
            label = "positive"
        elif score < -0.2:
            label = "negative"
        else:
            label = "neutral"

        intensity = min(1.0, total_count / 5)

        return SentimentResult(score, label, emotions, intensity)

    def extract_claims(self, text: str) -> List[Claim]:
        """Extract claims from text"""
        claims: List[Claim] = []
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]

        for sentence in sentences:
            sentence_lower = sentence.lower()

            # Determine claim type
            claim_type = "opinion"
            for ct, patterns in self.CLAIM_INDICATORS.items():
                for pattern in patterns:
                    if re.search(pattern, sentence_lower):
                        claim_type = ct
                        break

            # Detect stance
            stance = self._detect_stance(sentence_lower)

            # Detect topics
            topics = self._detect_topics(sentence_lower)

            # Is it verifiable?
            is_verifiable = bool(
                re.search('|'.join(self.FACT_PATTERNS), sentence_lower) or
                len([w for w in self.POSITIVE_WORDS | self.NEGATIVE_WORDS if w in sentence_lower]) > 2
            )

            # Confidence based on claim clarity
            confidence = min(0.95, 0.5 + (len(sentence) / 200) * 0.3)

            claims.append(Claim(
                text=sentence,
                stance=stance,
                claim_type=claim_type,
                topics=topics,
                confidence=confidence,
                is_verifiable=is_verifiable,
            ))

        return claims

    def _detect_stance(self, text: str) -> str:
        """Detect if argument is pro or con"""
        pro_words = ["support", "agree", "correct", "valid", "right", "true", "beneficial", "good", "fair"]
        con_words = ["oppose", "disagree", "wrong", "false", "invalid", "bad", "unfair", "harmful", "incorrect"]

        pro_count = sum(1 for w in pro_words if w in text)
        con_count = sum(1 for w in con_words if w in text)

        if pro_count > con_count:
            return "pro"
        elif con_count > pro_count:
            return "con"
        return "neutral"

    def _detect_topics(self, text: str) -> List[str]:
        """Detect topics in text"""
        detected = []
        for category, topics in self.TOPIC_KEYWORDS.items():
            for topic_name, keywords in topics.items():
                if any(kw in text for kw in keywords):
                    if topic_name not in detected:
                        detected.append(topic_name)
        return detected

    def fact_check(self, claim: str) -> Dict:
        """Fact-check a claim against known facts and patterns"""
        claim_lower = claim.lower()

        # Check against known facts
        for fact_key, (verdict, confidence, sources) in self.KNOWN_FACTS.items():
            if fact_key in claim_lower:
                return {
                    "verdict": verdict,
                    "confidence": confidence,
                    "sources": sources,
                    "explanation": f"Based on established {fact_key} evidence."
                }

        # Check verification patterns
        verdict = "unverified"
        confidence = 0.3

        for v_type, keywords in self.VERIFICATION_KEYWORDS.items():
            if any(kw in claim_lower for kw in keywords):
                verdict = v_type
                confidence = 0.5 if v_type == "disputed" else 0.4
                break

        # Check for statistical claims
        if re.search(r'\d+%|\d+\s*(million|billion|thousand)', claim_lower):
            verdict = "disputed"
            confidence = 0.4

        # Check for expert attribution
        if re.search(r'(experts?|scientists?|studies?|research)\s+(say|believe|claim)', claim_lower):
            verdict = "disputed"
            confidence = 0.45

        return {
            "verdict": verdict,
            "confidence": confidence,
            "sources": ["Local analysis"],
            "explanation": f"Analysis: {verdict} claim requires additional verification."
        }

    def analyze_text(self, text: str, context: Optional[str] = None) -> Dict:
        """Full analysis of text"""
        sentiment = self.analyze_sentiment(text)
        claims = self.extract_claims(text)
        detected_topics = self._detect_topics(text.lower())

        # Get main topic from context or detected
        main_topic = context or (detected_topics[0] if detected_topics else "General")

        return {
            "topic": main_topic,
            "sub_topics": detected_topics,
            "sentiment": sentiment.score,
            "sentiment_label": sentiment.label,
            "key_claims": [
                {
                    "claim": c.text[:100],
                    "stance": c.stance,
                    "importance": c.confidence,
                }
                for c in claims[:5]  # Top 5 claims
            ],
            "argument_flow": [c.claim_type for c in claims[:3]],
            "emotional_tone": sentiment.emotions,
            "is_verifiable": any(c.is_verifiable for c in claims),
        }

    def analyze_transcript(self, text: str) -> Dict:
        """Analyze full debate transcript"""
        if not text.strip():
            return {
                "topic": "General",
                "sub_topics": [],
                "sentiment_user": 0.0,
                "sentiment_opponent": 0.0,
                "key_claims": [],
                "argument_flow": [],
                "emotional_moments": [],
            }

        # Split by speaker (simple heuristic - by lines starting with different patterns)
        lines = text.split('\n')
        user_lines = []
        opponent_lines = []

        # Simple split - in real usage would need proper speaker detection
        for i, line in enumerate(lines):
            if i % 2 == 0:
                user_lines.append(line)
            else:
                opponent_lines.append(line)

        user_text = ' '.join(user_lines)
        opponent_text = ' '.join(opponent_lines)

        user_sentiment = self.analyze_sentiment(user_text)
        opponent_sentiment = self.analyze_sentiment(opponent_text)

        user_claims = self.extract_claims(user_text)
        opponent_claims = self.extract_claims(opponent_text)

        # Emotional moments
        emotional_moments = []
        for claim in user_claims[:2]:
            if claim.claim_type == "value":
                emotional_moments.append({
                    "text": claim.text[:50],
                    "intensity": claim.confidence,
                    "participant": "user"
                })
        for claim in opponent_claims[:2]:
            if claim.claim_type == "value":
                emotional_moments.append({
                    "text": claim.text[:50],
                    "intensity": claim.confidence,
                    "participant": "opponent"
                })

        detected_topics = self._detect_topics(text.lower())

        return {
            "topic": detected_topics[0] if detected_topics else "General",
            "sub_topics": detected_topics,
            "sentiment_user": user_sentiment.score,
            "sentiment_opponent": opponent_sentiment.score,
            "key_claims": [
                {
                    "claim": c.text[:100],
                    "stance": c.stance,
                    "topic": c.topics[0] if c.topics else "general",
                    "importance": c.confidence,
                }
                for c in (user_claims + opponent_claims)[:8]
            ],
            "argument_flow": ["opening", "evidence", "rebuttal", "conclusion"],
            "emotional_moments": emotional_moments,
        }


# Global instance
ai_pipeline = LocalAIPipeline()
