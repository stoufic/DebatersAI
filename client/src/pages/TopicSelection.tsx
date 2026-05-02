import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDebateStore } from '../hooks/useDebateStore';
import { fetchTopics } from '../services/api';
import type { Topic, Stance } from '../types';

export default function TopicSelection() {
  const navigate = useNavigate();
  const { topic, stance, setTopic, setStance, setSearching } = useDebateStore();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(topic);
  const [selectedStance, setSelectedStance] = useState<Stance | null>(stance);

  useEffect(() => {
    fetchTopics().then(setTopics).catch(console.error);
  }, []);

  const handleStartMatchmaking = () => {
    if (selectedTopic && selectedStance) {
      setTopic(selectedTopic);
      setStance(selectedStance);
      setSearching(true);
      navigate('/waiting');
    }
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Choose Your Battleground</span>
          </h1>
          <p className="text-text-secondary text-lg">Select a topic and pick your stance</p>
        </motion.div>

        {/* Stance Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-4 text-center">What's Your Position?</h2>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setSelectedStance('pro')}
              className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                selectedStance === 'pro'
                  ? 'bg-pro-green text-white glow-primary scale-105'
                  : 'bg-surface hover:bg-white/10 border border-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-2xl">✓</span> Pro
              </span>
            </button>
            <button
              onClick={() => setSelectedStance('con')}
              className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                selectedStance === 'con'
                  ? 'bg-con-red text-white glow-primary scale-105'
                  : 'bg-surface hover:bg-white/10 border border-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-2xl">✗</span> Con
              </span>
            </button>
          </div>
        </motion.div>

        {/* Topic Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {topics.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              onClick={() => setSelectedTopic(t)}
              className={`glass-card p-6 text-left transition-all duration-300 hover:scale-[1.02] ${
                selectedTopic?.id === t.id
                  ? 'ring-2 ring-primary bg-primary/20'
                  : 'hover:bg-white/10'
              }`}
            >
              <div className="text-4xl mb-3">{t.icon}</div>
              <h3 className="text-lg font-semibold mb-1">{t.name}</h3>
              <p className="text-text-secondary text-sm">{t.description}</p>
            </motion.button>
          ))}
        </div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <button
            onClick={handleStartMatchmaking}
            disabled={!selectedTopic || !selectedStance}
            className={`px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-300 ${
              selectedTopic && selectedStance
                ? 'gradient-bg hover:scale-105 glow-primary'
                : 'bg-surface/50 text-text-secondary cursor-not-allowed'
            }`}
          >
            Find Opponent
          </button>
        </motion.div>
      </div>
    </div>
  );
}
