# ADMIN + AUTH INSPECTION REPORT
## Fitness2Witness Repository

---

## 1) AUTHENTICATION

### Files

**File: `/home/ubuntu/fitness2witness/server/_core/context.ts`**

```typescript
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "../../shared/const";
import * as db from "../db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-in-production");

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    let sessionToken: string | undefined;

    // Try to get token from Authorization header first (for token-based auth)
    const authHeader = opts.req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
      console.log('[Auth Debug] Token from Authorization header');
    }

    // Fallback to cookie-based auth if no Authorization header
    if (!sessionToken) {
      const cookieHeader = opts.req.headers.cookie;
      console.log('[Auth Debug] Cookie header:', cookieHeader ? 'present' : 'missing');
      
      if (cookieHeader) {
        const cookies = parseCookieHeader(cookieHeader);
        sessionToken = cookies[COOKIE_NAME];
        console.log('[Auth Debug] Session token from cookie:', sessionToken ? 'found' : 'missing');
      }
    }

    if (!sessionToken) {
      console.log('[Auth Debug] No session token found');
      return { req: opts.req, res: opts.res, user: null };
    }

    // Verify JWT token
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const userId = payload.userId as number;

    if (!userId) {
      console.log('[Auth Debug] No userId in token payload');
      return { req: opts.req, res: opts.res, user: null };
    }

    // Get user from database
    user = await db.getUserById(userId) ?? null;
    console.log('[Auth Debug] User loaded:', user ? `${user.name} (ID: ${user.id})` : 'not found');
  } catch (error) {
    // Authentication is optional for public procedures
    console.log('[Auth Debug] Error:', error instanceof Error ? error.message : 'Unknown error');
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
```

**File: `/home/ubuntu/fitness2witness/server/_core/trpc.ts`**

```typescript
import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
```

**File: `/home/ubuntu/fitness2witness/drizzle/schema.ts` (User type)**

```typescript
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).unique(),
  role: roleEnum("role").default("user").notNull(),
  groupId: integer("groupId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
```

### Summary: How ctx.user is Built

- **Provider:** Custom JWT (using `jose` library)
- **Token Source (dual-path):**
  1. `Authorization: Bearer <token>` header (primary)
  2. Cookie named `COOKIE_NAME` (fallback)
- **How userId is derived:** JWT payload contains `userId` field (type: number)
- **How role is derived:** User loaded from database via `db.getUserById(userId)`, role field is enum: `"user" | "leader" | "admin"`
- **How groupId is derived:** User record in database has `groupId` field (type: number | null)
- **Available fields on ctx.user:**
  - `id` (number)
  - `name` (string)
  - `phoneNumber` (string | null)
  - `role` ("user" | "leader" | "admin")
  - `groupId` (number | null)
  - `createdAt`, `updatedAt`, `lastSignedIn` (timestamps)

**Missing pieces / ambiguity:**
- JWT_SECRET defaults to "default-secret-change-in-production" if env var not set (security risk)
- No JWT expiration handling visible in context creation
- `adminProcedure` middleware exists but is NOT used by admin router (all admin procedures use `protectedProcedure` + manual role check)

---

## 2) ADMIN API LAYER

### Backend Style: tRPC

**File: `/home/ubuntu/fitness2witness/server/routers.ts` (admin router - FULL CONTENTS)**

```typescript
  // Admin Console
  admin: router({
    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || user.role !== "admin") {
        throw new Error("Only admins can access this");
      }

      // Get all users with their stats
      const users = await db.getAllUsers();
      const usersWithStats = await Promise.all(
        users.map(async (u) => {
          // Get the first challenge ID (assuming single challenge for now)
          const challenges = await db.getAllChallenges();
          const challengeId = challenges[0]?.id || 1;
          const metrics = await db.getUserMetrics(u.id, challengeId);
          return {
            ...u,
            totalPoints: metrics.totalPoints,
            weekPoints: metrics.thisWeekTotal,
            checkInCount: await db.getUserCheckInCount(u.id),
          };
        })
      );
      return usersWithStats;
    }),

    updateUserRole: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
          role: z.enum(["user", "leader", "admin"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can update user roles");
        }

        await db.updateUser(parseInt(input.userId), { role: input.role });
        return { success: true };
      }),

    removeUser: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can remove users");
        }

        await db.deleteUser(parseInt(input.userId));
        return { success: true };
      }),

    deactivateUser: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can deactivate users");
        }

        // Deactivate by removing from group (same as removeUserFromGroup)
        await db.updateUser(parseInt(input.userId), { groupId: null });
        const updatedUser = await db.getUserById(parseInt(input.userId));
        return updatedUser;
      }),

    removeUserFromGroup: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can remove users from groups");
        }

        await db.updateUser(parseInt(input.userId), { groupId: null });
        const updatedUser = await db.getUserById(parseInt(input.userId));
        return updatedUser;
      }),

    updateUser: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          name: z.string().optional(),
          email: z.string().optional(),
          groupId: z.number().optional(),
          role: z.enum(["user", "leader", "admin"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can update users");
        }

        const { userId, ...updateData } = input;
        await db.updateUser(userId, updateData);
        return { success: true };
      }),

    getAllGroups: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || user.role !== "admin") {
        throw new Error("Only admins can access this");
      }

      return db.getAllGroups();
    }),

    createGroup: protectedProcedure
      .input(
        z.object({
          groupName: z.string(),
          leaderUserId: z.number().optional(),
          challengeId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can create groups");
        }

        const groupId = await db.createGroup(input);
        return { success: true, groupId };
      }),

    updateGroup: protectedProcedure
      .input(
        z.object({
          groupId: z.number(),
          groupName: z.string().optional(),
          leaderUserId: z.number().optional(),
          challengeId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can update groups");
        }

        const { groupId, ...updateData } = input;
        await db.updateGroup(groupId, updateData);
        return { success: true };
      }),

    getAllChallenges: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || user.role !== "admin") {
        throw new Error("Only admins can access this");
      }

      return db.getAllChallenges();
    }),

    createChallenge: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          startDate: z.string(),
          endDate: z.string(),
          active: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can create challenges");
        }

        const challengeId = await db.createChallenge({
          ...input,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
        });
        return { success: true, challengeId };
      }),

    updateChallenge: protectedProcedure
      .input(
        z.object({
          challengeId: z.number(),
          name: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          active: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can update challenges");
        }

        const { challengeId, ...rest } = input;
        const updateData: any = { ...rest };
        if (rest.startDate) updateData.startDate = new Date(rest.startDate);
        if (rest.endDate) updateData.endDate = new Date(rest.endDate);

        await db.updateChallenge(challengeId, updateData);
        return { success: true };
      }),

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

    getCheckInsByDate: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can access this");
        }

        return db.getCheckInsByDate(new Date(input.date));
      }),

    getAttendanceByDate: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can access this");
        }

        return db.getAttendanceByDate(new Date(input.date));
      }),

    addUserCheckIn: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
          date: z.string(),
          nutritionDone: z.boolean(),
          hydrationDone: z.boolean(),
          movementDone: z.boolean(),
          scriptureDone: z.boolean(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const adminUser = await db.getUserById(ctx.user.id);
        if (!adminUser || adminUser.role !== "admin") {
          throw new Error("Only admins can add check-ins");
        }

        const targetUser = await db.getUserById(parseInt(input.userId));
        if (!targetUser || !targetUser.groupId) {
          throw new Error("User must be assigned to a group");
        }

        const group = await db.getGroupById(targetUser.groupId);
        if (!group || !group.challengeId) {
          throw new Error("Group must be assigned to a challenge");
        }

        await db.createCheckIn({
          date: new Date(input.date),
          userId: parseInt(input.userId),
          groupId: targetUser.groupId,
          challengeId: group.challengeId,
          nutritionDone: input.nutritionDone,
          hydrationDone: input.hydrationDone,
          movementDone: input.movementDone,
          scriptureDone: input.scriptureDone,
          notes: input.notes,
        });

        return { success: true };
      }),

    upsertCheckInForUserDate: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
          dateISO: z.string(),
          nutritionDone: z.boolean(),
          hydrationDone: z.boolean(),
          movementDone: z.boolean(),
          scriptureDone: z.boolean(),
          lifeGroupAttended: z.boolean().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const adminUser = await db.getUserById(ctx.user.id);
        if (!adminUser || adminUser.role !== "admin") {
          throw new Error("Only admins can upsert check-ins");
        }

        const targetUser = await db.getUserById(parseInt(input.userId));
        if (!targetUser || !targetUser.groupId) {
          throw new Error("User must be assigned to a group");
        }

        const group = await db.getGroupById(targetUser.groupId);
        if (!group || !group.challengeId) {
          throw new Error("Group must be assigned to a challenge");
        }

        // Normalize date to day boundary
        const date = new Date(input.dateISO);
        date.setHours(0, 0, 0, 0);

        // Check if check-in exists for this user+date
        const existing = await db.getCheckinByUserIdAndDate(parseInt(input.userId), date);

        if (existing) {
          // Update existing check-in
          await db.updateDailyCheckin(existing.id, {
            nutritionDone: input.nutritionDone,
            hydrationDone: input.hydrationDone,
            movementDone: input.movementDone,
            scriptureDone: input.scriptureDone,
            notes: input.notes,
          });
          return { success: true, action: "updated", checkInId: existing.id };
        } else {
          // Create new check-in
          const newCheckIn = await db.createCheckIn({
            date,
            userId: parseInt(input.userId),
            groupId: targetUser.groupId,
            challengeId: group.challengeId,
            nutritionDone: input.nutritionDone,
            hydrationDone: input.hydrationDone,
            movementDone: input.movementDone,
            scriptureDone: input.scriptureDone,
            notes: input.notes,
          });
          return { success: true, action: "created", checkInId: newCheckIn?.id || 0 };
        }
      }),

    addUserAttendance: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
          date: z.string(),
          attended: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const adminUser = await db.getUserById(ctx.user.id);
        if (!adminUser || adminUser.role !== "admin") {
          throw new Error("Only admins can add attendance");
        }

        const targetUser = await db.getUserById(parseInt(input.userId));
        if (!targetUser || !targetUser.groupId) {
          throw new Error("User must be assigned to a group");
        }

        const group = await db.getGroupById(targetUser.groupId);
        if (!group || !group.challengeId) {
          throw new Error("Group must be assigned to a challenge");
        }

        const date = new Date(input.date);
        const startOfWeek = new Date(date);
        startOfWeek.setHours(0, 0, 0, 0);
        const dayOfWeek = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - dayOfWeek;
        startOfWeek.setDate(diff);

        await db.createWeeklyAttendance({
          weekStartDate: startOfWeek,
          userId: parseInt(input.userId),
          groupId: targetUser.groupId,
          challengeId: group.challengeId,
          attendedWednesday: input.attended,
        });

        return { success: true };
      }),
  }),
```

**File: `/home/ubuntu/fitness2witness/server/routers.ts` (community deletePost procedure)**

```typescript
deletePost: protectedProcedure
  .input(z.object({ postId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can delete posts");
    }

    await db.deletePost(input.postId);
    return { success: true };
  }),
```

### Summary: Admin Permission Enforcement

- **Pattern:** All admin procedures use `protectedProcedure` (NOT `adminProcedure`)
- **Role check:** Manual check inside each procedure: `if (!user || user.role !== "admin") throw new Error(...)`
- **Group scoping:** Most admin procedures require target user to have `groupId` and group to have `challengeId`
- **Type mismatch:** Input schemas use `userId: z.string()` but database expects `number` (converted with `parseInt()`)
- **Admin procedures:**
  - `getAllUsers` - Returns users with stats (totalPoints, weekPoints, checkInCount)
  - `updateUserRole` - Change user role
  - `removeUser` - Delete user permanently
  - `deactivateUser` / `removeUserFromGroup` - Set groupId to null
  - `createPointAdjustment` - Manual points adjustment (requires userId: number)
  - `getAuditLog` - View point adjustments history
  - `upsertCheckInForUserDate` - Create OR update check-in for user+date
  - `addUserAttendance` - Add attendance record
  - Group/challenge management procedures
- **Post moderation:** `community.deletePost` requires admin role

**Gaps:**
- `adminProcedure` middleware exists but is unused (all procedures use `protectedProcedure` + manual check)
- No group-level admin scoping (admin can modify any user in any group)
- Type inconsistency: frontend sends `userId` as string, backend expects number

---

## 3) ADMIN UI

### File Paths

- `/home/ubuntu/fitness2witness/app/admin-users.tsx`
- `/home/ubuntu/fitness2witness/app/admin-calendar.tsx`
- `/home/ubuntu/fitness2witness/app/admin-moderation.tsx`

### admin-users.tsx Summary

**Actions attempted:**
- Change user role (cycles through user → leader → admin)
- Remove user (2 options: Remove from Group OR Delete Permanently)

**Endpoints called:**
- `trpc.admin.getAllUsers.useQuery()` - Get users with stats
- `trpc.admin.updateUserRole.useMutation()` - Change role
- `trpc.admin.removeUser.useMutation()` - Delete permanently
- `trpc.admin.removeUserFromGroup.useMutation()` - Remove from group

**Payload sent:**
- `updateUserRole`: `{ userId: string, role: "user"|"leader"|"admin" }`
- `removeUser`: `{ userId: string }`
- `removeUserFromGroup`: `{ userId: string }`

**Type handling:**
```typescript
const payload = { userId: String(userId) };
console.log("Payload types:", { userId: typeof payload.userId }); // "string"
```

**Likely errors:**
- ✅ Type conversion correct (userId sent as string, backend converts with parseInt)
- ✅ Console logs added for debugging
- ✅ Error messages displayed via Alert

### admin-calendar.tsx Summary

**Actions attempted:**
- Quick Add Check-In (all 4 categories)
- Mark Present (attendance)

**Endpoints called:**
- `trpc.admin.getAllUsers.useQuery()` - Get users
- `trpc.admin.getCheckInsByDate.useQuery()` - Get check-ins for date
- `trpc.admin.getAttendanceByDate.useQuery()` - Get attendance for date
- `trpc.admin.upsertCheckInForUserDate.useMutation()` - Create/update check-in
- `trpc.admin.addUserAttendance.useMutation()` - Add attendance

**Payload sent:**
- `upsertCheckInForUserDate`:
  ```typescript
  {
    userId: string,
    dateISO: string, // .toISOString()
    nutritionDone: boolean,
    hydrationDone: boolean,
    movementDone: boolean,
    scriptureDone: boolean,
    notes: string
  }
  ```
- `addUserAttendance`:
  ```typescript
  {
    userId: string,
    date: string, // .toISOString()
    attended: boolean
  }
  ```

**Type handling:**
```typescript
const payload = {
  userId: String(userId),
  dateISO: selectedDate.toISOString(),
  // ...
};
console.log("Payload types:", { userId: typeof payload.userId, dateISO: typeof payload.dateISO });
```

**Likely errors:**
- ✅ Type conversion correct (userId as string, dateISO as ISO string)
- ✅ Console logs added for debugging
- ⚠️ DateTimePicker not supported on web (already fixed with web-compatible input)
- ✅ Error messages displayed via Alert

### admin-moderation.tsx Summary

**Actions attempted:**
- Delete community post

**Endpoints called:**
- `trpc.community.getPosts.useQuery()` - Get all posts
- `trpc.community.deletePost.useMutation()` - Delete post

**Payload sent:**
- `deletePost`:
  ```typescript
  {
    postId: number // Number(postId)
  }
  ```

**Type handling:**
```typescript
const payload = { postId: Number(postId) };
console.log("Payload types:", { postId: typeof payload.postId }); // "number"
```

**Likely errors:**
- ✅ Type conversion correct (postId as number)
- ✅ Query invalidation on success (immediate UI update)
- ✅ Error messages displayed via Alert

---

## 4) POINTS + LEADERBOARD DISCOVERY

### Points Calculation Logic

**File: `/home/ubuntu/fitness2witness/server/db.ts` (getUserMetrics function)**

```typescript
export async function getUserMetrics(userId: number, challengeId: number) {
  const db = await getDb();
  if (!db) {
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
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);

  const weekCheckins = checkins.filter(c => new Date(c.date) >= weekStart);
  let thisWeekDailyPoints = 0;
  for (const checkin of weekCheckins) {
    if (checkin.nutritionDone) thisWeekDailyPoints++;
    if (checkin.hydrationDone) thisWeekDailyPoints++;
    if (checkin.movementDone) thisWeekDailyPoints++;
    if (checkin.scriptureDone) thisWeekDailyPoints++;
  }

  const weekAttendance = attendance.filter(a => new Date(a.weekStartDate) >= weekStart && a.attendedWednesday);
  const thisWeekAttendancePoints = weekAttendance.length * 10;

  const thisWeekTotal = thisWeekDailyPoints + thisWeekAttendancePoints;

  return {
    totalPoints,
    thisWeekTotal,
    weeklyPercent: 0, // Not calculated
  };
}
```

**Points Formula:**
- **Daily check-ins:** 1 point per category (nutrition, hydration, movement, scripture) = max 4 points/day
- **Weekly attendance:** 10 points per week if `attendedWednesday` is true
- **Point adjustments:** Manual admin adjustments (can be positive or negative)
- **Total:** `dailyPoints + (attendanceWeeks * 10) + adjustments`

### Leaderboard API

**File: `/home/ubuntu/fitness2witness/server/routers.ts` (leaderboard procedure)**

```typescript
getLeaderboard: protectedProcedure
  .input(z.object({ period: z.enum(["week", "all"]) }))
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

### Point Adjustments (Audit System)

**Table:** `pointAdjustments`

**Schema:**
```typescript
export const pointAdjustments = pgTable("pointAdjustments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  date: timestamp("date").notNull(),
  userId: integer("userId").notNull(),
  groupId: integer("groupId").notNull(),
  challengeId: integer("challengeId").notNull(),
  pointsDelta: integer("pointsDelta").notNull(), // Can be positive or negative
  reason: text("reason").notNull(),
  adjustedBy: integer("adjustedBy").notNull(), // Admin user ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

**Admin Procedure:**
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

### Summary: How Totals Are Computed

- **Computed on-the-fly:** No cached totals, recalculated every time `getUserMetrics()` is called
- **Sources:**
  1. Daily check-ins (4 categories × 1 point each)
  2. Weekly attendance (10 points per week)
  3. Point adjustments (manual admin adjustments)
- **Leaderboard:** Fetches all group users, calculates metrics for each, sorts by points
- **Audit trail:** All manual adjustments stored in `pointAdjustments` table with admin ID and reason

---

## 5) BONUS POINTS HOOK LOCATIONS

### Recommended Storage Location

**Option 1 (RECOMMENDED): Reuse `pointAdjustments` table**

Add a `category` field to distinguish adjustment types:

```typescript
// Suggested schema extension (NOT IMPLEMENTED):
category: text("category").notNull(), // "nutrition" | "hydration" | "movement" | "scripture" | "attendance" | "manual" | "bonus"
```

**Why this works:**
- Table already exists with proper audit trail (date, userId, groupId, challengeId, adjustedBy)
- Already integrated into points calculation (`getUserMetrics` sums all adjustments)
- No schema migration needed if category is optional (can default to "manual")

**Option 2: New `bonusPoints` table**

Create separate table for bonus points (cleaner separation but requires migration):

```typescript
// Suggested schema (NOT IMPLEMENTED):
export const bonusPoints = pgTable("bonusPoints", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  date: timestamp("date").notNull(),
  userId: integer("userId").notNull(),
  groupId: integer("groupId").notNull(),
  challengeId: integer("challengeId").notNull(),
  pointsDelta: integer("pointsDelta").notNull(),
  category: text("category").notNull(), // "nutrition" | "hydration" | etc.
  reason: text("reason").notNull(),
  awardedBy: integer("awardedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

### Backend Procedure Location

**Extend existing `admin.createPointAdjustment` to accept category:**

```typescript
// Suggested enhancement (NOT IMPLEMENTED):
createPointAdjustment: protectedProcedure
  .input(
    z.object({
      userId: z.number(),
      pointsDelta: z.number(),
      category: z.enum(["nutrition", "hydration", "movement", "scripture", "attendance", "manual", "bonus"]),
      reason: z.string(),
      dateISO: z.string().optional(), // Allow backdating
    })
  )
  .mutation(async ({ ctx, input }) => {
    // ... existing validation ...
    
    const adjustmentId = await db.createPointAdjustment({
      date: input.dateISO ? new Date(input.dateISO) : new Date(),
      userId: input.userId,
      groupId: targetUser.groupId,
      challengeId: group.challengeId,
      pointsDelta: input.pointsDelta,
      category: input.category,
      reason: input.reason,
      adjustedBy: ctx.user.id,
    });

    return { success: true, adjustmentId };
  }),
```

### Frontend Admin Screen Location

**Add bonus points UI to `/app/admin-users.tsx`:**

- Add "Award Bonus Points" button next to each user
- Modal with:
  - Points input (number)
  - Category dropdown (nutrition, hydration, movement, scripture, attendance, bonus)
  - Reason text input
  - Optional date picker (default: today)
- Calls `admin.createPointAdjustment` with category field

**Alternative: Create dedicated `/app/admin-bonus-points.tsx` screen:**

- List all users with quick bonus point buttons
- Bulk award functionality (select multiple users, award same bonus)
- History view showing recent bonus point awards

---

## INSPECTION COMPLETE — NO CHANGES MADE
