-- Migration: Setup initial challenge, group, and admin user
-- This creates the default challenge and group needed for the app to function

-- Create default challenge (12 weeks)
INSERT INTO "challenges" ("id", "name", "startDate", "endDate", "active")
VALUES (
  1,
  'Fitness2Witness Challenge',
  '2026-02-10'::TIMESTAMP,
  '2026-05-04'::TIMESTAMP,
  true
)
ON CONFLICT ("id") DO NOTHING;

-- Create default pilot group
INSERT INTO "groups" ("id", "groupName", "challengeId")
VALUES (
  1,
  'Pilot Group',
  1
)
ON CONFLICT ("id") DO NOTHING;

-- Update existing users to assign them to the pilot group
-- This ensures all registered users can submit check-ins
UPDATE "users"
SET "groupId" = 1
WHERE "groupId" IS NULL;

-- Set user ID 2 (Quay Merida) as admin
UPDATE "users"
SET "role" = 'admin'
WHERE "id" = 2;
