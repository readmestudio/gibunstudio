# 카카오 로그인 준비 가이드

이 프로젝트는 **Supabase Auth**를 통해 카카오 OAuth 로그인을 사용합니다.  
카카오 키는 **Supabase 대시보드**에 입력하며, `.env.local`에는 카카오 관련 변수를 넣지 않습니다.

---

## 1. 카카오 개발자에서 준비할 항목

**사이트:** [developers.kakao.com](https://developers.kakao.com)

| 항목 | 설명 |
|------|------|
| **REST API 키** | 내 애플리케이션 → 앱 설정 → 앱 키 → "REST API 키" (Supabase Kakao **Client ID**로 사용) |
| **Client Secret** | 내 애플리케이션 → 제품 설정 → 카카오 로그인 → "Client Secret" → "코드" 생성 (Supabase Kakao **Client Secret**로 사용) |

---
1
## 2. 카카오 개발자 콘솔 설정

### 2-1. 애플리케이션 생성·앱 키 확인
1. [Kakao Developers](https://developers.kakao.com) 로그인
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. 앱 이름 등 입력 후 생성
4. **앱 설정** → **앱 키**에서 **REST API 키** 복사 (Client ID용)

### 2-2. 카카오 로그인 활성화 및 Client Secret
1. **제품 설정** → **카카오 로그인** → **활성화**
2. **카카오 로그인** → **Client Secret** → **코드** 생성 후 복사

### 2-3. 플랫폼(Web) 등록
1. **내 애플리케이션** → **앱 설정** → **플랫폼** → **Web** 플랫폼 등록
2. **Redirect URI** 추가:
   - Supabase 프로젝트 URL이 `https://[프로젝트참조].supabase.co` 인 경우
   - Redirect URI: `https://[프로젝트참조].supabase.co/auth/v1/callback`
   - 예: `https://ofqbadqziljuqddnvikw.supabase.co/auth/v1/callback`

### 2-4. (선택) 동의 항목
- **제품 설정** → **카카오 로그인** → **동의 항목**에서 이메일, 프로필 등 필요 시 활성화

---

## 3. Supabase 대시보드 설정

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택
2. **Authentication** → **Providers** → **Kakao** 선택
3. **Enable Sign in with Kakao** 활성화
4. 입력:
   - **Client ID (REST API 키):** 카카오 REST API 키
   - **Client Secret:** 카카오 Client Secret(코드)
5. 저장

Redirect URL은 Supabase가 제공하는 `https://[프로젝트참조].supabase.co/auth/v1/callback` 를 그대로 사용하며, 이 주소를 위 2-3에서 카카오 Web Redirect URI로 등록하면 됩니다.

---

## 4. 체크리스트

연동 전 아래를 모두 확인하세요.

- [ ] 카카오 **REST API 키** 발급 (Client ID용)
- [ ] 카카오 **Client Secret** 생성·복사
- [ ] 카카오 **Web 플랫폼** 등록 및 **Redirect URI** 추가 (Supabase callback URL)
- [ ] Supabase **Authentication > Providers > Kakao** 에 Client ID / Client Secret 입력
- [ ] 앱에서 "카카오로 시작하기" 클릭 시 카카오 로그인 창 → 콜백 후 로그인 완료되는지 확인

---

## 5. 참고

- `.env.local`에는 카카오 키를 넣지 않습니다. Supabase가 Kakao Provider 설정만 하면 `signInWithOAuth({ provider: "kakao" })` 로 로그인이 동작합니다.
- 로그인/가입 UI는 `src/app/login/page.tsx` 의 "카카오로 시작하기" 버튼에서 `handleKakaoLogin` 으로 처리됩니다.
