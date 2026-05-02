# DebatersAI

DebatersAI is a local-first web app for matching people into structured debates with an AI-style judge running in the background. The current app works without an external AI API: the analysis pipeline scores arguments with deterministic local heuristics for claims, evidence cues, rebuttals, civility, fact-check needs, and estimated winner.

## Features

- Random debate mode with a simulated opponent for local testing
- Debate lobbies with hosting, joining, spectator chat, and request-next
- Broad topic matching across politics, philosophy, technology, work, science, and culture
- In-person judge mode with transcript analysis and optional browser speech recognition
- Guest access with 10 local AI calls
- Free login/trial state with unlimited trial usage
- Premium state for a $10/month unlimited plan
- Responsive, minimal React UI

## Run Locally

```bash
cd client
npm install
npm run dev
```

Open the local URL Vite prints, usually `http://127.0.0.1:3000/`.

## Build

```bash
cd client
npm run build
```

## Project Structure

```text
DebatersAI/
  client/   React + TypeScript + Vite app
  server/   Optional FastAPI backend scaffold
  proxy/    Optional proxy scaffold
```

The production-ready demo experience is currently implemented in `client/src/App.tsx` and `client/src/styles/globals.css`.
