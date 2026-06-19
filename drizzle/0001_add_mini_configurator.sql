ALTER TABLE "product" ALTER COLUMN "kind" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "mini_configurator" boolean DEFAULT false NOT NULL;