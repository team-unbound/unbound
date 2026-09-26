CREATE TABLE "event_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"age" integer NOT NULL,
	"grade_year" text NOT NULL,
	"committed" boolean NOT NULL,
	"committed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_signups_committed" CHECK ("event_signups"."committed"),
	CONSTRAINT "event_signups_age_range" CHECK ("event_signups"."age" BETWEEN 10 AND 120)
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "tagline" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "event_signups" ADD CONSTRAINT "event_signups_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_signups_event_email_lower_idx" ON "event_signups" USING btree ("event_id",lower("email"));--> statement-breakpoint
CREATE INDEX "event_signups_event_idx" ON "event_signups" USING btree ("event_id","created_at");