# 빠른 시작 가이드

## 1단계: 프로젝트 확인

```bash
cd /Users/untitle/innerchild
npm install  # 이미 설치됨
```

## 2단계: 환경변수 설정

`.env.local` 파일 생성:

```bash
cp .env.local.example .env.local
```

최소 설정 (로컬 테스트용):
```
# Supabase는 나중에 설정
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 코치 이메일 (테스트용)
COACH_EMAILS=coach@test.com

# OpenAI (감정일기/리포트용)
OPENAI_API_KEY=sk-xxx...
```

## 3단계: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 확인할 페이지

### Supabase 없이 확인 가능
- ✅ 홈 페이지: http://localhost:3000
- ✅ 온보딩 테스트: http://localhost:3000/onboarding
- ✅ 7일 프로그램: http://localhost:3000/programs/7day
- ✅ 1:1 상담: http://localhost:3000/programs/counseling
- ✅ 결제: http://localhost:3000/payment/7day

### Supabase 연동 후 확인 가능
- ⏳ 로그인: http://localhost:3000/login
- ⏳ 대시보드: http://localhost:3000/dashboard
- ⏳ 코치 모드: http://localhost:3000/coach

## 주요 기능 테스트

### 온보딩 감정 테스트
1. 홈에서 "카카오로 시작하기" 클릭
2. STEP 1: 감정 단어 3개 이상 선택
3. STEP 2: 12문항 답변
4. 결과 확인
5. "7일 프로그램 알아보기" CTA 클릭

### 7일 프로그램 (Supabase 연동 후)
1. 로그인
2. 대시보드 > 7일 내면 아이 찾기
3. 일자별 미션 카드 클릭
4. 감정일기 + 데일리 미션 수행

### 코치 모드 (Supabase 연동 후)
1. 코치 계정으로 로그인 (COACH_EMAILS에 있는 이메일)
2. `/coach` 접속
3. 입금 확인, 리포트 작성 등

## 문제 해결

### "Supabase가 설정되지 않았습니다"
→ `.env.local`에 Supabase URL/KEY 설정 필요

### "OpenAI API key not configured"
→ `.env.local`에 OPENAI_API_KEY 설정 필요

### 로그인 후 리다이렉트 안 됨
→ Supabase Auth 프로바이더 설정 확인

## 다음 단계

자세한 내용은 `docs/NEXT_STEPS.md` 참조
