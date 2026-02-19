# Eighternity 프로젝트 규칙 (디렉터리·코드·API)

AI 어시스턴트(Claude, Cursor 등)와 개발자가 프로젝트 구조와 규칙을 일관되게 따르기 위한 단일 참고 문서입니다.

---

## 1. 프로젝트 개요

- **서비스명**: Eighternity (기운 사이클 시각화 / 라이프 인텔리전스)
- **한 줄 설명**: 생년월일시·성별 기반 AI 개인 에너지 분석 및 사이클 시각화 웹앱
- **핵심 스택**
  - **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, D3.js, Recharts, Framer Motion, React Router v6
  - **Backend**: Express.js, Drizzle ORM, PostgreSQL(Supabase), Supabase Auth
  - **배포**: Vercel (프론트 정적 빌드 + 백엔드 Serverless)

---

## 2. 루트 디렉터리 구조

| 디렉터리/파일 | 역할 |
|---------------|------|
| `frontend/` | React SPA. 실행: `cd frontend && npm run dev`, 빌드 산출물: `frontend/dist/` |
| `backend/` | Express API. 진입: `src/server.js` → `src/app.js`, 실행: `npm run dev` |
| `docs/` | 기획·API·배포·트러블슈팅 등 문서 (`.md`) |
| `vercel.json` | 배포 라우팅: `/v1/*`, `/api/*` → 백엔드, `/*` → 프론트엔드 |

---

## 3. Frontend 디렉터리 규칙 (`frontend/src/`)

### 3.1 디렉터리 역할

| 디렉터리 | 용도 |
|----------|------|
| `components/` | 재사용 UI·차트·레이아웃·게임 컴포넌트. 한 컴포넌트당 한 폴더, PascalCase 폴더명 |
| `pages/` | 라우트별 페이지. 한 페이지당 한 폴더, PascalCase 폴더명. 라우트는 `App.tsx`에서 lazy + Suspense로 등록 |
| `services/` | `api.ts`(API 클라이언트·토큰·v1/레거시), `mockData.ts`, `supabase.ts` |
| `store/` | Zustand 스토어 (`useUIStore`, `useUserStore`, `useCycleStore`, `useLifeProfileStore` 등) |
| `types/` | 공용 TypeScript 타입 (`index.ts`) |
| `hooks/` | 커스텀 훅 |
| `utils/` | 공용 유틸 함수 |
| `styles/` | 전역 스타일 (Tailwind 등) |
| `data/` | 정적 데이터 |

### 3.2 네이밍 규칙

- **컴포넌트/페이지 폴더**: PascalCase (예: `Button`, `CycleChart`, `RegionSelect`, `LuckyHub`, `Onboarding`)
- **기본 파일**: `{ComponentName}.tsx` 또는 `{PageName}.tsx` (예: `Button/Button.tsx`, `Home/Home.tsx`)
- **import 경로**: `@/` alias 사용 (예: `@/components/Button/Button`, `@/store/useCycleStore`, `@/types`)

### 3.3 현재 컴포넌트·페이지 목록 (참고)

- **Components**: BalanceGame, Button, Card, CycleChart, DetailPanel, EnergyElementBadge, EnergyElementsChart, EnergyTraitsCard, Footer, Header, Input, Layout, NaverMap, ProtectedRoute, RegionSelect, Sidebar, SnakeGame, StatusCard, WaveGame
- **Pages**: AuthCallback, DailyGuide, DevProfileTest, EnergyForecast, EnergyMap, Guide, Home, Interpretation, LifeDirections, LifeProfile, Login, LuckyHub, MyCycle, MyPage, Onboarding, PrivacyPolicy, Record, TermsOfService

### 3.4 기타 규칙

- **Vite base**: 프로덕션 빌드 시 `base: '/frontend/'` ([vite.config.ts](frontend/vite.config.ts))
- 새 페이지/컴포넌트 추가 시 위 폴더·파일 네이밍 유지

---

## 4. Backend 디렉터리 규칙 (`backend/src/`)

### 4.1 디렉터리 역할

| 디렉터리 | 용도 |
|----------|------|
| `controllers/` | 도메인별 비즈니스 로직. 파일명 camelCase (예: `auth.js`, `user.js`, `lucky.js`, `lifeProfile.js`) |
| `routes/` | `v1.js`: `/v1` 마운트, auth/user/job 등. `legacy.js`: `/api` 마운트(cycles, records, daily-guide, spots 등) |
| `middleware/` | `auth.js`(Supabase 토큰 검증), `error.js`, `logger.js` |
| `models/` | `db.js`, `schema.js` (Drizzle 스키마). 마이그레이션·스크립트는 `backend/scripts/` |
| `config/` | 환경 변수 등 설정 |
| `services/` | 토큰·사용자 등 도메인 서비스 |
| `utils/` | 공용 유틸 (응답 포맷 등) |

### 4.2 규칙

- **모듈**: ESM(`import`/`export`) 사용
- **인증**: 인증 필요 라우트에는 `authenticate` 미들웨어 적용
- 새 API: v1용이면 라우트 추가 후 컨트롤러 연결, 레거시 호환 필요 시 `legacy.js`에 추가

---

## 5. API 구조 규칙

| prefix | 용도 | 인증 |
|--------|------|------|
| **v1** (`/v1`) | 인증·프로필·Life Profile·사주 분석·동의 저장 등 신규 기능 | `Authorization: Bearer {access_token}` |
| **레거시** (`/api`) | 사이클, 데일리 가이드, 기록(records), 리포트, 스팟, 행운 등 | 필요 시 동일 토큰 |

- 프론트엔드 [api.ts](frontend/src/services/api.ts)에서 `API_BASE_URL`, `V1_API_BASE`로 구분 사용
- 새 엔드포인트 추가 시 v1 vs 레거시 구분을 명시하고, [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md)의 API 목록과 맞출 것

---

## 6. 공통 코딩·환경 규칙

- **언어**: 프론트엔드 TypeScript, 백엔드 JavaScript (추후 백엔드 TypeScript 전환 검토 가능)
- **스타일**: 가독성·유지보수 우선, async/await 사용, 명확한 변수·함수명
- **환경 변수**
  - **Frontend**: `VITE_API_URL`(백엔드 URL), `VITE_USE_MOCK`(목업 여부)
  - **Backend**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `PORT`, `CORS_ORIGIN` 등 ([PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md) 참고)
- **반응형**: 360px(모바일), 768px(태블릿), 1200px(데스크톱) 기준

---

## 7. 참고 문서

| 문서 | 용도 |
|------|------|
| [README.md](README.md) | 프로젝트 소개·실행 방법·기술 스택 요약 |
| [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md) | 아키텍처·DB 스키마·API 목록·기능 상세 |
| [docs/2.AI연동API구조&데이터모델명세.md](docs/2.AI연동API구조&데이터모델명세.md) | OAuth·API·데이터 모델 명세 |
| [TEST_GUIDE.md](TEST_GUIDE.md) | 테스트 가이드 |
