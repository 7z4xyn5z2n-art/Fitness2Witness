-- Initial schema migration for Fitness2Witness
-- This creates all tables needed for the application

-- Create enums (idempotent - safe to run multiple times)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
    CREATE TYPE "role" AS ENUM ('user', 'leader', 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'postType') THEN
    CREATE TYPE "postType" AS ENUM ('Encouragement', 'Testimony', 'Photo', 'Video', 'Announcement');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility') THEN
    CREATE TYPE "visibility" AS ENUM ('GroupOnly', 'LeadersOnly');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challengeType') THEN
    CREATE TYPE "challengeType" AS ENUM ('running', 'steps', 'workouts', 'custom');
  END IF;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "phoneNumber" VARCHAR(20) UNIQUE,
  "role" "role" DEFAULT 'user' NOT NULL,
  "groupId" INTEGER,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "lastSignedIn" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Groups table
CREATE TABLE IF NOT EXISTS "groups" (
  "id" SERIAL PRIMARY KEY,
  "groupName" VARCHAR(255) NOT NULL,
  "leaderUserId" INTEGER,
  "challengeId" INTEGER,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Challenges table
CREATE TABLE IF NOT EXISTS "challenges" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Daily check-ins table
CREATE TABLE IF NOT EXISTS "dailyCheckins" (
  "id" SERIAL PRIMARY KEY,
  "date" TIMESTAMP NOT NULL,
  "userId" INTEGER NOT NULL,
  "groupId" INTEGER NOT NULL,
  "challengeId" INTEGER NOT NULL,
  "nutritionDone" BOOLEAN DEFAULT FALSE NOT NULL,
  "hydrationDone" BOOLEAN DEFAULT FALSE NOT NULL,
  "movementDone" BOOLEAN DEFAULT FALSE NOT NULL,
  "scriptureDone" BOOLEAN DEFAULT FALSE NOT NULL,
  "notes" TEXT,
  "proofPhotoUrl" TEXT,
  "workoutLog" TEXT,
  "workoutAnalysis" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Weekly attendance table
CREATE TABLE IF NOT EXISTS "weeklyAttendance" (
  "id" SERIAL PRIMARY KEY,
  "weekStartDate" TIMESTAMP NOT NULL,
  "userId" INTEGER NOT NULL,
  "groupId" INTEGER NOT NULL,
  "challengeId" INTEGER NOT NULL,
  "attendedWednesday" BOOLEAN DEFAULT FALSE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Point adjustments table
CREATE TABLE IF NOT EXISTS "pointAdjustments" (
  "id" SERIAL PRIMARY KEY,
  "date" TIMESTAMP NOT NULL,
  "userId" INTEGER NOT NULL,
  "groupId" INTEGER NOT NULL,
  "challengeId" INTEGER NOT NULL,
  "pointsDelta" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "adjustedBy" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Community posts table
CREATE TABLE IF NOT EXISTS "communityPosts" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "groupId" INTEGER NOT NULL,
  "postType" "postType" NOT NULL,
  "postText" TEXT,
  "postImageUrl" TEXT,
  "postVideoUrl" TEXT,
  "isPinned" BOOLEAN DEFAULT FALSE NOT NULL,
  "visibility" "visibility" DEFAULT 'GroupOnly' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Post comments table
CREATE TABLE IF NOT EXISTS "postComments" (
  "id" SERIAL PRIMARY KEY,
  "postId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "commentText" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Group chat messages table
CREATE TABLE IF NOT EXISTS "groupChatMessages" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "groupId" INTEGER NOT NULL,
  "messageText" TEXT,
  "messageImageUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Body metrics table
CREATE TABLE IF NOT EXISTS "bodyMetrics" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "groupId" INTEGER NOT NULL,
  "challengeId" INTEGER NOT NULL,
  "date" TIMESTAMP NOT NULL,
  "weight" REAL,
  "bodyFatPercent" REAL,
  "muscleMass" REAL,
  "visceralFat" INTEGER,
  "bmr" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User badges table
CREATE TABLE IF NOT EXISTS "userBadges" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "badgeType" VARCHAR(100) NOT NULL,
  "badgeName" VARCHAR(255) NOT NULL,
  "badgeDescription" TEXT,
  "earnedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Group challenges table
CREATE TABLE IF NOT EXISTS "groupChallenges" (
  "id" SERIAL PRIMARY KEY,
  "groupId" INTEGER NOT NULL,
  "createdByUserId" INTEGER NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "challengeType" "challengeType" NOT NULL,
  "goalValue" REAL,
  "goalUnit" VARCHAR(50),
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Challenge participants table
CREATE TABLE IF NOT EXISTS "challengeParticipants" (
  "id" SERIAL PRIMARY KEY,
  "challengeId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "joinedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Challenge progress table
CREATE TABLE IF NOT EXISTS "challengeProgress" (
  "id" SERIAL PRIMARY KEY,
  "challengeId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "currentValue" REAL DEFAULT 0 NOT NULL,
  "notes" TEXT,
  "loggedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Challenge comments table
CREATE TABLE IF NOT EXISTS "challengeComments" (
  "id" SERIAL PRIMARY KEY,
  "challengeId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User targets table
CREATE TABLE IF NOT EXISTS "userTargets" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE,
  "targetWeight" REAL,
  "targetBodyFat" REAL,
  "recommendedCalories" INTEGER,
  "recommendedCarbs" INTEGER,
  "recommendedProtein" INTEGER,
  "recommendedFat" INTEGER,
  "sourceDate" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_users_phoneNumber" ON "users"("phoneNumber");
CREATE INDEX IF NOT EXISTS "idx_users_groupId" ON "users"("groupId");
CREATE INDEX IF NOT EXISTS "idx_dailyCheckins_userId" ON "dailyCheckins"("userId");
CREATE INDEX IF NOT EXISTS "idx_dailyCheckins_date" ON "dailyCheckins"("date");
CREATE INDEX IF NOT EXISTS "idx_bodyMetrics_userId" ON "bodyMetrics"("userId");
CREATE INDEX IF NOT EXISTS "idx_communityPosts_groupId" ON "communityPosts"("groupId");
CREATE INDEX IF NOT EXISTS "idx_groupChatMessages_groupId" ON "groupChatMessages"("groupId");
