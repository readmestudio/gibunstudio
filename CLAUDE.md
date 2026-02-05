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

## 테마/디자인

```
--background: #ffffff (흰색)
--foreground: #191919 (다크 그레이)
--accent: #FFE812 (노란색 - 브랜드 컬러)
--accent-hover: #f5de0f
--accent-muted: #fff8b8
--border: #e5e5e5
--surface: #fafafa
```

## 주의사항

- Supabase 클라이언트는 서버/브라우저 환경에 맞게 구분 사용 (`server.ts` vs `client.ts`)
- OpenAI 클라이언트는 싱글톤 지연 초기화 패턴 적용
- `useSearchParams` 사용 시 반드시 Suspense 바운더리로 감싸기
- API 라우트에서 인증 체크 필수 (`supabase.auth.getUser()`)
