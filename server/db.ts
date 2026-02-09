import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  challenges,
  communityPosts,
  dailyCheckins,
  groupChatMessages,
  groups,
  pointAdjustments,
  postComments,
  users,
  weeklyAttendance,
  type Challenge,
  type CommunityPost,
  type DailyCheckin,
  type Group,
  type GroupChatMessage,
  type InsertChallenge,
  type InsertCommunityPost,
  type InsertDailyCheckin,
  type InsertGroup,
  type InsertGroupChatMessage,
  type InsertPointAdjustment,
  type InsertPostComment,
  type InsertUser,
  type InsertWeeklyAttendance,
  type PointAdjustment,
  type PostComment,
  type User,
  type WeeklyAttendance,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// User Management
// ============================================================================

export async function getUserById(userId: number): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? null;
}

export async function getUsersByGroupId(groupId: number): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).where(eq(users.groupId, groupId));
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users);
}

export async function updateUser(userId: number, data: Partial<InsertUser>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function createUser(data: InsertUser): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(users).values(data);
  return result[0].insertId;
}

// ============================================================================
// Group Management
// ============================================================================

export async function getGroupById(groupId: number): Promise<Group | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  return result[0] ?? null;
}

export async function getAllGroups(): Promise<Group[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(groups);
}

export async function createGroup(data: InsertGroup): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(groups).values(data);
  return result[0].insertId;
}

export async function updateGroup(groupId: number, data: Partial<InsertGroup>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(groups).set(data).where(eq(groups.id, groupId));
}

export async function getGroupMembers(groupId: number): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).where(eq(users.groupId, groupId)).orderBy(users.name);
}

// ============================================================================
// Challenge Management
// ============================================================================

export async function getActiveChallenges(): Promise<Challenge[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(challenges).where(eq(challenges.active, true));
}

export async function getChallengeById(challengeId: number): Promise<Challenge | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  return result[0] ?? null;
}

export async function getAllChallenges(): Promise<Challenge[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(challenges);
}

export async function createChallenge(data: InsertChallenge): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(challenges).values(data);
  return result[0].insertId;
}

export async function updateChallenge(challengeId: number, data: Partial<InsertChallenge>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(challenges).set(data).where(eq(challenges.id, challengeId));
}

// ============================================================================
// Daily Check-ins
// ============================================================================

export async function getDailyCheckin(userId: number, date: Date): Promise<DailyCheckin | null> {
  const db = await getDb();
  if (!db) return null;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select()
    .from(dailyCheckins)
    .where(and(eq(dailyCheckins.userId, userId), gte(dailyCheckins.date, startOfDay), lte(dailyCheckins.date, endOfDay)))
    .limit(1);

  return result[0] ?? null;
}

export async function getUserCheckins(userId: number, limit = 50): Promise<DailyCheckin[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(dailyCheckins).where(eq(dailyCheckins.userId, userId)).orderBy(desc(dailyCheckins.date)).limit(limit);
}

export async function getGroupCheckinsForDate(groupId: number, date: Date): Promise<DailyCheckin[]> {
  const db = await getDb();
  if (!db) return [];

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return db
    .select()
    .from(dailyCheckins)
    .where(and(eq(dailyCheckins.groupId, groupId), gte(dailyCheckins.date, startOfDay), lte(dailyCheckins.date, endOfDay)));
}

export async function createDailyCheckin(data: InsertDailyCheckin): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(dailyCheckins).values(data);
  return result[0].insertId;
}

export async function updateDailyCheckin(checkinId: number, data: Partial<InsertDailyCheckin>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(dailyCheckins).set(data).where(eq(dailyCheckins.id, checkinId));
}

// ============================================================================
// Weekly Attendance
// ============================================================================

export async function getWeeklyAttendance(userId: number, weekStartDate: Date): Promise<WeeklyAttendance | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(weeklyAttendance)
    .where(and(eq(weeklyAttendance.userId, userId), eq(weeklyAttendance.weekStartDate, weekStartDate)))
    .limit(1);

  return result[0] ?? null;
}

export async function createWeeklyAttendance(data: InsertWeeklyAttendance): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(weeklyAttendance).values(data);
  return result[0].insertId;
}

export async function updateWeeklyAttendance(attendanceId: number, data: Partial<InsertWeeklyAttendance>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(weeklyAttendance).set(data).where(eq(weeklyAttendance.id, attendanceId));
}

export async function getWeeklyAttendanceForGroup(groupId: number, weekStartDate: Date): Promise<WeeklyAttendance[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(weeklyAttendance)
    .where(and(eq(weeklyAttendance.groupId, groupId), eq(weeklyAttendance.weekStartDate, weekStartDate)));
}

// ============================================================================
// Point Adjustments
// ============================================================================

export async function getUserPointAdjustments(userId: number): Promise<PointAdjustment[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(pointAdjustments).where(eq(pointAdjustments.userId, userId)).orderBy(desc(pointAdjustments.date));
}

export async function getAllPointAdjustments(): Promise<PointAdjustment[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(pointAdjustments).orderBy(desc(pointAdjustments.date));
}

export async function createPointAdjustment(data: InsertPointAdjustment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pointAdjustments).values(data);
  return result[0].insertId;
}

// ============================================================================
// Community Posts
// ============================================================================

export async function getGroupPosts(groupId: number, limit = 50): Promise<CommunityPost[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(communityPosts).where(eq(communityPosts.groupId, groupId)).orderBy(desc(communityPosts.createdAt)).limit(limit);
}

export async function getPostById(postId: number): Promise<CommunityPost | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  return result[0] ?? null;
}

export async function createPost(data: InsertCommunityPost): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(communityPosts).values(data);
  return result[0].insertId;
}

export async function updatePost(postId: number, data: Partial<InsertCommunityPost>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(communityPosts).set(data).where(eq(communityPosts.id, postId));
}

export async function deletePost(postId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(communityPosts).where(eq(communityPosts.id, postId));
}

// ============================================================================
// Post Comments
// ============================================================================

export async function getPostComments(postId: number): Promise<PostComment[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(postComments).where(eq(postComments.postId, postId)).orderBy(postComments.createdAt);
}

export async function createComment(data: InsertPostComment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(postComments).values(data);
  return result[0].insertId;
}

// ============================================================================
// Group Chat
// ============================================================================

export async function getGroupMessages(groupId: number, limit = 100): Promise<GroupChatMessage[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(groupChatMessages).where(eq(groupChatMessages.groupId, groupId)).orderBy(desc(groupChatMessages.createdAt)).limit(limit);
}

export async function createMessage(data: InsertGroupChatMessage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(groupChatMessages).values(data);
  return result[0].insertId;
}

// ============================================================================
// Computed Metrics
// ============================================================================

export interface UserMetrics {
  thisWeekDailyPoints: number;
  thisWeekAttendancePoints: number;
  thisWeekAdjustments: number;
  thisWeekTotal: number;
  totalDailyPoints: number;
  totalAttendancePoints: number;
  totalAdjustments: number;
  totalPoints: number;
  weeklyPercent: number;
  overallPercent: number;
}

export async function getUserMetrics(userId: number, challengeId: number): Promise<UserMetrics> {
  const db = await getDb();
  if (!db) {
    return {
      thisWeekDailyPoints: 0,
      thisWeekAttendancePoints: 0,
      thisWeekAdjustments: 0,
      thisWeekTotal: 0,
      totalDailyPoints: 0,
      totalAttendancePoints: 0,
      totalAdjustments: 0,
      totalPoints: 0,
      weeklyPercent: 0,
      overallPercent: 0,
    };
  }

  const now = new Date();
  const weekStart = getWeekStartDate(now);

  // Get this week's daily check-ins
  const thisWeekCheckins = await db
    .select()
    .from(dailyCheckins)
    .where(and(eq(dailyCheckins.userId, userId), eq(dailyCheckins.challengeId, challengeId), gte(dailyCheckins.date, weekStart)));

  const thisWeekDailyPoints = thisWeekCheckins.reduce((sum, checkin) => {
    return sum + (checkin.nutritionDone ? 1 : 0) + (checkin.hydrationDone ? 1 : 0) + (checkin.movementDone ? 1 : 0) + (checkin.scriptureDone ? 1 : 0);
  }, 0);

  // Get all daily check-ins
  const allCheckins = await db
    .select()
    .from(dailyCheckins)
    .where(and(eq(dailyCheckins.userId, userId), eq(dailyCheckins.challengeId, challengeId)));

  const totalDailyPoints = allCheckins.reduce((sum, checkin) => {
    return sum + (checkin.nutritionDone ? 1 : 0) + (checkin.hydrationDone ? 1 : 0) + (checkin.movementDone ? 1 : 0) + (checkin.scriptureDone ? 1 : 0);
  }, 0);

  // Get this week's attendance
  const thisWeekAttendanceRecord = await db
    .select()
    .from(weeklyAttendance)
    .where(and(eq(weeklyAttendance.userId, userId), eq(weeklyAttendance.challengeId, challengeId), eq(weeklyAttendance.weekStartDate, weekStart)))
    .limit(1);

  const thisWeekAttendancePoints = thisWeekAttendanceRecord[0]?.attendedWednesday ? 10 : 0;

  // Get all attendance
  const allAttendance = await db
    .select()
    .from(weeklyAttendance)
    .where(and(eq(weeklyAttendance.userId, userId), eq(weeklyAttendance.challengeId, challengeId)));

  const totalAttendancePoints = allAttendance.reduce((sum, record) => sum + (record.attendedWednesday ? 10 : 0), 0);

  // Get this week's adjustments
  const thisWeekAdjustmentsRecords = await db
    .select()
    .from(pointAdjustments)
    .where(and(eq(pointAdjustments.userId, userId), eq(pointAdjustments.challengeId, challengeId), gte(pointAdjustments.date, weekStart)));

  const thisWeekAdjustments = thisWeekAdjustmentsRecords.reduce((sum, adj) => sum + adj.pointsDelta, 0);

  // Get all adjustments
  const allAdjustments = await db
    .select()
    .from(pointAdjustments)
    .where(and(eq(pointAdjustments.userId, userId), eq(pointAdjustments.challengeId, challengeId)));

  const totalAdjustments = allAdjustments.reduce((sum, adj) => sum + adj.pointsDelta, 0);

  const thisWeekTotal = thisWeekDailyPoints + thisWeekAttendancePoints + thisWeekAdjustments;
  const totalPoints = totalDailyPoints + totalAttendancePoints + totalAdjustments;

  return {
    thisWeekDailyPoints,
    thisWeekAttendancePoints,
    thisWeekAdjustments,
    thisWeekTotal,
    totalDailyPoints,
    totalAttendancePoints,
    totalAdjustments,
    totalPoints,
    weeklyPercent: (thisWeekTotal / 38) * 100,
    overallPercent: (totalPoints / 456) * 100,
  };
}

export function getWeekStartDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

export function getWeekNumber(challengeStartDate: Date, currentDate: Date): number {
  const start = new Date(challengeStartDate);
  start.setHours(0, 0, 0, 0);
  const current = new Date(currentDate);
  current.setHours(0, 0, 0, 0);

  const diffTime = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1;

  return Math.max(1, Math.min(12, weekNumber));
}
