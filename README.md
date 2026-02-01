# 7일 내면 아이 찾기

Next.js 기반의 심리 상담 플랫폼

## 주요 기능

- 온보딩 감정 테스트
- 7일 내면 아이 찾기 프로그램
- 1:1 심리 상담 예약
- 코치 모드 (관리자)

## 기술 스택

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + DB)
- OpenAI GPT (감정일기, 리포트 생성)

## 시작하기

### 1. 환경변수 설정

`.env.local` 파일 생성:

```bash
cp .env.local.example .env.local
```

필요한 환경변수:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `OPENAI_API_KEY` - OpenAI API 키
- `COACH_EMAILS` - 코치 계정 이메일 (쉼표 구분)

### 2. 개발 서버 실행

```bash
npm install
npm run dev
```

http://localhost:3000 접속

### 3. 빌드

```bash
npm run build
npm start
```

## 프로젝트 구조

```
/src
  /app                 # Next.js App Router 페이지
    /api               # API 라우트
    /auth              # 인증 콜백
    /coach             # 코치 모드
    /dashboard         # 수강생 대시보드
    /login             # 로그인
    /onboarding        # 감정 테스트
    /payment           # 결제
    /programs          # 프로그램 상세
  /components          # 재사용 컴포넌트
    /layout            # Header, Footer
    /missions          # 미션 컴포넌트
  /lib                 # 유틸리티, 데이터
    /auth              # 인증 관련
    /emotion-diary     # 감정일기
    /missions          # 미션 데이터
    /onboarding        # 온보딩 테스트
    /report            # 리포트 템플릿
    /supabase          # Supabase 클라이언트

/docs                  # 프로젝트 문서
  /missions            # 미션별 상세 문서
  /inspections         # 검사 상세 문서
  /templates           # 템플릿 문서
```

## 다음 단계

1. **Supabase 설정**
   - 프로젝트 생성
   - 테이블 스키마 구성 (users, purchases, missions, reports 등)
   - Auth 프로바이더 설정 (Kakao OAuth)

2. **데이터 레이어 연결**
   - 구매/입금 확인 플로우
   - 미션 제출 저장
   - 리포트 생성/퍼블리시

3. **카카오 알림톡 연동**
   - 비즈니스 계정 설정
   - 템플릿 승인
   - 발송 시점 구현

4. **배포**
   - Vercel 프로젝트 연결
   - 환경변수 설정
   - 도메인 연결

## 문서

자세한 내용은 `/docs` 폴더 참조:
- [전체 계획](docs/plan.md)
- [미션 상세](docs/missions/)
- [검사 상세](docs/inspections/)
- [템플릿](docs/templates/)
