/**
 * users 테이블에 privacy_consent_at 컬럼 추가
 * 테스트 계정 로그인 500 오류 해결용 (컬럼 없음 오류)
 *
 * 실행: cd backend && node scripts/migrate-privacy-consent.js
 * 또는: npm run db:migrate-consent
 */
import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL 환경 변수가 없습니다. .env 파일을 확인하세요.');
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  try {
    console.log('🔄 users 테이블에 privacy_consent_at 컬럼 추가 중...');
    await sql.unsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "privacy_consent_at" timestamp;
    `);
    console.log('✅ 마이그레이션 완료: privacy_consent_at 컬럼이 추가되었습니다.');
  } catch (err) {
    console.error('❌ 마이그레이션 실패:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
