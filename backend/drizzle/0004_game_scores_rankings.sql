-- profiles.nickname (랭킹 표시명)
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "nickname" text;

-- game_scores
CREATE TABLE IF NOT EXISTS "game_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"game_id" text NOT NULL,
	"week_key" text NOT NULL,
	"score" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "game_scores_user_game_week_idx" ON "game_scores" USING btree ("user_id","game_id","week_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "game_scores_game_week_score_idx" ON "game_scores" USING btree ("game_id","week_key","score");

-- ranking_settings
CREATE TABLE IF NOT EXISTS "ranking_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
