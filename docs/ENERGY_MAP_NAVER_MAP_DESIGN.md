# 에너지 스팟 지도 - 네이버 지도 API 연동 분석·설계

## 1. 현황 분석

### 1.1 현재 구조
- **페이지**: `frontend/src/pages/EnergyMap/EnergyMap.tsx`
- **지도 영역**: Mock UI (회색 박스 + "지도 시각화 (Mock)" 텍스트)
- **데이터**: `spotApi.getSpots(lat, lng, purpose)` 로 추천 스팟 목록 조회
- **Spot 타입**: `id`, `name`, `type`, `lat`, `lng`, `purpose`, `score`, `description`, `address`, `tags`

### 1.2 요구사항
- 에너지 스팟 지도 메뉴의 **지도 영역**에 실제 네이버 지도 표시
- 사용자 위치(또는 기본 중심) 기준으로 스팟 마커 표시
- 스팟 클릭 시 정보창(인포윈도우) 또는 목록 연동 가능

---

## 2. 기술 설계

### 2.1 사용 API
- **네이버 지도 API v3** (JavaScript)
- 문서: https://navermaps.github.io/maps.js.ncp/docs/
- 스크립트: `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId={CLIENT_ID}`

### 2.2 아키텍처

```
EnergyMap (페이지)
  ├── 목적 선택 (휴식/집중/만남)
  ├── NaverMapContainer (지도 영역)  ← 신규
  │     ├── 스크립트 동적 로드 (VITE_NAVER_MAP_CLIENT_ID)
  │     ├── 지도 초기화 (center: 사용자 위치 또는 서울 기본값)
  │     ├── 사용자 위치 마커 (선택)
  │     └── 스팟 마커들 (spots 배열)
  └── 추천 장소 목록 (기존)
```

### 2.3 컴포넌트 책임
| 구분 | 파일 | 역할 |
|------|------|------|
| 스크립트 로더 | `utils/naverMapLoader.ts` | Naver Map JS 스크립트 동적 로드, 로드 완료 Promise 반환 |
| 타입 | `types/naver-maps.d.ts` | `window.naver`, `naver.maps` 타입 선언 (선택) |
| 지도 UI | `components/NaverMap/NaverMap.tsx` | 지도 컨테이너, center/spots 반영, 마커·인포윈도우 |

### 2.4 데이터 흐름
1. `EnergyMap`에서 `loadSpots()`로 스팟 목록 조회 (기존)
2. 중심 좌표: 현재 고정값 `37.5665, 126.9780` (서울) → 추후 브라우저 Geolocation API로 사용자 위치 사용 가능
3. `NaverMap`에 `center={{ lat, lng }}`, `spots={spots}` 전달
4. 지도: center로 지도 중심/줌 설정, spots로 마커 생성

### 2.5 환경 변수
- `VITE_NAVER_MAP_CLIENT_ID`: 네이버 클라우드 플랫폼에서 발급한 지도 API Client ID
- `.env.development`, `.env.example`에 예시 추가 (실제 값은 NCP에서 발급)

### 2.6 예외 처리
- Client ID 미설정: 지도 대신 "지도 사용을 위해 Client ID를 설정해주세요" 안내 문구
- 스크립트 로드 실패: 에러 메시지 표시
- 스팟 0건: 지도만 표시, 마커 없음

---

## 3. 구현 범위 (이번 작업)

1. **분석·설계 문서** (본 문서)
2. **네이버 지도 스크립트 로더** + 전역 타입
3. **NaverMap 컴포넌트**: 지도 + 중심 마커 + 스팟 마커 + 스팟 클릭 시 인포윈도우
4. **EnergyMap 수정**: Mock 영역을 `NaverMap`으로 교체, `VITE_NAVER_MAP_CLIENT_ID` 사용
5. **환경 변수**: `.env.development`에 `VITE_NAVER_MAP_CLIENT_ID` placeholder, `.env.example` 추가

---

## 4. NCP 설정 안내 (운영 시)

1. https://www.ncloud.com/product/applicationService/maps 접속
2. Application 등록 후 **Maps > Web Dynamic Map** 사용
3. Web 서비스 URL 등록 (localhost, 실제 도메인)
4. Client ID를 복사하여 `VITE_NAVER_MAP_CLIENT_ID`에 설정

---

## 5. 구현 완료 파일 (참고)

| 파일 | 설명 |
|------|------|
| `frontend/src/utils/naverMapLoader.ts` | 스크립트 동적 로드 |
| `frontend/src/types/naver-maps.d.ts` | 네이버 지도 전역 타입 |
| `frontend/src/components/NaverMap/NaverMap.tsx` | 지도 + 스팟 마커 + 인포윈도우 |
| `frontend/src/pages/EnergyMap/EnergyMap.tsx` | NaverMap 사용으로 수정 |
| `frontend/.env.development` | `VITE_NAVER_MAP_CLIENT_ID` 추가 |
| `frontend/.env.example` | 환경 변수 예시 |
