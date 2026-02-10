CREATE TABLE "userTargets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "userTargets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"targetWeight" real,
	"targetBodyFat" real,
	"recommendedCalories" integer,
	"recommendedCarbs" integer,
	"recommendedProtein" integer,
	"recommendedFat" integer,
	"sourceDate" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "userTargets_userId_unique" UNIQUE("userId")
);
