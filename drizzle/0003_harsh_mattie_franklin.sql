ALTER TABLE "fin_shares" RENAME COLUMN "shared_with_user_id" TO "shared_with_user_email";--> statement-breakpoint
ALTER TABLE "fin_shares" DROP CONSTRAINT "fin_shares_shared_with_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "fin_shares" DROP CONSTRAINT "fin_shares_fin_id_shared_with_user_id_pk";--> statement-breakpoint
ALTER TABLE "fin_shares" ADD CONSTRAINT "fin_shares_fin_id_shared_with_user_email_pk" PRIMARY KEY("fin_id","shared_with_user_email");