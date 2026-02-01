// Type definitions for husband-match analysis

export interface ChannelData {
  channel_id: string;
  channel_title: string;
  channel_description: string;
}

export interface ChannelCategories {
  music: number;
  reading: number;
  sports: number;
  cooking: number;
  travel: number;
  gaming: number;
  tech: number;
  art: number;
  education: number;
  entertainment: number;
}

export interface TCIScores {
  NS: number; // Novelty Seeking (0-100)
  HA: number; // Harm Avoidance (0-100)
  RD: number; // Reward Dependence (0-100)
  P: number;  // Persistence (0-100)
  SD: number; // Self-Directedness (0-100)
  CO: number; // Cooperativeness (0-100)
  ST: number; // Self-Transcendence (0-100)
}

export interface EnneagramCenter {
  head: number;  // 0-100
  heart: number; // 0-100
  body: number;  // 0-100
}

export interface MBTIScores {
  E: number; // Extraversion (0-100)
  I: number; // Introversion (0-100)
  S: number; // Sensing (0-100)
  N: number; // Intuition (0-100)
  T: number; // Thinking (0-100)
  F: number; // Feeling (0-100)
  J: number; // Judging (0-100)
  P: number; // Perceiving (0-100)
}

export interface UserVector {
  // TCI dimensions (7)
  NS: number;
  HA: number;
  RD: number;
  P: number;
  SD: number;
  CO: number;
  ST: number;
  // Enneagram centers (3)
  head: number;
  heart: number;
  body: number;
  // Content categories (8 normalized)
  music: number;
  intellectual: number;
  physical: number;
  creative: number;
  tech: number;
  lifestyle: number;
  learning: number;
  entertainment: number;
}

export interface HusbandType {
  id: string;
  name: string;
  category: string; // e.g., "성장파트너형"
  subcategory: string; // e.g., "모험가"
  variant: 'extrovert' | 'introvert'; // E/I 변형
  description: string;
  idealVector: number[]; // 18-dimensional vector
  metaphor_e?: string; // Extrovert variant metaphor
  metaphor_i?: string; // Introvert variant metaphor
}

export interface Phase1Result {
  id: string;
  user_id: string;
  channel_categories: ChannelCategories;
  tci_scores: TCIScores;
  enneagram_center: EnneagramCenter;
  enneagram_type: number | null; // 1-9
  mbti_scores: MBTIScores;
  mbti_type: string | null; // e.g., "INFP"
  user_vector: number[]; // 18-dimensional
  matched_husband_type: string;
  match_score: number; // 0-1
  match_method: string;
  cards: ReportCard[];
  created_at: string;
}

export interface ReportCard {
  card_number: number;
  title: string;
  subtitle?: string;
  content: string;
  card_type: 'intro' | 'personality' | 'values' | 'matching' | 'result';
  tags?: string[];
  highlight?: string;
  metadata?: Record<string, any>;
}

export interface SurveyQuestion {
  id: string;
  question: string;
  type: 'choice' | 'text' | 'scale';
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface Phase2Survey {
  id: string;
  user_id: string;
  phase1_id: string;
  payment_id: string;
  survey_responses: Record<string, any>;
  submitted_at: string;
}

export interface Phase2Result {
  id: string;
  user_id: string;
  phase1_id: string;
  survey_id: string;
  payment_id: string;
  cross_validation_insights: {
    discrepancies: Array<{
      dimension: string;
      youtube_value: number;
      survey_value: number;
      interpretation: string;
    }>;
    hidden_desires: string[];
    authenticity_score: number;
  };
  deep_cards: ReportCard[];
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  phase1_id: string;
  amount: number;
  payment_method: string;
  order_id: string;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  paid_at: string | null;
  created_at: string;
}
