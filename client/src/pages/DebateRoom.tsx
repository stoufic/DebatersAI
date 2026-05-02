import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebateStore } from '../hooks/useDebateStore';
import { debateSocket } from '../services/socket';
import type { Message, FactCheck, WSMessage } from '../types';

export default function DebateRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, topic, stance, opponentStance, messages, factChecks, addMessage, addFactCheck, setConnected, reset } = useDebateStore();
  const [input, setInput] = useState('');
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId || !user?.id) {
      navigate('/');
      return;
    }

    debateSocket.connect(roomId, user.id).then(() => {
      setConnected(true);
    }).catch(() => {
      navigate('/topics');
    });

    const unsubscribe = debateSocket.onMessage((msg: WSMessage) => {
      if (msg.type === 'message') {
        const message = msg.message as Message;
        if (message.user_id !== user.id) {
          addMessage(message);
        }
      } else if (msg.type === 'fact_check') {
        const fc = msg.fact_check as FactCheck;
        addFactCheck(msg.message_id as string, fc);
      } else if (msg.type === 'debate_ended') {
        alert('Debate ended: ' + (msg.reason as string));
        handleEndDebate();
      } else if (msg.type === 'user_disconnected') {
        alert('Your opponent has left the debate.');
        handleEndDebate();
      }
    });

    return () => {
      unsubscribe();
      debateSocket.disconnect();
      setConnected(false);
    };
  }, [roomId, user?.id, navigate, addMessage, addFactCheck, setConnected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !stance || !user?.id) return;
    debateSocket.sendMessage(input, stance);
    addMessage({
      id: crypto.randomUUID(),
      user_id: user.id,
      content: input,
      timestamp: new Date().toISOString(),
      stance,
      is_voice: false,
    });
    setInput('');
  };

  const handleEndDebate = () => {
    debateSocket.endDebate();
    reset();
    navigate('/');
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'verified': return 'text-pro-green';
      case 'disputed': return 'text-accent';
      default: return 'text-text-secondary';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 md:px-6 py-3 md:py-4 border-b border-white/10 bg-surface/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-2xl md:text-3xl">{topic?.icon}</span>
            <div>
              <h1 className="text-lg md:text-xl font-bold">{topic?.name}</h1>
              <div className="flex gap-2 md:gap-4 text-xs md:text-sm">
                <span className="text-pro-green">You: {stance?.toUpperCase()}</span>
                <span className="text-con-red">Opp: {opponentStance?.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleEndDebate}
            className="px-3 md:px-4 py-2 bg-con-red/20 hover:bg-con-red/30 border border-con-red/50 rounded-lg transition-colors text-sm"
          >
            End
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-text-secondary py-12">
                <p>Start the debate! Share your first argument.</p>
              </div>
            )}
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 md:px-6 py-3 md:py-4 ${
                    msg.user_id === user?.id
                      ? stance === 'pro' ? 'bg-pro-green/20 border-pro-green/30' : 'bg-con-red/20 border-con-red/30'
                      : 'bg-surface border-white/10'
                  } border`}>
                    <p className="font-mono text-sm leading-relaxed">{msg.content}</p>
                    {factChecks[msg.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`mt-3 pt-3 border-t border-white/10 text-sm ${getVerdictColor(factChecks[msg.id].verdict)}`}
                      >
                        <div className="flex items-center gap-2">
                          {factChecks[msg.id].verdict === 'verified' && '✓'}
                          {factChecks[msg.id].verdict === 'disputed' && '⚠'}
                          {factChecks[msg.id].verdict === 'unverified' && '?'}
                          <span className="font-semibold capitalize">{factChecks[msg.id].verdict}</span>
                        </div>
                        <p className="text-text-secondary mt-1">{factChecks[msg.id].explanation}</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 md:p-6 border-t border-white/10">
            <div className="flex gap-2 md:gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your argument..."
                className="flex-1 bg-surface border border-white/10 rounded-xl px-4 md:px-6 py-3 md:py-4 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm md:text-base"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-4 md:px-8 py-3 md:py-4 gradient-bg rounded-xl font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 text-sm md:text-base"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Analysis Sidebar Toggle - hidden on mobile */}
        <button
          onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
          className={`hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 px-3 py-6 bg-surface border border-white/10 rounded-l-xl transition-all items-center justify-center`}
        >
          <span className="writing-vertical">📊 Analysis</span>
        </button>
      </div>
    </div>
  );
}
