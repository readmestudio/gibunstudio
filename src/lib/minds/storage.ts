/**
 * /minds 클라이언트 저장 키. 로그인이 없으므로, 분석을 완료한 리드의 id 를
 * 브라우저 localStorage 에 남겨 재방문 시 결과를 자동 복원하는 데 쓴다.
 * (서버 의존성 없는 순수 상수 — 클라이언트 컴포넌트에서 안전하게 import)
 */
export const MINDS_LEAD_STORAGE_KEY = "minds_lead_id";
