import { motion } from 'framer-motion';
import { useDebateStore } from '../hooks/useDebateStore';
import { getMembershipStatus, startTrial, upgradeMembership } from '../services/api';
import { useState, useEffect } from 'react';

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MembershipModal({ isOpen, onClose }: MembershipModalProps) {
  const { sessionId, user } = useDebateStore();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && sessionId) {
      getMembershipStatus(sessionId).then(setStatus);
    }
  }, [isOpen, sessionId]);

  const handleStartTrial = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await startTrial(sessionId);
      getMembershipStatus(sessionId).then(setStatus);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleUpgrade = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await upgradeMembership(sessionId);
      getMembershipStatus(sessionId).then(setStatus);
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
        className="glass-card w-full max-w-lg p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 gradient-text">Membership</h2>

        {/* Current Status */}
        <div className="bg-surface/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Current Plan</p>
              <p className="text-2xl font-bold capitalize">{status?.tier || user?.membership_tier || 'free'}</p>
            </div>
            {user?.is_guest && (
              <div className="text-right">
                <p className="text-text-secondary text-sm">Guest Calls</p>
                <p className="text-xl font-bold text-accent">{user.guest_calls_remaining}</p>
              </div>
            )}
          </div>
          {status?.membership_expires && (
            <p className="text-text-secondary text-sm mt-2">
              Expires: {new Date(status.membership_expires).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Features Grid */}
        <div className="space-y-4 mb-8">
          <div className={`p-4 rounded-xl border ${status?.tier === 'free' ? 'border-accent' : 'border-white/10'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">Free</h3>
              <span className="text-text-secondary">$0</span>
            </div>
            <ul className="text-text-secondary text-sm space-y-1">
              <li>✓ 10 AI analysis calls</li>
              <li>✓ Join existing debates</li>
              <li>✗ Create lobby posts</li>
              <li>✗ Advanced analysis</li>
            </ul>
          </div>

          <div className={`p-4 rounded-xl border ${status?.tier === 'trial' ? 'border-primary bg-primary/20' : 'border-white/10'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">7-Day Trial</h3>
              <span className="text-primary">FREE</span>
            </div>
            <ul className="text-text-secondary text-sm space-y-1">
              <li>✓ Unlimited debates</li>
              <li>✓ Create lobby posts</li>
              <li>✓ Full analysis</li>
              <li>✓ No credit card required</li>
            </ul>
            {status?.tier === 'free' && (
              <button
                onClick={handleStartTrial}
                disabled={loading}
                className="w-full mt-4 py-2 bg-primary rounded-lg font-semibold hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Start Free Trial'}
              </button>
            )}
          </div>

          <div className={`p-4 rounded-xl border ${status?.tier === 'premium' ? 'border-accent bg-accent/20' : 'border-accent/50'}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-lg">Premium</h3>
                <span className="text-accent text-sm">BEST VALUE</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">$10</span>
                <span className="text-text-secondary">/mo</span>
              </div>
            </div>
            <ul className="text-text-secondary text-sm space-y-1">
              <li>✓ Unlimited AI calls</li>
              <li>✓ Create & join lobbies</li>
              <li>✓ Priority matching</li>
              <li>✓ Advanced analysis</li>
              <li>✓ No ads</li>
            </ul>
            {status?.tier !== 'premium' && (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full mt-4 py-2 bg-accent text-black rounded-lg font-semibold hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Upgrade to Premium'}
              </button>
            )}
          </div>
        </div>

        <button onClick={onClose} className="w-full py-3 bg-surface border border-white/10 rounded-xl">
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}
