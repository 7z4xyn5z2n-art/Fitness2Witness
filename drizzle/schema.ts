import { boolean, float, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "leader", "admin"]).default("user").notNull(),
  groupId: int("groupId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Groups table
export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  groupName: varchar("groupName", { length: 255 }).notNull(),
  leaderUserId: int("leaderUserId"),
  challengeId: int("challengeId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

// Challenges table
export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

// Daily check-ins table
export const dailyCheckins = mysqlTable("dailyCheckins", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  userId: int("userId").notNull(),
  groupId: int("groupId").notNull(),
  challengeId: int("challengeId").notNull(),
  nutritionDone: boolean("nutritionDone").default(false).notNull(),
  hydrationDone: boolean("hydrationDone").default(false).notNull(),
  movementDone: boolean("movementDone").default(false).notNull(),
  scriptureDone: boolean("scriptureDone").default(false).notNull(),
  notes: text("notes"),
  proofPhotoUrl: text("proofPhotoUrl"),
  workoutLog: text("workoutLog"),
  workoutAnalysis: text("workoutAnalysis"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type InsertDailyCheckin = typeof dailyCheckins.$inferInsert;

// Weekly attendance table
export const weeklyAttendance = mysqlTable("weeklyAttendance", {
  id: int("id").autoincrement().primaryKey(),
  weekStartDate: timestamp("weekStartDate").notNull(),
  userId: int("userId").notNull(),
  groupId: int("groupId").notNull(),
  challengeId: int("challengeId").notNull(),
  attendedWednesday: boolean("attendedWednesday").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklyAttendance = typeof weeklyAttendance.$inferSelect;
export type InsertWeeklyAttendance = typeof weeklyAttendance.$inferInsert;

// Point adjustments table
export const pointAdjustments = mysqlTable("pointAdjustments", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  userId: int("userId").notNull(),
  groupId: int("groupId").notNull(),
  challengeId: int("challengeId").notNull(),
  pointsDelta: int("pointsDelta").notNull(),
  reason: text("reason").notNull(),
  adjustedBy: int("adjustedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointAdjustment = typeof pointAdjustments.$inferSelect;
export type InsertPointAdjustment = typeof pointAdjustments.$inferInsert;

// Community posts table
export const communityPosts = mysqlTable("communityPosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  groupId: int("groupId").notNull(),
  postType: mysqlEnum("postType", ["Encouragement", "Testimony", "Photo", "Video", "Announcement"]).notNull(),
  postText: text("postText"),
  postImageUrl: text("postImageUrl"),
  postVideoUrl: text("postVideoUrl"),
  isPinned: boolean("isPinned").default(false).notNull(),
  visibility: mysqlEnum("visibility", ["GroupOnly", "LeadersOnly"]).default("GroupOnly").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;

// Post comments table
export const postComments = mysqlTable("postComments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  commentText: text("commentText").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = typeof postComments.$inferInsert;

// Group chat messages table
export const groupChatMessages = mysqlTable("groupChatMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  groupId: int("groupId").notNull(),
  messageText: text("messageText"),
  messageImageUrl: text("messageImageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GroupChatMessage = typeof groupChatMessages.$inferSelect;
export type InsertGroupChatMessage = typeof groupChatMessages.$inferInsert;

// Body metrics table for tracking weight, body fat %, muscle mass, etc.
export const bodyMetrics = mysqlTable("bodyMetrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  groupId: int("groupId").notNull(),
  challengeId: int("challengeId").notNull(),
  date: timestamp("date").notNull(),
  weight: float("weight"), // e.g., 185.5 lbs
  bodyFatPercent: float("bodyFatPercent"), // e.g., 18.5%
  muscleMass: float("muscleMass"), // e.g., 145.2 lbs
  visceralFat: int("visceralFat"), // e.g., 8
  bmr: int("bmr"), // Basal Metabolic Rate, e.g., 1850
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BodyMetric = typeof bodyMetrics.$inferSelect;
export type InsertBodyMetric = typeof bodyMetrics.$inferInsert;

// User badges table for achievement tracking
export const userBadges = mysqlTable("userBadges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeType: varchar("badgeType", { length: 100 }).notNull(), // e.g., "7_day_streak", "perfect_week", "weight_loss_10"
  badgeName: varchar("badgeName", { length: 255 }).notNull(), // e.g., "7-Day Streak"
  badgeDescription: text("badgeDescription"),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

// Group challenges table (separate from main 12-week challenge)
export const groupChallenges = mysqlTable("groupChallenges", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  challengeType: mysqlEnum("challengeType", ["running", "steps", "workouts", "custom"]).notNull(),
  goalValue: float("goalValue"), // e.g., 10 miles, 50000 steps
  goalUnit: varchar("goalUnit", { length: 50 }), // e.g., "miles", "steps", "workouts"
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GroupChallenge = typeof groupChallenges.$inferSelect;
export type InsertGroupChallenge = typeof groupChallenges.$inferInsert;

// Challenge participants table
export const challengeParticipants = mysqlTable("challengeParticipants", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  userId: int("userId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = typeof challengeParticipants.$inferInsert;

// Challenge progress table
export const challengeProgress = mysqlTable("challengeProgress", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  userId: int("userId").notNull(),
  currentValue: float("currentValue").default(0).notNull(), // Current progress toward goal
  notes: text("notes"),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
});

export type ChallengeProgress = typeof challengeProgress.$inferSelect;
export type InsertChallengeProgress = typeof challengeProgress.$inferInsert;

// Challenge comments table
export const challengeComments = mysqlTable("challengeComments", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChallengeComment = typeof challengeComments.$inferSelect;
export type InsertChallengeComment = typeof challengeComments.$inferInsert;
