# Debaters.AI - Technical Specification v2.0

## 1. Project Overview

**Project Name**: Debaters.AI
**Type**: Real-time debate matching & analysis platform
**Core Functionality**: Connect users with opposing views for debates, with local AI-powered fact-checking, real-time analysis, and optional in-person voice capture mode.
**Target Users**: Anyone interested in debating topics with opposing viewpoints (politics, philosophy, ethics, etc.)

## 2. Architecture

```
DebatersAI/
├── client/                 # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/    # AuthModal, PreferencesModal, MembershipModal
│   │   ├── pages/         # Landing, TopicSelection, WaitingRoom, DebateRoom, InPerson, Lobby
│   │   ├── hooks/         # useDebateStore (Zustand)
│   │   ├── services/      # api.ts, socket.ts
│   │   ├── types/         # TypeScript interfaces
│   │   └── styles/        # Tailwind globals
│   └── package.json
├── server/                 # Python FastAPI backend
│   ├── main.py
│   ├── routers/           # auth, lobby, match, membership, analysis, websocket
│   ├── services/          # database, matchmaking, ai_pipeline
│   └── models/            # pydantic schemas
├── proxy/                  # Claude API proxy (optional)
│   └── proxy_server.py
└── README.md
```

## 3. Frontend Features (v2.0)

### 3.1 Pages
- **Landing** (`/`) - Hero, feature highlights, user badge, CTA buttons
- **Topic Selection** (`/topics`) - Topic grid with stance selection
- **Waiting Room** (`/waiting`) - Matchmaking spinner with queue position
- **Debate Room** (`/room/:roomId`) - Real-time messaging with fact-checks
- **In-Person Mode** (`/inperson`) - Audio capture and live analysis
- **Lobby** (`/lobby`) - Browse/join posted arguments, create debate posts

### 3.2 Modals
- **AuthModal** - Login, Register, Guest mode
- **PreferencesModal** - 4-step wizard for political/philosophical/religious views
- **MembershipModal** - Trial activation, premium upgrade

### 3.3 Mobile Responsiveness
- Responsive text sizes (text-sm to text-4xl)
- Responsive padding (px-4 to px-6)
- Hidden analysis sidebar on mobile
- Proper touch targets (min 44px)
- Flex wrap for stats bars

## 4. Backend Features (v2.0)

### 4.1 Authentication System
- User registration with username/email/password
- User login with session tokens
- Guest sessions (10 free calls)
- Session management via cookies/headers

### 4.2 Preferences System
- Political views (1-10 scale)
- Philosophical views (free text)
- Religious views (free text)
- Bio and topics of interest

### 4.3 Membership System
- **Free tier**: 10 guest calls, can join debates
- **Trial tier**: 7-day free trial, unlimited access
- **Premium tier**: $10/month, unlimited everything
- Feature gating based on tier

### 4.4 Local AI Pipeline
- **Sentiment Analysis**: Keyword-based with intensifiers/negators
- **Claim Extraction**: Pattern matching for factual/opinion/value claims
- **Topic Detection**: Category-based keyword matching
- **Fact-Checking**: Known facts database + pattern-based verification
- **No external API required**

### 4.5 Lobby System
- Create debate posts with title/argument/stance
- Browse live posts by topic
- Join posts as opponent
- View count tracking
- Real-time post list updates

### 4.6 API Endpoints

#### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/guest` - Guest session
- `GET /api/auth/me` - Current user
- `PUT /api/auth/preferences` - Update preferences
- `GET /api/auth/preferences` - Get preferences

#### Lobby
- `GET /api/lobby/posts` - List posts
- `GET /api/lobby/posts/:id` - Single post
- `POST /api/lobby/posts` - Create post
- `POST /api/lobby/posts/:id/join` - Join post
- `DELETE /api/lobby/posts/:id` - Leave post
- `GET /api/lobby/online-count` - Online users count

#### Membership
- `GET /api/membership/status` - Current status
- `POST /api/membership/trial` - Start trial
- `POST /api/membership/upgrade` - Upgrade to premium
- `POST /api/membership/cancel` - Cancel subscription

#### Analysis
- `POST /api/analyze/text` - Analyze text
- `POST /api/analyze/factcheck` - Fact-check claim
- `POST /api/analyze/transcript` - Analyze transcript

#### WebSocket
- `WS /api/ws/room/:roomId` - Real-time debate room

## 5. Data Models

### User
```python
{
    "id", "username", "email",
    "is_guest", "guest_calls_remaining",
    "membership_tier", "membership_expires",
    "political_views", "political_scale",
    "philosophical_views", "religious_views",
    "ethical_stances", "bio", "topics_of_interest",
    "debates_completed", "member_since"
}
```

### LobbyPost
```python
{
    "id", "user_id", "username",
    "topic_id", "topic_name", "stance",
    "title", "argument", "created_at",
    "is_live", "opponent_id", "views"
}
```

## 6. Color Palette
- Primary: `#6366F1` (Indigo)
- Secondary: `#8B5CF6` (Purple)
- Accent: `#F59E0B` (Amber)
- Background: `#0F0F1A` (Deep navy)
- Surface: `#1A1A2E` (Dark card)
- Pro: `#22C55E` (Green)
- Con: `#EF4444` (Red)

## 7. Deployment

### Start Backend
```bash
cd server
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

### Start Frontend
```bash
cd client
npm install
npm run dev
# Runs on http://localhost:3000
```

No external API required - all AI features use local pipeline.
