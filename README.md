# Eighternity - 기운 사이클 시각화 웹사이트

사람의 기운(에너지) 흐름을 사이클 구조로 직관적으로 시각화하고 개인 맞춤 해석을 제공하는 모던한 웹사이트입니다.

## 프로젝트 구조

```
EighternityMax/
├── frontend/          # React 프론트엔드
├── backend/           # 목업 백엔드 서버
└── docs/              # 문서
```

## 기술 스택

### 프론트엔드
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (상태 관리)
- D3.js (사이클 차트)
- Recharts (추가 그래프)
- Framer Motion (애니메이션)
- React Router v6
- React Hook Form

### 백엔드 (목업)
- Express.js
- JSON 파일 기반 데이터 저장

## 시작하기

### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 `http://localhost:5173`에서 실행됩니다.

### 백엔드 실행 (선택사항)

목업 모드에서는 백엔드 없이도 작동하지만, 실제 API 서버를 사용하려면:

```bash
cd backend
npm install
npm run dev
```

백엔드는 `http://localhost:3001`에서 실행됩니다.

## 주요 기능

1. **온보딩**: 기본 정보 입력 및 AI 분석
2. **Home (대시보드)**: 현재 상태 요약 및 빠른 진입
3. **나의 사이클**: 인터랙티브 사이클 차트 시각화
4. **데일리 가이드**: 오늘의 상태 입력 및 AI 가이드
5. **에너지 예보 (30일)**: 30일 에너지 곡선 차트
6. **Life Profile**: AI 에너지 프로필
7. **인생 방향 가이드**: 6개 카테고리별 생활 가이드
8. **기록 & 리포트**: 상태 기록 및 변화 추이 그래프
9. **행운 센터**: 행운 번호 및 미니 게임
10. **에너지 스팟 지도**: 위치 기반 장소 추천
11. **콘텐츠 / 가이드**: 사이클 이론 및 관리법 가이드
12. **마이페이지**: 개인정보 관리 및 설정

## 반응형 디자인

- 모바일: 360px 이상
- 태블릿: 768px 이상
- 데스크탑: 1200px 이상

## 개발 가이드

### 환경 변수

프론트엔드에서 실제 백엔드 API를 사용하려면 `.env` 파일을 생성하세요:

```
VITE_API_URL=http://localhost:3001/api
```

### 빌드

```bash
cd frontend
npm run build
```

빌드된 파일은 `frontend/dist` 디렉토리에 생성됩니다.

## 라이선스

MIT
