CREATE TABLE "user_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"type" text NOT NULL,
	"path" text NOT NULL,
	"duration_ms" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_activities_user_idx" ON "user_activities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_activities_type_idx" ON "user_activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "user_activities_path_idx" ON "user_activities" USING btree ("path");--> statement-breakpoint
CREATE INDEX "user_activities_created_idx" ON "user_activities" USING btree ("created_at");