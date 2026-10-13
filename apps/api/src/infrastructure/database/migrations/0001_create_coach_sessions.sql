CREATE TABLE "coach_sessions" (
	"project_id" uuid PRIMARY KEY NOT NULL,
	"mode" text DEFAULT 'open-project' NOT NULL,
	"modeling_intent" text,
	"stage" text NOT NULL,
	"objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"turns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active_question_id" text,
	"design_revision" text,
	"version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coach_sessions" ADD CONSTRAINT "coach_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;