import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const devSecret = 'dev-secret-key-change-in-production';

function getJwtSecret() {
  const raw = process.env.JWT_SECRET;
  if (nodeEnv === 'production') {
    if (!raw || String(raw).trim() === '' || raw === devSecret) {
      console.error('FATAL: JWT_SECRET must be set to a secure, non-default value in production.');
      process.exit(1);
    }
    return raw;
  }
  return raw && String(raw).trim() !== '' ? raw : devSecret;
}

function getCorsOrigin() {
  if (nodeEnv !== 'production') {
    return process.env.CORS_ORIGIN || true;
  }
  let raw = process.env.CORS_ORIGIN;
  if (!raw || String(raw).trim() === '') {
    // Vercel: 동일 도메인 배포 시 VERCEL_URL로 기본 허용 (프론트/백엔드 같은 호스트)
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl && String(vercelUrl).trim() !== '') {
      raw = `https://${vercelUrl.trim()},https://eighternity-max.vercel.app`;
    } else {
      console.error('FATAL: CORS_ORIGIN must be set in production (comma-separated list of allowed origins).');
      process.exit(1);
    }
  }
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: getJwtSecret(),
  nodeEnv,
  corsOrigin: getCorsOrigin(),
  dbPath: process.env.DB_PATH || './mock-data/data.json',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  openaiTimeoutMs: parseInt(process.env.OPENAI_TIMEOUT_MS || '180000', 10),
  openaiPromptVersion: '1',
};
