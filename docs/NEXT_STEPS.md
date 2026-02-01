# 다음 단계 가이드

## 즉시 실행 가능

### 1. 개발 서버 시작
```bash
npm run dev
```
http://localhost:3000 접속

### 2. 확인 가능한 페이지
- `/` - 홈 페이지
- `/onboarding` - 감정 테스트 (로그인 불필요)
- `/programs/7day` - 7일 프로그램 상세
- `/programs/counseling` - 1:1 상담 상세
- `/payment/7day` - 결제 페이지

## Supabase 연동 (필수)

### 1. Supabase 프로젝트 생성
1. https://supabase.com 회원가입/로그인
2. "New Project" 클릭
3. 프로젝트 이름, 비밀번호, 리전 설정
4. 생성 완료 (약 2분 소요)

### 2. 환경변수 설정
1. Supabase Dashboard > Settings > API
2. Project URL, anon public key 복사
3. `.env.local` 파일 생성:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   ```

### 3. 데이터베이스 스키마 생성
1. Supabase Dashboard > SQL Editor
2. `docs/supabase-schema.sql` 파일 열기
3. 전체 내용 복사하여 SQL Editor에 붙여넣기
4. Run 클릭

### 4. 카카오 OAuth 설정
1. https://developers.kakao.com 로그인
2. 애플리케이션 추가
3. REST API 키 복사
4. Supabase Dashboard > Authentication > Providers > Kakao
5. Client ID (REST API 키), Client Secret 입력
6. Redirect URL: `https://xxx.supabase.co/auth/v1/callback`
7. Kakao Developers > 내 애플리케이션 > 플랫폼 > Web
   - Redirect URI 추가: `https://xxx.supabase.co/auth/v1/callback`

### 5. 코치 계정 지정
`.env.local`에 추가:
```
COACH_EMAILS=your-coach-email@example.com
```

### 6. 코치 계정 생성 (비밀번호 설정)
코치 로그인은 Supabase Auth의 이메일/비밀번호 방식을 사용합니다. Supabase 대시보드에서 사용자를 직접 추가해야 합니다.

1. Supabase Dashboard > **Authentication** > **Users**
2. **Add user** > **Create new user** 클릭
3. Email: 코치 이메일 (예: `fibillionwave@gmail.com`), Password: 원하는 비밀번호 입력
4. **Create user** 클릭
5. 이후 `/login/coach`에서 해당 이메일·비밀번호로 로그인

(선택) `coach_accounts` 테이블에 레코드 추가:
```sql
INSERT INTO public.coach_accounts (id, email)
SELECT id, email FROM auth.users WHERE email = 'your-coach@example.com';
```
현재 로직은 `COACH_EMAILS` env만 사용하므로, .env.local에 이메일이 있으면 이 단계는 생략 가능합니다.

### 7. 개발 서버 재시작
```bash
npm run dev
```

이제 로그인, 대시보드, 미션 제출이 작동합니다.

## OpenAI API 연동 (감정일기, 리포트)

### 1. OpenAI API 키 발급
1. https://platform.openai.com 로그인
2. API keys 메뉴
3. "Create new secret key" 클릭
4. 키 복사

### 2. 환경변수 추가
`.env.local`에 추가:
```
OPENAI_API_KEY=sk-xxx...
```

### 3. 개발 서버 재시작
이제 감정일기 대화와 리포트 자동 생성이 작동합니다.

## 카카오 알림톡 연동 (추후)

### 1. 카카오 비즈니스 계정
1. https://business.kakao.com 가입
2. 비즈니스 인증
3. 알림톡 채널 생성

### 2. 템플릿 승인
- 입금 확인 알림
- TCI 검사 링크 발송
- 리포트 완성 알림
- 예약 확정 알림

### 3. API 연동
- 카카오 알림톡 API 키 발급
- 발송 로직 구현

## 배포 (Vercel)

### 1. Vercel 프로젝트 연결
1. https://vercel.com 로그인
2. "Add New Project"
3. GitHub 저장소 연결
4. 환경변수 설정 (Supabase, OpenAI, COACH_EMAILS)
5. Deploy

### 2. 도메인 연결
1. Vercel Dashboard > Domains
2. 커스텀 도메인 추가
3. DNS 설정

### 3. Supabase Redirect URL 업데이트
- Supabase Dashboard > Authentication > URL Configuration
- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/auth/callback`

## 데이터 레이어 구현 (추후 작업)

현재 UI와 구조는 완성되었으나, 실제 데이터 저장/조회는 Supabase 연동 후 구현 필요:

1. **구매 플로우**
   - 결제 완료 시 purchases 테이블에 저장
   - 코치 입금 확인 시 status='confirmed', d1_date 설정

2. **미션 제출**
   - mission_submissions 테이블에 저장
   - 일자별 완료 현황 조회

3. **감정일기**
   - 대화 내역 저장
   - 일차별 진행 상태 추적

4. **리포트**
   - 로우데이터 조회 및 ChatGPT 생성
   - reports 테이블에 저장
   - 퍼블리시 시 유저에게 알림

5. **예약 시스템**
   - counseling_bookings 테이블 CRUD
   - 코치 가능 시간대 관리
   - 예약 확정 및 줌 링크 전달

## 현재 상태

- ✅ 모든 UI 및 페이지 구현 완료
- ✅ LLM 통합 (감정일기, 리포트 생성)
- ✅ 인증 구조 완성
- ⏳ Supabase 데이터 레이어 연결 대기
- ⏳ 카카오 알림톡 연동 대기

## 로컬 테스트

Supabase 없이 UI 확인:
```bash
npm run dev
```

- 홈, 온보딩, 프로그램 상세, 결제 페이지는 작동
- 로그인, 대시보드는 Supabase 연동 필요
