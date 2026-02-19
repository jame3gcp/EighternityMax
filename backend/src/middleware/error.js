const isDev = process.env.NODE_ENV !== 'production';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = (err && typeof err.message === 'string' && err.message.trim() !== '')
    ? err.message
    : 'Internal Server Error';

  // 프로덕션에서도 원인 로깅 (Vercel 로그에 남김)
  if (!isDev && statusCode >= 500) {
    console.error('[errorHandler]', statusCode, message, err?.stack || err);
  }

  // 개발 환경에서 에러 로깅
  if (isDev) {
    const timestamp = new Date().toLocaleTimeString('ko-KR', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
    
    console.error(`\n${'\x1b[31m'}❌ ERROR [${timestamp}]${'\x1b[0m'}`);
    console.error(`${'\x1b[31m'}  Status: ${statusCode}${'\x1b[0m'}`);
    console.error(`${'\x1b[31m'}  Message: ${message}${'\x1b[0m'}`);
    console.error(`${'\x1b[33m'}  Path: ${req.method} ${req.path}${'\x1b[0m'}`);
    
    if (err.stack) {
      console.error(`${'\x1b[31m'}  Stack:${'\x1b[0m'}`);
      console.error(`${'\x1b[31m'}${err.stack}${'\x1b[0m'}\n`);
    } else {
      console.error('');
    }
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
