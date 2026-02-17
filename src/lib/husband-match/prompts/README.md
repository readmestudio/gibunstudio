# LLM Prompts

Phase 1/Phase 2 리포트 카드 생성에 사용되는 프롬프트 및 유틸리티 모듈.

## 카드 생성 구조

실제 카드 프롬프트는 `src/app/api/analyze/phase1/run-from-channels.ts`에서 **11장 카드 구조**로 직접 생성됩니다.

## Files

### 1. `system-prompt.ts`
- **Purpose**: 카드 생성용 공통 시스템 프롬프트
- **Export**: `SYSTEM_PROMPT` string constant

### 2. `card-prompts.ts`
- **Purpose**: 카드 생성에 사용되는 타입 정의 및 유틸리티 함수
- **Exports**:
  - `Phase1CardData` — 카드 생성 입력 데이터 타입
  - `ENNEAGRAM_NAMES` — 애니어그램 한글 이름 매핑
  - `TCI_NAMES` — TCI 척도 한글명
  - `TCI_CHARACTERISTICS` — TCI 척도별 high/low 특성 설명
  - `getSortedCategories()` — 카테고리 분포를 정렬된 배열로 반환
  - `getTopTCIScores()` — TCI 상위 척도 반환
  - `getBottomTCIScores()` — TCI 하위 척도 반환
  - `getTCICharacteristics()` — TCI 점수 기반 특성 문장 생성

### 3. `phase2-prompts.ts`
- **Purpose**: Phase 2 심층 분석 카드 프롬프트 (8장)
- **Export**: `PHASE2_CARD_PROMPTS` object

### 4. `metaphor-generator.ts`
- **Purpose**: 성격 인사이트에 대한 비유 생성
- **Export**: `generateMetaphor(context: string)` async function

## Phase 1 카드 구조 (11장)

| # | 카드명 | subtitle | title | 특징 |
|---|--------|----------|-------|------|
| 1 | 커버 | INTRO | 고정 | 인트로 (LLM 미사용) |
| 2 | 구독 데이터 개요 | 구독 데이터 개요 | LLM 생성 | 육각형 TCI 차트 |
| 3 | 카테고리 랭킹 | Your Subscription DNA | LLM 생성 (상위 N%) | 바 차트, 희소성 |
| 4 | 희귀 취향 | Hidden Gem in Your List | 고정 | 희소 카테고리 |
| 5 | 통합 유형 분석 | LLM 생성 (영어) | LLM 생성 (한국어) | MBTI/애니어그램 명칭 금지 |
| 6 | 감성 | 감정 스타일 | 고정 | 감정 처리, 힐링 패턴 |
| 7 | 미래 | 미래상 | 고정 | 3축 분석 |
| 8 | 단점 | 관계 인사이트 | 고정 | 리프레이밍 |
| 9 | 왕자님 | 매칭 결과 | 고정 | 남편 타입 비유 |
| 10 | 상세 프로필 | 파트너 프로필 | 고정 | 3개 장면 묘사 |
| 11 | 결제 유도 | Phase 2 안내 | 고정 | CTA ₩9,900 |

## Phase 2 카드 구조 (8장)

1. **교차검증 서론**: Intro to cross-validation
2. **숨겨진 욕구**: Hidden desires from discrepancies
3. **진짜 vs 이상**: YouTube (real) vs Survey (ideal) gap
4. **심층 가치관**: Deep values analysis
5. **관계 패턴**: Relationship patterns
6. **성장 포인트**: Growth opportunities
7. **최종 남편상**: Refined husband type match
8. **액션 플랜**: Practical next steps
