/**
 * profiles 테이블에 saju(만세력/명리학) 컬럼 추가
 * 실행: cd backend && node scripts/migrate-saju.js
 */
import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL 환경 변수가 없습니다.');
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  try {
    console.log('🔄 profiles 테이블에 saju 컬럼 추가 중...');
    await sql.unsafe(`
      ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "saju" jsonb;
    `);
    console.log('✅ 마이그레이션 완료: saju 컬럼이 추가되었습니다.');
  } catch (err) {
    console.error('❌ 마이그레이션 실패:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
