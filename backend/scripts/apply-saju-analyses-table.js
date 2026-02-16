/**
 * saju_analyses 테이블 생성 (drizzle-kit push 버그 우회용)
 * 실행: cd backend && node scripts/apply-saju-analyses-table.js
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
    console.log('🔄 saju_analyses 테이블 생성 중...');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "saju_analyses" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "profile_id" text NOT NULL,
        "saju_signature" text NOT NULL,
        "input_saju" jsonb,
        "analysis" jsonb,
        "model" text,
        "prompt_version" text,
        "status" text NOT NULL,
        "error_message" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await sql.unsafe(`
      ALTER TABLE "saju_analyses"
        ADD CONSTRAINT "saju_analyses_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    `).catch((err) => {
      if (err.code === '42710') {
        console.log('ℹ️  FK saju_analyses_user_id_users_id_fk 이미 존재');
      } else throw err;
    });

    await sql.unsafe(`
      ALTER TABLE "saju_analyses"
        ADD CONSTRAINT "saju_analyses_profile_id_profiles_id_fk"
        FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    `).catch((err) => {
      if (err.code === '42710') {
        console.log('ℹ️  FK saju_analyses_profile_id_profiles_id_fk 이미 존재');
      } else throw err;
    });

    await sql.unsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "saju_analyses_profile_signature_idx"
        ON "saju_analyses" USING btree ("profile_id", "saju_signature");
    `).catch((err) => {
      if (err.code === '42710') {
        console.log('ℹ️  인덱스 saju_analyses_profile_signature_idx 이미 존재');
      } else throw err;
    });

    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS "saju_analyses_user_updated_idx"
        ON "saju_analyses" USING btree ("user_id", "updated_at" DESC);
    `).catch((err) => {
      if (err.code === '42710') {
        console.log('ℹ️  인덱스 saju_analyses_user_updated_idx 이미 존재');
      } else throw err;
    });

    console.log('✅ saju_analyses 테이블 적용 완료.');
  } catch (err) {
    console.error('❌ 적용 실패:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
