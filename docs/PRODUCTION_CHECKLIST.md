# 프로덕션 배포 전 체크리스트

오픈 서비스·앱스토어·국제 품질·보안 기준에 맞춰 배포 전 확인할 항목입니다.

## 1. 환경 변수 (필수)

### 백엔드 (`backend/.env` 또는 호스팅 환경 변수)

| 변수 | 설명 | 프로덕션 요구사항 |
|------|------|-------------------|
| `NODE_ENV` | `production`으로 설정 | 반드시 `production` |
| `JWT_SECRET` | JWT 서명용 비밀키 | **반드시 설정**. 기본값 사용 시 서버 기동 실패 |
| `CORS_ORIGIN` | 허용 출처 | **쉼표 구분 허용 도메인** (예: `https://app.example.com,https://www.example.com`) |
| `DATABASE_URL` | Postgres 연결 문자열 | Supabase 프로덕션 DB URL |
| `SUPABASE_URL` | Supabase 프로젝트 URL | 프로덕션 Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 롤 키 | 프로덕션 키 (노출 금지) |
| `OPENAI_API_KEY` | OpenAI API 키 | 사주 분석 사용 시 설정 |
| `STRIPE_SECRET_KEY` 또는 `STRIPE_API_KEY` | Stripe 시크릿 키 | 결제 사용 시 설정 |
| `STRIPE_WEBHOOK_SECRET` | Stripe 웹훅 시그니처 검증용 | 웹훅 사용 시 설정 |

### 프론트엔드 (빌드 시 `VITE_*` 주입)

| 변수 | 설명 |
|------|------|
| `VITE_API_URL` | 백엔드 API 베이스 URL (프로덕션 도메인) |
| `VITE_SUPABASE_URL` | Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key (퍼블릭 가능) |
| `VITE_NAVER_MAP_CLIENT_ID` | 네이버 지도 사용 시 |

## 2. 보안 확인

- [ ] `NODE_ENV=production` 설정
- [ ] `JWT_SECRET`를 강한 랜덤 값으로 설정 (기본값 미사용)
- [ ] `CORS_ORIGIN`에 허용 도메인만 설정 (와일드카드/전체 허용 금지)
- [ ] Supabase / Stripe / OpenAI 등 **프로덕션 키** 사용 (테스트 키 교체)
- [ ] HTTPS 적용 (프로덕션 트래픽 전 구간)
- [ ] 쿠키 옵션: `secure`, `sameSite` 프로덕션에 맞게 설정

## 3. 개인정보·정책

- [ ] 개인정보 처리방침·이용약관 최종 검토
- [ ] 처리방침/약관 링크 동작 확인 (푸터 등)
- [ ] 개인정보 보호책임자 연락처 유효성 확인

## 4. 의존성·품질

- [ ] `npm audit` 실행 후 **심각/높음** 이슈 해결
- [ ] 백엔드: `cd backend && npm run test` 통과
- [ ] 프론트: `cd frontend && npm run build` 성공

## 5. 실행 진입점

- 프로덕션 백엔드 진입점: `backend/src/server.js` → `backend/src/app.js`
- `backend/server.js`(루트)는 목업/로컬용 별도 파일이며, 프로덕션에서는 사용하지 않음.

## 6. 참고

- 상세 점검 계획: 프로젝트 내 오픈서비스 보안 품질 점검 계획 문서 참고.
- PWA/앱스토어: `manifest.json` 및 `index.html` 메타 태그는 별도 설정 가이드 참고.
