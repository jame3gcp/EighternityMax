# Supabase OAuth(구글) 로그인 설정

> **참고:** 당분간 **구글(Google) 로그인만** 사용합니다. 카카오(Kakao)는 추후 적용 예정이며, 현재 앱에서는 비활성화되어 있습니다.

"Unsupported provider: provider is not enabled" 오류는 **Supabase 프로젝트에서 해당 로그인 제공자(Provider)가 꺼져 있을 때** 발생합니다.

## 1. Supabase 대시보드에서 Provider 활성화

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속 후 프로젝트 선택
2. 왼쪽 메뉴 **Authentication** → **URL Configuration** 이동
   - **Site URL**: 실제 배포 URL (예: `https://your-app.vercel.app`)
   - **Redirect URLs**: 다음을 모두 추가 (각 줄에 하나씩):
     ```
     http://localhost:5173/auth/callback
     https://your-app.vercel.app/auth/callback
     ```
   - ⚠️ **중요**: `localhost:3000`이 아닌 **`localhost:5173`** (Vite 기본 포트) 또는 실제 프론트엔드 포트를 사용하세요.
3. 왼쪽 메뉴 **Authentication** → **Providers** 이동
4. 사용할 제공자 켜기:
   - **Google**: 토글 ON → 아래 항목 입력 (현재 앱에서 사용 중)
   - ~~Kakao~~: 추후 적용 예정 (현재 비활성화)

## 2. 구글(Google) 로그인 설정

### 2-1. Google Cloud Console에서 OAuth 클라이언트 만들기

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **API 및 서비스** → **사용자 인증 정보** → **사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
4. 애플리케이션 유형: **웹 애플리케이션**
5. **승인된 JavaScript 원본**에 배포 URL 추가:
   - 로컬: `http://localhost:5173`
   - Vercel: `https://your-app.vercel.app`
   - Supabase Auth URL: `https://<PROJECT_REF>.supabase.co`
6. **승인된 리디렉션 URI**에 추가:
   - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
   - (PROJECT_REF는 Supabase 프로젝트 URL의 하위 도메인)
7. 만들기 후 **클라이언트 ID**와 **클라이언트 보안 비밀** 복사

### 2-2. Supabase에 입력

- Supabase **Authentication → Providers → Google**에서:
  - **Client ID**: Google에서 복사한 클라이언트 ID
  - **Client Secret**: Google에서 복사한 클라이언트 보안 비밀
- **Save** 저장

## 3. 카카오(Kakao) 로그인 설정

1. [Kakao Developers](https://developers.kakao.com/) → 앱 생성/선택
2. **카카오 로그인** 활성화
3. **Redirect URI**에 등록:
   - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
4. **REST API 키** 확인 (Supabase Client ID에 사용)
5. **카카오 로그인** → **동의 항목** 등 필요 시 설정
6. Supabase **Authentication → Providers → Kakao**에서:
   - **Client ID**: REST API 키
   - **Client Secret**: 카카오 앱 설정에서 발급한 Client Secret(있을 경우)
- **Save** 저장

## 4. 저장 후 확인

- Provider를 **저장**한 뒤, 앱에서 다시 구글/카카오 로그인 버튼을 눌러 동작 여부를 확인하세요.
- 여전히 오류가 나면 브라우저 개발자 도구(F12) → Console/Network 탭에서 Supabase 요청/응답을 확인하세요.

## 5. "localhost refused to connect" 오류 해결

구글 로그인 후 `localhost:3000`으로 리다이렉트되면서 연결이 거부되는 경우:

### 원인
- Supabase **URL Configuration**의 **Redirect URLs**에 잘못된 URL이 등록되어 있거나
- Google Cloud Console의 **승인된 리디렉션 URI**가 잘못 설정되어 있을 수 있습니다.

### 해결 방법

1. **Supabase Dashboard** → **Authentication** → **URL Configuration** 확인:
   - **Redirect URLs**에 다음이 포함되어 있는지 확인:
     - `http://localhost:5173/auth/callback` (로컬 개발용)
     - `https://your-app.vercel.app/auth/callback` (배포 환경용)
   - ❌ `localhost:3000`은 제거 (프론트엔드가 5173 포트를 사용하는 경우)

2. **Google Cloud Console** → **승인된 리디렉션 URI** 확인:
   - Supabase 콜백 URL만 있어야 함: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
   - ❌ `localhost:3000` 같은 직접 앱 URL은 제거 (Supabase가 중간에서 처리)

3. **코드 확인**:
   - `frontend/src/services/api.ts`의 `redirectTo`는 자동으로 `window.location.origin`을 사용하므로 수정 불필요
   - 실제 배포 URL에서 로그인하면 Vercel URL로, 로컬에서 로그인하면 `localhost:5173`으로 리다이렉트됩니다.

4. **테스트**:
   - 로컬: `http://localhost:5173`에서 로그인 시도 → `http://localhost:5173/auth/callback`로 리다이렉트되어야 함
   - 배포: Vercel URL에서 로그인 시도 → `https://your-app.vercel.app/auth/callback`로 리다이렉트되어야 함

## 6. "Invalid API key" 오류 해결 (로그인 처리 중)

로그인 후 `/auth/callback`에서 **"Invalid API key"** 가 나오면, **Vercel에 Supabase 환경 변수가 없거나 잘못 들어간 경우**입니다.

### 필요한 환경 변수

| 변수명 | 사용처 | 설명 |
|--------|--------|------|
| `VITE_SUPABASE_URL` | 프론트엔드 | Supabase 프로젝트 URL (예: `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | 프론트엔드 | Supabase **anon public** 키 (Project Settings → API) |
| `SUPABASE_URL` | 백엔드(서버) | 위와 동일한 Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 백엔드(서버) | Supabase **service_role** 키 (Project Settings → API, 비공개) |
| `DATABASE_URL` | 백엔드(서버) | Supabase Postgres 연결 문자열 (Project Settings → Database → Connection string, URI) |

⚠️ **anon** 키는 프론트/백엔드 공용이 아니라, **프론트엔드는 anon**, **백엔드는 service_role**을 씁니다. service_role은 절대 프론트엔드나 공개되지 않도록 하세요.

### Vercel에서 설정하는 방법

1. [Vercel Dashboard](https://vercel.com/dashboard) → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 아래 5개를 **Production**, **Preview**, **Development** 모두에 추가 (또는 필요한 환경만):

   - **Key**: `VITE_SUPABASE_URL`  
     **Value**: `https://<PROJECT_REF>.supabase.co`  
     (Supabase 대시보드 → Project Settings → API → Project URL)

   - **Key**: `VITE_SUPABASE_ANON_KEY`  
     **Value**: `eyJhbGci...` (anon **public** 키)  
     (Project Settings → API → Project API keys → **anon** **public**)

   - **Key**: `SUPABASE_URL`  
     **Value**: `https://<PROJECT_REF>.supabase.co`  
     (위와 동일)

   - **Key**: `SUPABASE_SERVICE_ROLE_KEY`  
     **Value**: `eyJhbGci...` (service_role **secret** 키)  
     (Project Settings → API → Project API keys → **service_role** **secret**)

   - **Key**: `DATABASE_URL`  
     **Value**: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`  
     (Supabase → Project Settings → Database → Connection string → **URI**; 비밀번호는 DB 비밀번호)

4. **Save** 후 **Redeploy** (Deployments → 최신 배포 → ⋯ → Redeploy)

### Supabase에서 키 확인

- [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 → **Project Settings** (왼쪽 하단) → **API**
- **Project URL** → `VITE_SUPABASE_URL`, `SUPABASE_URL`에 사용
- **Project API keys**
  - **anon public** → `VITE_SUPABASE_ANON_KEY` (프론트엔드)
  - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY` (백엔드만, 노출 금지)

키를 수정했다면 Vercel에서 **재배포**해야 반영됩니다.

### 콜백 시 500 에러가 나는 경우

- **백엔드** `POST /v1/auth/oauth/google/callback` 이 500을 반환하면:
  - **SUPABASE_URL**, **SUPABASE_SERVICE_ROLE_KEY** 가 Vercel 백엔드(서버리스) 환경에 설정되어 있는지 확인하세요.
  - **DATABASE_URL** (Supabase Postgres 연결 문자열)이 설정되어 있는지 확인하세요. 백엔드는 사용자/프로필을 DB에 저장하므로 이 값이 없으면 DB 쿼리에서 500이 납니다.
- Vercel 대시보드 → 해당 배포 → **Functions** 로그에서 `[auth]` 로그를 확인하면 Supabase/DB 에러 메시지를 볼 수 있습니다.

### 코드 측 우회 (환경 변수 없이 콜백만 동작시키기)

앱에서는 **구글 로그인 후 리다이렉트될 때** URL hash에 `access_token`이 오면, **프론트 Supabase 클라이언트를 쓰지 않고** 그 토큰을 그대로 백엔드 `/v1/auth/oauth/google/callback`으로 보내도록 되어 있습니다.  
따라서 **콜백 페이지**에서는 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`가 없어도 "Invalid API key" 없이 동작합니다.  
(처음 로그인 버튼을 누를 때의 리다이렉트는 여전히 Supabase가 처리하므로, 구글 로그인 자체를 쓰려면 Supabase 프로젝트 설정과 **백엔드** 환경 변수 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`는 필요합니다.)

---

## 참고

- Supabase 문서: [Third-party OAuth providers](https://supabase.com/docs/guides/auth/social-login)
- 로컬/테스트만 필요하면 **개발용 로그인(테스트 로그인)** 버튼을 사용할 수 있습니다 (Supabase Provider 설정 없이 백엔드 `/v1/auth/oauth/dev/callback` 사용).
