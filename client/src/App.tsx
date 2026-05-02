import { useEffect, useMemo, useRef, useState } from 'react';

type Plan = 'guest' | 'trial' | 'premium';
type Mode = 'random' | 'lobby' | 'broad' | 'inperson';
type Stance = 'pro' | 'con';
type Status = 'idle' | 'camera' | 'waiting' | 'matched' | 'ended';

type User = {
  id: string;
  name: string;
  plan: Plan;
  guestCalls: number;
};

type ChatMessage = {
  id: string;
  userId: string;
  name: string;
  stance: Stance;
  text: string;
  createdAt: string;
};

type FactCheck = {
  claim: string;
  verdict: string;
  confidence: number;
  explanation?: string;
  note?: string;
};

const TOPIC_GROUPS = [
  {
    id: 'politics',
    name: 'Politics',
    topics: [
      'Should voting be mandatory?',
      'Should cities ban corporate campaign donations?',
      'Should local governments use ranked-choice voting?',
      'Should lobbying meetings be public by default?',
    ],
  },
  {
    id: 'philosophy',
    name: 'Philosophy',
    topics: [
      'Is free will compatible with determinism?',
      'Can a machine deserve moral consideration?',
      'Is lying ever morally required?',
      'Should intent matter more than outcome?',
    ],
  },
  {
    id: 'technology',
    name: 'Technology',
    topics: [
      'Should AI-generated work always be disclosed?',
      'Should children have a right to algorithm-free feeds?',
      'Should open-source AI models be regulated?',
      'Should social platforms verify all political ads?',
    ],
  },
  {
    id: 'work',
    name: 'Work and Business',
    topics: [
      'Should companies publish salary bands for every role?',
      'Should remote work be the default for knowledge workers?',
      'Should executive pay be capped relative to median worker pay?',
      'Should meetings require written agendas?',
    ],
  },
  {
    id: 'science',
    name: 'Science and Health',
    topics: [
      'Should medical AI make first-pass diagnoses?',
      'Should gene editing be allowed for inherited diseases?',
      'Should nutrition labels include climate impact?',
      'Should public health prioritize prevention over treatment?',
    ],
  },
  {
    id: 'culture',
    name: 'Culture and Media',
    topics: [
      'Should schools teach media literacy as a core subject?',
      'Should museums return disputed artifacts by default?',
      'Should artists disclose AI assistance?',
      'Should streaming platforms fund local journalism?',
    ],
  },
];

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function loadUser(): User {
  const saved = localStorage.getItem('debatersai:user');
  if (saved) return JSON.parse(saved);
  return { id: newId('user'), name: 'Guest Debater', plan: 'guest', guestCalls: 10 };
}

function wsUrl(path: string) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function countMatches(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.reduce((count, term) => count + (lower.includes(term) ? 1 : 0), 0);
}

function analyze(messages: ChatMessage[], topic: string) {
  const proText = messages.filter((m) => m.stance === 'pro').map((m) => m.text).join(' ');
  const conText = messages.filter((m) => m.stance === 'con').map((m) => m.text).join(' ');
  const allText = `${proText} ${conText}`;
  const evidenceWords = ['study', 'data', 'because', 'research', 'evidence', 'example', 'according', 'percent', '%', 'risk', 'cost'];
  const logicWords = ['therefore', 'if', 'then', 'causes', 'means', 'tradeoff', 'incentive', 'leads'];
  const rebuttalWords = ['but', 'however', 'counter', 'you said', 'assume', 'respond'];
  const harshWords = ['idiot', 'stupid', 'dumb', 'trash', 'shut up', 'ridiculous'];

  const proScore = clamp(Math.round(42 + countMatches(proText, evidenceWords) * 9 + countMatches(proText, logicWords) * 5 + countMatches(proText, rebuttalWords) * 6 + proText.length / 80 - countMatches(proText, harshWords) * 12));
  const conScore = clamp(Math.round(42 + countMatches(conText, evidenceWords) * 9 + countMatches(conText, logicWords) * 5 + countMatches(conText, rebuttalWords) * 6 + conText.length / 80 - countMatches(conText, harshWords) * 12));
  const leader = Math.abs(proScore - conScore) < 5 ? 'Even' : proScore > conScore ? 'PRO' : 'CON';
  const claims = allText.split(/[.!?]/).map((line) => line.trim()).filter((line) => line.length > 28).slice(-5);

  return {
    leader,
    proScore,
    conScore,
    claims,
    quality: {
      evidence: clamp(30 + countMatches(allText, evidenceWords) * 13),
      logic: clamp(35 + countMatches(allText, logicWords) * 12),
      rebuttal: clamp(25 + countMatches(allText, rebuttalWords) * 16),
      civility: clamp(90 - countMatches(allText, harshWords) * 22),
    },
    summary: messages.length
      ? `${leader} is currently ${leader === 'Even' ? 'with no clear edge' : 'ahead'} on ${topic}.`
      : 'AI analysis starts when either side sends a claim in chat.',
  };
}

export default function App() {
  const [user, setUser] = useState<User>(() => loadUser());
  const [mode, setMode] = useState<Mode>('random');
  const [status, setStatus] = useState<Status>('idle');
  const [topicGroup, setTopicGroup] = useState(TOPIC_GROUPS[0].name);
  const [topic, setTopic] = useState(TOPIC_GROUPS[0].topics[0]);
  const [stance, setStance] = useState<Stance>('pro');
  const [peerName, setPeerName] = useState('Waiting for opponent');
  const [peerStance, setPeerStance] = useState<Stance>('con');
  const [roomId, setRoomId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [factChecks, setFactChecks] = useState<FactCheck[]>([]);
  const [chatText, setChatText] = useState('');
  const [error, setError] = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const currentAnalysis = useMemo(() => analyze(messages, topic), [messages, topic]);
  const topics = TOPIC_GROUPS.find((group) => group.name === topicGroup)?.topics || TOPIC_GROUPS[0].topics;
  const canConnect = user.plan !== 'guest' || user.guestCalls > 0;

  useEffect(() => {
    localStorage.setItem('debatersai:user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => cleanup();
  }, []);

  async function ensureMedia() {
    if (localStreamRef.current) return localStreamRef.current;
    setStatus('camera');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }

  async function startMatch(nextMode: Mode = mode) {
    setError('');
    if (!canConnect) {
      setError('Guest calls are used up. Start the trial or upgrade to keep matching.');
      return;
    }
    try {
      cleanupConnectionOnly();
      setMode(nextMode);
      setStatus('waiting');
      setPeerName('Waiting for opponent');
      setMessages([]);
      setFactChecks([]);
      const stream = await ensureMedia();

      if (user.plan === 'guest') {
        setUser((current) => ({ ...current, guestCalls: Math.max(0, current.guestCalls - 1) }));
      }

      const params = new URLSearchParams({
        user_id: user.id,
        name: user.name,
        topic: nextMode === 'broad' ? 'Random broad topic' : topic,
        stance,
      });
      const socket = new WebSocket(wsUrl(`/api/ws/match?${params.toString()}`));
      wsRef.current = socket;

      socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'waiting') {
          setStatus('waiting');
        }
        if (data.type === 'matched') {
          setStatus('matched');
          setRoomId(data.roomId);
          setPeerName(data.peerName);
          setPeerStance(data.peerStance);
          if (data.topic && data.topic !== 'Random broad topic') setTopic(data.topic);
          await createPeerConnection(Boolean(data.isHost), stream);
        }
        if (data.type === 'offer') {
          const pc = pcRef.current || await createPeerConnection(false, stream);
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSocket({ type: 'answer', answer });
        }
        if (data.type === 'answer' && pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
        if (data.type === 'ice' && pcRef.current && data.candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
        if (data.type === 'chat') {
          setMessages((current) => [...current, data.message]);
        }
        if (data.type === 'analysis') {
          if (data.factCheck) {
            setFactChecks((current) => [data.factCheck, ...current].slice(0, 5));
          }
        }
        if (data.type === 'peer_left') {
          setStatus('ended');
          setPeerName('Partner left');
        }
      };

      socket.onerror = () => setError('Could not connect to the matching server. Start the backend on port 8000.');
      socket.onclose = () => {
        if (status === 'matched') setStatus('ended');
      };
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Camera or microphone permission failed.');
      setStatus('idle');
    }
  }

  async function createPeerConnection(isHost: boolean, stream: MediaStream) {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) sendSocket({ type: 'ice', candidate: event.candidate });
    };
    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        setStatus('ended');
      }
    };

    if (isHost) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSocket({ type: 'offer', offer });
    }
    return pc;
  }

  function sendSocket(payload: object) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }

  function sendChat(event: React.FormEvent) {
    event.preventDefault();
    const text = chatText.trim();
    if (!text) return;
    sendSocket({ type: 'chat', text });
    setChatText('');
  }

  function nextMatch() {
    cleanupConnectionOnly();
    setStatus('waiting');
    setMessages([]);
    setFactChecks([]);
    sendSocket({ type: 'next' });
  }

  function toggleCamera() {
    const next = !cameraOn;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setCameraOn(next);
  }

  function toggleMic() {
    const next = !micOn;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setMicOn(next);
  }

  function cleanupConnectionOnly() {
    pcRef.current?.close();
    pcRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }

  function cleanup() {
    sendSocket({ type: 'leave' });
    wsRef.current?.close();
    wsRef.current = null;
    cleanupConnectionOnly();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
  }

  function updatePlan(plan: Plan) {
    setUser((current) => ({ ...current, plan, guestCalls: plan === 'guest' ? current.guestCalls : 999 }));
  }

  function saveName(event: React.FormEvent) {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const name = String(form.get('name') || '').trim() || 'Guest Debater';
    setUser((current) => ({ ...current, name }));
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setStatus('idle')}>
          <span className="brand-mark">D</span>
          <span>DebatersAI</span>
        </button>
        <nav className="nav-tabs">
          {[
            ['random', 'Random'],
            ['lobby', 'Lobbies'],
            ['broad', 'Topics'],
            ['inperson', 'In Person'],
          ].map(([id, label]) => (
            <button key={id} className={mode === id ? 'active' : ''} onClick={() => setMode(id as Mode)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="account">
          <span>{user.name}</span>
          <strong>{user.plan === 'guest' ? `${user.guestCalls} calls` : user.plan}</strong>
        </div>
      </header>

      <main className="video-layout">
        <section className="stage">
          <div className="video-grid">
            <div className="video-tile remote">
              <video ref={remoteVideoRef} autoPlay playsInline />
              {status !== 'matched' && (
                <div className="video-placeholder">
                  <strong>{status === 'waiting' ? 'Finding a debate partner...' : 'Remote debater'}</strong>
                  <span>{status === 'idle' ? 'Pick a topic, allow camera and mic, then start matching.' : 'WebRTC connection will appear here.'}</span>
                </div>
              )}
              <div className="video-label">
                <span>{peerName}</span>
                <b>{peerStance.toUpperCase()}</b>
              </div>
            </div>

            <div className="video-tile local">
              <video ref={localVideoRef} autoPlay playsInline muted />
              {!localStreamRef.current && (
                <div className="video-placeholder">
                  <strong>Your camera</strong>
                  <span>Camera and microphone permission is required for matching.</span>
                </div>
              )}
              <div className="video-label">
                <span>{user.name}</span>
                <b>{stance.toUpperCase()}</b>
              </div>
            </div>
          </div>

          <div className="control-bar">
            <button className="primary" onClick={() => startMatch(mode)}>
              {status === 'idle' || status === 'ended' ? 'Start face-to-face debate' : 'Reconnect'}
            </button>
            <button onClick={nextMatch} disabled={status === 'idle'}>Next</button>
            <button onClick={toggleCamera}>{cameraOn ? 'Camera on' : 'Camera off'}</button>
            <button onClick={toggleMic}>{micOn ? 'Mic on' : 'Mic off'}</button>
            <button className="danger" onClick={() => {
              cleanup();
              setStatus('idle');
            }}>Stop</button>
          </div>

          {error && <div className="error-box">{error}</div>}

          <section className="setup-strip">
            <div>
              <p className="eyebrow">Match setup</p>
              <h1>Face-to-face debate first. AI watches the conversation.</h1>
            </div>
            <label>
              Category
              <select value={topicGroup} onChange={(event) => {
                const nextGroup = event.target.value;
                const nextTopic = TOPIC_GROUPS.find((group) => group.name === nextGroup)?.topics[0] || topic;
                setTopicGroup(nextGroup);
                setTopic(nextTopic);
              }}>
                {TOPIC_GROUPS.map((group) => <option key={group.id}>{group.name}</option>)}
              </select>
            </label>
            <label>
              Topic
              <select value={topic} onChange={(event) => setTopic(event.target.value)}>
                {topics.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Stance
              <select value={stance} onChange={(event) => {
                const next = event.target.value as Stance;
                setStance(next);
                setPeerStance(next === 'pro' ? 'con' : 'pro');
              }}>
                <option value="pro">Pro</option>
                <option value="con">Con</option>
              </select>
            </label>
          </section>

          {mode === 'lobby' && (
            <section className="mode-panel">
              <p className="eyebrow">Lobby mode</p>
              <h2>Host a topic, wait on camera, and accept whoever joins the opposing side.</h2>
              <p>The current lobby logic uses the same live WebRTC queue, scoped by topic and stance. Spectators and multi-person lobby queues can build on the same socket room model.</p>
            </section>
          )}

          {mode === 'broad' && (
            <section className="topic-grid">
              {TOPIC_GROUPS.map((group) => (
                <button key={group.id} className={topicGroup === group.name ? 'topic-card selected' : 'topic-card'} onClick={() => {
                  setTopicGroup(group.name);
                  setTopic(group.topics[Math.floor(Math.random() * group.topics.length)]);
                }}>
                  <strong>{group.name}</strong>
                  <span>{group.topics.length} debate prompts</span>
                </button>
              ))}
            </section>
          )}

          {mode === 'inperson' && (
            <section className="mode-panel">
              <p className="eyebrow">In-person mode</p>
              <h2>Use the same camera/mic permission flow, then keep both speakers in frame while the AI scores chat claims.</h2>
              <p>For browser support, speech-to-text can be layered onto the existing chat transcript. The camera/mic foundation is already active here.</p>
            </section>
          )}
        </section>

        <aside className="side-rail">
          <section className="panel-card compact">
            <p className="eyebrow">Connection</p>
            <h2>{status}</h2>
            <p className="muted">{roomId || 'No room yet'} | {topic}</p>
          </section>

          <section className="panel-card chat-panel">
            <div className="panel-title">
              <div>
                <p className="eyebrow">Room chat</p>
                <h2>Everyone in the debate</h2>
              </div>
            </div>
            <div className="chat-log">
              {messages.map((message) => (
                <article key={message.id} className={message.userId === user.id ? 'chat-message mine' : 'chat-message'}>
                  <div>
                    <strong>{message.name}</strong>
                    <span>{message.stance.toUpperCase()}</span>
                  </div>
                  <p>{message.text}</p>
                </article>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form className="chat-form" onSubmit={sendChat}>
              <input value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Type a claim, rebuttal, or source..." />
              <button className="primary">Send</button>
            </form>
          </section>

          <section className="panel-card">
            <p className="eyebrow">AI judge</p>
            <h2>{currentAnalysis.summary}</h2>
            <ScoreBar label="PRO" value={currentAnalysis.proScore} />
            <ScoreBar label="CON" value={currentAnalysis.conScore} />
          </section>

          <section className="panel-card">
            <p className="eyebrow">Argument quality</p>
            {Object.entries(currentAnalysis.quality).map(([label, value]) => (
              <ScoreBar key={label} label={label} value={value} />
            ))}
          </section>

          <section className="panel-card">
            <p className="eyebrow">Fact checks</p>
            {factChecks.length === 0 ? (
              <p className="muted">Fact-check notes appear after users send chat claims.</p>
            ) : (
              factChecks.map((item, index) => (
                <div className="fact" key={`${item.claim}-${index}`}>
                  <strong>{item.verdict} | {Math.round(item.confidence * (item.confidence <= 1 ? 100 : 1))}%</strong>
                  <p>{item.claim}</p>
                  <small>{item.explanation || item.note}</small>
                </div>
              ))
            )}
          </section>

          <section className="panel-card">
            <p className="eyebrow">Account</p>
            <form className="name-form" onSubmit={saveName}>
              <input name="name" placeholder="Display name" defaultValue={user.name} />
              <button>Save</button>
            </form>
            <div className="plan-buttons">
              <button onClick={() => updatePlan('guest')}>Guest</button>
              <button onClick={() => updatePlan('trial')}>7-day trial</button>
              <button onClick={() => updatePlan('premium')}>$10/month</button>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="scorebar">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="track">
        <i style={{ width: `${clamp(value)}%` }} />
      </div>
    </div>
  );
}
