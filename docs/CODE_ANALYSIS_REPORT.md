# EighternityMax 코드 분석 보고서

**분석 일시**: 2025-02-20  
**범위**: 전체 프로젝트 (프론트엔드 + 백엔드)  
**포커스**: 품질, 보안, 성능, 아키텍처

---

## 1. 프로젝트 개요

| 구분 | 기술 스택 |
|------|-----------|
| **프론트엔드** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router v6 |
| **백엔드** | Node.js (ESM), Express, Drizzle ORM, Supabase Auth, PostgreSQL |
| **배포** | Vercel (프론트 + 서버리스 API), `backend/src/app.js` 진입 |

- **실제 실행 진입점**: `backend/src/server.js` → `backend/src/app.js` (프로덕션/로컬 dev 동일)
- **목업 서버**: 루트 `backend/server.js` (파일 기반 JSON, JWT 목업) — 프로덕션 미사용

---

## 2. 품질 (Quality)

### 2.1 긍정 요소

- **라우팅 구조**: v1 API(`/v1`)와 레거시 API(`/api`) 분리, 컨트롤러/미들웨어/유효성 검사 분리
- **타입**: 프론트엔드 전반 TypeScript 사용, `@/` alias 및 타입 정의(`types/index.ts`) 활용
- **코드 스플리팅**: `App.tsx`에서 페이지 단위 `lazy()` + `Suspense` 적용
- **테스트**: `api.test.ts`, `test-api.js`, Vitest/Testing Library 설정 존재
- **에러 처리**: 백엔드 `ApiError` + 전역 `errorHandler`, 환경별 스택 노출 제어

### 2.2 개선 권장 (심각도: 낮음)

| 항목 | 위치 | 권장 사항 |
|------|------|-----------|
| **Deprecated `.substr()`** | `backend/server.js`, `backend/src/controllers/user.js`, `auth.js`, `analytics.js` 등 | `.substr(start, len)` → `.substring(start, end)` 또는 `.slice(start, end)` 로 교체 (호환성·일관성) |
| **프론트엔드 `error: any`** | `frontend/src/services/api.ts` (getProfile 등) | `unknown` 또는 구체 타입 + 타입 가드 사용 권장 |
| **콘솔 로그 다수** | `AuthCallback.tsx`, `api.ts` (DEV 분기 있으나 일부 상시) | 프로덕션 빌드에서 제거되도록 조건 유지 또는 로거 유틸로 통일 |
| **목업 서버 단일 파일** | `backend/server.js` (450줄 이상) | 유지보수 시 라우트/핸들러 분리 검토 (현재는 목업 전용이라 우선순위 낮음) |

---

## 3. 보안 (Security)

### 3.1 잘 적용된 부분

- **JWT/프로덕션**: `config/index.js`에서 프로덕션 시 `JWT_SECRET` 필수, 기본값(`dev-secret-key-change-in-production`) 사용 시 `process.exit(1)`
- **개발 전용 토큰**: `middleware/auth.js`에서 `dev-test-token-` 은 `NODE_ENV === 'development'` 일 때만 허용
- **Helmet + CORS**: `app.js`에서 Helmet 적용, CORS는 `config.corsOrigin` 기반 제한
- **Rate limiting**: `express-rate-limit` (15분당 100회, `/v1/auth/oauth/dev/callback` POST 제외)
- **관리자 라우트**: `RoleGate`(프론트) + `verifyAdmin`(백엔드)로 admin 역할 검증
- **Stripe 웹훅**: `STRIPE_WEBHOOK_SECRET` 검증, `STRIPE_SECRET_KEY` 없을 시 초기화 단계에서 에러

### 3.2 주의·개선 권장

| 항목 | 심각도 | 설명 |
|------|--------|------|
| **MarkdownContent HTML 렌더** | 중 | `dangerouslySetInnerHTML`로 CMS/DB 기반 HTML 직접 삽입. 관리자만 편집 가능하다고 가정할 때 위험은 완화되나, **입력값 sanitization**(DOMPurify 등) 적용 권장 |
| **NaverMap innerHTML** | 낮음 | `div.innerHTML`는 내부 마크업 생성용으로 보임. 외부 입력이 들어가지 않는다면 유지 가능; 외부 입력이면 sanitize 필요 |
| **레거시 `/api/cycles`** | 낮음 | `legacy.js`의 `GET /api/cycles`에 `authenticate` 미적용. 공개 데이터 의도인지 확인 후, 필요 시 인증 추가 |
| **민감 정보 로깅** | 낮음 | `logger.js`에서 body 일부만 잘라 로깅하나, 토큰/비밀번호 필드가 로그에 남지 않도록 필터 유지 필요 |

---

## 4. 성능 (Performance)

### 4.1 잘 적용된 부분

- **프론트**: 페이지 lazy loading, 공통 로딩 fallback
- **백엔드**: DB 접근은 Drizzle ORM 사용, 연결 풀 등은 Supabase/Postgres 설정에 따름

### 4.2 개선 권장

| 항목 | 권장 사항 |
|------|-----------|
| **API 호출 중복** | 동일 세션 내 동일 프로필/유저 정보 반복 요청 가능성 있음. 필요 시 React Query 등으로 캐싱·중복 제거 검토 |
| **번들 크기** | recharts, react-quill, d3, leaflet 등 무거운 라이브러리 포함. 사용하지 않는 페이지는 lazy와 함께 트리 쉐이킹 확인 권장 |
| **이미지/정적 자산** | Vite 기본 최적화에 의존. 대용량 이미지가 있다면 lazy load·WebP 등 정책 검토 |

---

## 5. 아키텍처 (Architecture)

### 5.1 구조 요약

```
frontend/
  src/
    App.tsx          # 라우팅, Layout/AdminLayout 분기
    components/       # 공통 UI (Layout, Header, Sidebar, RoleGate, ProtectedRoute 등)
    pages/            # 페이지 단위 (Admin, LuckyHub, MyPage 등)
    services/         # api.ts (API 클라이언트), supabase, mockData
    store/            # Zustand (useUserStore, useLifeProfileStore 등)
    hooks/            # useActivityTracker 등
backend/
  src/
    server.js         # 진입점 → app.js
    app.js            # Express, helmet, cors, rate-limit, 라우트 마운트
    routes/           # v1.js, auth.js, user.js, legacy.js, admin.js, webhook
    controllers/      # auth, user, admin, analytics, gameScores, webhook 등
    middleware/       # auth, error, validate, admin, logger
    services/         # saju, lifeProfileGenerator, chatgptSajuAnalyzer, subscription
    models/           # schema (Drizzle), db, init
    config/           # index.js (env 기반 설정)
```

### 5.2 강점

- **이중 백엔드 정책 문서화**: `docs/PRODUCTION_CHECKLIST.md`, `docs/LOCAL_VS_VERCEL_DIFF.md` 등에 목업 vs 프로덕션 진입점이 명시됨
- **인증 일원화**: Supabase Auth + 백엔드 JWT/dev-token 정책이 일관됨
- **v1 우선**: 신규 기능은 `/v1`에 두고 레거시는 `/api`로 유지하는 전략이 명확함

### 5.3 개선 권장

| 항목 | 권장 사항 |
|------|-----------|
| **package.json main** | `"main": "server.js"`인데 실제 진입은 `src/server.js`. 혼동 방지를 위해 `"main": "src/server.js"` 또는 문서에만 명시 |
| **환경 변수 정리** | `OPENAI_*`, `DATABASE_URL`, `SUPABASE_*`, `STRIPE_*`, `JWT_SECRET`, `CORS_ORIGIN` 등 필수/선택 목록을 README 또는 `.env.example`에 정리 권장 |

---

## 6. 심각도별 요약

| 심각도 | 개수 | 대표 항목 |
|--------|------|-----------|
| **높음** | 0 | - |
| **중간** | 1 | CMS HTML `dangerouslySetInnerHTML` → sanitization 권장 |
| **낮음** | 다수 | `.substr` deprecation, `error: any`, `/api/cycles` 인증 여부, 콘솔 로그, 번들/캐싱 |

---

## 7. 권장 액션 로드맵

1. **단기 (1–2주)**  
   - CMS/정책 등에서 들어오는 HTML에 DOMPurify(또는 동등) 적용  
   - `.substr` → `.slice`/`.substring` 일괄 교체  
   - `GET /api/cycles` 인증 필요 여부 결정 후, 필요 시 `authenticate` 적용  

2. **중기 (1개월)**  
   - 프론트엔드 `error: any` 제거 및 타입 가드/unknown 활용  
   - 프로덕션 콘솔 로그 정리 또는 로거 모듈로 통일  
   - `.env.example` 및 배포 체크리스트에 환경 변수 목록 반영  

3. **장기**  
   - 대형 의존성(recharts, d3, quill 등) 사용처 점검 및 트리 쉐이킹  
   - API 응답 캐싱(React Query 등) 도입 검토  

---

*본 보고서는 정적 분석 및 패턴 검색 기반이며, 실제 런타임 동작은 배포 환경에서 추가 검증이 필요합니다.*
