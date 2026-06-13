CREATE TABLE "account" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "address" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company" text,
	"line1" text NOT NULL,
	"line2" text,
	"postal_code" text,
	"city" text,
	"country" text,
	"phone" text,
	"is_default" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim" (
	"id" text PRIMARY KEY NOT NULL,
	"registration_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"photo_paths" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_token" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"type" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_attribute_value" (
	"id" text PRIMARY KEY NOT NULL,
	"attribute_id" text NOT NULL,
	"code" text NOT NULL,
	"label_i18n" jsonb NOT NULL,
	"swatch_hex" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_attribute" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"code" text NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"input_type" text DEFAULT 'select' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_link" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"linked_product_id" text NOT NULL,
	"type" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_option" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"group_label_i18n" jsonb,
	"price_delta_eur" numeric(10, 2) NOT NULL,
	"sku" text,
	"stock" integer,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"unit_id" text NOT NULL,
	"purchased_at" timestamp,
	"purchase_proof" text,
	"warranty_until" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"contact_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"variant_id" text,
	"serial" text,
	"status" text DEFAULT 'minted' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password_hash" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"onboarded" boolean DEFAULT false NOT NULL,
	"locale" text DEFAULT 'fr' NOT NULL,
	"token_version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "variant_value" (
	"variant_id" text NOT NULL,
	"attribute_id" text NOT NULL,
	"value_id" text NOT NULL,
	CONSTRAINT "variant_value_variant_id_attribute_id_pk" PRIMARY KEY("variant_id","attribute_id")
);
--> statement-breakpoint
CREATE TABLE "variant" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"sku" text NOT NULL,
	"price_eur" numeric(10, 2) NOT NULL,
	"sale_price_eur" numeric(10, 2),
	"stock" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_registration_id_registration_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_token" ADD CONSTRAINT "email_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_value" ADD CONSTRAINT "product_attribute_value_attribute_id_product_attribute_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."product_attribute"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute" ADD CONSTRAINT "product_attribute_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_link" ADD CONSTRAINT "product_link_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_link" ADD CONSTRAINT "product_link_linked_product_id_product_id_fk" FOREIGN KEY ("linked_product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_option" ADD CONSTRAINT "product_option_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_unit_id_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit" ADD CONSTRAINT "unit_variant_id_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_value" ADD CONSTRAINT "variant_value_variant_id_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_value" ADD CONSTRAINT "variant_value_attribute_id_product_attribute_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."product_attribute"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_value" ADD CONSTRAINT "variant_value_value_id_product_attribute_value_id_fk" FOREIGN KEY ("value_id") REFERENCES "public"."product_attribute_value"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant" ADD CONSTRAINT "variant_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_token_hash_uq" ON "email_token" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "email_token_user_idx" ON "email_token" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "product_attribute_value_attr_idx" ON "product_attribute_value" USING btree ("attribute_id");--> statement-breakpoint
CREATE INDEX "product_attribute_product_idx" ON "product_attribute" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_link_uq" ON "product_link" USING btree ("product_id","linked_product_id","type");--> statement-breakpoint
CREATE INDEX "product_link_product_idx" ON "product_link" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_option_sku_uq" ON "product_option" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_option_product_idx" ON "product_option" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_sku_uq" ON "product" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "registration_user_idx" ON "registration" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_active_unit_uq" ON "registration" USING btree ("unit_id") WHERE status = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "unit_token_uq" ON "unit" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "unit_serial_uq" ON "unit" USING btree ("serial");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_sku_uq" ON "variant" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "variant_product_idx" ON "variant" USING btree ("product_id");