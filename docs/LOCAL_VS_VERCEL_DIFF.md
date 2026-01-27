# 로컬 개발 환경 vs Vercel 배포 환경 차이점

## 🔍 주요 차이점 요약

| 항목 | 로컬 개발 환경 | Vercel 배포 환경 |
|------|---------------|------------------|
| **백엔드 서버** | `backend/server.js` (목업) | `backend/src/app.js` (프로덕션) |
| **데이터 저장소** | JSON 파일 (`mock-data/data.json`) | Supabase PostgreSQL |
| **API URL** | `http://localhost:3001` | `https://[vercel-domain]` |
| **환경 변수** | `.env.development` | Vercel 환경 변수 설정 |
| **인증** | 목업 OAuth | Supabase Auth (실제 OAuth) |
| **빌드 방식** | Vite dev server | Vite build → static files |

---

## 1. 백엔드 서버 파일 차이

### 로컬 개발 환경
- **파일**: `backend/server.js`
- **타입**: 목업 서버 (Mock Server)
- **데이터**: JSON 파일 기반 (`mock-data/data.json`)
- **기능**:
  - 간단한 OAuth 목업
  - 파일 시스템 기반 데이터 저장
  - 개발/테스트용

### Vercel 배포 환경
- **파일**: `backend/src/app.js`
- **타입**: 프로덕션 서버
- **데이터**: Supabase PostgreSQL
- **기능**:
  - 실제 Supabase Auth 연동
  - Drizzle ORM 사용
  - 프로덕션 준비된 구조

**문제점**: 
- `vercel.json`이 `backend/src/app.js`를 가리키고 있음 ✅ (올바름)
- 하지만 로컬에서는 `backend/server.js`를 사용 중
- 두 서버의 API 응답 형식이 다를 수 있음

---

## 2. 환경 변수 차이

### 로컬 개발 환경
**파일**: `frontend/.env.development`
```bash
VITE_API_URL=http://localhost:3001
VITE_USE_MOCK=false
VITE_SUPABASE_URL=https://vnrsprddsnuoftgaqelr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### Vercel 배포 환경
**Vercel 대시보드에서 설정해야 함:**
```bash
VITE_API_URL=https://[your-vercel-domain].vercel.app
# 또는 상대 경로 사용 (권장)
# VITE_API_URL= (비워두면 상대 경로 사용)

VITE_USE_MOCK=false
VITE_SUPABASE_URL=https://vnrsprddsnuoftgaqelr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

**⚠️ 중요**: 
- Vercel에서 `VITE_API_URL`을 설정하지 않으면 프론트엔드가 `http://localhost:3001`을 찾으려고 시도함
- 이 경우 API 호출이 실패함

---

## 3. API 엔드포인트 경로 차이

### 로컬 개발 환경
```typescript
// frontend/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
// 결과: http://localhost:3001/v1/...
```

### Vercel 배포 환경
```typescript
// frontend/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
// Vercel에서 VITE_API_URL이 설정되지 않으면 localhost를 찾으려고 시도함!
// 올바른 설정: VITE_API_URL을 비워두거나 상대 경로 사용
```

**해결 방법**:
1. **상대 경로 사용 (권장)**:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_URL || ''
   // 빈 문자열이면 상대 경로 사용 → /v1/... 로 요청
   ```

2. **Vercel 환경 변수 설정**:
   - Vercel 대시보드 > 프로젝트 > Settings > Environment Variables
   - `VITE_API_URL`을 Vercel 도메인으로 설정

---

## 4. 데이터 저장소 차이

### 로컬 개발 환경
- **저장소**: JSON 파일 (`backend/mock-data/data.json`)
- **특징**:
  - 파일 시스템 기반
  - 서버 재시작 시 데이터 유지
  - 개발/테스트용

### Vercel 배포 환경
- **저장소**: Supabase PostgreSQL
- **특징**:
  - 클라우드 데이터베이스
  - 영구 저장
  - 프로덕션 데이터

**문제점**:
- 로컬에서 테스트한 데이터는 JSON 파일에만 저장됨
- Vercel 배포 환경에서는 Supabase 데이터베이스를 사용
- 두 환경의 데이터가 완전히 분리됨

---

## 5. 인증 시스템 차이

### 로컬 개발 환경
- **OAuth**: 목업 (`backend/server.js`의 `dev` provider)
- **토큰**: JWT (로컬에서 생성)
- **사용자**: 테스트 사용자 자동 생성

### Vercel 배포 환경
- **OAuth**: 실제 Supabase Auth (Kakao, Google 등)
- **토큰**: Supabase JWT
- **사용자**: 실제 OAuth 제공자 인증 필요

---

## 6. 빌드 및 배포 차이

### 로컬 개발 환경
```bash
# 프론트엔드
cd frontend
npm run dev  # Vite dev server (HMR 지원)

# 백엔드
cd backend
npm run dev  # node server.js (목업 서버)
```

### Vercel 배포 환경
```json
// vercel.json
{
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "backend/src/app.js",
      "use": "@vercel/node"
    }
  ]
}
```

**프로세스**:
1. 프론트엔드: `npm run build` → `dist/` 폴더 생성 → 정적 파일로 배포
2. 백엔드: `backend/src/app.js` → Serverless Functions로 배포

---

## 🔧 해결 방법

### 1. API URL 동적 설정

`frontend/src/services/api.ts` 수정:

```typescript
// 현재
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// 개선안
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  
  // 환경 변수가 설정되어 있으면 사용
  if (envUrl) return envUrl
  
  // 프로덕션 환경에서는 상대 경로 사용
  if (import.meta.env.PROD) {
    return '' // 상대 경로 → /v1/...
  }
  
  // 개발 환경에서는 localhost
  return 'http://localhost:3001'
}

const API_BASE_URL = getApiBaseUrl()
```

### 2. Vercel 환경 변수 설정

Vercel 대시보드에서:
1. 프로젝트 선택
2. Settings > Environment Variables
3. 다음 변수 추가:
   ```
   VITE_API_URL= (비워두거나 상대 경로 사용)
   VITE_USE_MOCK=false
   VITE_SUPABASE_URL=https://vnrsprddsnuoftgaqelr.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```

### 3. 백엔드 서버 통일 (선택사항)

로컬에서도 `backend/src/app.js`를 사용하도록 변경:

```bash
# backend/package.json
{
  "scripts": {
    "dev": "node src/app.js",  # server.js 대신
    "dev:mock": "node server.js"  # 목업 서버는 별도 스크립트로
  }
}
```

---

## 📋 체크리스트

로컬과 Vercel이 동일하게 작동하도록 확인:

- [ ] `frontend/src/services/api.ts`에서 API URL 동적 설정
- [ ] Vercel 환경 변수 설정 확인
- [ ] `vercel.json` 빌드 설정 확인
- [ ] 백엔드 API 응답 형식 일치 확인
- [ ] 인증 플로우 테스트 (로컬 및 Vercel)
- [ ] 데이터 저장/조회 테스트

---

## 🐛 일반적인 문제

### 문제 1: Vercel에서 API 호출 실패
**원인**: `VITE_API_URL`이 설정되지 않아 `localhost`를 찾으려고 시도
**해결**: 상대 경로 사용 또는 Vercel 환경 변수 설정

### 문제 2: 인증이 작동하지 않음
**원인**: 로컬은 목업, Vercel은 실제 Supabase
**해결**: 두 환경 모두 Supabase 사용하거나, 환경에 따라 분기

### 문제 3: 데이터가 보이지 않음
**원인**: 로컬은 JSON 파일, Vercel은 Supabase DB
**해결**: 환경에 따라 데이터 소스 분기 또는 통일

---

## 📚 참고

- Vercel 환경 변수: https://vercel.com/docs/concepts/projects/environment-variables
- Vite 환경 변수: https://vitejs.dev/guide/env-and-mode.html
- Supabase 설정: `docs/2.AI연동API구조&데이터모델명세.md`
