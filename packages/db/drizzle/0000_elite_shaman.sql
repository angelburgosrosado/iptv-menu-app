CREATE TABLE "admin_actions" (
	"action_id" text PRIMARY KEY NOT NULL,
	"admin_uid" text NOT NULL,
	"action_type" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"notes" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_configs" (
	"app_id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"owner_uid" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"theme" jsonb NOT NULL,
	"playlist_url" text NOT NULL,
	"epg_url" text,
	"announcement" text,
	"version" integer DEFAULT 1 NOT NULL,
	"active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "build_requests" (
	"build_id" text PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"app_name" text NOT NULL,
	"brand_config" jsonb NOT NULL,
	"playlist_source" jsonb NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"artifact_path" text,
	"build_log_path" text,
	"app_config_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "epg_feeds" (
	"epg_id" text PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"playlist_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"source_config" jsonb NOT NULL,
	"output_file_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_generated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "playlist_runs" (
	"run_id" text PRIMARY KEY NOT NULL,
	"playlist_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"summary" jsonb,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"playlist_id" text PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"name" text NOT NULL,
	"source_type" text NOT NULL,
	"original_file_path" text,
	"cleaned_file_path" text,
	"channel_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'ready' NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tv_pairings" (
	"code" text PRIMARY KEY NOT NULL,
	"device_id" text,
	"device_name" text DEFAULT 'Smart TV' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"token" text,
	"user" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"uid" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"photo_url" text,
	"role" text DEFAULT 'user' NOT NULL,
	"account_status" text DEFAULT 'active' NOT NULL,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"workspace_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_uid" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"subscription_status" text DEFAULT 'active' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"entitlements" jsonb NOT NULL,
	"usage" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_configs" ADD CONSTRAINT "app_configs_workspace_id_workspaces_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_configs" ADD CONSTRAINT "app_configs_owner_uid_users_uid_fk" FOREIGN KEY ("owner_uid") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build_requests" ADD CONSTRAINT "build_requests_uid_users_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "epg_feeds" ADD CONSTRAINT "epg_feeds_uid_users_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "epg_feeds" ADD CONSTRAINT "epg_feeds_playlist_id_playlists_playlist_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("playlist_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_runs" ADD CONSTRAINT "playlist_runs_playlist_id_playlists_playlist_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("playlist_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_uid_users_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_uid_users_uid_fk" FOREIGN KEY ("owner_uid") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;