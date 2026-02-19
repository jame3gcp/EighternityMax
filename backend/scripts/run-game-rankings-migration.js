/**
 * 게임 랭킹 스키마 마이그레이션을 DB에 직접 적용합니다.
 * drizzle-kit push가 CHECK 제약 등으로 실패할 때 이 스크립트를 사용하세요.
 *
 * 사용: node scripts/run-game-rankings-migration.js
 * 필요: .env에 DATABASE_URL 설정
 */
import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL이 설정되지 않았습니다. .env를 확인하세요.');
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

// 괄호 안의 ; 에 의해 잘리지 않도록 문장을 명시적으로 나눔
const statements = [
  'ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "nickname" text',
  `CREATE TABLE IF NOT EXISTS "game_scores" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "game_id" text NOT NULL,
    "week_key" text NOT NULL,
    "score" integer NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
  'ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action',
  'CREATE UNIQUE INDEX IF NOT EXISTS "game_scores_user_game_week_idx" ON "game_scores" USING btree ("user_id","game_id","week_key")',
  'CREATE INDEX IF NOT EXISTS "game_scores_game_week_score_idx" ON "game_scores" USING btree ("game_id","week_key","score")',
  `CREATE TABLE IF NOT EXISTS "ranking_settings" (
    "key" text PRIMARY KEY NOT NULL,
    "value" jsonb NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
];

async function run() {
  console.log('게임 랭킹 마이그레이션 실행 중...');
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await sql.unsafe(stmt + ';');
      const preview = stmt.slice(0, 55).replace(/\s+/g, ' ');
      console.log(`  [${i + 1}/${statements.length}] OK: ${preview}...`);
    } catch (err) {
      if (err.code === '42P07') {
        console.log(`  [${i + 1}/${statements.length}] SKIP (이미 존재): 테이블/인덱스`);
      } else if (err.code === '42701') {
        console.log(`  [${i + 1}/${statements.length}] SKIP (이미 존재): 컬럼`);
      } else if (err.code === '42710') {
        console.log(`  [${i + 1}/${statements.length}] SKIP (이미 존재): 제약조건`);
      } else if (err.code === '42P16') {
        console.log(`  [${i + 1}/${statements.length}] SKIP (이미 존재): 제약조건`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] 실패:`, err.message);
        throw err;
      }
    }
  }
  console.log('마이그레이션 완료.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => sql.end());
