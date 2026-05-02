export type Stance = 'pro' | 'con';
export type RoomStatus = 'waiting' | 'active' | 'ended';
export type Verdict = 'verified' | 'disputed' | 'unverified';

export interface User {
  id: string;
  username: string;
  email?: string;
  created_at: string;
  is_guest: boolean;
  guest_calls_remaining: number;
  membership_tier: 'free' | 'trial' | 'premium';
  membership_expires?: string;
  political_views?: string;
  political_scale?: string;
  philosophical_views?: string;
  religious_views?: string;
  ethical_stances: Record<string, string>;
  bio?: string;
  topics_of_interest: string[];
  debates_completed: number;
  member_since?: string;
}

export interface LobbyPost {
  id: string;
  user_id: string;
  username: string;
  topic_id: string;
  topic_name: string;
  stance: Stance;
  title: string;
  argument: string;
  created_at: string;
  is_live: boolean;
  views: number;
}

export interface Topic {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  pro_claims: string[];
  con_claims: string[];
}

export interface Message {
  id: string;
  user_id: string;
  content: string;
  timestamp: string;
  stance: Stance;
  is_voice: boolean;
}

export interface FactCheck {
  claim: string;
  verdict: Verdict;
  confidence: number;
  sources: string[];
  explanation: string;
}

export interface KeyClaim {
  claim: string;
  stance: Stance;
  topic: string;
  importance: number;
}

export interface Analysis {
  topic: string;
  sub_topics: string[];
  sentiment: number;
  sentiment_label?: string;
  sentiment_user: number;
  sentiment_opponent: number;
  key_claims: KeyClaim[];
  argument_flow: string[];
  emotional_tone?: string[];
  emotional_moments: { text: string; intensity: number; participant: string }[];
  is_verifiable?: boolean;
}

export interface DebateRoom {
  id: string;
  topic_id: string;
  topic_name: string;
  participants: string[];
  status: RoomStatus;
  user_stance: Stance;
  opponent_stance: Stance;
}

export interface MatchResponse {
  room_id: string | null;
  position: number | null;
  estimated_wait: number | null;
}

export interface WSMessage {
  type: string;
  [key: string]: unknown;
}
