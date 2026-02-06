# CLAUDE.md - GIBUN 프로젝트 가이드

## 프로젝트 개요

**GIBUN (7일 내면 아이 찾기)** - AI 기반 심리 상담 플랫폼
- YouTube 데이터 분석 + 심리학 프레임워크(TCI, Enneagram, MBTI, CBT)를 결합하여 맞춤형 관계 인사이트 제공
- 7일 미션 프로그램, 감정 일기 AI 챗봇, 이상형 매칭 분석 기능 포함

## 기술 스택

- **프레임워크:** Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **스타일링:** Tailwind CSS v4 + Framer Motion + Pretendard 폰트
- **백엔드/DB:** Supabase (Auth + PostgreSQL)
- **AI:** OpenAI (GPT-4 Turbo, GPT-4o-mini)
- **외부 API:** Google APIs (YouTube), Kakao (알림 예정)
- **패키지 매니저:** npm

## 언어 규칙

- **기본 응답 언어:** 한국어
- **커밋 메시지:** 한국어로 작성
- **코드 주석:** 한국어로 작성
- **문서:** 한국어로 작성
- **변수명/함수명:** 영어 (코드 표준 준수)
- **타입/인터페이스명:** 영어 PascalCase

## 코딩 컨벤션

### 파일 명명 규칙
- 유틸리티/라이브러리: `camelCase.ts` (예: `openai-client.ts`, `calculate-tci.ts`)
- React 컴포넌트: `PascalCase.tsx` (예: `Header.tsx`, `CoreBeliefMission.tsx`)
- 페이지/레이아웃: `page.tsx`, `layout.tsx` (Next.js 규칙)

### 네이밍 컨벤션
- **변수/함수:** camelCase (`calculateTciScores`, `userVector`)
- **타입/인터페이스:** PascalCase (`TCIScores`, `HusbandType`, `Phase1Result`)
- **상수:** UPPER_SNAKE_CASE (`CORE_BELIEF_SENTENCES`, `ONBOARDING_QUESTIONS`)
- **컴포넌트:** PascalCase (`EmotionDiaryMission`, `PaymentGate`)

### 컴포넌트 패턴
- 서버 컴포넌트가 기본, 인터랙션 필요 시 `"use client"` 지시어 사용
- 서버 컴포넌트에서 인증 체크 후 리다이렉트 처리
- Props는 TypeScript 인터페이스로 명시적 타입 지정

### 임포트 경로
- `@/*` 경로 별칭 사용 (예: `@/lib/supabase/server`, `@/components/layout/Header`)

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router (페이지 + API)
│   ├── api/                # API 라우트 (analyze, auth, youtube, survey 등)
│   ├── dashboard/          # 사용자 대시보드 (보호된 라우트)
│   ├── coach/              # 코치/관리자 대시보드
│   ├── programs/           # 프로그램 소개 페이지
│   ├── payment/            # 결제 페이지
│   ├── login/              # 인증 페이지
│   └── actions/            # 서버 액션
├── components/             # 재사용 가능한 React 컴포넌트
│   ├── layout/             # Header, Footer
│   ├── missions/           # 미션별 컴포넌트
│   └── husband-match/      # 이상형 매칭 UI
├── lib/                    # 핵심 비즈니스 로직
│   ├── supabase/           # Supabase 클라이언트 (client, server, middleware)
│   ├── husband-match/      # 이상형 분석 (데이터, 분석, 프롬프트)
│   ├── missions/           # 7일 미션 콘텐츠
│   ├── onboarding/         # 초기 감정 평가
│   ├── emotion-diary/      # CBT 기반 감정 탐색
│   └── openai-client.ts    # OpenAI 클라이언트 (지연 초기화)
docs/                       # 미션 상세 가이드 및 구현 문서
```

## 주요 스크립트

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 실행
npm run lint         # ESLint 실행
```

## 환경 변수

`.env.local` 파일에 설정 필요:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 공개 키
- `OPENAI_API_KEY` - OpenAI API 키
- `COACH_EMAILS` - 코치 계정 이메일 (쉼표 구분)

## 테마/디자인 (Monotone 스타일)

### 디자인 원칙
- **모든 그라데이션 제거** → 순수 화이트 기반
- **검정색은 텍스트와 테두리에만 사용**
- **노란색(accent) 5% 미만으로 제한** (New 뱃지, 오픈 예정 등 특수 케이스만)
- **손그림 일러스트레이션 사용** (Monotone 스타일)

### CSS 변수

```css
:root {
  /* 기본 색상 - Monotone 스타일 */
  --background: #ffffff;
  --foreground: #191919;

  /* 노란색 accent - 5% 미만 사용 */
  --accent: #FFE812;
  --accent-hover: #f5de0f;
  --accent-muted: #fff8b8;

  /* 그레이 스케일 */
  --gray-50: #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #e5e5e5;
  --gray-300: #d4d4d4;
  --gray-400: #a3a3a3;
  --gray-500: #737373;

  /* 시맨틱 색상 */
  --border: #e5e5e5;
  --border-dark: #d4d4d4;
  --surface: #fafafa;
  --surface-hover: #f5f5f5;
}
```

### 버튼 스타일 시스템

```tsx
// Primary (흰색 + 검정 테두리) - 기본 CTA
className="bg-white border-2 border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--surface)]"

// Secondary (회색 테두리)
className="bg-white border border-[var(--border)] text-[var(--foreground)]/70 hover:border-[var(--foreground)]/50"

// 카카오 로그인 (브랜드 가이드라인 준수)
className="bg-[#FEE500] text-[#191919] hover:bg-[#FADA0A]"
```

### 노란색(accent) 사용 원칙

**사용 허용 (5% 미만)**
- "New", "오픈 예정" 등 뱃지
- 진행률 표시 완료 상태
- 특별한 강조가 필요한 텍스트 (아주 제한적)

**사용 금지**
- 기본 버튼 배경
- 링크 텍스트
- 차트/그래프 색상
- 폼 포커스 상태

### 손그림 일러스트레이션

**파일 위치**: `/public/doodles/`

| 파일명 | 용도 |
|--------|------|
| `heart-doodle.svg` | 상담 부트캠프 카드 |
| `chat-bubble.svg` | 1:1 상담 카드 |
| `star-sparkle.svg` | 금쪽 상담소 카드 |
| `arrow-squiggle.svg` | 스크롤 유도 |
| `plant-doodle.svg` | 힐링/성장 |
| `face-smile.svg` | 긍정 피드백 |
| `underline-wave.svg` | 제목 강조 |

**SVG 스타일 가이드**
- stroke만 사용 (fill 없음)
- stroke 색상: `#191919`
- stroke-width: 1.5~2.5
- stroke-linecap: round
- 손그림 느낌의 자연스러운 불규칙한 선

### 컴포넌트별 스타일 요약

| 컴포넌트 | 배경 | 테두리 | 특이사항 |
|----------|------|--------|----------|
| 카드 | `bg-white` | `border-2 border-[var(--foreground)]` | 손그림 일러스트 |
| 버튼 | `bg-white` | `border-2 border-[var(--foreground)]` | hover: `bg-[var(--surface)]` |
| 입력 필드 | `bg-white` | `border-2 border-[var(--border)]` | focus: `border-[var(--foreground)]` |
| 모달 | `bg-white` | `border-2 border-[var(--foreground)]` | |
| 차트 | - | - | 검정색 `#191919` |
| 프로그레스 dot | - | - | 활성: `bg-[var(--foreground)]` |

## 주의사항

- Supabase 클라이언트는 서버/브라우저 환경에 맞게 구분 사용 (`server.ts` vs `client.ts`)
- OpenAI 클라이언트는 싱글톤 지연 초기화 패턴 적용
- `useSearchParams` 사용 시 반드시 Suspense 바운더리로 감싸기
- API 라우트에서 인증 체크 필수 (`supabase.auth.getUser()`)

---

## 남편상 분석 파이프라인 (Husband Match)

### 개요
YouTube 구독 채널을 분석하여 심리 프로필(TCI, MBTI, Enneagram)을 추정하고, 이상형 남편 타입을 매칭하는 서비스.
Spotify Wrapped 스타일의 시각적 분석 카드 11장 제공.

### 핵심 파일 구조

```
src/lib/husband-match/
├── data/
│   ├── youtube-categories.ts    # 16개 YouTube 카테고리 + TCI 가중치 매트릭스
│   ├── categories.ts            # 10개 내부 카테고리 (기존)
│   └── husband-types.ts         # 48개 남편 타입 정의 + idealVector
├── analysis/
│   ├── youtube-analysis.ts      # YouTube 카테고리 분류, 희소성 계산, TCI 산출
│   ├── categorize-channels.ts   # LLM 기반 채널 카테고리 분류
│   ├── calculate-tci.ts         # TCI 7차원 점수 계산
│   ├── estimate-enneagram.ts    # 애니어그램 유형 추정
│   ├── estimate-mbti.ts         # MBTI 유형 추정
│   ├── create-vector.ts         # 18차원 사용자 벡터 생성
│   └── match-husband-type.ts    # 코사인 유사도 기반 매칭
├── prompts/
│   ├── card-prompts.ts          # 카드별 LLM 프롬프트 + 헬퍼 함수
│   └── system-prompt.ts         # LLM 시스템 프롬프트
└── types.ts                     # 타입 정의 (Phase1Result, ReportCard 등)

src/app/api/analyze/phase1/
└── run-from-channels.ts         # 메인 파이프라인 (카드 생성 + DB 저장)

src/components/husband-match/
├── ReportCard.tsx               # 카드 렌더링 (육각형 차트, 스크롤, 볼드 처리)
├── CardCarousel.tsx             # 카드 캐러셀 (스와이프, 애니메이션)
└── PaymentGate.tsx              # 결제 유도 카드

src/app/husband-match/report/[phase1_id]/
├── page.tsx                     # 리포트 페이지 (서버 컴포넌트)
└── Phase1ReportClient.tsx       # 클라이언트 렌더링 (hexagonData 전달)
```

### 11장 카드 구조

| # | 카드명 | subtitle | title | 특징 |
|---|--------|----------|-------|------|
| 1 | 커버 | INTRO | 고정 | 인트로 텍스트 (고정, LLM 미사용) |
| 2 | 구독 데이터 개요 | 구독 데이터 개요 | LLM 생성 | 육각형 TCI 차트 표시 |
| 3 | 카테고리 랭킹 | Your Subscription DNA | LLM 생성 (상위 N%) | 바 차트, 희소성 |
| 4 | 희귀 취향 | Hidden Gem in Your List | 고정 | 희소 카테고리, 시그니처 카피 |
| 5 | 통합 유형 분석 | LLM 생성 (영어) | LLM 생성 (한국어 타입명) | MBTI/애니어그램 명칭 금지 |
| 6 | 감성 | 감정 스타일 | 고정 | 감정 처리 방식, 힐링 패턴 |
| 7 | 미래 | 미래상 | 고정 | 3축 분석, 장면 묘사 |
| 8 | 단점 | 관계 인사이트 | 고정 | 힘든 상황 예시, 리프레이밍 |
| 9 | 왕자님 | 매칭 결과 | 고정 | 남편 타입 비유, 첫 만남 |
| 10 | 상세 프로필 | 파트너 프로필 | 고정 | 3개 장면 묘사 |
| 11 | 결제 유도 | Phase 2 안내 | 고정 | CTA ₩4,900 |

### 카드 콘텐츠 규격
- **모든 카드: 1,500-2,000자**
- 볼드 섹션 헤더: `**키워드: 요약 한 줄**`
- 볼드 전 줄바꿈 2회 (문단 여백)
- MBTI 4글자, 애니어그램 번호, TCI 척도명 직접 명시 금지

### YouTube 카테고리 시스템 (16개)

```typescript
// src/lib/husband-match/data/youtube-categories.ts
entertainment, vlog, music, gaming, food, beauty,
education, news, tech, sports, pets, kids,
asmr, finance, travel, other
```

### TCI 6축 가중치 매트릭스

각 카테고리가 6축(자기초월/자율성/자극추구/위험회피/인내력/연대감)에 기여:
- 주축: +3, 부축: +2, 보조축: +1
- 예: `entertainment: { NS: 3, CO: 2, SD: 1 }`

### 희소성 계산 (코사인 유사도)

```typescript
// 사용자 비율 벡터 vs 한국 평균 비율 벡터
similarity >= 0.95 → 상위 50%
similarity 0.85~0.95 → 상위 20~50%
similarity 0.70~0.85 → 상위 5~20%
similarity < 0.70 → 상위 5% 이하
```

### 육각형 스탯 정규화

```typescript
// Step 1-2: 가중 합산
rawScore[axis] = Σ(채널수 × 가중치)

// Step 3: 정규화 (최대 100, 최소 10)
normalized = max(10, (raw / maxRaw) × 100)

// Step 4: 분포 보정
- 한 축 80 이상 돌출 시 → 나머지 +7
- 두 축 이상 15 미만 시 → 해당 축 +5
```

### 분석 파이프라인 흐름

```
1. 채널 데이터 입력 (ChannelData[])
   ↓
2. YouTube 카테고리 분류 (LLM) → YouTubeCategoryResult[]
   ↓
3. 희소성 계산 (코사인 유사도) → RarityAnalysis
   ↓
4. TCI 6축 계산 (가중치 매트릭스) → YouTubeTCIScores
   ↓
5. 기존 분석 (categorize → TCI → Enneagram → MBTI → Vector)
   ↓
6. 남편 타입 매칭 (코사인 유사도)
   ↓
7. 11장 카드 생성 (LLM 또는 폴백)
   ↓
8. DB 저장 (phase1_results)
```

### 정책 (2026-02-06 확정)

| 항목 | 정책 |
|------|------|
| 테스트 횟수 | 1인 1회 (재분석 불가) |
| 리포트 보관 | 1년 (무료/유료 동일) |
| 환불 | 서베이 제출 전: 전액 / 제출 후: 불가 |
| 환불 신청 | 카카오톡 `gibun_studio` |
| 입금 확인 SLA | 24시간 이내 |
| 리포트 공개 SLA | 24시간 이내 |

### 주요 타입 정의

```typescript
// Phase1Result (DB 저장 구조)
interface Phase1Result {
  id: string;
  user_id: string;
  channel_categories: ChannelCategories;
  tci_scores: TCIScores;           // { NS, HA, RD, P, SD, CO, ST }
  enneagram_center: EnneagramCenter; // { head, heart, body }
  enneagram_type: number | null;   // 1-9
  mbti_scores: MBTIScores;
  mbti_type: string | null;        // "INFP" 등
  user_vector: number[];           // 18차원
  matched_husband_type: string;
  match_score: number;             // 0-1
  cards: ReportCard[];             // 11장
  created_at: string;
}

// ReportCard (카드 구조)
interface ReportCard {
  card_number: number;
  title: string;
  subtitle?: string;
  content: string;
  card_type: 'intro' | 'personality' | 'values' | 'matching' | 'result';
}
```

### 개발 시 주의사항

1. **카드 내용 수정**: `run-from-channels.ts`의 `generateFallbackCards()` + LLM 프롬프트 동시 수정
2. **카테고리 추가**: `youtube-categories.ts`의 `CATEGORY_TCI_WEIGHTS` 가중치 설정 필수
3. **새 분석 테스트**: 기존 `phase1_results` 삭제 후 재분석 필요 (기존 결과는 이전 형식)
4. **육각형 차트**: `Phase1ReportClient.tsx`에서 `hexagonData` prop으로 전달
5. **LLM 응답 형식**: JSON 필드명 (`2_title`, `3_title`, `5_subtitle` 등) 정확히 매칭
