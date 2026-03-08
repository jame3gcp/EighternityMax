/**
 * life_profiles 테이블에 energy 확장 컬럼 추가 (0007 마이그레이션)
 * - energy_elements, energy_traits, energy_blueprint, insights_summary
 * Dev 로그인 시 "column energy_elements does not exist" 오류 해결용
 *
 * 실행: cd backend && node scripts/migrate-life-profiles-energy.js
 * 또는: npm run db:migrate-life-profiles-energy
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
    console.log('🔄 life_profiles 테이블에 energy 확장 컬럼 추가 중...');
    await sql.unsafe(`
      ALTER TABLE "life_profiles" ADD COLUMN IF NOT EXISTS "energy_elements" jsonb;
      ALTER TABLE "life_profiles" ADD COLUMN IF NOT EXISTS "energy_traits" jsonb;
      ALTER TABLE "life_profiles" ADD COLUMN IF NOT EXISTS "energy_blueprint" jsonb;
      ALTER TABLE "life_profiles" ADD COLUMN IF NOT EXISTS "insights_summary" text;
    `);
    console.log('✅ 마이그레이션 완료: energy_elements, energy_traits, energy_blueprint, insights_summary 컬럼이 추가되었습니다.');
  } catch (err) {
    console.error('❌ 마이그레이션 실패:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
