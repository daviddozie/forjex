CREATE TABLE "credentials" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128),
	"provider" varchar(50) NOT NULL,
	"access_token" text NOT NULL,
	"username" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"project_id" varchar(128) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"url" text NOT NULL,
	"status" varchar(50) DEFAULT 'ready' NOT NULL,
	"environment" varchar(50) DEFAULT 'production' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128),
	"name" varchar(255) NOT NULL,
	"repo_owner" varchar(255) NOT NULL,
	"repo_name" varchar(255) NOT NULL,
	"repo_url" text NOT NULL,
	"description" text,
	"framework" varchar(100) NOT NULL,
	"template" varchar(100) NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_live" boolean DEFAULT false NOT NULL,
	"branch" varchar(100) DEFAULT 'main' NOT NULL,
	"status" varchar(50) DEFAULT 'ready' NOT NULL,
	"add_cicd" boolean DEFAULT true NOT NULL,
	"deploy_vercel" boolean DEFAULT true NOT NULL,
	"vercel_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"github_id" varchar(128),
	"github_username" varchar(128) NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;