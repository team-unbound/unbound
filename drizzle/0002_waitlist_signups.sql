CREATE TYPE "public"."phone_type" AS ENUM('iphone', 'android', 'other');--> statement-breakpoint
CREATE TABLE "waitlist_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"role_text" text,
	"building" text,
	"city" text,
	"school" text,
	"heard_from" text,
	"phone_type" "phone_type",
	"is_17_plus" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_signups_email_unique" UNIQUE("email"),
	CONSTRAINT "waitlist_signups_email_len" CHECK (char_length("waitlist_signups"."email") <= 254),
	CONSTRAINT "waitlist_signups_full_name_len" CHECK (char_length("waitlist_signups"."full_name") <= 100),
	CONSTRAINT "waitlist_signups_role_text_len" CHECK (char_length("waitlist_signups"."role_text") <= 100),
	CONSTRAINT "waitlist_signups_building_len" CHECK (char_length("waitlist_signups"."building") <= 500),
	CONSTRAINT "waitlist_signups_city_len" CHECK (char_length("waitlist_signups"."city") <= 100),
	CONSTRAINT "waitlist_signups_school_len" CHECK (char_length("waitlist_signups"."school") <= 150),
	CONSTRAINT "waitlist_signups_heard_from_len" CHECK (char_length("waitlist_signups"."heard_from") <= 300)
);
--> statement-breakpoint
CREATE INDEX "waitlist_signups_created_at_idx" ON "waitlist_signups" USING btree ("created_at");