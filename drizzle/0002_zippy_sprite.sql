CREATE TABLE "fin_shares" (
	"fin_id" varchar(255) NOT NULL,
	"shared_with_user_id" varchar(255) NOT NULL,
	"shared_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fin_shares_fin_id_shared_with_user_id_pk" PRIMARY KEY("fin_id","shared_with_user_id")
);
--> statement-breakpoint
ALTER TABLE "fin_shares" ADD CONSTRAINT "fin_shares_fin_id_fins_id_fk" FOREIGN KEY ("fin_id") REFERENCES "public"."fins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fin_shares" ADD CONSTRAINT "fin_shares_shared_with_user_id_users_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;