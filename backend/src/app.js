import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { errorHandler } from './middleware/error.js';
import { requestLogger } from './middleware/logger.js';
import v1Routes from './routes/v1.js';
import legacyRoutes from './routes/legacy.js';
import webhookRoutes from './routes/webhook.js';

const app = express();

// Vercel 등 리버스 프록시 뒤에서 X-Forwarded-* 헤더 검증 오류 방지 (express-rate-limit 등)
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ 
  origin: config.corsOrigin, 
  credentials: true 
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.method === 'POST' && req.path === '/v1/auth/oauth/dev/callback',
});
app.use(limiter);

app.use('/webhook', webhookRoutes);

app.use(express.json());
app.use(cookieParser());

// 요청 로깅 미들웨어 (개발 환경에서만 활성화)
app.use(requestLogger);

app.use('/v1', v1Routes);
app.use('/api', legacyRoutes);

// 루트 경로
app.get('/', (_req, res) => {
  res.json({
    service: 'Eighternity API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      v1: '/v1',
      api: '/api',
      health: '/health',
    },
    message: 'API 서버가 정상적으로 실행 중입니다.',
  });
});

// 헬스 체크
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 핸들러 (알 수 없는 경로)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `요청하신 경로를 찾을 수 없습니다: ${req.method} ${req.path}`,
    availableEndpoints: {
      v1: '/v1',
      api: '/api',
      health: '/health',
    },
  });
});

app.use(errorHandler);

export default app;
