import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDebateStore } from '../hooks/useDebateStore';
import { findMatch, cancelMatch } from '../services/api';

export default function WaitingRoom() {
  const navigate = useNavigate();
  const { topic, stance, setRoom, setSearching } = useDebateStore();
  const [position, setPosition] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topic || !stance) {
      navigate('/topics');
      return;
    }

    let interval: number;

    const checkMatch = async () => {
      try {
        const response = await findMatch(topic.id, stance);
        if (response.room_id) {
          setRoom(response.room_id, stance === 'pro' ? 'con' : 'pro');
          setSearching(false);
          navigate(`/room/${response.room_id}`);
        } else {
          setPosition(response.position);
          setEstimatedWait(response.estimated_wait || 0);
        }
      } catch (e) {
        setError('Failed to find match. Please try again.');
        setSearching(false);
      }
    };

    checkMatch();
    interval = window.setInterval(checkMatch, 5000);

    return () => {
      clearInterval(interval);
      cancelMatch().catch(() => {});
    };
  }, [topic, stance, navigate, setRoom, setSearching]);

  const handleCancel = async () => {
    await cancelMatch();
    setSearching(false);
    navigate('/topics');
  };

  if (!topic || !stance) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        {/* Animated Pulse */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-ring" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0 rounded-full bg-primary flex items-center justify-center">
            <span className="text-5xl">{topic.icon}</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4">Searching for Opponent</h1>
        <p className="text-text-secondary mb-2">
          Topic: <span className="text-white font-semibold">{topic.name}</span>
        </p>
        <p className="text-text-secondary mb-8">
          Your stance:{' '}
          <span className={stance === 'pro' ? 'text-pro-green' : 'text-con-red'}>
            {stance.toUpperCase()}
          </span>
        </p>

        {position && (
          <div className="glass-card p-6 mb-8">
            <p className="text-text-secondary mb-2">Queue position</p>
            <p className="text-4xl font-bold gradient-text">#{position}</p>
            {estimatedWait > 0 && (
              <p className="text-text-secondary text-sm mt-2">
                Estimated wait: ~{Math.ceil(estimatedWait / 60)} min
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-con-red/20 border border-con-red/50 rounded-xl p-4 mb-8">
            <p className="text-con-red">{error}</p>
          </div>
        )}

        <button
          onClick={handleCancel}
          className="px-8 py-3 bg-surface hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300"
        >
          Cancel & Go Back
        </button>
      </motion.div>
    </div>
  );
}
