import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDebateStore } from '../hooks/useDebateStore';

export default function Landing() {
  const { setShowAuth, user } = useDebateStore();

  useEffect(() => {
    // Could load online count here if needed
  }, []);

  const handleStart = () => {
    if (!user) {
      setShowAuth(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-primary/20 rounded-full blur-[100px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-secondary/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-48 md:w-64 h-48 md:h-64 bg-accent/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-4 md:mb-6">
              <span className="gradient-text">Debaters.AI</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-text-secondary mb-8 md:mb-12 px-4"
          >
            Find Your Opponent. Challenge Your Views.
          </motion.p>

          {/* User Badge */}
          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 px-4"
            >
              <div className="inline-flex items-center gap-3 glass-card px-4 py-2 rounded-full">
                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-sm font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">{user.username}</p>
                  <p className="text-xs text-text-secondary capitalize">{user.membership_tier}</p>
                </div>
                {user.is_guest && (
                  <span className="text-xs text-accent">{user.guest_calls_remaining} calls left</span>
                )}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center px-4"
          >
            <Link to="/topics" onClick={handleStart}>
              <button className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-primary hover:bg-primary/90 rounded-xl md:rounded-2xl font-semibold text-base md:text-lg transition-all duration-300 glow-primary hover:scale-105">
                <span className="flex items-center justify-center gap-2 md:gap-3">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Find a Debater
                </span>
              </button>
            </Link>

            <Link to="/inperson" onClick={handleStart}>
              <button className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-surface hover:bg-surface/80 border border-white/10 rounded-xl md:rounded-2xl font-semibold text-base md:text-lg transition-all duration-300 hover:scale-105">
                <span className="flex items-center justify-center gap-2 md:gap-3">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  In-Person Debate
                </span>
              </button>
            </Link>
          </motion.div>

          {/* Quick Access to Lobby */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8 md:mt-12"
          >
            <Link to="/lobby" onClick={handleStart}>
              <button className="px-6 md:px-8 py-2 md:py-3 bg-accent/20 hover:bg-accent/30 border border-accent/50 rounded-xl md:rounded-2xl font-semibold text-accent transition-all duration-300 hover:scale-105">
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Browse Active Debates
                </span>
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 px-4 bg-surface/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-16">
            <span className="gradient-text">How It Works</span>
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {[
              {
                icon: '🎯',
                title: 'Match with Opposing Views',
                description: 'Get paired with someone who holds a different perspective on your chosen topic.',
              },
              {
                icon: '🔍',
                title: 'Real-Time AI Fact-Checking',
                description: 'Local AI analyzes claims and provides verification instantly.',
              },
              {
                icon: '📊',
                title: 'Deep Conversation Analysis',
                description: 'Track sentiment, key arguments, and emotional moments throughout the debate.',
              },
              {
                icon: '🏠',
                title: 'Create Debate Lobbies',
                description: 'Post your argument and wait for challengers to join you.',
              },
              {
                icon: '👥',
                title: 'Browse Online Debaters',
                description: 'See who is online and ready to debate right now.',
              },
              {
                icon: '🎤',
                title: 'In-Person Mode',
                description: 'Place your phone between two people for live debate analysis.',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-5 md:p-6 md:p-8 hover:bg-white/10 transition-all duration-300"
              >
                <div className="text-4xl md:text-5xl mb-4 md:mb-6">{feature.icon}</div>
                <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-text-secondary text-sm md:text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Challenge Your Views?</h2>
          <p className="text-text-secondary mb-8">Join the debate and discover how others think differently.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/topics">
              <button className="w-full sm:w-auto px-8 py-4 gradient-bg rounded-2xl font-bold text-lg hover:scale-105 transition-all glow-primary">
                Start Debating
              </button>
            </Link>
            <Link to="/lobby">
              <button className="w-full sm:w-auto px-8 py-4 bg-surface hover:bg-white/10 border border-white/10 rounded-2xl font-semibold transition-all">
                Browse Debates
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 md:py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
          <p className="text-text-secondary text-xs md:text-sm">
            Debaters.AI — Challenge your perspective
          </p>
          <div className="flex items-center gap-4">
            {!user && (
              <button
                onClick={() => setShowAuth(true)}
                className="text-primary hover:underline text-xs md:text-sm"
              >
                Sign In / Register
              </button>
            )}
            {user && user.is_guest && (
              <button
                onClick={() => setShowAuth(true)}
                className="text-accent hover:underline text-xs md:text-sm"
              >
                Create Account ({user.guest_calls_remaining} calls left)
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
