CREATE TABLE "authorization_code" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"app_id" text NOT NULL,
	"session_token" text NOT NULL,
	"redirect_uri" text NOT NULL,
	"state" text,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "authorization_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "authorization_code" ADD CONSTRAINT "authorization_code_app_id_falcon_auth_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."falcon_auth_app"("id") ON DELETE cascade ON UPDATE no action;
