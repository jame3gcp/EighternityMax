# eighternity-max Vercel 실패 배포 전체 분석

**분석 일시**: 2025-01-28  
**프로젝트**: eighternity-max (prj_TSM1pAzZu05keH946zxeGxkjhXtb)  
**실패 배포 수**: 10건 (총 16건 중)

---

## 1. 요약

| 구분 | 내용 |
|------|------|
| **주요 실패 원인** | ① `@supabase/supabase-js` 미설치/미해석 (8건), ② TypeScript/컴포넌트 타입 에러 (2건) |
| **해결된 시점** | 최근 2건은 READY (배포 성공). Supabase·TS 수정 후 재배포로 해결된 흐름 |
| **권장 사항** | `frontend/package.json`에 `@supabase/supabase-js` 명시, Vercel install 시 캐시 무시 옵션 유지 |

---

## 2. 실패 배포 목록 및 원인

### 2.1 @supabase/supabase-js 관련 (8건)

동일한 근본 원인: **`frontend/src/services/supabase.ts`·`api.ts`에서 `@supabase/supabase-js`를 import 하는데, Vercel 빌드 환경에서 패키지를 찾지 못함.**

- **TS 단계 실패**: `Cannot find module '@supabase/supabase-js' or its corresponding type declarations`  
  → `package.json`에 없거나, `npm ci` 시 설치되지 않은 상태.
- **Vite/Rollup 단계 실패**: `Rollup failed to resolve import "@supabase/supabase-js" from ".../supabase.ts"`  
  → 이전 배포 캐시를 쓰는 경우, 캐시에 supabase가 없어서 발생. `installCommand`에서 `rm -rf node_modules && npm ci`로 캐시 무시 후에도 Rollup이 해석하지 못한 케이스.

| # | 배포 ID | Commit 메시지 요약 | 빌드 로그 핵심 에러 |
|---|---------|-------------------|---------------------|
| 1 | dpl_5j6CJLJT7kUUvDzjvGqBCwAh9myk | installCommand 추가, node_modules 캐시 무시 | Rollup failed to resolve `@supabase/supabase-js` from supabase.ts |
| 2 | dpl_3h7Q1LwgLXcyFP3EhS49tsTz2RVp | @supabase/supabase-js 타입 선언 추가 | 동일 (Rollup resolve 실패) |
| 3 | dpl_BvKxMReqmcdoh768KnCg92QLhdqZ | esModuleInterop, allowSyntheticDefaultImports | TS2307: Cannot find module '@supabase/supabase-js' (api.ts, supabase.ts) |
| 4 | dpl_FRdMHnQbmK6mHB7HNr1p1JaBwMxC | types 필드 제거 (Supabase 모듈 인식) | TS2307: Cannot find module '@supabase/supabase-js' |
| 5 | dpl_g8sQed3DVjfHwu3WeB9fwJE9f4CW | TypeScript 설정 개선 (types 필드 추가) | (동일 패턴으로 추정) |
| 6 | dpl_J8a89q7ufYqKKhqdQxEBcSiRSnWn | NodeJS.Timeout → number (WaveGame, SnakeGame) | TS2307: Cannot find module '@supabase/supabase-js' |
| 7 | dpl_BzunXHsPgWHY4VCMXnvV1xZfsjhe | 누락 파일 추가, 타입 에러 수정 | (동일 패턴으로 추정) |
| 8 | dpl_G4yuFd6iU5m9SakqUoshbc9onE2y | import 상단 이동, API 디버깅 로그 | (동일 패턴 또는 타입/export 관련으로 추정) |

**공통점**

- `frontend`에서 `npm ci` 시 350 packages 설치. **`@supabase/supabase-js`가 dependencies에 없거나**, lockfile/캐시 영향으로 설치가 누락된 상태로 빌드됨.
- 일부 배포는 “이전 성공 배포(5ks4dL9q7vp6Zmscb3wi78zNDhKU) 캐시 복원” 후 빌드 → 그 캐시에 supabase가 없으면 Rollup이 resolve 실패.

---

### 2.2 TypeScript / 컴포넌트 타입 에러 (2건)

#### (1) dpl_8g8ZKhdViZ5Gzr3Bhk3o94J3uh2X — 최초 Vercel 설정 배포

- **Commit**: "Fix Vercel deployment configuration" (vercel.json, tsconfig, .vercelignore, SPA rewrites)
- **에러**:
  - `Button.tsx`: `onAnimationStart` 등이 `MotionProps`와 호환되지 않음 (framer-motion vs DOM 타입 충돌)
  - `CycleChart.utils.ts`: `d3.arc()` 호출 시 인자 부족 (Expected at least 1 arguments, but got 0)
  - `Interpretation.tsx`: `Card`에 `id` prop 없음 (CardProps에 id 미정의)
  - `mockData.ts`: `nextPhase` 타입 — string 할당 불가 (number 기대)
- **해결 방향**: 이후 커밋 "Fix TypeScript build errors for Vercel deployment"에서 Button/CycleChart/Card/mockData 수정 후 배포 성공(READY).

#### (2) dpl_Fby7KAhvypxhBMYtzHxvo32911nR — API URL 상대 경로

- **Commit**: "fix: Vercel 배포 환경 API URL 상대 경로 사용"
- **에러**:
  - `@/types`에서 export 없는 타입 사용: `OAuthCallbackResponse`, `Profile`, `LifeProfile`, `Job`, `DailyGuide`, `Directions`, `Spot`, `MonthlyReport`
  - `User` 타입에 `provider` 없음
  - `./supabase`·`@supabase/supabase-js` 모듈을 찾을 수 없음
- **해결 방향**: 이후 커밋들에서 `types/index.ts` 보강, Supabase 연동 및 타입 정리 후 배포 성공.

---

## 3. 원인별 정리

### 3.1 @supabase/supabase-js

| 가능 원인 | 설명 |
|-----------|------|
| **package.json 누락** | `frontend/package.json`의 `dependencies`에 `@supabase/supabase-js`가 없었을 가능성 |
| **캐시** | Vercel이 이전 배포의 `node_modules`를 복원한 경우, 그 시점에는 supabase가 없어서 tsc/vite 모두에서 실패 |
| **installCommand** | `cd frontend && rm -rf node_modules && npm ci`로 캐시 무시를 시도했지만, 일부 배포에서는 여전히 Rollup이 모듈을 해석하지 못함 (패키지가 lock/package에 반영되지 않은 상태였을 수 있음) |

**권장**

- `frontend/package.json`에 `"@supabase/supabase-js": "^2.x"` (또는 사용 중인 버전) 명시.
- Vercel 프로젝트 설정에서 **Install Command**를 `cd frontend && rm -rf node_modules && npm ci`로 두어 캐시 오염 시에도 깨끗한 설치가 되도록 유지.
- 배포 전 로컬에서 `cd frontend && npm ci && npm run build` 한 번 실행해, 동일한 lockfile으로 Supabase가 포함된 채 빌드되는지 확인.

### 3.2 TypeScript / 컴포넌트

- **Button**: `motion.button`에 넘기는 props에서 DOM 전용 prop과 Framer Motion 전용 prop이 겹치지 않도록 타입 분리 또는 Omit 처리.
- **CycleChart.utils.ts**: `d3.arc()`에 필요한 인자(예: innerRadius, outerRadius 등) 전달.
- **Card**: `CardProps`에 `id?: string` 등 HTML 속성 확장.
- **mockData**: `Interpretation` 타입의 `nextPhase`를 number로 맞추기.
- **types/index.ts**: API에서 쓰는 모든 타입(OAuthCallbackResponse, Profile, LifeProfile, Job, DailyGuide, Directions, Spot, MonthlyReport 등)을 export.
- **User**: 백엔드/ Supabase와 맞춰 `provider` 필드 추가하거나, 별도 타입으로 분리.

---

## 4. 성공 배포와의 관계

- **dpl_5ks4dL9q7vp6Zmscb3wi78zNDhKU**, **dpl_SaJwZrxtdMvq1bvL4NMk8FqZCMSY**: "feat: 외부 네트워크 접근 지원 및 UI 통합 테스트 추가" — Supabase 없이 빌드되는 시점의 성공.
- **dpl_8i565pytgCGsrrqAiEAiy78nbJsA**: "Fix TypeScript build errors for Vercel deployment" — Button, CycleChart, Card, mockData 수정으로 TS 에러 제거 후 성공.
- **dpl_FdHgXNfKAVzDTqS4eSErrW1zPrVv**, **dpl_hD9qEbeL5KApetpLUisH3M2eP7HC**, **dpl_F3f2J9shLdTo6WNKfuEcqX81gR9d**: 최근 production READY — 현재는 빌드가 통과하는 상태.

즉, 실패 10건은 **Supabase 도입 전후의 의존성·타입 정리 부족**과 **초기 Vercel/TS 설정 미비**에서 비롯되었고, 위 권장 사항을 반영한 현재 코드베이스는 이미 대부분 해결된 상태로 보임.

---

## 5. 다음에 할 일 (체크리스트)

- [ ] `frontend/package.json`에 `@supabase/supabase-js`가 있고, 로컬 `npm ci && npm run build` 성공하는지 확인
- [ ] Vercel Install Command가 `cd frontend && rm -rf node_modules && npm ci`인지 확인 (필요 시 유지)
- [ ] 새로 커밋 후 한 번 더 배포해, 실패 없이 READY 되는지 확인
- [ ] (선택) Vercel 대시보드에서 최근 실패 배포의 “Redeploy” 없이, 새 커밋으로만 배포해 캐시 영향 제거

이 문서는 Vercel MCP의 `list_deployments`·`get_deployment_build_logs` 결과를 바탕으로 작성되었습니다.
