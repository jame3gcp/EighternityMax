# Vercel 배포 환경 수정 가이드

## 🔴 발견된 문제점

### 1. API URL 설정 문제 (가장 중요)

**현재 코드**:
```typescript
// frontend/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
```

**문제**:
- Vercel에서 `VITE_API_URL`이 설정되지 않으면 `localhost:3001`을 찾으려고 시도
- Vercel은 Serverless Functions이므로 `localhost:3001`에 접근 불가
- API 호출이 모두 실패함

**해결**:
- ✅ 코드 수정 완료: 프로덕션 환경에서는 상대 경로 사용
- ⚠️ Vercel 환경 변수 확인 필요

---

## ✅ 수정 완료 사항

### 1. API URL 동적 설정

`frontend/src/services/api.ts` 파일이 수정되었습니다:

```typescript
// 프로덕션: 상대 경로 사용 (/v1/...)
// 개발: localhost 사용 (http://localhost:3001/v1/...)
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  
  if (envUrl && envUrl.trim() !== '') {
    return envUrl
  }
  
  if (import.meta.env.PROD) {
    return '' // 상대 경로
  }
  
  return 'http://localhost:3001'
}
```

---

## 🔧 Vercel 설정 확인 및 수정

### 1. Vercel 환경 변수 확인

Vercel 대시보드에서 확인:

1. **프로젝트 선택** → **Settings** → **Environment Variables**

2. **다음 변수들이 설정되어 있는지 확인**:
   ```
   VITE_API_URL= (비워두거나 설정 안 함 - 상대 경로 사용)
   VITE_USE_MOCK=false
   VITE_SUPABASE_URL=https://vnrsprddsnuoftgaqelr.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```

3. **환경별 설정**:
   - Production, Preview, Development 모두에 설정
   - 또는 Production에만 설정

### 2. Vercel 재배포

코드 수정 후 재배포:

```bash
# 변경사항 커밋 및 푸시
git add frontend/src/services/api.ts
git commit -m "fix: Vercel 배포 환경 API URL 상대 경로 사용"
git push origin main
```

Vercel이 자동으로 재배포합니다.

---

## 📋 차이점 요약

| 항목 | 로컬 | Vercel |
|------|------|--------|
| **백엔드** | `backend/server.js` (목업) | `backend/src/app.js` (프로덕션) |
| **API URL** | `http://localhost:3001` | 상대 경로 `/v1/...` |
| **데이터** | JSON 파일 | Supabase PostgreSQL |
| **인증** | 목업 OAuth | Supabase Auth |

---

## 🧪 테스트 방법

### 로컬 테스트
```bash
# 프론트엔드
cd frontend
npm run dev

# 백엔드
cd backend
npm run dev
```

### Vercel 배포 테스트
1. 코드 푸시 후 자동 배포 대기
2. Vercel 도메인에서 접근
3. 브라우저 개발자 도구 > Network 탭에서 API 호출 확인
4. API 호출이 `/v1/...`로 가는지 확인 (localhost가 아닌지)

---

## ⚠️ 추가 확인 사항

### 1. 백엔드 서버 파일 확인

`vercel.json`이 올바른 파일을 가리키는지 확인:

```json
{
  "builds": [
    {
      "src": "backend/src/app.js",  // ✅ 올바름
      "use": "@vercel/node"
    }
  ]
}
```

### 2. 빌드 스크립트 확인

`frontend/package.json`:
```json
{
  "scripts": {
    "build": "tsc && vite build"  // ✅ 올바름
  }
}
```

### 3. 환경 변수 우선순위

Vercel 환경 변수 > `.env.production` > 코드 기본값

---

## 🐛 문제 해결

### 문제: Vercel에서 API 호출이 404 에러

**원인**: 
- `vercel.json`의 rewrites 설정 문제
- 또는 백엔드 서버 파일 경로 문제

**해결**:
1. `vercel.json`의 rewrites 확인
2. 백엔드 서버가 `/v1/*` 경로를 올바르게 처리하는지 확인

### 문제: CORS 에러

**원인**: 백엔드 CORS 설정이 Vercel 도메인을 허용하지 않음

**해결**:
`backend/src/config/index.js`에서 CORS origin 설정 확인

---

## 📚 참고 문서

- [로컬 vs Vercel 차이점 상세](./LOCAL_VS_VERCEL_DIFF.md)
- [Vercel 환경 변수 설정](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite 환경 변수](https://vitejs.dev/guide/env-and-mode.html)
