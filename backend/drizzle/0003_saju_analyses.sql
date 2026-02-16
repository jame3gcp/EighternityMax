-- ChatGPT 사주 상세 분석 결과 (프로필 저장 시 자동 생성, 동일 사주는 재사용)
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
--> statement-breakpoint
ALTER TABLE "saju_analyses" ADD CONSTRAINT "saju_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "saju_analyses" ADD CONSTRAINT "saju_analyses_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "saju_analyses_profile_signature_idx" ON "saju_analyses" USING btree ("profile_id","saju_signature");
--> statement-breakpoint
CREATE INDEX "saju_analyses_user_updated_idx" ON "saju_analyses" USING btree ("user_id","updated_at" DESC);
