CREATE TYPE "public"."pairing_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"location" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pairing_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" "pairing_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	CONSTRAINT "pairing_requests_no_self" CHECK ("pairing_requests"."sender_id" <> "pairing_requests"."recipient_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"grade_year" text,
	"school" text,
	"bio" text,
	"fun_facts" text,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"profession" text,
	"open_to_pairing" boolean DEFAULT true NOT NULL,
	"avatar_url" text,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
ALTER TABLE "pairing_requests" ADD CONSTRAINT "pairing_requests_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairing_requests" ADD CONSTRAINT "pairing_requests_recipient_id_profiles_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_email_lower_idx" ON "newsletter_subscribers" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "pairing_requests_one_pending_idx" ON "pairing_requests" USING btree ("sender_id","recipient_id") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "pairing_requests_recipient_idx" ON "pairing_requests" USING btree ("recipient_id","status");--> statement-breakpoint
CREATE INDEX "pairing_requests_sender_idx" ON "pairing_requests" USING btree ("sender_id","status");--> statement-breakpoint
CREATE INDEX "profiles_onboarded_at_idx" ON "profiles" USING btree ("onboarded_at");--> statement-breakpoint
CREATE INDEX "profiles_open_to_pairing_idx" ON "profiles" USING btree ("open_to_pairing");