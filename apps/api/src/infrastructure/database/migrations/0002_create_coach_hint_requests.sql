CREATE TABLE "coach_hint_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"question_id" text NOT NULL,
	"question_purpose" text NOT NULL,
	"level" integer NOT NULL,
	"outcome" text NOT NULL,
	"design_revision" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coach_hint_requests" ADD CONSTRAINT "coach_hint_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;