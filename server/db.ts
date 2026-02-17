import { and, desc, eq, gte, lte, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

function startOfAppDayLocal(date: Date) {
  const d = new Date(date);
  d.setHours(0, 1, 0, 0); // 12:01 AM
  return d;
}

function endOfAppDayLocal(date: Date) {
  const start = startOfAppDayLocal(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0); // next day 12:00 AM
  return end;
}

function startOfAppWeekLocal(anchor: Date) {
  // Monday start at 12:01 AM
  const d = new Date(anchor);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 1, 0, 0);
  return d;
}

function endOfAppWeekLocal(anchor: Date) {
  const start = startOfAppWeekLocal(anchor);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(0, 0, 0, 0);
  return end;
}
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
  userTargets,
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
  type InsertUserTarget,
  type InsertWeeklyAttendance,
  type UserTarget,
  type PointAdjustment,
  type UserBadge,
  type PostComment,
  type User,
  type WeeklyAttendance,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      });
      _db = drizzle(_pool, {
        schema: {
          users,
          groups,
          challenges,
          dailyCheckins,
          weeklyAttendance,
          pointAdjustments,
          communityPosts,
          postComments,
          groupChatMessages,
          groupChallenges,
          challengeParticipants,
          challengeProgress,
          challengeComments,
          bodyMetrics,
          userBadges,
        },
      });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Removed upsertUser and getUserByOpenId - not needed for phone-based auth

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Get all users
export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  return await db.select().from(users);
}

// Get users by group ID
export async function getUsersByGroupId(groupId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  return await db.select().from(users).where(eq(users.groupId, groupId));
}

// Create a new group
export async function createGroup(group: InsertGroup) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create group: database not available");
    return undefined;
  }

  const result = await db.insert(groups).values(group).returning();
  return result[0];
}

// Get group by ID
export async function getGroupById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get group: database not available");
    return undefined;
  }

  const result = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Create a new challenge
export async function createChallenge(challenge: InsertChallenge) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create challenge: database not available");
    return undefined;
  }

  const result = await db.insert(challenges).values(challenge).returning();
  return result[0];
}

// Get challenge by ID
export async function getChallengeById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get challenge: database not available");
    return undefined;
  }

  const result = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Get active challenge
export async function getActiveChallenge() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get active challenge: database not available");
    return undefined;
  }

  const result = await db.select().from(challenges).where(eq(challenges.active, true)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Create a daily check-in
export async function createDailyCheckin(checkin: InsertDailyCheckin) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create check-in: database not available");
    return undefined;
  }

  const result = await db.insert(dailyCheckins).values(checkin).returning();
  return result[0];
}

// Delete a daily check-in by ID
export async function deleteDailyCheckinById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete check-in: database not available");
    return false;
  }
  await db.delete(dailyCheckins).where(eq(dailyCheckins.id, id));
  return true;
}

// Update a daily check-in (for AI analysis updates)
export async function updateDailyCheckin(checkinId: number, updates: Partial<InsertDailyCheckin>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update check-in: database not available");
    return undefined;
  }

  const result = await db
    .update(dailyCheckins)
    .set(updates)
    .where(eq(dailyCheckins.id, checkinId))
    .returning();
  return result[0];
}

// Get check-ins by user ID
export async function getCheckinsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get check-ins: database not available");
    return [];
  }

  return await db
    .select()
    .from(dailyCheckins)
    .where(eq(dailyCheckins.userId, userId))
    .orderBy(desc(dailyCheckins.date));
}

// Get check-ins by user ID and date range
export async function getCheckinsByUserIdAndDateRange(
  userId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get check-ins: database not available");
    return [];
  }

  return await db
    .select()
    .from(dailyCheckins)
    .where(
      and(
        eq(dailyCheckins.userId, userId),
        gte(dailyCheckins.date, startDate),
        lte(dailyCheckins.date, endDate)
      )
    )
    .orderBy(desc(dailyCheckins.date));
}

// Get check-ins by group ID and date range
export async function getCheckinsByGroupIdAndDateRange(
  groupId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get check-ins: database not available");
    return [];
  }

  return await db
    .select()
    .from(dailyCheckins)
    .where(
      and(
        eq(dailyCheckins.groupId, groupId),
        gte(dailyCheckins.date, startDate),
        lte(dailyCheckins.date, endDate)
      )
    )
    .orderBy(desc(dailyCheckins.date));
}

// Create weekly attendance record
export async function createWeeklyAttendance(attendance: InsertWeeklyAttendance) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create attendance: database not available");
    return undefined;
  }

  const result = await db.insert(weeklyAttendance).values(attendance).returning();
  return result[0];
}

// Get attendance by user ID and week
export async function getAttendanceByUserIdAndWeek(userId: number, weekStartDate: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get attendance: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(weeklyAttendance)
    .where(
      and(eq(weeklyAttendance.userId, userId), eq(weeklyAttendance.weekStartDate, weekStartDate))
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Get all attendance records for a group and date range
export async function getAttendanceByGroupIdAndDateRange(
  groupId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get attendance: database not available");
    return [];
  }

  return await db
    .select()
    .from(weeklyAttendance)
    .where(
      and(
        eq(weeklyAttendance.groupId, groupId),
        gte(weeklyAttendance.weekStartDate, startDate),
        lte(weeklyAttendance.weekStartDate, endDate)
      )
    );
}

// Create point adjustment
export async function createPointAdjustment(adjustment: InsertPointAdjustment) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create point adjustment: database not available");
    return undefined;
  }

  const result = await db.insert(pointAdjustments).values(adjustment).returning();
  return result[0];
}

// Get point adjustments by user ID
export async function getPointAdjustmentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get point adjustments: database not available");
    return [];
  }

  return await db
    .select()
    .from(pointAdjustments)
    .where(eq(pointAdjustments.userId, userId))
    .orderBy(desc(pointAdjustments.date));
}

// Create community post
export async function createCommunityPost(post: InsertCommunityPost) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create post: database not available");
    return undefined;
  }

  const result = await db.insert(communityPosts).values(post).returning();
  return result[0];
}

// Get community posts by group ID
export async function getCommunityPostsByGroupId(groupId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get posts: database not available");
    return [];
  }

  return await db
    .select()
    .from(communityPosts)
    .where(eq(communityPosts.groupId, groupId))
    .orderBy(desc(communityPosts.createdAt));
}

// Delete community post
export async function deleteCommunityPost(postId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete post: database not available");
    return;
  }

  await db.delete(communityPosts).where(eq(communityPosts.id, postId));
}

// Create post comment
export async function createPostComment(comment: InsertPostComment) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create comment: database not available");
    return undefined;
  }

  const result = await db.insert(postComments).values(comment).returning();
  return result[0];
}

// Get comments by post ID
export async function getCommentsByPostId(postId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get comments: database not available");
    return [];
  }

  return await db
    .select()
    .from(postComments)
    .where(eq(postComments.postId, postId))
    .orderBy(postComments.createdAt);
}

// Delete post comment
export async function deletePostComment(commentId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete comment: database not available");
    return;
  }

  await db.delete(postComments).where(eq(postComments.id, commentId));
}

// Create group chat message
export async function createGroupChatMessage(message: InsertGroupChatMessage) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create message: database not available");
    return undefined;
  }

  const result = await db.insert(groupChatMessages).values(message).returning();
  return result[0];
}

// Get chat messages by group ID
export async function getChatMessagesByGroupId(groupId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get messages: database not available");
    return [];
  }

  return await db
    .select()
    .from(groupChatMessages)
    .where(eq(groupChatMessages.groupId, groupId))
    .orderBy(groupChatMessages.createdAt);
}

// Create body metric
export async function createBodyMetric(metric: InsertBodyMetric) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create body metric: database not available");
    return undefined;
  }

  const result = await db.insert(bodyMetrics).values(metric).returning();
  return result[0];
}

// Get body metrics by user ID
export async function getBodyMetricsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get body metrics: database not available");
    return [];
  }

  return await db
    .select()
    .from(bodyMetrics)
    .where(eq(bodyMetrics.userId, userId))
    .orderBy(desc(bodyMetrics.date));
}

// Create user badge
export async function createUserBadge(badge: InsertUserBadge) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create badge: database not available");
    return undefined;
  }

  const result = await db.insert(userBadges).values(badge).returning();
  return result[0];
}

// Get badges by user ID
export async function getBadgesByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get badges: database not available");
    return [];
  }

  return await db
    .select()
    .from(userBadges)
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.earnedAt));
}

// Check if user has specific badge
export async function userHasBadge(userId: number, badgeType: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot check badge: database not available");
    return false;
  }

  const result = await db
    .select()
    .from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeType, badgeType)))
    .limit(1);

  return result.length > 0;
}

// Update user role
export async function updateUserRole(userId: number, role: "user" | "leader" | "admin") {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user role: database not available");
    return;
  }

  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// Delete user
export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete user: database not available");
    return;
  }

  // Delete all related data
  await db.delete(dailyCheckins).where(eq(dailyCheckins.userId, userId));
  await db.delete(weeklyAttendance).where(eq(weeklyAttendance.userId, userId));
  await db.delete(pointAdjustments).where(eq(pointAdjustments.userId, userId));
  await db.delete(communityPosts).where(eq(communityPosts.userId, userId));
  await db.delete(postComments).where(eq(postComments.userId, userId));
  await db.delete(groupChatMessages).where(eq(groupChatMessages.userId, userId));
  await db.delete(bodyMetrics).where(eq(bodyMetrics.userId, userId));
  await db.delete(userBadges).where(eq(userBadges.userId, userId));
  
  // Delete the user
  await db.delete(users).where(eq(users.id, userId));
}

// Get all community posts (for admin moderation)
export async function getAllCommunityPosts() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get posts: database not available");
    return [];
  }

  return await db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt));
}

// Update attendance record
export async function updateAttendance(
  userId: number,
  weekStartDate: Date,
  attendedWednesday: boolean
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update attendance: database not available");
    return;
  }

  await db
    .update(weeklyAttendance)
    .set({ attendedWednesday, updatedAt: new Date() })
    .where(
      and(eq(weeklyAttendance.userId, userId), eq(weeklyAttendance.weekStartDate, weekStartDate))
    );
}

// Get check-in by user ID and date
export async function getCheckinByUserIdAndDate(userId: number, date: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get check-in: database not available");
    return undefined;
  }
  const start = startOfAppDayLocal(date);
  const end = endOfAppDayLocal(date);
  const result = await db
    .select()
    .from(dailyCheckins)
    .where(and(eq(dailyCheckins.userId, userId), gte(dailyCheckins.date, start), lt(dailyCheckins.date, end)))
    .orderBy(desc(dailyCheckins.date))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Get all check-ins for a specific date
export async function getCheckinsByDate(date: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get check-ins: database not available");
    return [];
  }
  const start = startOfAppDayLocal(date);
  const end = endOfAppDayLocal(date);
  return await db
    .select()
    .from(dailyCheckins)
    .where(and(gte(dailyCheckins.date, start), lt(dailyCheckins.date, end)))
    .orderBy(desc(dailyCheckins.date));
}

// Get all attendance records for a specific week
export async function getAttendanceByWeek(weekStartDate: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get attendance: database not available");
    return [];
  }

  return await db
    .select()
    .from(weeklyAttendance)
    .where(eq(weeklyAttendance.weekStartDate, weekStartDate));
}

// Get challenge progress for a user
export async function getChallengeProgress(challengeId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get challenge progress: database not available");
    return [];
  }

  return await db
    .select()
    .from(challengeProgress)
    .where(
      and(eq(challengeProgress.challengeId, challengeId), eq(challengeProgress.userId, userId))
    )
    .orderBy(desc(challengeProgress.loggedAt));
}

// Get challenge comments
export async function getChallengeComments(challengeId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get challenge comments: database not available");
    return [];
  }

  return await db
    .select()
    .from(challengeComments)
    .where(eq(challengeComments.challengeId, challengeId))
    .orderBy(challengeComments.createdAt);
}

// Create challenge comment
export async function createChallengeComment(comment: {
  challengeId: number;
  userId: number;
  content: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create challenge comment: database not available");
    return undefined;
  }

  const result = await db.insert(challengeComments).values(comment).returning();
  return result[0]?.id;
}

// Delete challenge comment
export async function deleteChallengeComment(commentId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete challenge comment: database not available");
    return false;
  }

  // Check if the comment belongs to the user or if user is admin
  const comment = await db
    .select()
    .from(challengeComments)
    .where(eq(challengeComments.id, commentId))
    .limit(1);

  if (comment.length === 0) {
    return false;
  }

  const user = await getUserById(userId);
  if (!user) {
    return false;
  }

  if (comment[0].userId !== userId && user.role !== "admin") {
    return false;
  }

  await db.delete(challengeComments).where(eq(challengeComments.id, commentId));
  return true;
}

// Create group challenge
export async function createGroupChallenge(challenge: {
  groupId: number;
  createdByUserId: number;
  title: string;
  description?: string;
  challengeType: "running" | "steps" | "workouts" | "custom";
  goalValue?: number;
  goalUnit?: string;
  startDate: Date;
  endDate: Date;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create group challenge: database not available");
    return undefined;
  }

  const result = await db.insert(groupChallenges).values(challenge).returning();
  return result[0];
}

// Join challenge
export async function joinChallenge(challengeId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot join challenge: database not available");
    return undefined;
  }

  const result = await db
    .insert(challengeParticipants)
    .values({ challengeId, userId })
    .returning();
  return result[0];
}

// Log challenge progress
export async function logChallengeProgress(progress: {
  challengeId: number;
  userId: number;
  currentValue: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log challenge progress: database not available");
    return undefined;
  }

  const result = await db.insert(challengeProgress).values(progress).returning();
  return result[0];
}

// Get challenge leaderboard
export async function getChallengeLeaderboard(challengeId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get challenge leaderboard: database not available");
    return [];
  }

  // Get all participants
  const participants = await db
    .select()
    .from(challengeParticipants)
    .where(eq(challengeParticipants.challengeId, challengeId));

  // Get progress for each participant
  const leaderboard = await Promise.all(
    participants.map(async (participant) => {
      const progress = await db
        .select()
        .from(challengeProgress)
        .where(
          and(
            eq(challengeProgress.challengeId, challengeId),
            eq(challengeProgress.userId, participant.userId)
          )
        )
        .orderBy(desc(challengeProgress.loggedAt));

      const totalProgress = progress.reduce((sum, p) => sum + (p.currentValue || 0), 0);
      const user = await getUserById(participant.userId);

      return {
        userId: participant.userId,
        userName: user?.name || "Unknown",
        totalProgress,
        lastUpdated: progress[0]?.loggedAt || participant.joinedAt,
      };
    })
  );

  // Sort by total progress descending
  return leaderboard.sort((a, b) => b.totalProgress - a.totalProgress);
}

// Get group posts with optional limit
export async function getGroupPosts(groupId: number, limit?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get posts: database not available");
    return [];
  }

  const query = db
    .select()
    .from(communityPosts)
    .where(eq(communityPosts.groupId, groupId))
    .orderBy(desc(communityPosts.createdAt));

  if (limit) {
    return await query.limit(limit);
  }
  return await query;
}

// Get user check-ins with optional limit
export async function getUserCheckins(userId: number, limit?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get check-ins: database not available");
    return [];
  }

  const query = db
    .select()
    .from(dailyCheckins)
    .where(eq(dailyCheckins.userId, userId))
    .orderBy(desc(dailyCheckins.date));

  if (limit) {
    return await query.limit(limit);
  }
  return await query;
}

// Get user body metrics with optional limit
export async function getUserBodyMetrics(userId: number, limit?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get body metrics: database not available");
    return [];
  }

  const query = db
    .select()
    .from(bodyMetrics)
    .where(eq(bodyMetrics.userId, userId))
    .orderBy(desc(bodyMetrics.date));

  if (limit) {
    return await query.limit(limit);
  }
  return await query;
}

// Get group challenges
export async function getGroupChallenges(groupId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get group challenges: database not available");
    return [];
  }

  return await db
    .select()
    .from(groupChallenges)
    .where(eq(groupChallenges.groupId, groupId))
    .orderBy(desc(groupChallenges.createdAt));
}

// Get user badges (alias for getBadgesByUserId)
export async function getUserBadges(userId: number) {
  return getBadgesByUserId(userId);
}

// Check and award badges based on user activity
export async function checkAndAwardBadges(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot check badges: database not available");
    return [];
  }

  const newBadges: UserBadge[] = [];
  const checkins = await getUserCheckins(userId);
  const bodyMetrics = await getUserBodyMetrics(userId);

  // First Step badge - complete first check-in
  if (checkins.length >= 1 && !(await userHasBadge(userId, "first_step"))) {
    const badge = await createUserBadge({
      userId,
      badgeType: "first_step",
      badgeName: "First Step",
      badgeDescription: "Completed your first daily check-in",
    });
    if (badge) newBadges.push(badge);
  }

  // Week Warrior - complete 7 check-ins
  if (checkins.length >= 7 && !(await userHasBadge(userId, "week_warrior"))) {
    const badge = await createUserBadge({
      userId,
      badgeType: "week_warrior",
      badgeName: "Week Warrior",
      badgeDescription: "Completed 7 daily check-ins",
    });
    if (badge) newBadges.push(badge);
  }

  // Perfect Week - 7 consecutive days with all 4 categories
  const last7Days = checkins.slice(0, 7);
  if (
    last7Days.length === 7 &&
    last7Days.every(
      (c: any) => c.nutritionDone && c.hydrationDone && c.movementDone && c.scriptureDone
    ) &&
    !(await userHasBadge(userId, "perfect_week"))
  ) {
    const badge = await createUserBadge({
      userId,
      badgeType: "perfect_week",
      badgeName: "Perfect Week",
      badgeDescription: "Completed all 4 categories for 7 consecutive days",
    });
    if (badge) newBadges.push(badge);
  }

  // 30-Day Champion - complete 30 check-ins
  if (checkins.length >= 30 && !(await userHasBadge(userId, "30_day_champion"))) {
    const badge = await createUserBadge({
      userId,
      badgeType: "30_day_champion",
      badgeName: "30-Day Champion",
      badgeDescription: "Completed 30 daily check-ins",
    });
    if (badge) newBadges.push(badge);
  }

  // 10 Pounds Down - lost 10+ pounds based on body metrics
  if (bodyMetrics.length >= 2) {
    const latest = bodyMetrics[0];
    const earliest = bodyMetrics[bodyMetrics.length - 1];
    if (
      latest.weight &&
      earliest.weight &&
      earliest.weight - latest.weight >= 10 &&
      !(await userHasBadge(userId, "10_pounds_down"))
    ) {
      const badge = await createUserBadge({
        userId,
        badgeType: "10_pounds_down",
        badgeName: "10 Pounds Down",
        badgeDescription: "Lost 10 or more pounds",
      });
      if (badge) newBadges.push(badge);
    }
  }

  return newBadges;
}

// Get group members (alias for getUsersByGroupId)
export async function getGroupMembers(groupId: number) {
  return getUsersByGroupId(groupId);
}

// Get weekly attendance for group
export async function getWeeklyAttendanceForGroup(groupId: number, weekStartDate: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get weekly attendance: database not available");
    return [];
  }

  return await db
    .select()
    .from(weeklyAttendance)
    .where(
      and(eq(weeklyAttendance.groupId, groupId), eq(weeklyAttendance.weekStartDate, weekStartDate))
    );
}

// Get body metrics by date range
export async function getBodyMetricsByDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get body metrics: database not available");
    return [];
  }

  return await db
    .select()
    .from(bodyMetrics)
    .where(
      and(eq(bodyMetrics.userId, userId), gte(bodyMetrics.date, startDate), lte(bodyMetrics.date, endDate))
    )
    .orderBy(desc(bodyMetrics.date));
}

// Get active challenges (returns array for compatibility)
export async function getActiveChallenges() {
  const challenge = await getActiveChallenge();
  return challenge ? [challenge] : [];
}

// Update body metric
export async function updateBodyMetric(id: number, updates: Partial<InsertBodyMetric>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update body metric: database not available");
    return undefined;
  }

  const result = await db
    .update(bodyMetrics)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(bodyMetrics.id, id))
    .returning();
  return result[0];
}

// Delete body metric
export async function deleteBodyMetric(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete body metric: database not available");
    return false;
  }

  await db.delete(bodyMetrics).where(eq(bodyMetrics.id, id));
  return true;
}

// Aliases for function naming consistency
export async function getCheckInsByDate(date: Date) {
  return getCheckinsByDate(date);
}

export async function getAttendanceByDate(weekStartDate: Date) {
  return getAttendanceByWeek(weekStartDate);
}

export async function createCheckIn(checkin: InsertDailyCheckin) {
  return createDailyCheckin(checkin);
}

// Get all challenges
export async function getAllChallenges() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get challenges: database not available");
    return [];
  }

  return await db.select().from(challenges).orderBy(desc(challenges.createdAt));
}

// Update challenge
export async function updateChallenge(id: number, updates: Partial<InsertChallenge>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update challenge: database not available");
    return undefined;
  }

  const result = await db
    .update(challenges)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(challenges.id, id))
    .returning();
  return result[0];
}

// Get all point adjustments
export async function getAllPointAdjustments() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get point adjustments: database not available");
    return [];
  }

  return await db.select().from(pointAdjustments).orderBy(desc(pointAdjustments.date));
}

// Update user
export async function updateUser(id: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return undefined;
  }

  const result = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return result[0];
}

// Get all groups
export async function getAllGroups() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get groups: database not available");
    return [];
  }

  return await db.select().from(groups).orderBy(desc(groups.createdAt));
}

// Update group
export async function updateGroup(id: number, updates: Partial<InsertGroup>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update group: database not available");
    return undefined;
  }

  const result = await db
    .update(groups)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(groups.id, id))
    .returning();
  return result[0];
}

// Get group check-ins for a specific date
export async function getGroupCheckinsForDate(groupId: number, date: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get group check-ins: database not available");
    return [];
  }

  return await db
    .select()
    .from(dailyCheckins)
    .where(and(eq(dailyCheckins.groupId, groupId), eq(dailyCheckins.date, date)));
}

// Get user metrics with calculated points and percentages
export async function getUserMetrics(userId: number, challengeId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user metrics: database not available");
    return { totalPoints: 0, thisWeekTotal: 0, weeklyPercent: 0 };
  }

  // Get all check-ins for this user
  const checkins = await getUserCheckins(userId);
  
  // Calculate total points
  let totalPoints = 0;
  for (const checkin of checkins) {
    if (checkin.nutritionDone) totalPoints++;
    if (checkin.hydrationDone) totalPoints++;
    if (checkin.movementDone) totalPoints++;
    if (checkin.scriptureDone) totalPoints++;
  }

  // Get attendance records
  const attendance = await db
    .select()
    .from(weeklyAttendance)
    .where(and(eq(weeklyAttendance.userId, userId), eq(weeklyAttendance.challengeId, challengeId)));
  
  totalPoints += attendance.filter(a => a.attendedWednesday).length * 10;

  // Get point adjustments
  const adjustments = await getPointAdjustmentsByUserId(userId);
  totalPoints += adjustments.reduce((sum, adj) => sum + adj.pointsDelta, 0);

  // Calculate this week's points
  const now = new Date();
  const dayStart = startOfAppDayLocal(now);
  const dayEnd = endOfAppDayLocal(now);
  const weekStart = startOfAppWeekLocal(now);
  const weekEnd = endOfAppWeekLocal(now);

  const weekCheckins = checkins.filter(c => {
    const d = new Date(c.date);
    return d >= weekStart && d < weekEnd;
  });
  let thisWeekDailyPoints = 0;
  for (const checkin of weekCheckins) {
    if (checkin.nutritionDone) thisWeekDailyPoints++;
    if (checkin.hydrationDone) thisWeekDailyPoints++;
    if (checkin.movementDone) thisWeekDailyPoints++;
    if (checkin.scriptureDone) thisWeekDailyPoints++;
  }

  const weekAttendance = attendance.filter(a => new Date(a.weekStartDate) >= weekStart && a.attendedWednesday);
  const thisWeekAttendancePoints = weekAttendance.length * 10;

  const todayCheckins = checkins.filter((c) => {
    const d = new Date(c.date);
    return d >= dayStart && d < dayEnd;
  });
  let todayTotal = 0;
  for (const c of todayCheckins) {
    if (c.nutritionDone) todayTotal++;
    if (c.hydrationDone) todayTotal++;
    if (c.movementDone) todayTotal++;
    if (c.scriptureDone) todayTotal++;
  }

  const weekAdjustments = adjustments.filter(a => {
    const d = new Date(a.date);
    return d >= weekStart && d < weekEnd;
  });
  const thisWeekAdjustmentPoints = weekAdjustments.reduce((sum, adj) => sum + adj.pointsDelta, 0);
  
  const thisWeekTotal = thisWeekDailyPoints + thisWeekAttendancePoints + thisWeekAdjustmentPoints;

  // Calculate weekly percentage (max 38 points per week: 7 days * 4 categories + 10 for attendance)
  const weeklyPercent = (thisWeekTotal / 38) * 100;

  // Calculate overall percentage (max 456 points for 12 weeks: 12 * 38)
  const overallPercent = (totalPoints / 456) * 100;

  return {
    totalPoints,
    todayTotal,
    thisWeekTotal,
    thisWeekDailyPoints,
    thisWeekAttendancePoints,
    weeklyPercent,
    overallPercent,
    thisWeekAdjustments: weekAdjustments.length,
  };
}

// Get user check-in count
export async function getUserCheckInCount(userId: number) {
  const checkins = await getUserCheckins(userId);
  return checkins.length;
}

// Additional aliases for function naming consistency
export async function createComment(comment: InsertPostComment) {
  return createPostComment(comment);
}

export async function getGroupMessages(groupId: number) {
  return getChatMessagesByGroupId(groupId);
}

export async function createMessage(message: InsertGroupChatMessage) {
  return createGroupChatMessage(message);
}

// Update post
export async function updatePost(id: number, updates: Partial<InsertCommunityPost>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update post: database not available");
    return undefined;
  }

  const result = await db
    .update(communityPosts)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(communityPosts.id, id))
    .returning();
  return result[0];
}

// Delete post (alias for deleteCommunityPost)
export async function deletePost(postId: number) {
  return deleteCommunityPost(postId);
}

// Get post comments (alias for getCommentsByPostId)
export async function getPostComments(postId: number) {
  return getCommentsByPostId(postId);
}

// Get weekly attendance (alias for getAttendanceByUserIdAndWeek)
export async function getWeeklyAttendance(userId: number, weekStartDate: Date) {
  return getAttendanceByUserIdAndWeek(userId, weekStartDate);
}

// Update weekly attendance (alias for updateAttendance)
export async function updateWeeklyAttendance(userId: number, weekStartDate: Date, attendedWednesday: boolean) {
  return updateAttendance(userId, weekStartDate, attendedWednesday);
}

// Get post by ID
export async function getPostById(postId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get post: database not available");
    return undefined;
  }

  const result = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Create post (alias for createCommunityPost)
export async function createPost(post: InsertCommunityPost) {
  return createCommunityPost(post);
}

// Get daily check-in (alias for getCheckinByUserIdAndDate)
export async function getDailyCheckin(userId: number, date: Date) {
  return getCheckinByUserIdAndDate(userId, date);
}

// User Targets functions
export async function getUserTargets(userId: number): Promise<UserTarget | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user targets: database not available");
    return undefined;
  }

  const result = await db.select().from(userTargets).where(eq(userTargets.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserTargets(targets: InsertUserTarget): Promise<UserTarget | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user targets: database not available");
    return undefined;
  }

  // Check if targets already exist for this user
  const existing = await getUserTargets(targets.userId);

  if (existing) {
    // Update existing targets
    const result = await db
      .update(userTargets)
      .set({ ...targets, updatedAt: new Date() })
      .where(eq(userTargets.userId, targets.userId))
      .returning();
    return result[0];
  } else {
    // Insert new targets
    const result = await db.insert(userTargets).values(targets).returning();
    return result[0];
  }
}

// Meal Suggestions Cache (in-memory for simplicity)
const mealSuggestionsCache = new Map<string, { data: any; timestamp: string }>();

export async function getMealSuggestionsCache(userId: number, date: string): Promise<any | null> {
  const key = `${userId}-${date}`;
  const cached = mealSuggestionsCache.get(key);
  
  if (cached && cached.timestamp === date) {
    return cached.data;
  }
  
  return null;
}

export async function saveMealSuggestionsCache(userId: number, date: string, data: any): Promise<void> {
  const key = `${userId}-${date}`;
  mealSuggestionsCache.set(key, { data, timestamp: date });
}

export async function clearMealSuggestionsCache(userId: number, date: string): Promise<void> {
  const key = `${userId}-${date}`;
  mealSuggestionsCache.delete(key);
}
