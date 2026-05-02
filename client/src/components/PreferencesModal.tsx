import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDebateStore } from '../hooks/useDebateStore';
import { updatePreferences } from '../services/api';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POLITICAL_SCALES = [
  { value: '1-2', label: 'Far Left', desc: 'Strong progressive/liberal' },
  { value: '3-4', label: 'Left', desc: 'Progressive/liberal' },
  { value: '5-6', label: 'Center', desc: 'Moderate/centrist' },
  { value: '7-8', label: 'Right', desc: 'Conservative' },
  { value: '9-10', label: 'Far Right', desc: 'Strong conservative' },
];

const TOPIC_OPTIONS = [
  { id: 'politics', name: 'Politics', icon: '🏛️' },
  { id: 'philosophy', name: 'Philosophy', icon: '🧠' },
  { id: 'ethics', name: 'Ethics', icon: '⚖️' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'religion', name: 'Religion', icon: '⛪' },
  { id: 'social', name: 'Social Issues', icon: '👥' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'culture', name: 'Culture', icon: '🎭' },
];

export default function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const { sessionId } = useDebateStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [prefs, setPrefs] = useState({
    political_views: '',
    political_scale: '',
    philosophical_views: '',
    religious_views: '',
    bio: '',
    topics_of_interest: [] as string[],
  });

  const toggleTopic = (topicId: string) => {
    setPrefs((p) => ({
      ...p,
      topics_of_interest: p.topics_of_interest.includes(topicId)
        ? p.topics_of_interest.filter((t) => t !== topicId)
        : [...p.topics_of_interest, topicId],
    }));
  };

  const handleSave = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await updatePreferences(sessionId, prefs);
      onClose();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2 gradient-text">Tell Us About You</h2>
        <p className="text-text-secondary mb-6">Help us match you with the best debate partners.</p>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-primary' : 'bg-surface'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Political Views</h3>
            <p className="text-text-secondary text-sm">Where do you generally fall on the political spectrum?</p>
            <div className="grid grid-cols-1 gap-3">
              {POLITICAL_SCALES.map((scale) => (
                <button
                  key={scale.value}
                  onClick={() => setPrefs((p) => ({ ...p, political_scale: scale.value }))}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    prefs.political_scale === scale.value
                      ? 'border-primary bg-primary/20'
                      : 'border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="font-semibold">{scale.label}</div>
                  <div className="text-text-secondary text-sm">{scale.desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm text-text-secondary mb-2">Describe your political views (optional)</label>
              <textarea
                value={prefs.political_views}
                onChange={(e) => setPrefs((p) => ({ ...p, political_views: e.target.value }))}
                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="E.g., I'm generally progressive but believe in some market economics..."
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Philosophical Views</h3>
            <p className="text-text-secondary text-sm">What philosophical frameworks resonate with you?</p>
            <textarea
              value={prefs.philosophical_views}
              onChange={(e) => setPrefs((p) => ({ ...p, philosophical_views: e.target.value }))}
              className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="E.g., I'm influenced by utilitarian thinking but also value deontological ethics..."
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Religious Views</h3>
            <p className="text-text-secondary text-sm">What's your religious or spiritual perspective?</p>
            <textarea
              value={prefs.religious_views}
              onChange={(e) => setPrefs((p) => ({ ...p, religious_views: e.target.value }))}
              className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="E.g., I'm an atheist who respects religious traditions, or I'm a Christian who..."
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Topics of Interest</h3>
            <p className="text-text-secondary text-sm">Select the debate topics you're most interested in</p>
            <div className="grid grid-cols-2 gap-3">
              {TOPIC_OPTIONS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    prefs.topics_of_interest.includes(topic.id)
                      ? 'border-primary bg-primary/20'
                      : 'border-white/10 hover:bg-white/5'
                  }`}
                >
                  <span className="text-2xl mr-2">{topic.icon}</span>
                  <span className="font-semibold">{topic.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm text-text-secondary mb-2">Bio (optional)</label>
              <textarea
                value={prefs.bio}
                onChange={(e) => setPrefs((p) => ({ ...p, bio: e.target.value }))}
                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="A brief description about yourself for debate partners..."
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-6 py-3 bg-surface border border-white/10 rounded-xl"
            >
              Back
            </button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-3 gradient-bg rounded-xl font-semibold hover:scale-[1.02]"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 gradient-bg rounded-xl font-semibold hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
