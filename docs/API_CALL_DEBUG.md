# API 호출 문제 디버깅 가이드

## 🔴 문제: 행운 번호 생성 버튼 클릭 시 API 호출이 보이지 않음

## 원인 분석

### 가능한 원인들

1. **API URL 설정 문제**
   - `V1_API_BASE`가 잘못 설정됨
   - 프로덕션에서 상대 경로가 아닌 localhost를 사용

2. **에러가 조용히 실패**
   - `console.error`만 사용하여 사용자가 모름
   - Network 탭에 실패한 요청이 표시되지 않을 수 있음

3. **인증 토큰 문제**
   - 토큰이 없어서 API 호출이 차단됨
   - 401 에러가 발생했지만 조용히 처리됨

4. **빌드된 코드 문제**
   - Vercel에 배포된 코드가 이전 버전
   - `getApiBaseUrl` 함수가 빌드에 포함되지 않음

---

## ✅ 추가된 디버깅 코드

### 1. API 설정 정보 로깅

`frontend/src/services/api.ts`에 추가:
```typescript
// 개발 환경에서 API 설정 정보 출력
if (import.meta.env.DEV) {
  console.log('[API Config]', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    PROD: import.meta.env.PROD,
    MODE: import.meta.env.MODE,
    API_BASE_URL,
    V1_API_BASE,
  })
}
```

### 2. API 요청 로깅

`ApiClient.request()` 메서드에 추가:
```typescript
// 개발 환경에서 API 요청 정보 출력
if (import.meta.env.DEV) {
  console.log('[API Request]', {
    method: options?.method || 'GET',
    url,
    baseUrl: this.baseUrl,
    endpoint,
    hasToken: !!accessToken,
  })
}
```

### 3. 에러 상세 로깅

`LuckyHub.generateLuckyNumbers()`에 추가:
```typescript
catch (error: any) {
  console.error('[LuckyHub] 행운 번호 생성 실패:', error)
  console.error('[LuckyHub] 에러 상세:', {
    message: error?.message,
    statusCode: error?.statusCode,
    statusText: error?.statusText,
    stack: error?.stack,
  })
  alert(`행운 번호 생성에 실패했습니다.\n\n에러: ${error?.message || '알 수 없는 오류'}`)
}
```

---

## 🔍 확인 방법

### 1. Console 탭에서 확인

**Vercel 배포 환경에서:**
1. 브라우저 개발자 도구 > Console 탭
2. 페이지 새로고침
3. 다음 로그 확인:
   ```
   [API Config] { VITE_API_URL: undefined, PROD: true, MODE: "production", ... }
   ```

4. "행운 번호 생성" 버튼 클릭
5. 다음 로그 확인:
   ```
   [LuckyHub] 행운 번호 생성 시작
   [API Request] { method: "GET", url: "/v1/users/me/lucky-numbers?type=lotto", ... }
   ```

**예상되는 문제:**
- `VITE_API_URL`이 설정되어 있으면 → Vercel 환경 변수 확인 필요
- `url`이 `http://localhost:3001/...`로 시작하면 → API URL 설정 문제
- `[API Request]` 로그가 없으면 → 함수가 호출되지 않음

### 2. Network 탭에서 확인

1. **"Fetch/XHR" 필터 선택**
2. **"Preserve log" 체크**
3. **"행운 번호 생성" 버튼 클릭**
4. **다음 확인:**
   - API 호출이 나타나는지
   - 호출 URL이 올바른지 (`/v1/users/me/lucky-numbers?type=lotto`)
   - 상태 코드 (200, 401, 404, 500 등)
   - 에러 메시지

### 3. Sources 탭에서 빌드된 코드 확인

1. Sources 탭 열기
2. `assets/index-*.js` 파일 찾기
3. `Ctrl+F`로 검색:
   - `getApiBaseUrl` → 함수가 있는지 확인
   - `localhost:3001` → 하드코딩되어 있는지 확인
   - `/v1/users/me/lucky-numbers` → 엔드포인트 확인

---

## 🐛 일반적인 문제와 해결

### 문제 1: Console에 `[API Request]` 로그가 없음

**의미**: `generateLuckyNumbers` 함수가 호출되지 않음

**확인:**
1. 버튼 클릭 이벤트가 연결되어 있는지
2. `disabled` 상태가 아닌지
3. Console에 `[LuckyHub] 행운 번호 생성 시작` 로그가 있는지

**해결:**
- 버튼이 `disabled={isLoading}`이므로, `isLoading`이 `true`로 고정되어 있는지 확인

### 문제 2: `[API Request]` 로그는 있지만 Network에 요청이 없음

**의미**: `fetch` 호출이 실패하거나 차단됨

**확인:**
1. Console에 에러 메시지 확인
2. CORS 에러인지 확인
3. 네트워크 연결 확인

**해결:**
- CORS 에러면 백엔드 CORS 설정 확인
- 네트워크 에러면 Vercel 백엔드 서버 상태 확인

### 문제 3: API URL이 `localhost:3001`로 시작

**의미**: 프로덕션 환경에서도 localhost를 사용

**원인:**
- Vercel 환경 변수 `VITE_API_URL`이 설정되어 있음
- 또는 빌드된 코드가 이전 버전

**해결:**
1. Vercel 대시보드 > Settings > Environment Variables
2. `VITE_API_URL` 제거 또는 비워두기
3. 재배포

### 문제 4: 401 Unauthorized 에러

**의미**: 인증 토큰이 없거나 만료됨

**확인:**
1. Application > Local Storage에서 `access_token` 확인
2. 토큰이 있으면 만료되었는지 확인

**해결:**
- 로그인 다시 시도
- 토큰 갱신 로직 확인

### 문제 5: 404 Not Found 에러

**의미**: API 엔드포인트가 존재하지 않음

**확인:**
1. 백엔드 서버에 `/v1/users/me/lucky-numbers` 엔드포인트가 있는지
2. `vercel.json`의 rewrites 설정 확인

**해결:**
- 백엔드 API 엔드포인트 구현 확인
- `vercel.json` rewrites 설정 확인

---

## 📋 체크리스트

다음 순서로 확인하세요:

1. **Console 탭 확인**
   - [ ] `[API Config]` 로그 확인
   - [ ] `[LuckyHub] 행운 번호 생성 시작` 로그 확인
   - [ ] `[API Request]` 로그 확인
   - [ ] 에러 메시지 확인

2. **Network 탭 확인**
   - [ ] "Fetch/XHR" 필터 선택
   - [ ] API 호출이 보이는지 확인
   - [ ] 호출 URL 확인 (`/v1/...` 또는 `localhost:3001/...`)
   - [ ] 상태 코드 확인

3. **Vercel 설정 확인**
   - [ ] 최신 커밋이 배포되었는지
   - [ ] 환경 변수 `VITE_API_URL` 확인
   - [ ] 빌드 로그 확인

---

## 🎯 다음 단계

1. **코드 변경사항 커밋 및 푸시**
   ```bash
   git add frontend/src/services/api.ts frontend/src/pages/LuckyHub/LuckyHub.tsx
   git commit -m "debug: API 호출 디버깅 로그 추가"
   git push origin main
   ```

2. **Vercel 재배포 대기**

3. **브라우저에서 테스트**
   - Console 탭 열기
   - "행운 번호 생성" 버튼 클릭
   - 로그 확인

4. **결과 공유**
   - Console 로그 내용
   - Network 탭의 API 호출 상태
   - 에러 메시지 (있는 경우)

이 정보를 바탕으로 정확한 원인을 파악할 수 있습니다!
