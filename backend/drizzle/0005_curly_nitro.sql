CREATE TABLE "game_scores" (
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
CREATE TABLE "ranking_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_contents" (
	"id" text PRIMARY KEY NOT NULL,
	"content_key" text NOT NULL,
	"title" text NOT NULL,
	"content_markdown" text NOT NULL,
	"version" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"effective_at" timestamp,
	"published_at" timestamp,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "nickname" text;--> statement-breakpoint
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_contents" ADD CONSTRAINT "site_contents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_contents" ADD CONSTRAINT "site_contents_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "game_scores_user_game_week_idx" ON "game_scores" USING btree ("user_id","game_id","week_key");--> statement-breakpoint
CREATE INDEX "game_scores_game_week_score_idx" ON "game_scores" USING btree ("game_id","week_key","score");--> statement-breakpoint
CREATE UNIQUE INDEX "site_contents_key_version_idx" ON "site_contents" USING btree ("content_key","version");--> statement-breakpoint
CREATE INDEX "site_contents_active_idx" ON "site_contents" USING btree ("content_key") WHERE status = 'active';