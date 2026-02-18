/**
 * lucky_number_draws 테이블 생성 (행운 번호 1일 1회 + 히스토리)
 * 실행: cd backend && node scripts/migrate-lucky-draws.js
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
    console.log('🔄 lucky_number_draws 테이블 생성 중...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "lucky_number_draws" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "date" text NOT NULL,
        "type" text NOT NULL,
        "numbers" jsonb NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "lucky_number_draws_user_date_idx" ON "lucky_number_draws" ("user_id", "date");
    `);
    console.log('✅ 마이그레이션 완료: lucky_number_draws 테이블이 생성되었습니다.');
  } catch (err) {
    console.error('❌ 마이그레이션 실패:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
