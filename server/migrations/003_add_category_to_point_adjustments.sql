-- Migration 003: Add category field to pointAdjustments table
-- This allows admins to categorize bonus points (e.g., "Scripture Memory", "Workout Excellence")

ALTER TABLE "pointAdjustments" 
ADD COLUMN IF NOT EXISTS "category" VARCHAR(100);

COMMENT ON COLUMN "pointAdjustments"."category" IS 'Optional category for bonus points (e.g., Scripture Memory, Workout Excellence, Community Engagement)';
