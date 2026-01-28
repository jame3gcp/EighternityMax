# STEP 1 테스트 실행 가이드

이 가이드는 STEP 1 구현된 기능들을 테스트하는 방법을 안내합니다.

## 빠른 시작

### 1. 환경 설정

```bash
# 백엔드 의존성 설치
cd backend
npm install

# 프론트엔드 의존성 설치
cd ../frontend
npm install
```

### 2. 서버 실행

**터미널 1: 백엔드 서버**
```bash
cd backend
npm run dev
```
서버가 `http://localhost:3001`에서 실행됩니다.

**터미널 2: 프론트엔드**
```bash
cd frontend
npm run dev
```
프론트엔드가 `http://localhost:5173`에서 실행됩니다.

### 3. 브라우저에서 테스트

브라우저에서 `http://localhost:5173` 접속

---

## 테스트 시나리오

### 시나리오 1: 신규 사용자 가입 플로우

1. **로그인 페이지**
   - `http://localhost:5173/login` 접속
   - "카카오로 시작하기" 또는 "구글로 시작하기" 버튼 클릭

2. **온보딩 페이지**
   - 자동으로 `/onboarding`으로 이동
   - 프로필 정보 입력:
     - 생년월일: `1990-01-01`
     - 출생시간: `14:30` (선택)
     - 성별: `남성`
     - 지역: `서울시 강남구` (선택)
   - "내 에너지 분석 시작" 버튼 클릭

3. **분석 생성**
   - 로딩 화면 표시 (약 3초)
   - 분석 완료 후 결과 화면 표시

4. **Home 페이지**
   - "대시보드로 이동" 버튼 클릭
   - Energy Index 및 가이드 확인

### 시나리오 2: 데일리 가이드 조회

1. 로그인 상태에서 `/daily-guide` 접속
2. 오늘 가이드 확인
3. 날짜 선택기를 사용하여 다른 날짜 선택

### 시나리오 3: 인증 보호 테스트

1. 브라우저 개발자 도구에서 localStorage 삭제
2. 보호된 페이지(`/`, `/onboarding` 등) 접속
3. 자동으로 `/login`으로 리다이렉트되는지 확인

---

## API 테스트

### 자동화 테스트 실행

```bash
# 백엔드 서버가 실행 중인 상태에서
cd backend
node test-api.js
```

### Postman/Insomnia 사용

#### 1. OAuth 로그인
```
POST http://localhost:3001/v1/auth/oauth/kakao/callback
Content-Type: application/json

{
  "code": "test-code-123",
  "redirect_uri": "http://localhost:5173/login",
  "state": "test-state"
}
```

#### 2. 프로필 저장
```
POST http://localhost:3001/v1/users/me/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "birth_date": "1990-01-01",
  "birth_time": "14:30",
  "gender": "M",
  "region": "서울시 강남구"
}
```

#### 3. AI 분석 생성
```
POST http://localhost:3001/v1/users/me/life-profile/generate
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "profile_id": "{profile_id}",
  "options": {
    "detail_level": "standard",
    "language": "ko"
  }
}
```

#### 4. Job 상태 조회
```
GET http://localhost:3001/v1/jobs/{jobId}
Authorization: Bearer {access_token}
```

#### 5. Life Profile 조회
```
GET http://localhost:3001/v1/users/me/life-profile
Authorization: Bearer {access_token}
```

#### 6. 데일리 가이드 조회
```
GET http://localhost:3001/v1/users/me/daily-guide
Authorization: Bearer {access_token}
```

---

## 예상 결과

### 정상 동작 시

- ✅ 로그인 후 온보딩 페이지로 이동
- ✅ 프로필 저장 성공
- ✅ AI 분석 생성 시작 (Job 생성)
- ✅ 약 3초 후 분석 완료
- ✅ Life Profile 표시
- ✅ Home 페이지에서 Energy Index 및 가이드 표시
- ✅ Daily Guide 페이지에서 상세 가이드 표시

### 에러 발생 시

- ❌ 401 에러: 토큰이 없거나 만료됨 → 로그인 페이지로 리다이렉트
- ❌ 404 에러: 리소스를 찾을 수 없음 (예: 프로필 없이 분석 생성 시도)
- ❌ 400 에러: 잘못된 요청 (예: 필수 필드 누락)

---

## 문제 해결

### 서버가 시작되지 않는 경우

1. 포트 3001이 이미 사용 중인지 확인
   ```bash
   lsof -i :3001
   ```

2. 의존성 설치 확인
   ```bash
   cd backend
   npm install
   ```

### 프론트엔드가 연결되지 않는 경우

1. 환경 변수 확인
   - `.env` 파일에 `VITE_API_URL=http://localhost:3001` 설정

2. CORS 에러 발생 시
   - 백엔드 서버의 CORS 설정 확인

### 토큰 관련 문제

1. localStorage 확인
   - 개발자 도구 → Application → Local Storage
   - `access_token`, `refresh_token` 확인

2. 토큰 만료 시
   - 자동으로 갱신되어야 함
   - 갱신 실패 시 로그인 페이지로 리다이렉트

---

## 테스트 체크리스트

### 필수 테스트

- [ ] 로그인 플로우
- [ ] 프로필 저장
- [ ] AI 분석 생성
- [ ] Life Profile 조회
- [ ] Daily Guide 조회
- [ ] Home 페이지 렌더링
- [ ] 인증 보호

### 권장 테스트

- [ ] 토큰 갱신
- [ ] 에러 처리
- [ ] 날짜 변경 (Daily Guide)
- [ ] 브라우저 호환성

---

## 추가 정보

- 상세 테스트 계획: `docs/5.STEP1테스트계획.md`
- 테스트 결과: `docs/5-1.STEP1테스트결과.md`
- API 명세: `docs/2.AI연동API구조&데이터모델명세.md`
