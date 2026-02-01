/**
 * STEP 1 감정 단어 → 8개 기본 감정 매핑
 * joy, trust, fear, surprise, sadness, disgust, anger, anticipation
 */
export const EMOTION_WORDS = [
  "자신있는", "기쁜", "감동적인", "재미있는", "사랑스러운", "자랑스러운", "행복한", "감사한",
  "부끄러운", "지루한", "신나는", "기대되는", "편안한", "뿌듯한", "만족스러운", "관심있는", "설레는",
  "용기있는", "귀찮은", "공허한", "열정적인", "홀가분한", "여유로운", "든든한", "놀라운", "부러운",
  "피곤한", "안타까운", "억울한", "답답한", "긴장한", "슬픈", "우울한", "그리운",
  "외로운", "좌절한", "막막한", "화난", "짜증나는", "미운", "불안한", "무서운", "혼란스러운", "당황한",
  "두려운", "후회스러운", "서운한", "미안한", "괴로운", "실망스러운",
] as const;

export type BasicEmotion = "joy" | "trust" | "fear" | "surprise" | "sadness" | "disgust" | "anger" | "anticipation";

export const WORD_TO_BASIC: Record<string, BasicEmotion> = {
  // joy
  자신있는: "joy", 기쁜: "joy", 감동적인: "joy", 재미있는: "joy", 사랑스러운: "joy",
  자랑스러운: "joy", 행복한: "joy", 감사한: "joy", 뿌듯한: "joy", 만족스러운: "joy",
  신나는: "joy", 편안한: "joy", 열정적인: "joy", 홀가분한: "joy", 여유로운: "joy",
  // trust
  든든한: "trust", 설레는: "trust", 관심있는: "trust", 용기있는: "joy",
  // fear
  긴장한: "fear", 불안한: "fear", 무서운: "fear", 두려운: "fear", 막막한: "fear",
  // surprise
  놀라운: "surprise", 혼란스러운: "surprise", 당황한: "surprise",
  // sadness
  슬픈: "sadness", 우울한: "sadness", 그리운: "sadness", 외로운: "sadness",
  피곤한: "sadness", 안타까운: "sadness", 괴로운: "sadness", 실망스러운: "sadness",
  좌절한: "sadness", 공허한: "sadness", 부끄러운: "sadness", 후회스러운: "sadness",
  // disgust
  지루한: "disgust", 미운: "disgust", 귀찮은: "disgust",
  // anger
  화난: "anger", 짜증나는: "anger", 억울한: "anger", 답답한: "anger", 서운한: "anger",
  미안한: "sadness",
  // anticipation
  기대되는: "anticipation", 부러운: "anticipation",
};

export const BASIC_EMOTION_LABELS: Record<BasicEmotion, string> = {
  joy: "기쁨",
  trust: "신뢰",
  fear: "두려움",
  surprise: "놀람",
  sadness: "슬픔",
  disgust: "혐오",
  anger: "분노",
  anticipation: "기대",
};
