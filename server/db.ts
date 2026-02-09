import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  bodyMetrics,
  challengeComments,
  challengeParticipants,
  challengeProgress,
  challenges,
  communityPosts,
  dailyCheckins,
  groupChallenges,
  groupChatMessages,
  groups,
  pointAdjustments,
  postComments,
  userBadges,
  users,
  weeklyAttendance,
  type BodyMetric,
  type Challenge,
  type ChallengeParticipant,
  type ChallengeProgress,
  type CommunityPost,
  type DailyCheckin,
  type Group,
  type GroupChallenge,
  type GroupChatMessage,
  type InsertBodyMetric,
  type InsertChallenge,
  type InsertCommunityPost,
  type InsertDailyCheckin,
  type InsertGroup,
  type InsertGroupChatMessage,
  type InsertPointAdjustment,
  type InsertPostComment,
  type InsertUser,
  type InsertUserBadge,
  type InsertWeeklyAttendance,
  type PointAdjustment,
  type UserBadge,
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

// ============================================================================
// Body Metrics
// ============================================================================

export async function getUserBodyMetrics(userId: number, limit = 50): Promise<BodyMetric[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(bodyMetrics).where(eq(bodyMetrics.userId, userId)).orderBy(desc(bodyMetrics.date)).limit(limit);
}

export async function getBodyMetricsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<BodyMetric[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(bodyMetrics)
    .where(and(eq(bodyMetrics.userId, userId), gte(bodyMetrics.date, startDate), lte(bodyMetrics.date, endDate)))
    .orderBy(bodyMetrics.date);
}

export async function createBodyMetric(data: InsertBodyMetric): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bodyMetrics).values(data);
  return result[0].insertId;
}

export async function updateBodyMetric(metricId: number, data: Partial<InsertBodyMetric>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(bodyMetrics).set(data).where(eq(bodyMetrics.id, metricId));
}

export async function deleteBodyMetric(metricId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(bodyMetrics).where(eq(bodyMetrics.id, metricId));
}

// ============================================================================
// User Badges Functions
// ============================================================================

export async function getUserBadges(userId: number): Promise<UserBadge[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(userBadges).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.earnedAt));
}

export async function awardBadge(data: InsertUserBadge): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already has this badge
  const existing = await db
    .select()
    .from(userBadges)
    .where(and(eq(userBadges.userId, data.userId), eq(userBadges.badgeType, data.badgeType)));

  if (existing.length > 0) {
    return existing[0].id; // Already has badge
  }

  const result = await db.insert(userBadges).values(data);
  return result[0].insertId;
}

export async function checkAndAwardBadges(userId: number): Promise<UserBadge[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const newBadges: UserBadge[] = [];

  // Get user's check-ins
  const checkins = await db.select().from(dailyCheckins).where(eq(dailyCheckins.userId, userId));

  // Badge: First Check-in
  if (checkins.length === 1) {
    const badgeId = await awardBadge({
      userId,
      badgeType: "first_checkin",
      badgeName: "First Step",
      badgeDescription: "Completed your first daily check-in!",
    });
    const badge = await db.select().from(userBadges).where(eq(userBadges.id, badgeId));
    if (badge.length > 0) newBadges.push(badge[0]);
  }

  // Badge: 7-Day Streak
  const last7Days = checkins.slice(-7);
  if (last7Days.length === 7) {
    const badgeId = await awardBadge({
      userId,
      badgeType: "7_day_streak",
      badgeName: "Week Warrior",
      badgeDescription: "Checked in for 7 days straight!",
    });
    const badge = await db.select().from(userBadges).where(eq(userBadges.id, badgeId));
    if (badge.length > 0) newBadges.push(badge[0]);
  }

  // Badge: Perfect Week (38/38 points)
  const weeklyScores = await db
    .select()
    .from(dailyCheckins)
    .where(eq(dailyCheckins.userId, userId))
    .orderBy(desc(dailyCheckins.date));

  // Check if any week had 38 points (4 points/day * 7 days + 10 attendance)
  // Simplified: check if user has 7 consecutive days with 4 points each
  let consecutivePerfectDays = 0;
  for (const checkin of weeklyScores) {
    const points =
      (checkin.nutritionDone ? 1 : 0) +
      (checkin.hydrationDone ? 1 : 0) +
      (checkin.movementDone ? 1 : 0) +
      (checkin.scriptureDone ? 1 : 0);
    if (points === 4) {
      consecutivePerfectDays++;
      if (consecutivePerfectDays === 7) {
        const badgeId = await awardBadge({
          userId,
          badgeType: "perfect_week",
          badgeName: "Perfect Week",
          badgeDescription: "Scored 28/28 daily points in one week!",
        });
        const badge = await db.select().from(userBadges).where(eq(userBadges.id, badgeId));
        if (badge.length > 0) newBadges.push(badge[0]);
        break;
      }
    } else {
      consecutivePerfectDays = 0;
    }
  }

  // Badge: 30-Day Milestone
  if (checkins.length >= 30) {
    const badgeId = await awardBadge({
      userId,
      badgeType: "30_day_milestone",
      badgeName: "30-Day Champion",
      badgeDescription: "Completed 30 days of check-ins!",
    });
    const badge = await db.select().from(userBadges).where(eq(userBadges.id, badgeId));
    if (badge.length > 0) newBadges.push(badge[0]);
  }

  // Badge: Weight Loss (10 lbs)
  const metrics = await db
    .select()
    .from(bodyMetrics)
    .where(eq(bodyMetrics.userId, userId))
    .orderBy(bodyMetrics.date);

  if (metrics.length >= 2) {
    const firstWeight = metrics[0].weight;
    const latestWeight = metrics[metrics.length - 1].weight;
    if (firstWeight && latestWeight && firstWeight - latestWeight >= 10) {
      const badgeId = await awardBadge({
        userId,
        badgeType: "weight_loss_10",
        badgeName: "10 Pounds Down",
        badgeDescription: "Lost 10 pounds or more!",
      });
      const badge = await db.select().from(userBadges).where(eq(userBadges.id, badgeId));
      if (badge.length > 0) newBadges.push(badge[0]);
    }
  }

  return newBadges;
}

// ===== Group Challenges Functions =====

export async function createGroupChallenge(data: {
  groupId: number;
  createdByUserId: number;
  title: string;
  description?: string;
  challengeType: "running" | "steps" | "workouts" | "custom";
  goalValue?: number;
  goalUnit?: string;
  startDate: Date;
  endDate: Date;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(groupChallenges).values(data);
  return result.insertId;
}

export async function getGroupChallenges(groupId: number, activeOnly = true): Promise<GroupChallenge[]> {
  const db = await getDb();
  if (!db) return [];

  if (activeOnly) {
    return await db
      .select()
      .from(groupChallenges)
      .where(and(eq(groupChallenges.groupId, groupId), eq(groupChallenges.active, true)))
      .orderBy(desc(groupChallenges.createdAt));
  }

  return await db
    .select()
    .from(groupChallenges)
    .where(eq(groupChallenges.groupId, groupId))
    .orderBy(desc(groupChallenges.createdAt));
}

export async function getGroupChallengeById(challengeId: number): Promise<GroupChallenge | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(groupChallenges).where(eq(groupChallenges.id, challengeId)).limit(1);
  return result[0] || null;
}

export async function joinChallenge(challengeId: number, userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already joined
  const existing = await db
    .select()
    .from(challengeParticipants)
    .where(and(eq(challengeParticipants.challengeId, challengeId), eq(challengeParticipants.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [result] = await db.insert(challengeParticipants).values({ challengeId, userId });
  return result.insertId;
}

export async function getChallengeParticipants(challengeId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const participants = await db
    .select()
    .from(challengeParticipants)
    .where(eq(challengeParticipants.challengeId, challengeId));

  // Get user details for each participant
  const result = [];
  for (const p of participants) {
    const user = await getUserById(p.userId);
    if (user) {
      result.push({
        userId: p.userId,
        userName: user.name || "Unknown",
        joinedAt: p.joinedAt,
      });
    }
  }

  return result;
}

export async function logChallengeProgress(data: {
  challengeId: number;
  userId: number;
  currentValue: number;
  notes?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(challengeProgress).values(data);
  return result.insertId;
}

export async function getChallengeProgress(challengeId: number, userId: number): Promise<ChallengeProgress[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(challengeProgress)
    .where(and(eq(challengeProgress.challengeId, challengeId), eq(challengeProgress.userId, userId)))
    .orderBy(desc(challengeProgress.loggedAt));
}

export async function getChallengeLeaderboard(challengeId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const participants = await getChallengeParticipants(challengeId);
  const leaderboard = [];

  for (const p of participants) {
    const progress = await getChallengeProgress(challengeId, p.userId);
    const latestProgress = progress[0];
    const currentValue = latestProgress?.currentValue || 0;

    leaderboard.push({
      userId: p.userId,
      userName: p.userName,
      currentValue,
      lastUpdated: latestProgress?.loggedAt || p.joinedAt,
    });
  }

  // Sort by current value descending
  leaderboard.sort((a, b) => b.currentValue - a.currentValue);

  return leaderboard;
}

// Challenge Comments
export async function createChallengeComment(data: {
  challengeId: number;
  userId: number;
  content: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(challengeComments).values(data);
  return result.insertId;
}

export async function getChallengeComments(challengeId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const comments = await db
    .select()
    .from(challengeComments)
    .where(eq(challengeComments.challengeId, challengeId))
    .orderBy(desc(challengeComments.createdAt));

  // Fetch user names for each comment
  const commentsWithUsers = [];
  for (const comment of comments) {
    const user = await getUserById(comment.userId);
    commentsWithUsers.push({
      ...comment,
      userName: user?.name || "Unknown User",
    });
  }

  return commentsWithUsers;
}

export async function deleteChallengeComment(commentId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Check if user owns the comment or is admin
  const comment = await db.select().from(challengeComments).where(eq(challengeComments.id, commentId)).limit(1);
  if (!comment[0]) return false;

  const user = await getUserById(userId);
  if (comment[0].userId !== userId && user?.role !== "admin") {
    return false;
  }

  await db.delete(challengeComments).where(eq(challengeComments.id, commentId));
  return true;
}
