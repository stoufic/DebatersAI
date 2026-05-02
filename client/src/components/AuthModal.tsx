import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebateStore } from '../hooks/useDebateStore';
import { register, login, guestLogin } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { setUser, setShowPreferences } = useDebateStore();
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await login(username, password);
      } else if (mode === 'register') {
        if (!email.includes('@')) {
          setError('Please enter a valid email');
          setLoading(false);
          return;
        }
        result = await register(username, email, password);
      } else {
        result = await guestLogin();
      }

      if (result.detail) {
        setError(result.detail);
      } else {
        setUser(result.user, result.session_id);
        onClose();
        // If new user or guest, show preferences
        if (mode === 'register') {
          setShowPreferences(true);
        }
      }
    } catch {
      setError('Connection error. Please try again.');
    }

    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6 text-center gradient-text">
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Join Debaters.AI' : 'Continue as Guest'}
            </h2>

            {mode === 'guest' ? (
              <div className="text-center">
                <p className="text-text-secondary mb-6">
                  Browse and join debates with 10 free calls. Create an account for unlimited access.
                </p>
                <div className="bg-surface/50 rounded-xl p-4 mb-6">
                  <p className="text-accent font-semibold">Guest limitations:</p>
                  <ul className="text-text-secondary text-sm mt-2 space-y-1">
                    <li>• 10 free AI analysis calls</li>
                    <li>• Cannot create lobby posts</li>
                    <li>• Can join existing debates</li>
                    <li>• Upgrade anytime for $10/mo</li>
                  </ul>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                {mode === 'register' && (
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </form>
            )}

            {error && (
              <div className="bg-con-red/20 border border-con-red/50 rounded-xl p-3 mt-4">
                <p className="text-con-red text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full gradient-bg py-3 rounded-xl font-semibold mt-6 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Continue as Guest'}
            </button>

            <div className="mt-6 text-center space-y-3">
              {mode !== 'guest' && (
                <>
                  <button
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-primary hover:underline text-sm"
                  >
                    {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-surface px-4 text-text-secondary">or</span>
                    </div>
                  </div>
                </>
              )}
              <button
                onClick={() => setMode('guest')}
                className="text-text-secondary hover:text-white text-sm"
              >
                Continue as Guest
              </button>
            </div>

            <button
              onClick={onClose}
              className="mt-4 text-text-secondary hover:text-white text-sm"
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
