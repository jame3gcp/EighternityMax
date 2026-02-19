/**
 * E2E 테스트 스크립트
 * Playwright MCP 서버를 통한 UI 통합 테스트
 * 
 * 실행 방법:
 * 1. 백엔드 서버 실행: cd backend && npm run dev
 * 2. 프론트엔드 서버 실행: cd frontend && npm run dev
 * 3. 이 스크립트는 MCP 브라우저 도구를 통해 실행됩니다.
 */

const TEST_CONFIG = {
  frontendUrl: 'http://localhost:5173',
  backendUrl: 'http://localhost:3001',
  testUser: {
    birthDate: '1990-01-01',
    birthTime: '14:30',
    gender: 'male',
    region: '서울시 강남구'
  }
};

// 테스트 시나리오 정의
const scenarios = {
  scenario1: {
    name: '신규 사용자 가입 → 분석 생성 → Home 진입',
    steps: [
      { action: 'navigate', url: `${TEST_CONFIG.frontendUrl}/login` },
      { action: 'wait', selector: 'text=테스트 로그인 → 홈', timeout: 5000 },
      { action: 'click', selector: 'text=테스트 로그인 → 홈' },
      { action: 'wait', url: `${TEST_CONFIG.frontendUrl}/onboarding` },
      { action: 'wait', selector: 'text=개인정보 수집 및 이용 동의' },
      { action: 'check', selector: 'input[type="checkbox"]:first-of-type' },
      { action: 'check', selector: 'input[type="checkbox"]:last-of-type' },
      { action: 'click', selector: 'text=동의하고 시작하기' },
      { action: 'wait', selector: 'text=기본 정보 입력' },
      { action: 'fill', selector: 'input[type="date"]', value: TEST_CONFIG.testUser.birthDate },
      { action: 'fill', selector: 'input[type="time"]', value: TEST_CONFIG.testUser.birthTime },
      { action: 'click', selector: 'input[value="male"]' },
      { action: 'fill', selector: 'input[placeholder*="지역"]', value: TEST_CONFIG.testUser.region },
      { action: 'click', selector: 'text=내 에너지 분석 시작' },
      { action: 'wait', selector: 'text=당신의 라이프 패턴을 분석 중입니다', timeout: 10000 },
      { action: 'wait', selector: 'text=분석 완료', timeout: 5000 },
      { action: 'wait', selector: 'text=Energy Type' },
      { action: 'click', selector: 'text=대시보드로 이동' },
      { action: 'wait', url: `${TEST_CONFIG.frontendUrl}/` },
      { action: 'verify', selector: 'text=Eighternity에 오신 것을 환영합니다' },
      { action: 'verify', selector: 'text=Energy Index' }
    ]
  },
  scenario2: {
    name: '기존 사용자 로그인 → Home 진입',
    steps: [
      { action: 'navigate', url: `${TEST_CONFIG.frontendUrl}/login` },
      { action: 'click', selector: 'text=테스트 로그인 → 홈' },
      { action: 'wait', url: `${TEST_CONFIG.frontendUrl}/` },
      { action: 'verify', selector: 'text=Energy Index' }
    ]
  },
  scenario3: {
    name: '데일리 가이드 조회 및 날짜 변경',
    steps: [
      { action: 'navigate', url: `${TEST_CONFIG.frontendUrl}/daily-guide` },
      { action: 'wait', selector: 'text=데일리 가이드' },
      { action: 'verify', selector: 'text=Phase Tag' },
      { action: 'verify', selector: 'text=Energy Index' },
      { action: 'fill', selector: 'input[type="date"]', value: '2026-01-20' },
      { action: 'wait', selector: 'text=오늘 적합한 활동', timeout: 3000 }
    ]
  }
};

module.exports = { TEST_CONFIG, scenarios };
