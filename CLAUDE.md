# CLAUDE.md - GIBUN 프로젝트 가이드

## 프로젝트 개요

**GIBUN** - AI 기반 심리 상담 플랫폼 (YouTube 분석 + TCI/Enneagram/MBTI/CBT)

## 기술 스택

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4 + Framer Motion + Pretendard 폰트
- Supabase (Auth + PostgreSQL)
- Google Gemini (gemini-1.5-pro, gemini-2.0-flash)
- Google APIs (YouTube), Kakao

## 언어 규칙

- **응답/커밋/주석/문서:** 한국어
- **변수/함수명:** 영어 camelCase
- **타입/인터페이스/컴포넌트:** 영어 PascalCase
- **상수:** UPPER_SNAKE_CASE

## 코딩 컨벤션

- 유틸리티: `camelCase.ts`, 컴포넌트: `PascalCase.tsx`
- 서버 컴포넌트 기본, 인터랙션 시 `"use client"`
- 임포트: `@/*` 경로 별칭 사용

## 프로젝트 구조

```
src/
├── app/                    # 페이지 + API 라우트
├── components/             # layout/, missions/, husband-match/
└── lib/                    # supabase/, husband-match/, missions/, gemini-client.ts
```

## 환경 변수 (.env.local)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `COACH_EMAILS`

## 디자인 (Monotone 스타일)

- **그라데이션 금지** → 순수 화이트 기반
- **검정색:** 텍스트/테두리만 (`border-2 border-[var(--foreground)]`)
- **노란색(accent):** 5% 미만 (New 뱃지 등 특수 케이스만)
- **손그림 일러스트:** `/public/doodles/*.svg` (stroke만, fill 없음)
- CSS 변수는 `globals.css` 참조

## 주의사항

- Supabase: 서버(`server.ts`) / 브라우저(`client.ts`) 구분
- `useSearchParams` → Suspense 바운더리 필수
- API 라우트 인증 체크 필수

---

## 남편상 분석 (Husband Match)

YouTube 구독 채널 → 심리 프로필(TCI/MBTI/Enneagram) → 이상형 남편 타입 매칭
Phase 1 (9장) + Phase 2 (10장) 리포트 (Spotify Wrapped 스타일)

### 핵심 파일

```
src/lib/husband-match/
├── data/           # youtube-categories.ts, husband-types.ts (48개 타입)
├── analysis/       # youtube-analysis.ts, calculate-tci.ts, match-husband-type.ts
└── prompts/        # card-prompts.ts, phase2-prompts.ts

src/app/api/analyze/phase1/run-from-channels.ts  # Phase 1 메인 파이프라인
src/app/api/analyze/phase2/route.ts              # Phase 2 메인 파이프라인
src/components/husband-match/                     # ReportCard, CardCarousel, PaymentGate
```

### Phase 1: 9장 카드 구조 (무료 — "나는 어떤 사람인가")

| # | 카드명 | subtitle | title | 특징 |
|---|--------|----------|-------|------|
| 1 | 브릿지 인트로 | INTRO | 고정 | 화학 반응 비유, Phase 1/2 관계 설명 |
| 2 | 구독 데이터 개요 | 구독 데이터 개요 | LLM 생성 | 육각형 TCI 차트 |
| 3 | 기본 성격+기질 | LLM 생성 (영어) | LLM 생성 (한국어) | 성격, 세계관, 내면의 모순, 관계 |
| 4 | 관계 패턴+갈등 | 관계 패턴 | 고정 | 관계 행동, 갈등 해결, 반복 사이클 |
| 5 | 스트레스 반응 | 스트레스 반응 | 고정 | 분노 패턴, 트리거, 회복법 |
| 6 | 딜브레이커+행복 | 관계 인사이트 | 고정 | 참을 수 없는 것 + 행복 공식 |
| 7 | 매칭 결과 | 매칭 결과 | 고정 | 남편 타입 비유 |
| 8 | 매칭 결론 | 매칭 결론 | 고정 | 상세 프로필, 직업, 채널 |
| 9 | Phase 2 CTA | Phase 2 안내 | 고정 | 브릿지 카드, ₩9,900 |

### Phase 2: 10장 카드 구조 (유료 — "왜 그런 반응을 일으키는가")

| # | 카드명 | subtitle | title | 특징 |
|---|--------|----------|-------|------|
| 1 | 브릿지 교차검증 | 교차 검증 | LLM 생성 | Phase1→2 브릿지, YouTube vs 설문 |
| 2 | 인생 가치 | 가치관 | LLM 생성 | hiddenDesires + q14/q15 |
| 3 | 무의식 욕구 | 숨겨진 욕구 | LLM 생성 | 욕구 패턴 + q11 위안의 원천 |
| 4 | 자동적 사고 | 감정 도미노 | LLM 생성 | 5-Part CBT, 인지 왜곡 |
| 5 | 핵심 신념 | 관계 규칙 | LLM 생성 | q17/q18 중간신념→핵심신념 |
| 6 | 관계 영향 | 관계 패턴 | LLM 생성 | 핵심 신념→관계 패턴 연결 |
| 7 | 두려움 | 두려움 | LLM 생성 | q12 + coreBelief 추적 |
| 8 | 성장 포인트 | 성장 포인트 | LLM 생성 | q13 + 실천 3개 (관계/혼자/마음) |
| 9 | 심층 매칭 | 심층 매칭 | LLM 생성 | Phase 1 매칭 교차검증 |
| 10 | 마무리 편지 | 마무리 편지 | LLM 생성 | 전체 여정 요약 + 편지 |

### TCI 6축 가중치

각 YouTube 카테고리 → 6축(자기초월/자율성/자극추구/위험회피/인내력/연대감) 기여
- 주축: +3, 부축: +2, 보조축: +1

### 희소성 계산 (코사인 유사도)

```
사용자 비율 벡터 vs 한국 평균 비율 벡터
≥0.95 → 상위 50% | 0.85~0.95 → 상위 20~50% | 0.70~0.85 → 상위 5~20% | <0.70 → 상위 5%
```

### 육각형 스탯 정규화

```
1. rawScore[axis] = Σ(채널수 × 가중치)
2. normalized = max(10, (raw / maxRaw) × 100)
3. 분포 보정: 80+ 돌출 시 나머지 +7, 15 미만 2개+ 시 해당 +5
```

### 분석 파이프라인

```
채널 입력 → YouTube 카테고리 분류(LLM) → 희소성 계산 → TCI 6축 계산
→ Enneagram/MBTI 추정 → 18차원 벡터 → 남편 타입 매칭 → 9장 카드 생성 → DB 저장
→ (Phase 2) 설문 18문항 → 교차검증 + CBT 분석 → 10장 카드 생성 → DB 저장
```

### 비즈니스 정책

| 항목 | 정책 |
|------|------|
| 테스트 횟수 | 1인 1회 (재분석 불가) |
| 리포트 보관 | 1년 |
| 환불 | 서베이 제출 전: 전액 / 제출 후: 불가 |
| 환불 신청 | 카카오톡 `gibun_studio` |

### 주요 타입

```typescript
interface Phase1Result {
  id: string; user_id: string;
  tci_scores: TCIScores;           // { NS, HA, RD, P, SD, CO, ST }
  enneagram_type: number | null;   // 1-9
  mbti_type: string | null;        // "INFP"
  user_vector: number[];           // 18차원
  matched_husband_type: string;
  match_score: number;             // 0-1
  cards: ReportCard[];             // 9장
}

interface ReportCard {
  card_number: number; title: string; subtitle?: string;
  content: string; card_type: 'intro' | 'personality' | 'values' | 'matching' | 'result';
}
```

### 개발 주의사항

1. Phase 1 카드 수정: `run-from-channels.ts`의 `generateFallbackCards()` + LLM 프롬프트 동시
2. Phase 2 카드 수정: `phase2-prompts.ts` 프롬프트 + `phase2/route.ts` 메타데이터 동시
3. 카테고리 추가: `youtube-categories.ts`의 `CATEGORY_TCI_WEIGHTS` 필수
4. 새 분석 테스트: 기존 `phase1_results` 삭제 후 재분석
5. LLM 응답 형식: JSON 필드명 (`2_title`, `3_title`, `5_subtitle`) 정확히 매칭
