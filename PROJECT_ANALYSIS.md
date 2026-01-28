# Eighternity 프로젝트 전체 분석 리포트

## 📋 프로젝트 개요

**Eighternity**는 사용자의 생년월일시와 성별을 기반으로 AI가 개인 에너지 사이클을 분석하고, 이를 시각화하여 라이프 인텔리전스 서비스를 제공하는 웹 애플리케이션입니다.

### 핵심 컨셉
- **AI Personal Energy Modeling**: 생년월일시 기반 개인 에너지 패턴 분석
- **Life Pattern Analysis**: 에너지 흐름 사이클 시각화
- **Personal Direction Guide**: 6개 카테고리별 생활 가이드
- **Energy Forecast**: 30일 에너지 예보
- **Location-based Recommendations**: 에너지 스팟 지도

---

## 🏗️ 아키텍처 구조

### 전체 구조
```
EighternityMax/
├── frontend/          # React + TypeScript 프론트엔드
├── backend/           # Express.js + Drizzle ORM 백엔드
├── docs/              # 프로젝트 문서
└── vercel.json        # Vercel 배포 설정
```

### 배포 환경
- **프론트엔드**: Vercel Static Build (`frontend/dist`)
- **백엔드**: Vercel Serverless Functions (`@vercel/node`)
- **데이터베이스**: Supabase PostgreSQL (Drizzle ORM)
- **인증**: Supabase Auth (OAuth: Kakao, Google, Facebook, Apple)

---

## 🛠️ 기술 스택

### 프론트엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18.2.0 | UI 프레임워크 |
| TypeScript | 5.2.2 | 타입 안정성 |
| Vite | 5.0.8 | 빌드 도구 |
| Tailwind CSS | 3.3.6 | 스타일링 |
| Zustand | 4.4.7 | 상태 관리 |
| React Router | 6.20.0 | 라우팅 |
| D3.js | 7.8.5 | 사이클 차트 시각화 |
| Recharts | 2.10.3 | 그래프 차트 |
| Framer Motion | 10.16.16 | 애니메이션 |
| React Hook Form | 7.48.2 | 폼 관리 |
| Supabase JS | 2.91.1 | 인증 클라이언트 |

### 백엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | 20.19.4 | 런타임 |
| Express.js | 4.18.2 | 웹 프레임워크 |
| Drizzle ORM | 0.45.1 | 데이터베이스 ORM |
| PostgreSQL | - | 데이터베이스 (Supabase) |
| Supabase JS | 2.91.1 | 인증 서버 |
| Helmet | 8.1.0 | 보안 헤더 |
| CORS | 2.8.5 | CORS 설정 |
| Express Rate Limit | 8.2.1 | 요청 제한 |
| Express Validator | 7.3.1 | 입력 검증 |

---

## 📁 디렉토리 구조 상세

### Frontend (`/frontend`)
```
src/
├── App.tsx                    # 메인 앱 컴포넌트 (라우팅)
├── main.tsx                   # 진입점
├── components/                # 재사용 가능한 컴포넌트
│   ├── Button/
│   ├── Card/
│   ├── CycleChart/           # D3.js 사이클 차트
│   ├── DetailPanel/
│   ├── Header/
│   ├── Layout/
│   ├── ProtectedRoute/       # 인증 보호 라우트
│   └── Sidebar/
├── pages/                     # 페이지 컴포넌트
│   ├── Login/                # OAuth 로그인
│   ├── AuthCallback/         # OAuth 콜백 처리
│   ├── Onboarding/           # 프로필 입력
│   ├── Home/                 # 대시보드
│   ├── MyCycle/              # 사이클 시각화
│   ├── DailyGuide/           # 오늘의 가이드
│   ├── EnergyForecast/       # 30일 예보
│   ├── LifeProfile/          # AI 프로필
│   ├── LifeDirections/       # 인생 방향 가이드
│   ├── Record/               # 기록 & 리포트
│   ├── LuckyHub/             # 행운 센터
│   ├── EnergyMap/            # 에너지 스팟 지도
│   ├── Guide/                # 콘텐츠 가이드
│   └── MyPage/               # 마이페이지
├── services/
│   ├── api.ts                # API 클라이언트 (TokenManager 포함)
│   ├── mockData.ts           # 목업 데이터
│   └── supabase.ts           # Supabase 클라이언트 설정
├── store/                     # Zustand 상태 관리
│   ├── useUIStore.ts         # UI 상태 (사이드바, 다크모드)
│   ├── useUserStore.ts       # 사용자 정보
│   └── useCycleStore.ts      # 사이클 데이터
├── types/
│   └── index.ts              # TypeScript 타입 정의
└── styles/
    └── index.css             # Tailwind CSS
```

### Backend (`/backend`)
```
src/
├── server.js                 # 서버 진입점
├── app.js                    # Express 앱 설정
├── config/
│   └── index.js              # 환경 변수 설정
├── controllers/              # 비즈니스 로직
│   ├── auth.js              # 인증 컨트롤러
│   ├── user.js              # 사용자 관리
│   ├── cycle.js             # 사이클 데이터
│   ├── guide.js             # 데일리 가이드
│   ├── lifeProfile.js        # Life Profile
│   ├── direction.js         # 인생 방향
│   ├── record.js            # 기록
│   ├── report.js            # 리포트
│   ├── lucky.js             # 행운 센터
│   └── spot.js              # 에너지 스팟
├── routes/                   # API 라우트
│   ├── v1.js                # v1 API 라우터
│   ├── auth.js              # 인증 라우트
│   ├── user.js              # 사용자 라우트
│   ├── job.js               # AI 작업 라우트
│   └── legacy.js            # 레거시 API
├── middleware/
│   ├── auth.js              # 인증 미들웨어 (Supabase)
│   └── error.js             # 에러 핸들링
├── models/
│   ├── db.js                # Drizzle DB 연결
│   ├── schema.js            # 데이터베이스 스키마
│   └── init.js              # DB 초기화 (비활성화됨)
├── services/
│   ├── token.js             # 토큰 관리
│   └── user.js              # 사용자 서비스
└── utils/
    └── response.js          # 응답 유틸리티
```

---

## 🔐 인증 아키텍처

### 인증 플로우
1. **프론트엔드**: Supabase OAuth SDK로 로그인 시작
   - 지원 Provider: Kakao, Google, Facebook, Apple
   - `signInWithOAuth()` 호출 → Provider 리다이렉트

2. **OAuth 콜백**: `/auth/callback` 페이지
   - Supabase 세션 획득
   - 백엔드 `/v1/auth/oauth/{provider}/callback` 호출
   - `access_token`, `refresh_token` 전달

3. **백엔드 처리**:
   - Supabase 토큰 검증
   - 로컬 DB에 사용자 생성/조회
   - 프로필/Life Profile 존재 여부 확인
   - `next_step` 반환 (`profile_required` | `life_profile_required` | `ready`)

4. **토큰 저장**:
   - `localStorage`에 `access_token`, `refresh_token` 저장
   - API 요청 시 `Authorization: Bearer {token}` 헤더 사용

5. **토큰 갱신**:
   - 401 응답 시 자동 `refreshToken()` 호출
   - 실패 시 `/login`으로 리다이렉트

### 보안 기능
- **Helmet**: 보안 헤더 설정
- **CORS**: 크로스 오리진 요청 제어
- **Rate Limiting**: 15분당 100회 요청 제한
- **JWT 검증**: Supabase Auth 토큰 검증
- **Protected Routes**: 인증 필요 페이지 보호

---

## 🗄️ 데이터베이스 스키마

### 테이블 구조 (PostgreSQL)

#### 1. `users`
```sql
- id: TEXT (PK)
- provider: TEXT (NOT NULL)           # OAuth 제공자
- provider_user_id: TEXT (NOT NULL)   # Supabase User ID
- email: TEXT
- display_name: TEXT
- created_at: TIMESTAMP
- last_login_at: TIMESTAMP
- UNIQUE(provider, provider_user_id)
```

#### 2. `profiles`
```sql
- id: TEXT (PK)
- user_id: TEXT (FK → users.id)
- birth_date: TEXT (NOT NULL)         # YYYY-MM-DD
- birth_time: TEXT                    # HH:mm
- gender: TEXT (NOT NULL)              # M|F|X
- region: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 3. `life_profiles`
```sql
- user_id: TEXT (PK, FK → users.id)
- profile_id: TEXT (FK → profiles.id)
- energy_type: TEXT
- energy_type_emoji: TEXT
- strengths: JSONB                    # 강점 배열
- patterns: JSONB                    # 시간대별 패턴
- cycle_description: TEXT
- recommendations: JSONB             # 추천 사항
- version: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 4. `jobs`
```sql
- id: TEXT (PK)
- user_id: TEXT (FK → users.id)
- profile_id: TEXT (NOT NULL)
- status: TEXT (NOT NULL)            # queued|running|done|failed
- progress: INTEGER (0-100)
- options: JSONB
- result_ref: TEXT
- created_at: TIMESTAMP
- completed_at: TIMESTAMP
```

#### 5. `records`
```sql
- id: TEXT (PK)
- user_id: TEXT (FK → users.id)
- date: TEXT (NOT NULL)               # YYYY-MM-DD
- energy: INTEGER (0-100)
- emotion: INTEGER (0-100)
- focus: INTEGER (0-100)
- memo: TEXT
- timestamp: TIMESTAMP
```

#### 6. `refresh_tokens`
```sql
- id: INTEGER (PK, AUTO_INCREMENT)
- user_id: TEXT (FK → users.id)
- token: TEXT (NOT NULL)
- expires_at: TIMESTAMP (NOT NULL)
```

---

## 🔌 API 엔드포인트

### 인증 API (`/v1/auth`)
- `POST /v1/auth/oauth/:provider/callback` - OAuth 콜백 처리
- `POST /v1/auth/token/refresh` - 토큰 갱신
- `POST /v1/auth/logout` - 로그아웃

### 사용자 API (`/v1/users`)
- `GET /v1/users/me` - 현재 사용자 정보
- `POST /v1/users/me/profile` - 프로필 저장
- `GET /v1/users/me/life-profile` - Life Profile 조회
- `POST /v1/users/me/life-profile/generate` - AI 분석 생성 (비동기)

### 작업 API (`/v1/jobs`)
- `GET /v1/jobs/:jobId` - AI 작업 상태 조회

### 기능 API (레거시 `/api`)
- `GET /api/cycles` - 사이클 데이터
- `GET /api/daily-guide` - 데일리 가이드
- `GET /api/energy-forecast` - 에너지 예보
- `GET /api/life-directions` - 인생 방향
- `GET /api/records` - 기록 조회
- `POST /api/records` - 기록 생성
- `GET /api/reports/monthly` - 월간 리포트
- `GET /api/spots` - 에너지 스팟 (위치 기반)

---

## 📊 주요 기능 상세

### 1. 온보딩 (Onboarding)
- **목적**: 최초 사용자 프로필 입력
- **입력 항목**:
  - 생년월일 (YYYY-MM-DD)
  - 출생 시간 (HH:mm, 선택)
  - 성별 (M/F/X)
  - 거주 지역 (선택)
- **후속 작업**: AI Life Profile 생성 트리거

### 2. Home (대시보드)
- **위젯**:
  - Today Energy Index
  - 현재 사이클 위치
  - 오늘 핵심 가이드
  - 오늘의 방향 키워드 (Love/Money/Career 등)
- **CTA**: 오늘 가이드, 방향 제안, 에너지 스팟

### 3. 나의 사이클 (MyCycle)
- **기능**: D3.js 기반 인터랙티브 사이클 차트
- **8단계 사이클**:
  1. 새벽 (Dawn)
  2. 상승 (Rising)
  3. 정점 (Peak)
  4. 유지 (Sustained)
  5. 하강 (Declining)
  6. 저점 (Low)
  7. 회복 (Recovery)
  8. 준비 (Preparation)
- **시각화**: 에너지/감정/집중력 3차원 그래프

### 4. 데일리 가이드 (DailyGuide)
- **내용**:
  - 오늘의 에너지 인덱스
  - Phase 태그
  - 요약
  - 추천 활동 (`do`)
  - 피해야 할 활동 (`avoid`)
  - 관계 가이드

### 5. 에너지 예보 (EnergyForecast)
- **기간**: 30일
- **차트**: Recharts 라인 차트
- **데이터**: 일별 에너지/감정/집중력 예측

### 6. Life Profile
- **AI 분석 결과**:
  - Energy Type (에너지 유형)
  - Activity Rhythm (활동 리듬)
  - Strengths (강점)
  - Patterns (시간대별 패턴)
  - Cycle Description (사이클 설명)
  - Recommendations (추천 사항)

### 7. 인생 방향 가이드 (LifeDirections)
- **6개 카테고리**:
  1. Love (연애/관계)
  2. Money (재정)
  3. Career (직업)
  4. Health (건강)
  5. Growth (성장)
  6. Social (사회)
- **각 카테고리**: 점수, 가이드, 추천 사항

### 8. 기록 & 리포트 (Record)
- **기능**:
  - 일일 에너지/감정/집중력 기록
  - 메모 작성
  - 월간 리포트 (평균, 인사이트, 주요 활동)

### 9. 행운 센터 (LuckyHub)
- **기능**:
  - 행운 번호 생성
  - 미니 게임 (선택)

### 10. 에너지 스팟 지도 (EnergyMap)
- **기능**: 위치 기반 장소 추천
- **목적별 필터**:
  - `rest`: 휴식
  - `focus`: 집중
  - `meet`: 만남
- **데이터**: 위도/경도, 점수, 설명, 태그

### 11. 콘텐츠 / 가이드 (Guide)
- **내용**: 사이클 이론, 관리법 가이드

### 12. 마이페이지 (MyPage)
- **기능**: 개인정보 관리, 설정

---

## 🎨 UI/UX 특징

### 디자인 시스템
- **컬러 팔레트**:
  - Primary: `#1e3a5f`
  - Charcoal: `#2d3748`
  - Energy: Green/Yellow/Orange/Red
- **폰트**: Pretendard, Inter, system-ui
- **다크 모드**: 지원 (Zustand persist)

### 반응형 디자인
- **모바일**: 360px 이상
- **태블릿**: 768px 이상
- **데스크탑**: 1200px 이상

### 접근성
- **ARIA 레이블**: 스크린리더 지원
- **키보드 네비게이션**: 포커스 관리
- **터치 타겟**: 최소 44x44px

### 애니메이션
- **Framer Motion**: 페이지 전환, 호버 효과
- **로딩 상태**: Suspense + 로딩 스피너

---

## 🔄 데이터 흐름

### 1. 사용자 가입 플로우
```
OAuth 로그인 → Supabase 인증 → 백엔드 사용자 생성
→ 프로필 입력 → AI 분석 작업 생성 → Life Profile 생성
→ 대시보드 진입
```

### 2. AI 분석 생성 플로우
```
POST /v1/users/me/life-profile/generate
→ Job 생성 (status: queued)
→ 폴링: GET /v1/jobs/:jobId
→ 완료 시: GET /v1/users/me/life-profile
```

### 3. 일일 데이터 흐름
```
사용자 기록 입력 → POST /api/records
→ 리포트 생성: GET /api/reports/monthly
→ 가이드 생성: GET /api/daily-guide
```

---

## 🚀 배포 설정

### Vercel 설정 (`vercel.json`)
- **프론트엔드**: Static Build (`frontend/dist`)
- **백엔드**: Serverless Functions (`@vercel/node`)
- **라우팅**:
  - `/v1/*` → 백엔드
  - `/api/*` → 백엔드
  - `/*` → 프론트엔드 (SPA)

### 환경 변수

#### Backend (`.env`)
```env
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://...
PORT=3001
JWT_SECRET=...
CORS_ORIGIN=...
```

#### Frontend (`.env.development`)
```env
VITE_API_URL=http://localhost:3001
VITE_USE_MOCK=false
```

---

## 📝 개발 상태

### 완료된 기능
✅ OAuth 인증 (Supabase)
✅ 사용자 프로필 관리
✅ 데이터베이스 스키마 (Drizzle ORM)
✅ 기본 API 엔드포인트
✅ 프론트엔드 페이지 구조
✅ 사이클 차트 시각화 (D3.js)
✅ 반응형 레이아웃
✅ 다크 모드

### 진행 중 / 미완성
⚠️ AI 분석 엔진 연동 (현재 목업)
⚠️ 실제 에너지 스팟 API 연동
⚠️ Life Profile 생성 로직
⚠️ 일부 컨트롤러 구현 미완성

---

## 🔍 주요 이슈 및 개선 사항

### 현재 이슈
1. **DB 초기화**: `init.js`가 SQLite 스타일로 작성되어 Drizzle과 호환 안 됨 (수정됨)
2. **Import 오류**: 일부 파일에서 default/named import 혼용 (수정됨)
3. **Layout 구조**: Login 페이지가 Layout 안에 포함되어 있음 (수정됨)

### 개선 제안
1. **에러 바운더리**: React Error Boundary 추가
2. **로딩 상태**: 전역 로딩 인디케이터
3. **API 캐싱**: React Query 도입 검토
4. **테스트**: Unit/Integration 테스트 추가
5. **타입 안정성**: 백엔드 TypeScript 전환 검토
6. **문서화**: API 문서 (Swagger/OpenAPI)

---

## 📚 참고 문서

- `docs/1. 서비스기획.md` - 전체 서비스 기획서
- `docs/2.AI연동API구조&데이터모델명세.md` - API 명세
- `docs/3.DevOps연속배포형개발우선순위` - 배포 우선순위
- `docs/4.개발WBS` - 개발 작업 분해
- `docs/5.STEP1테스트계획.md` - 테스트 계획
- `TEST_GUIDE.md` - 테스트 가이드

---

## 🎯 결론

**Eighternity**는 현대적인 웹 기술 스택을 활용한 개인화된 라이프 인텔리전스 서비스입니다. 

### 강점
- ✅ 모던한 기술 스택 (React 18, TypeScript, Drizzle ORM)
- ✅ 확장 가능한 아키텍처
- ✅ Supabase 기반 안정적인 인증
- ✅ 반응형 디자인 및 접근성 고려
- ✅ 명확한 데이터 모델 및 API 구조

### 향후 과제
- AI 분석 엔진 실제 연동
- 에너지 스팟 API 연동
- 성능 최적화
- 테스트 커버리지 확대
- 모니터링 및 로깅 시스템 구축

---

**분석 일자**: 2026-01-24  
**프로젝트 버전**: 0.1.0
