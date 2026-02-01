# YouTube 구독 기반 남편상 분석 서비스 - 구현 완료 보고서

## 📊 구현 개요

**날짜**: 2026-02-01
**상태**: ✅ Claude Code 담당 부분 완료
**다음 단계**: Cursor에서 데이터 분석 파이프라인 구현 필요

---

## ✅ 완료된 작업 (Claude Code)

### 1. 프로젝트 구조 설정
- ✅ 모든 디렉토리 생성 완료
- ✅ `/src/app/husband-match/` - 5개 페이지 디렉토리
- ✅ `/src/components/husband-match/` - UI 컴포넌트
- ✅ `/src/lib/husband-match/` - 분석 로직 (스텁)
- ✅ `/src/app/api/` - 8개 API 라우트

### 2. 의존성 설치
```bash
✅ @anthropic-ai/sdk (Claude API - 계획 변경: OpenAI 사용 예정)
✅ googleapis (YouTube Data API v3)
✅ framer-motion (카드 애니메이션)
```

### 3. Supabase 스키마 업데이트
**파일**: `/docs/supabase-schema.sql`

추가된 테이블:
- ✅ `youtube_subscriptions` - YouTube 구독 데이터
- ✅ `phase1_results` - Phase 1 분석 결과 (10장 카드)
- ✅ `husband_match_payments` - 결제 내역
- ✅ `phase2_surveys` - Phase 2 서베이 응답
- ✅ `phase2_results` - Phase 2 심층 분석 결과 (8장 카드)

**RLS 정책**:
- ✅ 사용자는 자신의 데이터만 조회 가능
- ✅ 코치는 모든 데이터 조회 가능

### 4. Google OAuth & YouTube API 통합
**파일**:
- ✅ `/src/app/api/auth/google/route.ts` - OAuth 시작
- ✅ `/src/app/api/auth/google/callback/route.ts` - OAuth 콜백
- ✅ `/src/app/api/youtube/subscriptions/route.ts` - 구독 채널 수집

**기능**:
- Google OAuth 2.0 플로우
- YouTube readonly scope
- 구독 채널 데이터 Supabase 저장

**환경 변수 필요**:
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 5. UI 컴포넌트
**파일**:
- ✅ `/src/components/husband-match/CardCarousel.tsx` - 카드 슬라이드
- ✅ `/src/components/husband-match/ReportCard.tsx` - 리포트 카드
- ✅ `/src/components/husband-match/SurveyCard.tsx` - 서베이 질문 카드
- ✅ `/src/components/husband-match/PaymentGate.tsx` - 결제 유도 카드

**기능**:
- Framer Motion 애니메이션
- 스와이프/화살표 네비게이션
- 진행도 인디케이터
- 노션 스타일 디자인
- 공유 기능

### 6. 페이지 구현
**파일**:
- ✅ `/src/app/husband-match/onboarding/page.tsx` - Google 로그인
- ✅ `/src/app/husband-match/loading/page.tsx` - 분석 로딩
- ✅ `/src/app/husband-match/report/[phase1_id]/page.tsx` - Phase 1 리포트
- ✅ `/src/app/husband-match/payment/[phase1_id]/page.tsx` - 무통장 입금
- ✅ `/src/app/husband-match/payment/waiting/[payment_id]/page.tsx` - 입금 대기
- ✅ `/src/app/husband-match/survey/[phase1_id]/page.tsx` - Phase 2 서베이
- ✅ `/src/app/husband-match/deep-report/[phase2_id]/page.tsx` - Phase 2 리포트

### 7. API 라우트
**파일**:
- ✅ `/src/app/api/analyze/phase1/route.ts` - Phase 1 분석 (스텁)
- ✅ `/src/app/api/analyze/phase2/route.ts` - Phase 2 분석 (스텁)
- ✅ `/src/app/api/payment/create/route.ts` - 결제 생성
- ✅ `/src/app/api/survey/submit/route.ts` - 서베이 제출

### 8. 결제 시스템
**방식**: 무통장 입금 (신한은행)

**계좌 정보** (예시, 실제 계좌로 변경 필요):
- 은행: 신한은행
- 계좌번호: 110-123-456789
- 예금주: 이너차일드
- 금액: ₩4,900

**플로우**:
1. 사용자가 계좌 정보 확인
2. 입금자명 입력
3. 입금 완료 신청
4. 관리자 확인 대기
5. 확인 후 Phase 2 서베이 접근 가능

### 9. 홈페이지 업데이트
**파일**: `/src/app/page.tsx`

**변경 사항**:
- ✅ 새로운 남편상 분석 히어로 섹션 추가
- ✅ 기존 7일 프로그램 섹션 유지
- ✅ 두 서비스 병렬 표시

---

## ⏳ 다음 단계 (Cursor에서 구현 필요)

### 1. 데이터 정의 완성
**파일**: `/src/lib/husband-match/data/husband-types.ts`

**작업**:
- [ ] 48개 남편상 유형 전체 정의
  - 6개 카테고리 × 4개 서브타입 × 2개 변형(E/I)
  - 각 유형의 18차원 ideal vector 계산
  - E/I 변형 비유 작성

**현재 상태**: 2개 예시만 작성됨 (나머지 46개 필요)

### 2. 분석 파이프라인 구현
**디렉토리**: `/src/lib/husband-match/analysis/`

**구현 필요 파일**:

#### a. `categorize-channels.ts`
```typescript
// LLM을 사용해 YouTube 채널을 10개 카테고리로 분류
export async function categorizeChannels(
  channels: ChannelData[]
): Promise<ChannelCategories>
```
- OpenAI GPT-4 사용
- 프롬프트: 채널명 + 설명 → 카테고리 분류
- 출력: 각 카테고리별 채널 수

#### b. `calculate-tci.ts`
```typescript
// 카테고리 분포에서 TCI 7차원 점수 계산
export function calculateTCI(
  categories: ChannelCategories
): TCIScores
```
- 수학적 공식 사용 (문서 참조)
- 출력: NS, HA, RD, P, SD, CO, ST (0-100)

#### c. `estimate-enneagram.ts`
```typescript
// TCI + 카테고리로 애니어그램 추정
export function estimateEnneagram(
  tci: TCIScores,
  categories: ChannelCategories
): { center: EnneagramCenter; type: number }
```
- 3대 중심(Head/Heart/Body) 점수
- 9유형 추정 (1-9)

#### d. `estimate-mbti.ts`
```typescript
// TCI + 카테고리로 MBTI 추정
export function estimateMBTI(
  tci: TCIScores,
  categories: ChannelCategories
): { scores: MBTIScores; type: string }
```
- 4축 점수: E/I, S/N, T/F, J/P
- 4글자 타입 (예: "INFP")

#### e. `create-vector.ts`
```typescript
// 18차원 통합 벡터 생성
export function createVector(
  tci: TCIScores,
  enneagram: EnneagramCenter,
  categories: ChannelCategories
): number[]
```
- TCI 7차원 + 애니어그램 3차원 + 콘텐츠 8차원
- 정규화 필요

#### f. `match-husband-type.ts`
```typescript
// 남편상 매칭 (하이브리드 알고리즘)
export function matchHusbandType(
  vector: number[],
  mbti: MBTIScores,
  enneagram: number
): { type: HusbandType; score: number; method: string }
```
- 60% 코사인 유사도 (벡터)
- 20% MBTI 매칭
- 20% 애니어그램 매칭
- 최종 점수 0-1

### 3. LLM 프롬프트 작성
**디렉토리**: `/src/lib/husband-match/prompts/`

**구현 필요 파일**:

#### a. `system-prompt.ts`
```typescript
export const SYSTEM_PROMPT = `
당신은 심리 분석 전문가입니다.
...
`;
```

#### b. `card-prompts.ts`
```typescript
export const PHASE1_CARD_PROMPTS = {
  card_01_intro: (data) => `...`,
  card_02_personality: (data) => `...`,
  // ... 총 10개
};
```

**Phase 1 카드 10장**:
1. 인트로
2. 성격 프로필 (TCI)
3. 애니어그램 분석
4. MBTI 추정
5. 콘텐츠 취향
6. 가치관 분석
7. 관계 스타일
8. 남편상 매칭 결과
9. 비유와 인사이트
10. Phase 2 안내

#### c. `phase2-prompts.ts`
```typescript
export const PHASE2_CARD_PROMPTS = {
  card_01_cross_validation: (data) => `...`,
  // ... 총 8개
};
```

**Phase 2 카드 8장**:
1. 교차검증 서론
2. 숨겨진 욕구
3. 진짜 vs 이상
4. 심층 가치관
5. 관계 패턴
6. 성장 포인트
7. 최종 남편상
8. 액션 플랜

#### d. `metaphor-generator.ts`
```typescript
export async function generateMetaphor(
  context: string
): Promise<string>
```

### 4. API 라우트 업데이트
**파일**:
- `/src/app/api/analyze/phase1/route.ts`
- `/src/app/api/analyze/phase2/route.ts`

**작업**:
- [ ] 실제 분석 함수 호출 (현재는 스텁)
- [ ] LLM으로 카드 생성
- [ ] 에러 처리 강화

---

## 🔧 환경 설정 가이드

### 1. Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보" 이동
4. "OAuth 2.0 클라이언트 ID" 생성
   - 애플리케이션 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI: `http://localhost:3000/api/auth/google/callback`
5. YouTube Data API v3 활성화

### 2. .env.local 설정
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI (분석 파이프라인용)
OPENAI_API_KEY=your_openai_api_key

# Supabase (이미 설정되어 있음)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Supabase 마이그레이션
```bash
# Supabase SQL Editor에서 실행
cat docs/supabase-schema.sql
```

---

## 🚀 로컬 개발 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일 생성 (위 가이드 참조)

### 3. 개발 서버 시작
```bash
npm run dev
```

### 4. 접속
- 홈페이지: http://localhost:3000
- 남편상 분석: http://localhost:3000/husband-match/onboarding

---

## 📁 파일 구조

```
src/
├── app/
│   ├── page.tsx                          ✅ 업데이트됨 (두 서비스 표시)
│   ├── husband-match/                    ✅ 새로 생성
│   │   ├── onboarding/page.tsx           ✅ Google 로그인
│   │   ├── loading/page.tsx              ✅ 분석 로딩
│   │   ├── report/[phase1_id]/           ✅ Phase 1 리포트
│   │   ├── payment/[phase1_id]/          ✅ 무통장 입금
│   │   ├── payment/waiting/[payment_id]/ ✅ 입금 대기
│   │   ├── survey/[phase1_id]/           ✅ Phase 2 서베이
│   │   └── deep-report/[phase2_id]/      ✅ Phase 2 리포트
│   └── api/
│       ├── auth/google/                  ✅ OAuth
│       ├── youtube/subscriptions/        ✅ YouTube API
│       ├── analyze/phase1/               ⏳ 스텁 (파이프라인 필요)
│       ├── analyze/phase2/               ⏳ 스텁 (파이프라인 필요)
│       ├── payment/create/               ✅ 결제 생성
│       └── survey/submit/                ✅ 서베이 제출
├── components/husband-match/             ✅ 모두 완료
│   ├── CardCarousel.tsx
│   ├── ReportCard.tsx
│   ├── SurveyCard.tsx
│   └── PaymentGate.tsx
└── lib/husband-match/
    ├── types.ts                          ✅ 타입 정의
    ├── data/
    │   ├── categories.ts                 ✅ 10개 카테고리
    │   ├── survey-questions.ts           ✅ 9문항
    │   └── husband-types.ts              ⏳ 2/48 완성
    ├── analysis/                         ⏳ README만 작성됨
    │   └── README.md
    └── prompts/                          ⏳ README만 작성됨
        └── README.md
```

---

## 🎯 Cursor 구현 체크리스트

### 데이터 정의
- [ ] `husband-types.ts`: 48개 유형 완성
  - [ ] 각 유형의 설명
  - [ ] 18차원 ideal vector
  - [ ] E/I 변형 비유

### 분석 파이프라인
- [ ] `categorize-channels.ts`: LLM 채널 분류
- [ ] `calculate-tci.ts`: TCI 계산
- [ ] `estimate-enneagram.ts`: 애니어그램 추정
- [ ] `estimate-mbti.ts`: MBTI 추정
- [ ] `create-vector.ts`: 벡터 생성
- [ ] `match-husband-type.ts`: 매칭 알고리즘

### LLM 프롬프트
- [ ] `system-prompt.ts`: 공통 프롬프트
- [ ] `card-prompts.ts`: Phase 1 10장 프롬프트
- [ ] `phase2-prompts.ts`: Phase 2 8장 프롬프트
- [ ] `metaphor-generator.ts`: 비유 생성

### API 통합
- [ ] Phase 1 API에 파이프라인 연결
- [ ] Phase 2 API에 교차검증 로직 추가
- [ ] LLM 카드 생성 연결

---

## 🧪 테스트 시나리오

### Phase 1 (무료)
1. Google 로그인
2. YouTube 구독 채널 수집
3. 자동 분석 (30초)
4. 10장 카드 리포트 확인
5. 남편상 매칭 결과 확인

### Phase 2 (유료)
1. 결제 페이지 접속
2. 무통장 입금 정보 확인
3. 입금 후 입금자명 입력
4. 관리자 확인 대기
5. 확인 후 9문항 서베이 작성
6. 8장 심층 리포트 확인

---

## ⚠️ 주의사항

### 보안
- Google OAuth 토큰을 URL에 base64로 전달하는 방식은 임시 방편
- 프로덕션에서는 세션 또는 서버 저장 필요
- Supabase RLS 정책 철저히 테스트

### 성능
- YouTube 구독 채널이 많은 경우 페이지네이션 고려
- LLM 호출이 느릴 수 있으므로 타임아웃 설정
- Phase 1 분석은 백그라운드 작업 권장

### 비용
- OpenAI API 비용 모니터링
- YouTube API 할당량 확인 (일일 10,000 유닛)

---

## 📞 다음 단계

1. **Cursor로 이동**하여 데이터 파이프라인 구현
2. 프롬프트 PDF 문서 참조하여 정확한 로직 구현
3. 로컬 테스트 (mock 데이터 사용)
4. 프롬프트 튜닝 및 품질 개선
5. Vercel 배포

---

## 📝 참고 문서

- [커서 프롬프트 문서](PDF 파일 참조)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [OpenAI API Docs](https://platform.openai.com/docs)

---

**작성자**: Claude Code
**날짜**: 2026-02-01
**버전**: 1.0
