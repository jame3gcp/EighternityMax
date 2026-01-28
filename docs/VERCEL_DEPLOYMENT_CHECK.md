# Vercel 배포 상태 확인 가이드

## 현재 상황

프론트엔드 API URL 설정 변경사항이 이미 커밋되어 있습니다:
- **커밋**: `43f3d56 fix: Vercel 배포 환경 API URL 상대 경로 사용`
- **변경 파일**: `frontend/src/services/api.ts`

## 확인해야 할 사항

### 1. Vercel에 최신 커밋이 배포되었는지 확인

**Vercel 대시보드에서 확인:**
1. 프로젝트 선택
2. **Deployments** 탭 확인
3. 최신 배포의 커밋 해시가 `43f3d56` 이후인지 확인
4. 배포 상태가 "Ready"인지 확인

**또는 터미널에서:**
```bash
# 최신 커밋 확인
git log --oneline -5

# Vercel CLI로 배포 상태 확인 (설치되어 있다면)
vercel ls
```

### 2. 빌드 로그 확인

Vercel 대시보드 > Deployments > 최신 배포 > Build Logs에서:
- 빌드가 성공했는지 확인
- 에러가 없는지 확인
- `frontend/src/services/api.ts` 파일이 빌드에 포함되었는지 확인

### 3. @supabase/supabase-js 빌드 실패 시 (Rollup failed to resolve import)

- **vercel.json**에 `installCommand: "cd frontend && rm -rf node_modules && npm ci"`가 설정되어 있으면, 매 배포 시 `node_modules`를 지운 뒤 다시 설치합니다. (캐시된 node_modules로 인한 누락 방지)
- 그래도 실패하면: Vercel 대시보드 → 프로젝트 → **Deployments** → 최신 배포 옆 **⋯** → **Redeploy** 시 **Clear Build Cache** 체크 후 재배포하세요.

### 4. 실제 배포된 코드 확인

**브라우저에서 확인:**
1. Vercel 배포 URL 접속
2. 개발자 도구 > Sources 탭
3. `assets/` 폴더에서 JavaScript 파일 찾기
4. 파일 내용에서 `getApiBaseUrl` 함수가 있는지 확인

**또는 Network 탭에서:**
1. API 호출 확인
2. 요청 URL이 `/v1/...`로 시작하는지 확인 (localhost가 아닌지)

---

## 현재 코드 상태

### 로컬 파일 (현재)
```typescript
// frontend/src/services/api.ts
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

const API_BASE_URL = getApiBaseUrl()
const V1_API_BASE = API_BASE_URL ? `${API_BASE_URL}/v1` : '/v1'
```

### 이전 코드 (Vercel에 배포된 것일 수 있음)
```typescript
// 이전 버전
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const V1_API_BASE = `${API_BASE_URL}/v1`
```

**차이점:**
- 이전: 항상 `/api` 경로 포함
- 현재: 프로덕션에서는 상대 경로 사용

---

## 해결 방법

### 방법 1: Vercel 재배포 강제

```bash
# 빈 커밋으로 재배포 트리거
git commit --allow-empty -m "trigger: Vercel 재배포"
git push origin main
```

### 방법 2: Vercel 대시보드에서 재배포

1. Vercel 대시보드 > Deployments
2. 최신 배포의 "..." 메뉴 클릭
3. "Redeploy" 선택

### 방법 3: 환경 변수 확인

Vercel 대시보드 > Settings > Environment Variables:
- `VITE_API_URL`이 설정되어 있다면 제거하거나 비워두기
- 프로덕션 환경에서 상대 경로를 사용하려면 환경 변수를 설정하지 않아야 함

---

## 추가 확인 사항

### 1. 빌드 캐시 문제

Vercel이 이전 빌드 캐시를 사용하고 있을 수 있습니다.

**해결:**
- Vercel 대시보드 > Settings > General
- "Clear Build Cache" 클릭
- 재배포

### 2. 브랜치 확인

Vercel이 다른 브랜치를 배포하고 있을 수 있습니다.

**확인:**
- Vercel 대시보드 > Settings > Git
- Production Branch가 `main`인지 확인

### 3. 빌드 설정 확인

`vercel.json` 또는 프로젝트 설정에서:
- Build Command가 올바른지 확인
- Output Directory가 `frontend/dist`인지 확인

---

## 테스트 방법

### 로컬에서 프로덕션 빌드 테스트

```bash
cd frontend
npm run build
npm run preview
```

브라우저에서 `http://localhost:4173` 접속 후:
- 개발자 도구 > Network 탭
- API 호출이 상대 경로(`/v1/...`)로 가는지 확인

### Vercel 배포 테스트

1. Vercel URL 접속
2. 개발자 도구 > Network 탭 열기
3. 페이지 새로고침
4. API 호출 확인:
   - ✅ 올바름: `/v1/auth/...` (상대 경로)
   - ❌ 문제: `http://localhost:3001/v1/...` (절대 경로)

---

## 문제가 계속되면

1. **Vercel 빌드 로그 확인**
   - 에러 메시지 확인
   - 빌드 단계별 확인

2. **코드 재확인**
   ```bash
   git show HEAD:frontend/src/services/api.ts | grep -A 20 "getApiBaseUrl"
   ```

3. **강제 재배포**
   - Vercel 대시보드에서 "Redeploy"
   - 또는 빈 커밋으로 트리거
