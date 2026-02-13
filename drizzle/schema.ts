import { boolean, date, index, integer, jsonb, pgEnum, pgTable, real, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

// Define enums for PostgreSQL
export const roleEnum = pgEnum("role", ["user", "leader", "admin"]);
export const postTypeEnum = pgEnum("postType", ["Encouragement", "Testimony", "Photo", "Video", "Announcement"]);
export const visibilityEnum = pgEnum("visibility", ["GroupOnly", "LeadersOnly"]);
export const challengeTypeEnum = pgEnum("challengeType", ["running", "steps", "workouts", "custom"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** User's full name (displayed publicly in leaderboards, community, etc.) */
  name: text("name").notNull(),
  /** Phone number used for login and tracking (private, not displayed) */
  phoneNumber: varchar("phoneNumber", { length: 20 }).unique(),
  /** User role for access control */
  role: roleEnum("role").default("user").notNull(),
  /** Group assignment */
  groupId: integer("groupId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Groups table
export const groups = pgTable("groups", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  groupName: varchar("groupName", { length: 255 }).notNull(),
  leaderUserId: integer("leaderUserId"),
  challengeId: integer("challengeId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

// Challenges table
export const challenges = pgTable("challenges", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

// Daily check-ins table
export const dailyCheckins = pgTable(
  "dailyCheckins",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    day: date("day").notNull(), // Changed from timestamp to date for timezone-safe day keys
    userId: integer("userId").notNull(),
    groupId: integer("groupId").notNull(),
    challengeId: integer("challengeId").notNull(),
    nutritionDone: boolean("nutritionDone").default(false).notNull(),
    hydrationDone: boolean("hydrationDone").default(false).notNull(),
    movementDone: boolean("movementDone").default(false).notNull(),
    scriptureDone: boolean("scriptureDone").default(false).notNull(),
    notes: text("notes"),
    proofPhotoUrl: text("proofPhotoUrl"),
    workoutLog: text("workoutLog"),
    workoutAnalysis: text("workoutAnalysis"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint to prevent duplicate check-ins for same user/challenge/day
    uniqueUserChallengeDay: unique("dailyCheckins_userId_challengeId_day_unique").on(
      table.userId,
      table.challengeId,
      table.day
    ),
  })
);

export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type InsertDailyCheckin = typeof dailyCheckins.$inferInsert;

// Weekly attendance table
export const weeklyAttendance = pgTable(
  "weeklyAttendance",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    weekStart: date("weekStart").notNull(), // Changed from weekStartDate timestamp to date
    userId: integer("userId").notNull(),
    groupId: integer("groupId").notNull(),
    challengeId: integer("challengeId").notNull(),
    attendedWednesday: boolean("attendedWednesday").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint to prevent duplicate attendance records
    uniqueUserChallengeWeek: unique("weeklyAttendance_userId_challengeId_weekStart_unique").on(
      table.userId,
      table.challengeId,
      table.weekStart
    ),
  })
);

export type WeeklyAttendance = typeof weeklyAttendance.$inferSelect;
export type InsertWeeklyAttendance = typeof weeklyAttendance.$inferInsert;

// Point adjustments table
export const pointAdjustments = pgTable(
  "pointAdjustments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    day: date("day").notNull(), // Changed from timestamp to date
    userId: integer("userId").notNull(),
    groupId: integer("groupId").notNull(),
    challengeId: integer("challengeId").notNull(),
    pointsDelta: integer("pointsDelta").notNull(),
    reason: text("reason").notNull(),
    category: varchar("category", { length: 100 }), // Optional category for bonus points
    adjustedBy: integer("adjustedBy").notNull(),
    idempotencyKey: varchar("idempotencyKey", { length: 80 }).notNull(), // Prevents duplicate submissions
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint on idempotencyKey to prevent duplicate adjustments
    uniqueIdempotencyKey: unique("pointAdjustments_idempotencyKey_unique").on(table.idempotencyKey),
  })
);

export type PointAdjustment = typeof pointAdjustments.$inferSelect;
export type InsertPointAdjustment = typeof pointAdjustments.$inferInsert;

// Admin audit log table
export const adminAuditLog = pgTable(
  "adminAuditLog",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    actionType: varchar("actionType", { length: 50 }).notNull(), // e.g., CHECKIN_UPSERT, ATTENDANCE_SET, POST_UPDATE
    entityType: varchar("entityType", { length: 30 }).notNull(), // checkin, attendance, post, adjustment
    entityId: integer("entityId"), // if known at time of log
    affectedUserId: integer("affectedUserId"),
    day: date("day"), // for day-scoped actions
    weekStart: date("weekStart"), // for week-scoped actions
    before: jsonb("before"), // snapshot before change
    after: jsonb("after"), // snapshot after change
    performedBy: integer("performedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    // Indexes for common query patterns
    idxPerformedBy: index("adminAuditLog_performedBy_idx").on(table.performedBy),
    idxAffectedUserId: index("adminAuditLog_affectedUserId_idx").on(table.affectedUserId),
    idxDay: index("adminAuditLog_day_idx").on(table.day),
    idxWeekStart: index("adminAuditLog_weekStart_idx").on(table.weekStart),
  })
);

export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLog.$inferInsert;

// Community posts table
export const communityPosts = pgTable("communityPosts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  groupId: integer("groupId").notNull(),
  postType: postTypeEnum("postType").notNull(),
  postText: text("postText"),
  postImageUrl: text("postImageUrl"),
  postVideoUrl: text("postVideoUrl"),
  isPinned: boolean("isPinned").default(false).notNull(),
  visibility: visibilityEnum("visibility").default("GroupOnly").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;

// Post comments table
export const postComments = pgTable("postComments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postId: integer("postId").notNull(),
  userId: integer("userId").notNull(),
  commentText: text("commentText").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = typeof postComments.$inferInsert;

// Group chat messages table
export const groupChatMessages = pgTable("groupChatMessages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  groupId: integer("groupId").notNull(),
  messageText: text("messageText"),
  messageImageUrl: text("messageImageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GroupChatMessage = typeof groupChatMessages.$inferSelect;
export type InsertGroupChatMessage = typeof groupChatMessages.$inferInsert;

// Body metrics table for tracking weight, body fat %, muscle mass, etc.
export const bodyMetrics = pgTable("bodyMetrics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  groupId: integer("groupId").notNull(),
  challengeId: integer("challengeId").notNull(),
  date: timestamp("date").notNull(),
  weight: real("weight"), // e.g., 185.5 lbs
  bodyFatPercent: real("bodyFatPercent"), // e.g., 18.5%
  muscleMass: real("muscleMass"), // e.g., 145.2 lbs
  visceralFat: integer("visceralFat"), // e.g., 8
  bmr: integer("bmr"), // Basal Metabolic Rate, e.g., 1850
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BodyMetric = typeof bodyMetrics.$inferSelect;
export type InsertBodyMetric = typeof bodyMetrics.$inferInsert;

// User badges table for achievement tracking
export const userBadges = pgTable("userBadges", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  badgeType: varchar("badgeType", { length: 100 }).notNull(), // e.g., "7_day_streak", "perfect_week", "weight_loss_10"
  badgeName: varchar("badgeName", { length: 255 }).notNull(), // e.g., "7-Day Streak"
  badgeDescription: text("badgeDescription"),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

// Group challenges table (separate from main 12-week challenge)
export const groupChallenges = pgTable("groupChallenges", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  groupId: integer("groupId").notNull(),
  createdByUserId: integer("createdByUserId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  challengeType: challengeTypeEnum("challengeType").notNull(),
  goalValue: real("goalValue"), // e.g., 10 miles, 50000 steps
  goalUnit: varchar("goalUnit", { length: 50 }), // e.g., "miles", "steps", "workouts"
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GroupChallenge = typeof groupChallenges.$inferSelect;
export type InsertGroupChallenge = typeof groupChallenges.$inferInsert;

// Challenge participants table
export const challengeParticipants = pgTable("challengeParticipants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  challengeId: integer("challengeId").notNull(),
  userId: integer("userId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = typeof challengeParticipants.$inferInsert;

// Challenge progress table
export const challengeProgress = pgTable("challengeProgress", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  challengeId: integer("challengeId").notNull(),
  userId: integer("userId").notNull(),
  currentValue: real("currentValue").default(0).notNull(), // Current progress toward goal
  notes: text("notes"),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
});

export type ChallengeProgress = typeof challengeProgress.$inferSelect;
export type InsertChallengeProgress = typeof challengeProgress.$inferInsert;

// Challenge comments table
export const challengeComments = pgTable("challengeComments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  challengeId: integer("challengeId").notNull(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChallengeComment = typeof challengeComments.$inferSelect;
export type InsertChallengeComment = typeof challengeComments.$inferInsert;

// User targets table for storing InBody recommended/target values
export const userTargets = pgTable("userTargets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().unique(), // One set of targets per user (latest InBody scan)
  targetWeight: real("targetWeight"), // Target weight in lbs
  targetBodyFat: real("targetBodyFat"), // Target body fat %
  recommendedCalories: integer("recommendedCalories"), // Daily calorie target
  recommendedCarbs: integer("recommendedCarbs"), // Daily carbs in grams
  recommendedProtein: integer("recommendedProtein"), // Daily protein in grams
  recommendedFat: integer("recommendedFat"), // Daily fat in grams
  sourceDate: timestamp("sourceDate").notNull(), // Date of InBody scan that generated these targets
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserTarget = typeof userTargets.$inferSelect;
export type InsertUserTarget = typeof userTargets.$inferInsert;
