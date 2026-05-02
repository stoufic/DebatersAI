import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebateStore } from '../hooks/useDebateStore';
import { getLobbyPosts, createLobbyPost, joinLobbyPost, fetchTopics } from '../services/api';
import type { Topic as TopicType } from '../types';

export default function Lobby() {
  const navigate = useNavigate();
  const { sessionId, user, setRoom, setLobbyPosts, lobbyPosts, setShowAuth } = useDebateStore();
  const [topics, setTopics] = useState<TopicType[]>([]);
  const [filterTopic, setFilterTopic] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<{ title: string; argument: string; topicId: string; stance: 'pro' | 'con' }>({ title: '', argument: '', topicId: '', stance: 'pro' });

  useEffect(() => {
    fetchTopics().then(setTopics);
    loadPosts();
  }, [filterTopic]);

  const loadPosts = () => {
    getLobbyPosts(filterTopic || undefined).then((data) => {
      setLobbyPosts(data.posts || []);
    });
  };

  const handleCreate = async () => {
    if (!sessionId) {
      setShowAuth(true);
      return;
    }
    if (!createForm.title || !createForm.argument || !createForm.topicId) return;

    setCreating(true);
    try {
      const result = await createLobbyPost(sessionId, createForm.topicId, createForm.title, createForm.argument, createForm.stance);
      if (result.post) {
        setShowCreate(false);
        setCreateForm({ title: '', argument: '', topicId: '', stance: 'pro' });
        loadPosts();
      }
    } catch (e) {
      console.error(e);
    }
    setCreating(false);
  };

  const handleJoin = async (postId: string) => {
    if (!sessionId) {
      setShowAuth(true);
      return;
    }

    try {
      const result = await joinLobbyPost(postId, sessionId);
      if (result.room_id) {
        setRoom(result.room_id, 'con');
        navigate(`/room/${result.room_id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Debate Lobbies</span>
          </h1>
          <p className="text-text-secondary">
            Browse active debates or post your own argument for others to challenge.
          </p>
        </motion.div>

        {/* Stats Bar */}
        <div className="glass-card p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{lobbyPosts.length}</p>
              <p className="text-text-secondary text-xs">Active Posts</p>
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (user?.membership_tier === 'free' && user?.is_guest) {
                  setShowAuth(true);
                } else {
                  setShowCreate(true);
                }
              }}
              className="px-4 py-2 gradient-bg rounded-lg font-semibold text-sm hover:scale-[1.02] transition-all"
            >
              + Post Argument
            </button>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {lobbyPosts.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-text-secondary mb-4">No active debates right now.</p>
              <p className="text-text-secondary text-sm">Be the first to post your argument!</p>
            </div>
          ) : (
            lobbyPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6 hover:bg-white/5 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        post.stance === 'pro' ? 'bg-pro-green/20 text-pro-green' : 'bg-con-red/20 text-con-red'
                      }`}>
                        {post.stance.toUpperCase()}
                      </span>
                      <span className="text-text-secondary text-sm">{post.topic_name}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                    <p className="text-text-secondary text-sm mb-3 line-clamp-2">{post.argument}</p>
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <span>by {post.username}</span>
                      <span>{post.views} views</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoin(post.id)}
                    className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg font-semibold text-sm transition-all whitespace-nowrap"
                  >
                    Challenge
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Create Post Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreate(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="glass-card w-full max-w-lg p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-bold mb-4 gradient-text">Post Your Argument</h2>
                <p className="text-text-secondary text-sm mb-6">
                  Write a clear, thought-provoking argument and wait for someone to challenge you.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">Topic</label>
                    <select
                      value={createForm.topicId}
                      onChange={(e) => setCreateForm((p) => ({ ...p, topicId: e.target.value }))}
                      className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3"
                    >
                      <option value="">Select a topic...</option>
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Your Stance</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCreateForm((p) => ({ ...p, stance: 'pro' }))}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                          createForm.stance === 'pro'
                            ? 'bg-pro-green text-white'
                            : 'bg-surface border border-white/10'
                        }`}
                      >
                        ✓ Pro
                      </button>
                      <button
                        onClick={() => setCreateForm((p) => ({ ...p, stance: 'con' }))}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                          createForm.stance === 'con'
                            ? 'bg-con-red text-white'
                            : 'bg-surface border border-white/10'
                        }`}
                      >
                        ✗ Con
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Title</label>
                    <input
                      type="text"
                      value={createForm.title}
                      onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                      className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3"
                      placeholder="E.g., Universal Basic Income would benefit society"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Your Argument</label>
                    <textarea
                      value={createForm.argument}
                      onChange={(e) => setCreateForm((p) => ({ ...p, argument: e.target.value }))}
                      className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 h-32 resize-none"
                      placeholder="Present your argument clearly. The better your argument, the more likely someone will want to debate you!"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-3 bg-surface border border-white/10 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !createForm.title || !createForm.argument || !createForm.topicId}
                    className="flex-1 py-3 gradient-bg rounded-xl font-semibold disabled:opacity-50"
                  >
                    {creating ? 'Posting...' : 'Post Argument'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
