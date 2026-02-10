CREATE TYPE "public"."challengeType" AS ENUM('running', 'steps', 'workouts', 'custom');--> statement-breakpoint
CREATE TYPE "public"."postType" AS ENUM('Encouragement', 'Testimony', 'Photo', 'Video', 'Announcement');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'leader', 'admin');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('GroupOnly', 'LeadersOnly');--> statement-breakpoint
CREATE TABLE "bodyMetrics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bodyMetrics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"groupId" integer NOT NULL,
	"challengeId" integer NOT NULL,
	"date" timestamp NOT NULL,
	"weight" real,
	"bodyFatPercent" real,
	"muscleMass" real,
	"visceralFat" integer,
	"bmr" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challengeComments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "challengeComments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"challengeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challengeParticipants" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "challengeParticipants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"challengeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challengeProgress" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "challengeProgress_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"challengeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"currentValue" real DEFAULT 0 NOT NULL,
	"notes" text,
	"loggedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "challenges_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communityPosts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "communityPosts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"groupId" integer NOT NULL,
	"postType" "postType" NOT NULL,
	"postText" text,
	"postImageUrl" text,
	"postVideoUrl" text,
	"isPinned" boolean DEFAULT false NOT NULL,
	"visibility" "visibility" DEFAULT 'GroupOnly' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dailyCheckins" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "dailyCheckins_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"date" timestamp NOT NULL,
	"userId" integer NOT NULL,
	"groupId" integer NOT NULL,
	"challengeId" integer NOT NULL,
	"nutritionDone" boolean DEFAULT false NOT NULL,
	"hydrationDone" boolean DEFAULT false NOT NULL,
	"movementDone" boolean DEFAULT false NOT NULL,
	"scriptureDone" boolean DEFAULT false NOT NULL,
	"notes" text,
	"proofPhotoUrl" text,
	"workoutLog" text,
	"workoutAnalysis" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groupChallenges" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "groupChallenges_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"groupId" integer NOT NULL,
	"createdByUserId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"challengeType" "challengeType" NOT NULL,
	"goalValue" real,
	"goalUnit" varchar(50),
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groupChatMessages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "groupChatMessages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"groupId" integer NOT NULL,
	"messageText" text,
	"messageImageUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "groups_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"groupName" varchar(255) NOT NULL,
	"leaderUserId" integer,
	"challengeId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pointAdjustments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pointAdjustments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"date" timestamp NOT NULL,
	"userId" integer NOT NULL,
	"groupId" integer NOT NULL,
	"challengeId" integer NOT NULL,
	"pointsDelta" integer NOT NULL,
	"reason" text NOT NULL,
	"adjustedBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "postComments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "postComments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"postId" integer NOT NULL,
	"userId" integer NOT NULL,
	"commentText" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userBadges" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "userBadges_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"badgeType" varchar(100) NOT NULL,
	"badgeName" varchar(255) NOT NULL,
	"badgeDescription" text,
	"earnedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"phoneNumber" varchar(20),
	"role" "role" DEFAULT 'user' NOT NULL,
	"groupId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phoneNumber_unique" UNIQUE("phoneNumber")
);
--> statement-breakpoint
CREATE TABLE "weeklyAttendance" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "weeklyAttendance_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"weekStartDate" timestamp NOT NULL,
	"userId" integer NOT NULL,
	"groupId" integer NOT NULL,
	"challengeId" integer NOT NULL,
	"attendedWednesday" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
