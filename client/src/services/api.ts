const API_BASE = '/api';

export async function register(username: string, email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  return res.json();
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function guestLogin() {
  const res = await fetch(`${API_BASE}/auth/guest`, { method: 'POST' });
  return res.json();
}

export async function getMe(sessionId: string) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'x-session-id': sessionId },
  });
  return res.json();
}

export async function updatePreferences(sessionId: string, prefs: object) {
  const res = await fetch(`${API_BASE}/auth/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId,
    },
    body: JSON.stringify(prefs),
  });
  return res.json();
}

export async function getPreferences(sessionId: string) {
  const res = await fetch(`${API_BASE}/auth/preferences`, {
    headers: { 'x-session-id': sessionId },
  });
  return res.json();
}

// Lobby
export async function getLobbyPosts(topicId?: string) {
  const url = topicId ? `${API_BASE}/lobby/posts?topic_id=${topicId}` : `${API_BASE}/lobby/posts`;
  const res = await fetch(url);
  return res.json();
}

export async function getLobbyPost(postId: string) {
  const res = await fetch(`${API_BASE}/lobby/posts/${postId}`);
  return res.json();
}

export async function createLobbyPost(sessionId: string, topicId: string, title: string, argument: string, stance: string) {
  const res = await fetch(`${API_BASE}/lobby/posts?session_id=${sessionId}&topic_id=${topicId}&title=${encodeURIComponent(title)}&argument=${encodeURIComponent(argument)}&stance=${stance}`, {
    method: 'POST',
  });
  return res.json();
}

export async function joinLobbyPost(postId: string, sessionId: string) {
  const res = await fetch(`${API_BASE}/lobby/posts/${postId}/join?session_id=${sessionId}`, {
    method: 'POST',
  });
  return res.json();
}

export async function leaveLobby(postId: string, sessionId: string) {
  const res = await fetch(`${API_BASE}/lobby/posts/${postId}?session_id=${sessionId}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function getOnlineCount() {
  const res = await fetch(`${API_BASE}/lobby/online-count`);
  return res.json();
}

// Membership
export async function getMembershipStatus(sessionId: string) {
  const res = await fetch(`${API_BASE}/membership/status`, {
    headers: { 'x-session-id': sessionId },
  });
  return res.json();
}

export async function startTrial(sessionId: string) {
  const res = await fetch(`${API_BASE}/membership/trial`, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
  });
  return res.json();
}

export async function upgradeMembership(sessionId: string) {
  const res = await fetch(`${API_BASE}/membership/upgrade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId,
    },
    body: JSON.stringify({ tier: 'premium' }),
  });
  return res.json();
}

// Topics
export async function fetchTopics() {
  const res = await fetch(`${API_BASE}/match/topics`);
  const data = await res.json();
  return data.topics;
}

export async function findMatch(topicId: string, stance: string) {
  const res = await fetch(`${API_BASE}/match/find?user_id=${crypto.randomUUID()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic_id: topicId, stance }),
  });
  return res.json();
}

export async function cancelMatch() {
  await fetch(`${API_BASE}/match/cancel`, { method: 'DELETE' });
}
