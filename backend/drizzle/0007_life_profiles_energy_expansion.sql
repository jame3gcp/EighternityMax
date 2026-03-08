-- Life Profile 확장: energy_elements, energy_traits, energy_blueprint, insights_summary
ALTER TABLE "life_profiles" ADD COLUMN "energy_elements" jsonb;
--> statement-breakpoint
ALTER TABLE "life_profiles" ADD COLUMN "energy_traits" jsonb;
--> statement-breakpoint
ALTER TABLE "life_profiles" ADD COLUMN "energy_blueprint" jsonb;
--> statement-breakpoint
ALTER TABLE "life_profiles" ADD COLUMN "insights_summary" text;
