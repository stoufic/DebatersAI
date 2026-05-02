# DebatersAI

DebatersAI is a face-to-face debate matching app with an AI-style judge running in the background. It uses WebRTC for browser camera/microphone calls, a FastAPI WebSocket server for matchmaking and signaling, and a local deterministic analysis pipeline for claims, evidence cues, rebuttals, civility, fact-check needs, and estimated winner.

## Features

- Random face-to-face debate matching
- WebRTC camera and microphone connection between matched users
- Debate lobbies using the same topic and stance queue
- Broad topic matching across politics, philosophy, technology, work, science, and culture
- In-person judge mode using the same camera/microphone permission flow
- Shared room chat for everyone in the debate
- AI sidebar with scores, argument quality, and fact-check notes
- Guest access with 10 local AI calls
- Free login/trial state with unlimited trial usage
- Premium state for a $10/month unlimited plan
- Responsive, minimal React UI

## Run Locally

Start the backend first:

```bash
cd server
python3 -m pip install -r requirements.txt
python3 main.py
```

Then start the frontend:

```bash
cd client
npm install
npm run dev
```

Open the local URL Vite prints, usually `http://127.0.0.1:3000/`.

To test matching locally, open the app in two browser windows, choose opposite stances on the same topic, and start matching in both windows.

## Build

```bash
cd client
npm run build
```

## Project Structure

```text
DebatersAI/
  client/   React + TypeScript + Vite app
  server/   FastAPI matchmaking, WebSocket signaling, and local AI analysis
  proxy/    Optional proxy scaffold
```

The main app experience is implemented in `client/src/App.tsx`, `client/src/styles/globals.css`, and `server/routers/websocket.py`.
