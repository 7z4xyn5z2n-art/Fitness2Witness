-- Migration: Setup initial challenge, group, and admin user
-- This creates the default challenge and group needed for the app to function
-- Uses safe insert-if-not-exists pattern (idempotent, no hardcoded IDs)

-- Insert default challenge if it doesn't exist
INSERT INTO "challenges" ("name", "startDate", "endDate", "active")
SELECT 'Fitness2Witness Challenge', '2026-02-10'::timestamp, '2026-05-04'::timestamp, true
WHERE NOT EXISTS (
  SELECT 1 FROM "challenges" WHERE "name" = 'Fitness2Witness Challenge'
);

-- Insert default group if it doesn't exist
INSERT INTO "groups" ("groupName", "challengeId")
SELECT 'Pilot Group', c."id"
FROM "challenges" c
WHERE c."name" = 'Fitness2Witness Challenge'
  AND NOT EXISTS (
    SELECT 1 FROM "groups" g WHERE g."groupName" = 'Pilot Group'
  );

-- Update existing users to assign them to the pilot group
-- This ensures all registered users can submit check-ins
UPDATE "users"
SET "groupId" = (
  SELECT "id" FROM "groups" WHERE "groupName" = 'Pilot Group' LIMIT 1
)
WHERE "groupId" IS NULL;

-- Set user ID 2 (Quay Merida) as admin
UPDATE "users"
SET "role" = 'admin'
WHERE "id" = 2;
