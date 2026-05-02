import { useEffect, useMemo, useRef, useState } from 'react';

type Plan = 'guest' | 'trial' | 'premium';
type Mode = 'random' | 'lobbies' | 'broad' | 'inperson';
type Stance = 'pro' | 'con';

type User = {
  id: string;
  name: string;
  plan: Plan;
  guestCalls: number;
  trialStartedAt?: string;
};

type Message = {
  id: string;
  speaker: 'you' | 'opponent';
  stance: Stance;
  text: string;
  createdAt: string;
};

type Lobby = {
  id: string;
  host: string;
  topic: string;
  category: string;
  stance: Stance;
  summary: string;
  viewers: number;
  requests: number;
  live: boolean;
  chat: { id: string; name: string; text: string }[];
};

type Analysis = {
  proScore: number;
  conScore: number;
  leader: 'pro' | 'con' | 'even';
  claims: string[];
  factChecks: { claim: string; verdict: string; confidence: number; note: string }[];
  suggestions: string[];
  quality: { evidence: number; logic: number; civility: number; rebuttal: number };
  summary: string;
};

const CATEGORIES = [
  {
    id: 'politics',
    name: 'Politics',
    topics: [
      'Should cities ban corporate campaign donations?',
      'Should voting be mandatory?',
      'Should local governments use ranked-choice voting?',
      'Should lobbying contacts be public in real time?',
    ],
  },
  {
    id: 'philosophy',
    name: 'Philosophy',
    topics: [
      'Is free will compatible with determinism?',
      'Is lying ever morally required?',
      'Should intent matter more than outcome?',
      'Can a machine deserve moral consideration?',
    ],
  },
  {
    id: 'technology',
    name: 'Technology',
    topics: [
      'Should companies disclose AI-generated work by default?',
      'Should social platforms verify all political ads?',
      'Should children have a legal right to algorithm-free feeds?',
      'Should open-source AI models be regulated like infrastructure?',
    ],
  },
  {
    id: 'work',
    name: 'Work and Business',
    topics: [
      'Should remote work be the default for knowledge workers?',
      'Should executive pay be capped relative to median worker pay?',
      'Should companies publish salary bands for every role?',
      'Should meetings require written agendas to be scheduled?',
    ],
  },
  {
    id: 'science',
    name: 'Science and Health',
    topics: [
      'Should gene editing be allowed for inherited diseases?',
      'Should nutrition labels include climate impact?',
      'Should medical AI be allowed to make first-pass diagnoses?',
      'Should public health policy prioritize prevention over treatment?',
    ],
  },
  {
    id: 'culture',
    name: 'Culture and Media',
    topics: [
      'Should streaming platforms fund local journalism?',
      'Should museums return disputed artifacts by default?',
      'Should schools teach media literacy as a core subject?',
      'Should artists disclose AI assistance?',
    ],
  },
];

const SAMPLE_LOBBIES: Lobby[] = [
  {
    id: 'lobby-1',
    host: 'Maya',
    topic: 'Should companies publish salary bands for every role?',
    category: 'Work and Business',
    stance: 'pro',
    summary: 'Transparent bands reduce hidden bias and make hiring more efficient.',
    viewers: 34,
    requests: 5,
    live: true,
    chat: [
      { id: 'c1', name: 'Noah', text: 'The counterargument has to deal with negotiation asymmetry.' },
      { id: 'c2', name: 'Iris', text: 'I want next on the con side.' },
    ],
  },
  {
    id: 'lobby-2',
    host: 'Andre',
    topic: 'Can a machine deserve moral consideration?',
    category: 'Philosophy',
    stance: 'con',
    summary: 'Simulation of suffering is not the same as subjective experience.',
    viewers: 21,
    requests: 2,
    live: true,
    chat: [{ id: 'c3', name: 'Sam', text: 'Definitions are doing most of the work here.' }],
  },
  {
    id: 'lobby-3',
    host: 'Priya',
    topic: 'Should medical AI be allowed to make first-pass diagnoses?',
    category: 'Science and Health',
    stance: 'pro',
    summary: 'A supervised first pass can reduce wait times without replacing doctors.',
    viewers: 47,
    requests: 9,
    live: true,
    chat: [{ id: 'c4', name: 'Dev', text: 'Liability is the part I want to hear more about.' }],
  },
];

const OPPONENT_LINES = [
  'That sounds appealing, but the policy creates second-order costs you have not priced in yet.',
  'Your evidence supports a narrower conclusion than the one you are drawing.',
  'I think the real issue is incentives. People respond to the system around them, not just ideals.',
  'That argument assumes the institution will execute perfectly, which is rarely true.',
  'You are right about the problem, but your solution may make the tradeoff worse.',
  'The burden of proof is higher when a policy affects people who cannot easily opt out.',
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function countMatches(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.reduce((total, word) => total + (lower.includes(word) ? 1 : 0), 0);
}

function analyzeDebate(messages: Message[], topic: string): Analysis {
  const proText = messages.filter((m) => m.stance === 'pro').map((m) => m.text).join(' ');
  const conText = messages.filter((m) => m.stance === 'con').map((m) => m.text).join(' ');
  const allText = `${proText} ${conText}`;
  const evidenceWords = ['study', 'data', 'because', 'evidence', 'research', 'example', 'according', 'percent', '%', 'cost', 'risk'];
  const logicWords = ['therefore', 'if', 'then', 'so', 'causes', 'leads', 'tradeoff', 'incentive', 'means'];
  const rebuttalWords = ['but', 'however', 'respond', 'counter', 'assume', 'because you', 'you said'];
  const civilWords = ['fair', 'understand', 'agree', 'respect', 'reasonable', 'point'];
  const harshWords = ['stupid', 'idiot', 'dumb', 'lie', 'trash', 'ridiculous'];

  const proRaw =
    44 +
    countMatches(proText, evidenceWords) * 7 +
    countMatches(proText, logicWords) * 4 +
    countMatches(proText, rebuttalWords) * 5 +
    Math.min(proText.length / 60, 16) -
    countMatches(proText, harshWords) * 8;
  const conRaw =
    44 +
    countMatches(conText, evidenceWords) * 7 +
    countMatches(conText, logicWords) * 4 +
    countMatches(conText, rebuttalWords) * 5 +
    Math.min(conText.length / 60, 16) -
    countMatches(conText, harshWords) * 8;
  const proScore = clamp(Math.round(proRaw));
  const conScore = clamp(Math.round(conRaw));
  const leader = Math.abs(proScore - conScore) < 5 ? 'even' : proScore > conScore ? 'pro' : 'con';

  const claims = allText
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 28)
    .slice(-5);

  const factChecks = claims.slice(-3).map((claim) => {
    const hasEvidence = countMatches(claim, evidenceWords) > 0;
    const hasNumber = /\d|percent|%|million|billion/i.test(claim);
    return {
      claim,
      verdict: hasEvidence ? 'supported pattern' : hasNumber ? 'needs source' : 'argumentative claim',
      confidence: hasEvidence ? 78 : hasNumber ? 55 : 46,
      note: hasEvidence
        ? 'The claim includes evidence language, but a production release should verify it against trusted sources.'
        : hasNumber
          ? 'Numeric claims should be sourced before being counted as verified.'
          : 'This reads as reasoning or opinion, so the AI scores structure rather than truth.',
    };
  });

  const suggestions = [
    countMatches(allText, evidenceWords) < 2 ? 'Add one concrete source, example, or measurable outcome.' : 'Evidence use is visible. Tie it directly to the conclusion.',
    countMatches(allText, rebuttalWords) < 2 ? 'Address the strongest opposing point instead of only restating your side.' : 'Rebuttals are present. Clarify which premise you are attacking.',
    countMatches(allText, harshWords) > 0 ? 'Tone penalty detected. Replace personal attacks with claim-specific criticism.' : 'Civility is stable. Keep the focus on claims and tradeoffs.',
  ];

  return {
    proScore,
    conScore,
    leader,
    claims,
    factChecks,
    suggestions,
    quality: {
      evidence: clamp(35 + countMatches(allText, evidenceWords) * 12),
      logic: clamp(40 + countMatches(allText, logicWords) * 10),
      civility: clamp(88 - countMatches(allText, harshWords) * 20 + countMatches(allText, civilWords) * 3),
      rebuttal: clamp(30 + countMatches(allText, rebuttalWords) * 16),
    },
    summary:
      leader === 'even'
        ? `The debate on "${topic}" is close. Neither side has built a decisive evidence advantage yet.`
        : `${leader.toUpperCase()} is currently ahead on "${topic}" because that side has stronger structure, evidence cues, or rebuttal coverage.`,
  };
}

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem('debatersai:user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [mode, setMode] = useState<Mode>('random');
  const [user, setUser] = useState<User | null>(() => loadUser());
  const [authOpen, setAuthOpen] = useState(!loadUser());
  const [authMode, setAuthMode] = useState<'guest' | 'login' | 'register'>('guest');
  const [name, setName] = useState('');
  const [topic, setTopic] = useState(CATEGORIES[0].topics[0]);
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [stance, setStance] = useState<Stance>('pro');
  const [active, setActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [lobbies, setLobbies] = useState<Lobby[]>(() => {
    const saved = localStorage.getItem('debatersai:lobbies');
    return saved ? JSON.parse(saved) : SAMPLE_LOBBIES;
  });
  const [chatText, setChatText] = useState('');
  const [selectedLobbyId, setSelectedLobbyId] = useState('lobby-1');
  const [inPersonText, setInPersonText] = useState('Speaker A: Companies should disclose AI-generated work because clients deserve transparency.\nSpeaker B: Disclosure is fine, but forcing it for every draft could slow down normal work.');
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedLobby = lobbies.find((lobby) => lobby.id === selectedLobbyId) || lobbies[0];
  const analysis = useMemo(() => analyzeDebate(messages, topic), [messages, topic]);
  const inPersonMessages = useMemo<Message[]>(() => {
    return inPersonText
      .split('\n')
      .map((line, index) => {
        const speaker: Message['speaker'] = line.toLowerCase().startsWith('speaker b') ? 'opponent' : 'you';
        const parsedStance: Stance = speaker === 'you' ? 'pro' : 'con';
        return {
          id: `line-${index}`,
          speaker,
          stance: parsedStance,
          text: line.replace(/^speaker [ab]:\s*/i, '').trim(),
          createdAt: new Date().toISOString(),
        };
      })
      .filter((message) => message.text);
  }, [inPersonText]);
  const inPersonAnalysis = useMemo(() => analyzeDebate(inPersonMessages, 'in-person debate'), [inPersonMessages]);

  useEffect(() => {
    if (user) localStorage.setItem('debatersai:user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('debatersai:lobbies', JSON.stringify(lobbies));
  }, [lobbies]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const canUseCall = user && (user.plan !== 'guest' || user.guestCalls > 0);

  function consumeCall() {
    if (!user) {
      setAuthOpen(true);
      return false;
    }
    if (user.plan === 'guest' && user.guestCalls <= 0) {
      setAuthOpen(true);
      return false;
    }
    if (user.plan === 'guest') {
      setUser({ ...user, guestCalls: user.guestCalls - 1 });
    }
    return true;
  }

  function submitAuth(event: React.FormEvent) {
    event.preventDefault();
    const displayName = name.trim() || (authMode === 'guest' ? 'Guest Debater' : 'Debater');
    const plan: Plan = authMode === 'guest' ? 'guest' : 'trial';
    setUser({
      id: newId('user'),
      name: displayName,
      plan,
      guestCalls: plan === 'guest' ? 10 : 999,
      trialStartedAt: plan === 'trial' ? new Date().toISOString() : undefined,
    });
    setAuthOpen(false);
  }

  function startDebate(nextMode: Mode = mode) {
    if (!consumeCall()) return;
    setMode(nextMode);
    setActive(true);
    setMessages([
      {
        id: newId('msg'),
        speaker: 'opponent',
        stance: stance === 'pro' ? 'con' : 'pro',
        text: `I am ready to argue the ${stance === 'pro' ? 'con' : 'pro'} side of "${topic}". Start with your strongest reason.`,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  function sendMessage(event?: React.FormEvent) {
    event?.preventDefault();
    if (!input.trim() || !consumeCall()) return;
    const yourMessage: Message = {
      id: newId('msg'),
      speaker: 'you',
      stance,
      text: input.trim(),
      createdAt: new Date().toISOString(),
    };
    const opponentMessage: Message = {
      id: newId('msg'),
      speaker: 'opponent',
      stance: stance === 'pro' ? 'con' : 'pro',
      text: OPPONENT_LINES[(messages.length + input.length) % OPPONENT_LINES.length],
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, yourMessage, opponentMessage]);
    setInput('');
  }

  function createLobby(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consumeCall()) return;
    const form = new FormData(event.currentTarget);
    const nextLobby: Lobby = {
      id: newId('lobby'),
      host: user?.name || 'Guest',
      topic: String(form.get('topic') || topic),
      category: String(form.get('category') || category),
      stance: String(form.get('stance') || 'pro') as Stance,
      summary: String(form.get('summary') || 'Open challenge. Join and debate the opposing side.'),
      viewers: 1,
      requests: 0,
      live: true,
      chat: [],
    };
    setLobbies((current) => [nextLobby, ...current]);
    setSelectedLobbyId(nextLobby.id);
  }

  function sendLobbyChat() {
    if (!chatText.trim() || !selectedLobby) return;
    setLobbies((current) =>
      current.map((lobby) =>
        lobby.id === selectedLobby.id
          ? {
              ...lobby,
              chat: [...lobby.chat, { id: newId('chat'), name: user?.name || 'Spectator', text: chatText.trim() }],
            }
          : lobby,
      ),
    );
    setChatText('');
  }

  function requestNext() {
    if (!selectedLobby) return;
    setLobbies((current) =>
      current.map((lobby) => (lobby.id === selectedLobby.id ? { ...lobby, requests: lobby.requests + 1 } : lobby)),
    );
  }

  function joinLobby() {
    if (!selectedLobby) return;
    setTopic(selectedLobby.topic);
    setCategory(selectedLobby.category);
    setStance(selectedLobby.stance === 'pro' ? 'con' : 'pro');
    startDebate('lobbies');
  }

  function broadTopic(categoryName: string) {
    const selected = CATEGORIES.find((item) => item.name === categoryName) || CATEGORIES[0];
    const picked = selected.topics[Math.floor(Math.random() * selected.topics.length)];
    setCategory(selected.name);
    setTopic(picked);
    setMode('broad');
  }

  function upgrade(plan: Plan) {
    if (!user) {
      setAuthMode('register');
      setAuthOpen(true);
      return;
    }
    setUser({
      ...user,
      plan,
      guestCalls: plan === 'guest' ? user.guestCalls : 999,
      trialStartedAt: plan === 'trial' ? new Date().toISOString() : user.trialStartedAt,
    });
  }

  function toggleSpeech() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setInPersonText((current) => `${current}\nSpeaker A: Browser speech recognition is not available here, so manual transcript mode is active.`);
      return;
    }
    if (listening) {
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInPersonText((current) => `${current}\nSpeaker A: ${text}`);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setActive(false)}>
          <span className="brand-mark">D</span>
          <span>DebatersAI</span>
        </button>
        <nav className="nav-tabs">
          {[
            ['random', 'Random'],
            ['lobbies', 'Lobbies'],
            ['broad', 'Topic Match'],
            ['inperson', 'In Person'],
          ].map(([id, label]) => (
            <button key={id} className={mode === id ? 'active' : ''} onClick={() => setMode(id as Mode)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="account">
          {user ? (
            <>
              <span>{user.name}</span>
              <strong>{user.plan === 'guest' ? `${user.guestCalls} calls` : user.plan}</strong>
            </>
          ) : (
            <button onClick={() => setAuthOpen(true)}>Sign in</button>
          )}
        </div>
      </header>

      <main className="layout">
        <section className="main-panel">
          {!active && mode !== 'inperson' && (
            <div className="hero">
              <div>
                <p className="eyebrow">Live debate matching with local AI scoring</p>
                <h1>Debate strangers, host lobbies, or run an in-room judge.</h1>
                <p>
                  DebatersAI pairs people by topic and stance, then analyzes claims, evidence, tone, rebuttals, and
                  estimated winner without using an external AI API.
                </p>
              </div>
              <div className="hero-card">
                <span>Current AI estimate</span>
                <strong>{analysis.leader === 'even' ? 'Even debate' : `${analysis.leader.toUpperCase()} leading`}</strong>
                <div className="score-row">
                  <span>PRO {analysis.proScore}</span>
                  <span>CON {analysis.conScore}</span>
                </div>
              </div>
            </div>
          )}

          {mode === 'random' && !active && (
            <SetupPanel
              title="Random debate"
              description="Pick a precise topic and stance. The local demo creates a realistic opposing debater so you can test the full flow."
              topic={topic}
              category={category}
              stance={stance}
              setTopic={setTopic}
              setCategory={setCategory}
              setStance={setStance}
              onStart={() => startDebate('random')}
            />
          )}

          {mode === 'broad' && !active && (
            <section className="section">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Broad topic matching</p>
                  <h2>Choose a category, get a specific debate.</h2>
                </div>
                <button className="primary" onClick={() => startDebate('broad')}>
                  Start match
                </button>
              </div>
              <div className="category-grid">
                {CATEGORIES.map((item) => (
                  <button key={item.id} className={category === item.name ? 'category selected' : 'category'} onClick={() => broadTopic(item.name)}>
                    <strong>{item.name}</strong>
                    <span>{item.topics[0]}</span>
                  </button>
                ))}
              </div>
              <div className="selected-topic">
                <span>Selected debate</span>
                <strong>{topic}</strong>
              </div>
            </section>
          )}

          {mode === 'lobbies' && !active && (
            <section className="lobby-view">
              <div className="lobby-list">
                <div className="section-head compact">
                  <div>
                    <p className="eyebrow">Debate lobbies</p>
                    <h2>Host, join, spectate, chat, or request next.</h2>
                  </div>
                </div>
                {lobbies.map((lobby) => (
                  <button key={lobby.id} className={selectedLobbyId === lobby.id ? 'lobby selected' : 'lobby'} onClick={() => setSelectedLobbyId(lobby.id)}>
                    <span>{lobby.category}</span>
                    <strong>{lobby.topic}</strong>
                    <small>{lobby.viewers} watching | {lobby.requests} next requests</small>
                  </button>
                ))}
              </div>
              <div className="lobby-detail">
                {selectedLobby && (
                  <>
                    <div className="live-header">
                      <span className="live-dot" />
                      <span>Live lobby hosted by {selectedLobby.host}</span>
                    </div>
                    <h2>{selectedLobby.topic}</h2>
                    <p>{selectedLobby.summary}</p>
                    <div className="actions">
                      <button className="primary" onClick={joinLobby}>Challenge host</button>
                      <button onClick={requestNext}>Request next</button>
                    </div>
                    <div className="chatbox">
                      <strong>Spectator chat</strong>
                      <div className="chatlog">
                        {selectedLobby.chat.map((chat) => (
                          <p key={chat.id}><b>{chat.name}:</b> {chat.text}</p>
                        ))}
                      </div>
                      <div className="inline-form">
                        <input value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Chat as spectator" />
                        <button onClick={sendLobbyChat}>Send</button>
                      </div>
                    </div>
                    <form className="create-lobby" onSubmit={createLobby}>
                      <strong>Create a lobby</strong>
                      <input name="topic" placeholder="Debate topic" defaultValue={topic} />
                      <select name="category" defaultValue={category}>
                        {CATEGORIES.map((item) => <option key={item.id}>{item.name}</option>)}
                      </select>
                      <select name="stance" defaultValue="pro">
                        <option value="pro">Pro</option>
                        <option value="con">Con</option>
                      </select>
                      <textarea name="summary" placeholder="Your opening argument" />
                      <button className="primary">Host lobby</button>
                    </form>
                  </>
                )}
              </div>
            </section>
          )}

          {active && mode !== 'inperson' && (
            <section className="debate-room">
              <div className="room-header">
                <div>
                  <p className="eyebrow">{category}</p>
                  <h2>{topic}</h2>
                </div>
                <button onClick={() => setActive(false)}>End debate</button>
              </div>
              <div className="messages">
                {messages.map((message) => (
                  <article key={message.id} className={message.speaker === 'you' ? 'message mine' : 'message'}>
                    <span>{message.speaker === 'you' ? 'You' : 'Opponent'} | {message.stance.toUpperCase()}</span>
                    <p>{message.text}</p>
                  </article>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form className="composer" onSubmit={sendMessage}>
                <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Make your argument..." />
                <button className="primary">Send</button>
              </form>
            </section>
          )}

          {mode === 'inperson' && (
            <section className="inperson">
              <div className="section-head">
                <div>
                  <p className="eyebrow">In-person judge mode</p>
                  <h2>Let two people talk while the AI tracks the debate.</h2>
                </div>
                <button className={listening ? 'danger' : 'primary'} onClick={toggleSpeech}>
                  {listening ? 'Stop' : 'Use mic'}
                </button>
              </div>
              <div className="topic-strip">
                {['Dinner table ethics', 'Founder disputes', 'Classroom Socratic debate', 'Mock trial prep', 'Family decisions', 'Policy club practice'].map((item) => (
                  <button key={item} onClick={() => setInPersonText((current) => `${current}\nSpeaker A: Let us frame this as ${item.toLowerCase()}.`)}>
                    {item}
                  </button>
                ))}
              </div>
              <textarea
                className="transcript"
                value={inPersonText}
                onChange={(event) => setInPersonText(event.target.value)}
                placeholder="Speaker A: ...&#10;Speaker B: ..."
              />
            </section>
          )}
        </section>

        <aside className="analysis-panel">
          <div className="panel-card">
            <p className="eyebrow">AI judge</p>
            <h2>{mode === 'inperson' ? inPersonAnalysis.summary : analysis.summary}</h2>
            <ScoreBar label="PRO" value={mode === 'inperson' ? inPersonAnalysis.proScore : analysis.proScore} />
            <ScoreBar label="CON" value={mode === 'inperson' ? inPersonAnalysis.conScore : analysis.conScore} />
          </div>
          <div className="panel-card">
            <p className="eyebrow">Argument quality</p>
            {Object.entries(mode === 'inperson' ? inPersonAnalysis.quality : analysis.quality).map(([label, value]) => (
              <ScoreBar key={label} label={label} value={value} />
            ))}
          </div>
          <div className="panel-card">
            <p className="eyebrow">Fact checking</p>
            {(mode === 'inperson' ? inPersonAnalysis.factChecks : analysis.factChecks).length === 0 ? (
              <p className="muted">Claims will appear after the debate starts.</p>
            ) : (
              (mode === 'inperson' ? inPersonAnalysis.factChecks : analysis.factChecks).map((check) => (
                <div className="fact" key={check.claim}>
                  <strong>{check.verdict} | {check.confidence}%</strong>
                  <p>{check.claim}</p>
                  <small>{check.note}</small>
                </div>
              ))
            )}
          </div>
          <div className="panel-card">
            <p className="eyebrow">Coach</p>
            {(mode === 'inperson' ? inPersonAnalysis.suggestions : analysis.suggestions).map((tip) => (
              <p className="tip" key={tip}>{tip}</p>
            ))}
          </div>
          <div className="panel-card pricing">
            <p className="eyebrow">Plans</p>
            <button onClick={() => upgrade('trial')}>Start 7-day free login trial</button>
            <button onClick={() => upgrade('premium')}>Upgrade to $10/month</button>
            {!canUseCall && <p className="limit">Guest calls are used up. Start a trial or upgrade.</p>}
          </div>
        </aside>
      </main>

      {authOpen && (
        <div className="modal-backdrop">
          <form className="auth-modal" onSubmit={submitAuth}>
            <p className="eyebrow">Access</p>
            <h2>Use DebatersAI locally</h2>
            <div className="segmented">
              {(['guest', 'login', 'register'] as const).map((item) => (
                <button type="button" key={item} className={authMode === item ? 'active' : ''} onClick={() => setAuthMode(item)}>
                  {item}
                </button>
              ))}
            </div>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Display name" />
            {authMode !== 'guest' && <input placeholder="Email" type="email" />}
            {authMode !== 'guest' && <input placeholder="Password" type="password" />}
            <div className="plan-note">
              {authMode === 'guest'
                ? 'Guest access includes 10 local AI calls.'
                : 'Free login starts a 7-day unlimited trial. Premium is $10/month.'}
            </div>
            <button className="primary">Continue</button>
          </form>
        </div>
      )}
    </div>
  );
}

function SetupPanel({
  title,
  description,
  topic,
  category,
  stance,
  setTopic,
  setCategory,
  setStance,
  onStart,
}: {
  title: string;
  description: string;
  topic: string;
  category: string;
  stance: Stance;
  setTopic: (topic: string) => void;
  setCategory: (category: string) => void;
  setStance: (stance: Stance) => void;
  onStart: () => void;
}) {
  const topics = CATEGORIES.find((item) => item.name === category)?.topics || CATEGORIES[0].topics;

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <p className="eyebrow">{title}</p>
          <h2>{description}</h2>
        </div>
        <button className="primary" onClick={onStart}>Find opponent</button>
      </div>
      <div className="form-grid">
        <label>
          Category
          <select value={category} onChange={(event) => {
            const next = event.target.value;
            setCategory(next);
            setTopic(CATEGORIES.find((item) => item.name === next)?.topics[0] || topic);
          }}>
            {CATEGORIES.map((item) => <option key={item.id}>{item.name}</option>)}
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
          <select value={stance} onChange={(event) => setStance(event.target.value as Stance)}>
            <option value="pro">Pro</option>
            <option value="con">Con</option>
          </select>
        </label>
      </div>
    </section>
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
