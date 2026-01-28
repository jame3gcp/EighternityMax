/**
 * 개발 환경용 요청 로깅 미들웨어
 * 모든 HTTP 요청을 콘솔에 로그로 출력합니다.
 */

const isDev = process.env.NODE_ENV !== 'production';

// 색상 코드 (터미널 출력용)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// HTTP 메서드별 색상
const methodColors = {
  GET: colors.cyan,
  POST: colors.green,
  PUT: colors.yellow,
  PATCH: colors.yellow,
  DELETE: colors.red,
  OPTIONS: colors.dim,
  HEAD: colors.dim,
};

// 상태 코드별 색상
const getStatusColor = (status) => {
  if (status >= 500) return colors.red;
  if (status >= 400) return colors.yellow;
  if (status >= 300) return colors.blue;
  if (status >= 200) return colors.green;
  return colors.reset;
};

// 시간 포맷팅
const formatTime = (ms) => {
  if (ms < 10) return `${colors.green}${ms.toFixed(2)}ms${colors.reset}`;
  if (ms < 100) return `${colors.yellow}${ms.toFixed(2)}ms${colors.reset}`;
  return `${colors.red}${ms.toFixed(2)}ms${colors.reset}`;
};

// 날짜/시간 포맷팅
const formatTimestamp = () => {
  const now = new Date();
  return now.toLocaleTimeString('ko-KR', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
};

/**
 * 요청 로깅 미들웨어
 */
export const requestLogger = (req, res, next) => {
  if (!isDev) {
    return next(); // 프로덕션에서는 로깅 비활성화
  }

  const startTime = Date.now();
  const timestamp = formatTimestamp();
  const method = req.method;
  const path = req.path;
  const query = Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query).toString()}` : '';
  const fullPath = `${path}${query}`;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  // 요청 시작 로그
  const methodColor = methodColors[method] || colors.reset;
  console.log(
    `${colors.dim}[${timestamp}]${colors.reset} ` +
    `${methodColor}${method.padEnd(7)}${colors.reset} ` +
    `${colors.bright}${fullPath}${colors.reset} ` +
    `${colors.dim}from ${ip}${colors.reset}`
  );

  // 요청 본문 로그 (POST, PUT, PATCH만)
  if (['POST', 'PUT', 'PATCH'].includes(method) && req.body && Object.keys(req.body).length > 0) {
    const bodyStr = JSON.stringify(req.body, null, 2);
    // 긴 본문은 잘라서 표시
    const truncatedBody = bodyStr.length > 500 
      ? bodyStr.substring(0, 500) + '\n... (truncated)'
      : bodyStr;
    console.log(`${colors.dim}  Body:${colors.reset}\n${colors.cyan}${truncatedBody}${colors.reset}`);
  }

  // 응답 완료 시 로그
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const statusColor = getStatusColor(status);
    const statusText = status >= 400 ? '❌' : status >= 300 ? '↪️' : '✅';

    console.log(
      `${colors.dim}[${formatTimestamp()}]${colors.reset} ` +
      `${methodColor}${method.padEnd(7)}${colors.reset} ` +
      `${colors.bright}${fullPath}${colors.reset} ` +
      `${statusColor}${status}${colors.reset} ` +
      `${formatTime(duration)} ` +
      `${statusText}`
    );

    // 에러 응답인 경우 본문도 로그
    if (status >= 400 && body) {
      try {
        const errorBody = typeof body === 'string' ? JSON.parse(body) : body;
        console.log(`${colors.red}  Error: ${JSON.stringify(errorBody, null, 2)}${colors.reset}`);
      } catch (e) {
        // 파싱 실패 시 원본 출력
        const truncated = typeof body === 'string' && body.length > 200 
          ? body.substring(0, 200) + '...'
          : body;
        console.log(`${colors.red}  Error: ${truncated}${colors.reset}`);
      }
    }

    originalSend.call(this, body);
  };

  next();
};

/**
 * 서버 시작 시 로그 설정 정보 출력
 */
export const logServerStart = (port) => {
  if (!isDev) return;

  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}${colors.cyan}🚀 Eighternity API Server${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`${colors.green}✓${colors.reset} Server running on ${colors.bright}http://localhost:${port}${colors.reset}`);
  console.log(`${colors.green}✓${colors.reset} Environment: ${colors.yellow}${process.env.NODE_ENV || 'development'}${colors.reset}`);
  console.log(`${colors.green}✓${colors.reset} Request logging: ${colors.cyan}ENABLED${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`${colors.dim}Waiting for requests...${colors.reset}\n`);
};
