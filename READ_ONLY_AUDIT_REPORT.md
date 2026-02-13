# READ-ONLY AUDIT REPORT
**STRICT READ-ONLY MODE — NO MODIFICATIONS MADE**

---

## SECTION 1 — COMMUNITY ROUTER (POSTS)

### File Location
**Path:** `/home/ubuntu/fitness2witness/server/routers.ts`

### Community Router Code (Lines 375-509)

```typescript
// Community Feed
community: router({
  // Public endpoint - anyone can view community posts (no auth required)
  getPosts: publicProcedure.query(async () => {
    // Get all groups and their posts (for now, return posts from all groups)
    // In production, you might want to filter by a specific group or make this configurable
    const allGroups = await db.getAllGroups();
    if (!allGroups || allGroups.length === 0) {
      return [];
    }

    // Get posts from the first group (pilot group)
    const posts = await db.getGroupPosts(allGroups[0].id);
    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const author = await db.getUserById(post.userId);
        // Only return safe fields - no phone, email, or other sensitive data
        return {
          id: post.id,
          userId: post.userId,
          groupId: post.groupId,
          postType: post.postType,
          postText: post.postText,
          postImageUrl: post.postImageUrl,
          postVideoUrl: post.postVideoUrl,
          isPinned: post.isPinned,
          visibility: post.visibility,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          authorName: author?.name || "Unknown",
        };
      })
    );

    return postsWithUsers;
  }),

  getPostById: protectedProcedure.input(z.object({ postId: z.number() })).query(async ({ input }) => {
    const post = await db.getPostById(input.postId);
    if (!post) return null;

    const author = await db.getUserById(post.userId);
    return {
      ...post,
      authorName: author?.name || "Unknown",
    };
  }),

  createPost: protectedProcedure
    .input(
      z.object({
        postType: z.enum(["Encouragement", "Testimony", "Photo", "Video", "Announcement"]),
        postText: z.string().optional(),
        postImageBase64: z.string().optional(),
        postVideoUrl: z.string().optional(),
        visibility: z.enum(["GroupOnly", "LeadersOnly"]).default("GroupOnly"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.groupId) {
        throw new Error("User must be assigned to a group");
      }

      let postImageUrl: string | undefined;
      if (input.postImageBase64) {
        const buffer = Buffer.from(input.postImageBase64, "base64");
        const filename = `posts/${ctx.user.id}/${Date.now()}.jpg`;
        const result = await storagePut(filename, buffer, "image/jpeg");
        postImageUrl = result.url;
      }

      const postId = await db.createPost({
        userId: ctx.user.id,
        groupId: user.groupId,
        postType: input.postType,
        postText: input.postText,
        postImageUrl,
        postVideoUrl: input.postVideoUrl,
        visibility: input.visibility,
      });

      return { success: true, postId };
    }),

  pinPost: protectedProcedure
    .input(z.object({ postId: z.number(), pinned: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || (user.role !== "leader" && user.role !== "admin")) {
        throw new Error("Only leaders and admins can pin posts");
      }

      await db.updatePost(input.postId, { isPinned: input.pinned });
      return { success: true };
    }),

  deletePost: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can delete posts");
    }

    await db.deletePost(input.postId);
    return { success: true };
  }),

  // Public endpoint - anyone can view comments (read-only)
  getComments: publicProcedure.input(z.object({ postId: z.number() })).query(async ({ input }) => {
    const comments = await db.getPostComments(input.postId);
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const author = await db.getUserById(comment.userId);
        return {
          ...comment,
          authorName: author?.name || "Unknown",
        };
      })
    );

    return commentsWithUsers;
  }),

  addComment: protectedProcedure
    .input(z.object({ postId: z.number(), commentText: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const commentId = await db.createComment({
        postId: input.postId,
        userId: ctx.user.id,
        commentText: input.commentText,
      });

      return { success: true, commentId };
    }),
}),
```

### Factual Summary

**deletePost behavior:**
- **HARD DELETE** - Calls `db.deletePost(input.postId)` which removes the record from the database
- No soft-delete flag (e.g., `isDeleted`, `deletedAt`) is used

**editPost:**
- **DOES NOT EXIST** - No `editPost` or `updatePost` procedure in community router

**restorePost:**
- **DOES NOT EXIST** - No restore functionality (since hard delete is used)

**Role check enforcement:**
- **YES** - `deletePost` checks: `if (!user || user.role !== "admin")`
- **ctx.user.role checked:** YES - Explicitly checks `user.role !== "admin"`
- **Group membership checked:** NO - Admin can delete posts from any group (global admin scope)

---

## SECTION 2 — POSTS RELATED TABLES

### File Location
**Path:** `/home/ubuntu/fitness2witness/drizzle/schema.ts`

### communityPosts Table (Lines 117-132)

```typescript
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
```

### postComments Table (Lines 135-144)

```typescript
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
```

### Reactions/Likes Table

**NO REACTIONS/LIKES TABLES FOUND**

---

## SECTION 3 — ADMIN POINT ADJUSTMENT UI

### Search Results

**NO FRONTEND UI FOUND** - The pattern `trpc.admin.createPointAdjustment` does not appear in any `.tsx` files in the `/app` directory.

### Factual Summary

- **UI exists:** NO
- **Allows negative numbers:** N/A (no UI)
- **Allows positive numbers:** N/A (no UI)
- **Category field:** N/A (no UI)
- **Reason required:** N/A (no UI)
- **challengeId included:** N/A (no UI)

### Backend Schema (for reference)

From `/home/ubuntu/fitness2witness/server/routers.ts` (lines 831-866):

```typescript
createPointAdjustment: protectedProcedure
  .input(
    z.object({
      userId: z.number(),
      pointsDelta: z.number(),
      reason: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const adminUser = await db.getUserById(ctx.user.id);
    if (!adminUser || adminUser.role !== "admin") {
      throw new Error("Only admins can create point adjustments");
    }

    const targetUser = await db.getUserById(input.userId);
    if (!targetUser || !targetUser.groupId) {
      throw new Error("Target user must be assigned to a group");
    }

    const group = await db.getGroupById(targetUser.groupId);
    if (!group || !group.challengeId) {
      throw new Error("Group must be assigned to a challenge");
    }

    const adjustmentId = await db.createPointAdjustment({
      date: new Date(),
      userId: input.userId,
      groupId: targetUser.groupId,
      challengeId: group.challengeId,
      pointsDelta: input.pointsDelta,
      reason: input.reason,
      adjustedBy: ctx.user.id,
    });

    return { success: true, adjustmentId };
  }),
```

**Backend Schema Summary:**
- **Negative numbers:** YES - `pointsDelta: z.number()` accepts any number (positive or negative)
- **Positive numbers:** YES
- **Category field:** NO - Not in input schema
- **Reason required:** YES - `reason: z.string()` is required
- **challengeId included:** YES - Auto-derived from user's group, not user input

---

## SECTION 4 — LEADERBOARD / POINT CALCULATION FLOW

### Leaderboard Component

**Path:** `/home/ubuntu/fitness2witness/app/(tabs)/leaderboard.tsx`

**Full File Contents:**

```typescript
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

type Period = "week" | "overall";

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState<Period>("week");

  const { data: leaderboard, isLoading, refetch } = trpc.metrics.getGroupLeaderboard.useQuery({ period });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getTopThreeStyle = (index: number) => {
    if (index === 0) {
      return {
        badge: "bg-yellow-500",
        border: "border-yellow-500 border-2",
        trophy: "🥇",
        shadow: "shadow-lg",
      };
    }
    if (index === 1) {
      return {
        badge: "bg-gray-400",
        border: "border-gray-400 border-2",
        trophy: "🥈",
        shadow: "shadow-md",
      };
    }
    if (index === 2) {
      return {
        badge: "bg-orange-600",
        border: "border-orange-600 border-2",
        trophy: "🥉",
        shadow: "shadow-md",
      };
    }
    return {
      badge: "bg-muted",
      border: "border-border",
      trophy: "",
      shadow: "",
    };
  };

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 gap-6">
        {/* Header */}
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-foreground">Leaderboard</Text>
          <Text className="text-base text-muted">See how your group is doing</Text>
        </View>

        {/* Period Selector */}
        <View className="flex-row bg-surface rounded-full p-1">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-full ${period === "week" ? "bg-primary" : ""}`}
            onPress={() => setPeriod("week")}
          >
            <Text className={`text-center font-semibold ${period === "week" ? "text-background" : "text-muted"}`}>
              This Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 py-3 rounded-full ${period === "overall" ? "bg-primary" : ""}`}
            onPress={() => setPeriod("overall")}
          >
            <Text className={`text-center font-semibold ${period === "overall" ? "text-background" : "text-muted"}`}>
              Overall
            </Text>
          </TouchableOpacity>
        </View>

        {/* Leaderboard List */}
        {isLoading && !leaderboard ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
            <Text className="text-base text-muted mt-4">Loading leaderboard...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {!leaderboard || leaderboard.length === 0 ? (
              <View className="flex-1 items-center justify-center py-12">
                <Text className="text-xl font-semibold text-muted">No rankings yet</Text>
                <Text className="text-sm text-muted mt-2">Complete check-ins to appear on the leaderboard!</Text>
              </View>
            ) : (
              <View className="gap-3">
                {leaderboard.map((entry, index) => {
                  const style = getTopThreeStyle(index);
                  const isTopThree = index < 3;

                  return (
                    <View
                      key={entry.userId}
                      className={`bg-surface rounded-2xl ${isTopThree ? "p-5" : "p-4"} border ${style.border} ${style.shadow} flex-row items-center justify-between`}
                    >
                      <View className="flex-row items-center gap-4">
                        {/* Rank Badge */}
                        <View className={`${isTopThree ? "w-14 h-14" : "w-10 h-10"} rounded-full items-center justify-center ${style.badge}`}>
                          <Text className={`${isTopThree ? "text-2xl" : "text-lg"} font-bold text-background`}>
                            {index + 1}
                          </Text>
                        </View>
                        
                        {/* Name with Trophy */}
                        <View>
                          <View className="flex-row items-center gap-2">
                            {style.trophy && <Text className="text-2xl">{style.trophy}</Text>}
                            <Text className={`${isTopThree ? "text-lg" : "text-base"} font-bold text-foreground`}>
                              {entry.name}
                            </Text>
                          </View>
                          {isTopThree && (
                            <Text className="text-xs text-muted mt-1">
                              {index === 0 ? "🏆 Top Performer" : index === 1 ? "🌟 Runner Up" : "💪 Bronze Medal"}
                            </Text>
                          )}
                        </View>
                      </View>
                      
                      {/* Points */}
                      <View className="items-end">
                        <Text className={`${isTopThree ? "text-2xl" : "text-lg"} font-bold text-primary`}>
                          {entry.points}
                        </Text>
                        <Text className="text-xs text-muted">of {entry.maxPoints} pts</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}
```

### API Procedure Called

**From:** `/home/ubuntu/fitness2witness/server/routers.ts` (lines 184-212)

```typescript
getGroupLeaderboard: protectedProcedure
  .input(z.object({ period: z.enum(["week", "overall"]) }))
  .query(async ({ ctx, input }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user || !user.groupId) {
      throw new Error("User must be assigned to a group");
    }

    const group = await db.getGroupById(user.groupId);
    if (!group || !group.challengeId) {
      throw new Error("Group must be assigned to a challenge");
    }

    const groupUsers = await db.getUsersByGroupId(user.groupId);
    const leaderboard = await Promise.all(
      groupUsers.map(async (u) => {
        const metrics = await db.getUserMetrics(u.id, group.challengeId!);
        return {
          userId: u.id,
          name: u.name || "Unknown",
          points: input.period === "week" ? metrics.thisWeekTotal : metrics.totalPoints,
          maxPoints: input.period === "week" ? 38 : 456,
        };
      })
    );

    leaderboard.sort((a, b) => b.points - a.points);
    return leaderboard;
  }),
```

### Database Function for Totals

**From:** `/home/ubuntu/fitness2witness/server/db.ts` (lines 1165-1194)

```typescript
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
  // ... (continues with weekly calculation)
```

### Factual Summary

**Leaderboard includes dailyCheckins:**
- **YES** - Lines 1176-1182 iterate through check-ins and add 1 point for each category completed

**Leaderboard includes weeklyAttendance:**
- **YES** - Line 1190 adds 10 points for each week attended

**Leaderboard includes pointAdjustments:**
- **YES** - Lines 1193-1194 sum all `pointsDelta` values from point adjustments table

**Recalculates live:**
- **YES** - `getUserMetrics()` is called on-demand for each user in the leaderboard query
- No cached/stored total points field
- Points are calculated fresh from database records every time

---

## SECTION 5 — WRITE LOCATIONS FOR pointAdjustments

### Database Write Function

**Path:** `/home/ubuntu/fitness2witness/server/db.ts` (lines 334-343)

```typescript
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
```

### Database Read Functions

**Path:** `/home/ubuntu/fitness2witness/server/db.ts`

**getPointAdjustmentsByUserId** (lines 346-357):
```typescript
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
```

**getAllPointAdjustments** (lines 1097-1105):
```typescript
// Get all point adjustments
export async function getAllPointAdjustments() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get point adjustments: database not available");
    return [];
  }

  return await db.select().from(pointAdjustments).orderBy(desc(pointAdjustments.date));
}
```

### API Router Write Location

**Path:** `/home/ubuntu/fitness2witness/server/routers.ts` (lines 831-866)

```typescript
createPointAdjustment: protectedProcedure
  .input(
    z.object({
      userId: z.number(),
      pointsDelta: z.number(),
      reason: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const adminUser = await db.getUserById(ctx.user.id);
    if (!adminUser || adminUser.role !== "admin") {
      throw new Error("Only admins can create point adjustments");
    }

    const targetUser = await db.getUserById(input.userId);
    if (!targetUser || !targetUser.groupId) {
      throw new Error("Target user must be assigned to a group");
    }

    const group = await db.getGroupById(targetUser.groupId);
    if (!group || !group.challengeId) {
      throw new Error("Group must be assigned to a challenge");
    }

    const adjustmentId = await db.createPointAdjustment({
      date: new Date(),
      userId: input.userId,
      groupId: targetUser.groupId,
      challengeId: group.challengeId,
      pointsDelta: input.pointsDelta,
      reason: input.reason,
      adjustedBy: ctx.user.id,
    });

    return { success: true, adjustmentId };
  }),
```

### API Router Read Location

**Path:** `/home/ubuntu/fitness2witness/server/routers.ts` (lines 868-888)

```typescript
getAuditLog: protectedProcedure.query(async ({ ctx }) => {
  const user = await db.getUserById(ctx.user.id);
  if (!user || user.role !== "admin") {
    throw new Error("Only admins can access audit log");
  }

  const adjustments = await db.getAllPointAdjustments();
  const adjustmentsWithUsers = await Promise.all(
    adjustments.map(async (adj) => {
      const targetUser = await db.getUserById(adj.userId);
      const adminUser = await db.getUserById(adj.adjustedBy);
      return {
        ...adj,
        targetUserName: targetUser?.name || "Unknown",
        adminName: adminUser?.name || "Unknown",
      };
    })
  );

  return adjustmentsWithUsers;
}),
```

### Usage in Points Calculation

**Path:** `/home/ubuntu/fitness2witness/server/db.ts` (lines 1192-1194)

```typescript
// Get point adjustments
const adjustments = await getPointAdjustmentsByUserId(userId);
totalPoints += adjustments.reduce((sum, adj) => sum + adj.pointsDelta, 0);
```

### Summary of Write/Read Locations

**WRITE locations:**
1. `db.createPointAdjustment()` in `/server/db.ts` (line 334)
2. `admin.createPointAdjustment` tRPC mutation in `/server/routers.ts` (line 831)

**READ locations:**
1. `db.getPointAdjustmentsByUserId()` in `/server/db.ts` (line 346) - Used by getUserMetrics
2. `db.getAllPointAdjustments()` in `/server/db.ts` (line 1097) - Used by admin audit log
3. `admin.getAuditLog` tRPC query in `/server/routers.ts` (line 868) - Admin audit view
4. `getUserMetrics()` in `/server/db.ts` (line 1193) - Leaderboard calculation

**INSERT statement:**
- Direct Drizzle ORM insert: `db.insert(pointAdjustments).values(adjustment).returning()`

**SELECT statements:**
- By user: `db.select().from(pointAdjustments).where(eq(pointAdjustments.userId, userId))`
- All: `db.select().from(pointAdjustments).orderBy(desc(pointAdjustments.date))`

---

**READ-ONLY AUDIT COMPLETE — NO FILES MODIFIED**
