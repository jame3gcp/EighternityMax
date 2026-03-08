# SonarQube CI 오류 분석

GitHub Actions에서 SonarQube 워크플로우 실패 시 아래 항목을 순서대로 확인하세요.

## 1. 어떤 Step에서 실패했는지 확인

**Actions** → 해당 Run 클릭 → 실패한 Job → **빨간색 Step** 클릭 후 로그 맨 아래 에러 메시지 확인.

---

## 2. 자주 나오는 오류와 대응

### SONAR_TOKEN 관련

| 증상 | 원인 | 조치 |
|------|------|------|
| `SONAR_TOKEN is missing` / `Invalid token` | 시크릿 미설정 또는 만료 | Repo **Settings** → **Secrets and variables** → **Actions** 에서 `SONAR_TOKEN` 추가. SonarQube Cloud에서 토큰 재발급 후 값 갱신 |

### 프로젝트 식별

| 증상 | 원인 | 조치 |
|------|------|------|
| `Project not found` / `Organization not found` | projectKey·organization 불일치 | `sonar-project.properties`의 `sonar.projectKey`, `sonar.organization`를 SonarQube Cloud 프로젝트 설정과 동일하게 수정 |

### npm / 테스트

| 증상 | 원인 | 조치 |
|------|------|------|
| `Install frontend dependencies` 실패 | `package-lock.json`과 `package.json` 불일치 | 로컬에서 `cd frontend && npm install` 후 `frontend/package-lock.json` 커밋 |
| `Install backend dependencies` 실패 | backend lock 불일치 | `cd backend && npm install` 후 `backend/package-lock.json` 커밋 |
| `Run frontend tests with coverage` 실패 | 테스트 실패 또는 타임아웃 | 로컬에서 `cd frontend && npm run test:run -- --coverage` 실행해 동일 오류 재현 후 수정 |

### LCOV / 커버리지 경로

| 증상 | 원인 | 조치 |
|------|------|------|
| `Could not resolve file paths in ... lcov.info` | LCOV 내 경로가 `src/...`(frontend 기준)인데 Sonar는 루트 기준 경로 기대 | 워크플로에 **Fix LCOV paths for SonarQube** step이 있는지 확인. 없으면 `.github/workflows/sonarqube.yml`에 해당 step 추가됨(이미 반영됨) |
| `Report file .../lcov.info not found` | 테스트 단계 실패로 `lcov.info` 미생성 | 위의 "Run frontend tests with coverage 실패" 항목대로 테스트부터 수정 |

---

## 3. 적용된 수정 (LCOV 경로)

Vitest가 생성하는 `lcov.info`의 파일 경로는 `src/...`(frontend 디렉터리 기준)인데, SonarQube는 저장소 루트 기준으로 파일을 찾습니다.  
그래서 **Fix LCOV paths for SonarQube** step에서 `src/` → `frontend/src/`로 치환해 두었습니다.  
이 수정이 있으면 "Could not resolve file paths in lcov.info" 유형 오류는 대부분 해소됩니다.

---

## 4. 여전히 실패할 때

실패한 **Step 이름**과 로그에 나온 **에러 메시지 전체**를 복사해 두고,  
- SONAR_TOKEN / projectKey·organization / npm·테스트 / LCOV 중 어디에서 터졌는지 위 표와 비교한 뒤  
- 필요하면 해당 Step 주변 설정(시크릿, properties, 스크립트)만 최소로 수정해 재실행하면 됩니다.
