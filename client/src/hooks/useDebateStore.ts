import { create } from 'zustand';
import type { Stance, Topic, Message, FactCheck, User, LobbyPost } from '../types';

interface DebateState {
  // User
  user: User | null;
  sessionId: string | null;
  // Debate
  topic: Topic | null;
  stance: Stance | null;
  roomId: string | null;
  opponentStance: Stance | null;
  messages: Message[];
  factChecks: Record<string, FactCheck>;
  isConnected: boolean;
  isSearching: boolean;
  // Lobby
  lobbyPosts: LobbyPost[];
  currentPost: LobbyPost | null;
  // UI
  showAuth: boolean;
  showPreferences: boolean;
  showMembership: boolean;

  // Actions
  setUser: (user: User | null, sessionId: string | null) => void;
  setTopic: (topic: Topic | null) => void;
  setStance: (stance: Stance | null) => void;
  setRoom: (roomId: string | null, opponentStance: Stance | null) => void;
  addMessage: (message: Message) => void;
  addFactCheck: (messageId: string, factCheck: FactCheck) => void;
  setConnected: (connected: boolean) => void;
  setSearching: (searching: boolean) => void;
  setLobbyPosts: (posts: LobbyPost[]) => void;
  setCurrentPost: (post: LobbyPost | null) => void;
  setShowAuth: (show: boolean) => void;
  setShowPreferences: (show: boolean) => void;
  setShowMembership: (show: boolean) => void;
  decrementGuestCalls: () => void;
  reset: () => void;
}

export const useDebateStore = create<DebateState>((set) => ({
  user: null,
  sessionId: null,
  topic: null,
  stance: null,
  roomId: null,
  opponentStance: null,
  messages: [],
  factChecks: {},
  isConnected: false,
  isSearching: false,
  lobbyPosts: [],
  currentPost: null,
  showAuth: false,
  showPreferences: false,
  showMembership: false,

  setUser: (user, sessionId) => set({ user, sessionId }),
  setTopic: (topic) => set({ topic }),
  setStance: (stance) => set({ stance }),
  setRoom: (roomId, opponentStance) => set({ roomId, opponentStance }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  addFactCheck: (messageId, factCheck) => set((state) => ({
    factChecks: { ...state.factChecks, [messageId]: factCheck },
  })),
  setConnected: (connected) => set({ isConnected: connected }),
  setSearching: (searching) => set({ isSearching: searching }),
  setLobbyPosts: (posts) => set({ lobbyPosts: posts }),
  setCurrentPost: (post) => set({ currentPost: post }),
  setShowAuth: (show) => set({ showAuth: show }),
  setShowPreferences: (show) => set({ showPreferences: show }),
  setShowMembership: (show) => set({ showMembership: show }),
  decrementGuestCalls: () => set((state) => ({
    user: state.user ? {
      ...state.user,
      guest_calls_remaining: Math.max(0, state.user.guest_calls_remaining - 1)
    } : null,
  })),
  reset: () => set({
    topic: null,
    stance: null,
    roomId: null,
    opponentStance: null,
    messages: [],
    factChecks: {},
    isConnected: false,
    isSearching: false,
    currentPost: null,
  }),
}));
