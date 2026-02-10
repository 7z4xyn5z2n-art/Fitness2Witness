ALTER TABLE "users" DROP CONSTRAINT "users_openId_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phoneNumber" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "openId";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "passwordHash";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "resetToken";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "resetTokenExpiry";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "loginMethod";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_phoneNumber_unique" UNIQUE("phoneNumber");