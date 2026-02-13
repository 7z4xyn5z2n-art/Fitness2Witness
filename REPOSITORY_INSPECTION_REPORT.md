# REPOSITORY INSPECTION REPORT
# Fitness2Witness Application

---

## 1) DATA MODEL

### File: /home/ubuntu/fitness2witness/drizzle/schema.ts

```typescript
import { boolean, integer, pgEnum, pgTable, real, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Define enums for PostgreSQL
export const roleEnum = pgEnum("role", ["user", "leader", "admin"]);
export const postTypeEnum = pgEnum("postType", ["Encouragement", "Testimony", "Photo", "Video", "Announcement"]);
export const visibilityEnum = pgEnum("visibility", ["GroupOnly", "LeadersOnly"]);
export const challengeTypeEnum = pgEnum("challengeType", ["running", "steps", "workouts", "custom"]);

/**
 * Core user table backing auth flow.
 */
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

// Groups table
export const groups = pgTable("groups", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  groupName: varchar("groupName", { length: 255 }).notNull(),
  leaderUserId: integer("leaderUserId"),
  challengeId: integer("challengeId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

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

// Daily check-ins table
export const dailyCheckins = pgTable("dailyCheckins", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  date: timestamp("date").notNull(),
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
});

// Weekly attendance table
export const weeklyAttendance = pgTable("weeklyAttendance", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  weekStartDate: timestamp("weekStartDate").notNull(),
  userId: integer("userId").notNull(),
  groupId: integer("groupId").notNull(),
  challengeId: integer("challengeId").notNull(),
  attendedWednesday: boolean("attendedWednesday").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Point adjustments table
export const pointAdjustments = pgTable("pointAdjustments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  date: timestamp("date").notNull(),
  userId: integer("userId").notNull(),
  groupId: integer("groupId").notNull(),
  challengeId: integer("challengeId").notNull(),
  pointsDelta: integer("pointsDelta").notNull(),
  reason: text("reason").notNull(),
  adjustedBy: integer("adjustedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

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

// Body metrics table
export const bodyMetrics = pgTable("bodyMetrics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  groupId: integer("groupId").notNull(),
  challengeId: integer("challengeId").notNull(),
  date: timestamp("date").notNull(),
  weight: real("weight"),
  bodyFatPercent: real("bodyFatPercent"),
  muscleMass: real("muscleMass"),
  visceralFat: integer("visceralFat"),
  bmr: integer("bmr"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// User badges table
export const userBadges = pgTable("userBadges", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  badgeType: varchar("badgeType", { length: 100 }).notNull(),
  badgeName: varchar("badgeName", { length: 255 }).notNull(),
  badgeDescription: text("badgeDescription"),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

// User targets table (InBody recommendations)
export const userTargets = pgTable("userTargets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().unique(),
  targetWeight: real("targetWeight"),
  targetBodyFat: real("targetBodyFat"),
  recommendedCalories: integer("recommendedCalories"),
  recommendedCarbs: integer("recommendedCarbs"),
  recommendedProtein: integer("recommendedProtein"),
  recommendedFat: integer("recommendedFat"),
  sourceDate: timestamp("sourceDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
```

### Migrations

**Folder:** `/home/ubuntu/fitness2witness/drizzle/migrations/`
**Status:** Migrations folder not found (migrations likely run via server/migrations/run-migrations.ts)

### drizzle.config.ts

**Status:** File not found (configuration likely embedded in server code)

---

## 2) API LAYER

### Backend System: **tRPC**

### File: /home/ubuntu/fitness2witness/server/_core/trpc.ts

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

### File: /home/ubuntu/fitness2witness/server/_core/context.ts

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

### Admin Router Procedures (from /home/ubuntu/fitness2witness/server/routers.ts)

```typescript
admin: router({
  // Get all users with stats
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can access this");
    }
    // Returns users with totalPoints, weekPoints, checkInCount
  }),

  // Update user role
  updateUserRole: protectedProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(["user", "leader", "admin"]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Admin check: ctx.user.role === "admin"
      await db.updateUser(parseInt(input.userId), { role: input.role });
    }),

  // Remove user (delete permanently)
  removeUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Admin check: ctx.user.role === "admin"
      await db.deleteUser(parseInt(input.userId));
    }),

  // Deactivate user (remove from group)
  deactivateUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Admin check: ctx.user.role === "admin"
      await db.updateUser(parseInt(input.userId), { groupId: null });
    }),

  // Remove user from group
  removeUserFromGroup: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Admin check: ctx.user.role === "admin"
      await db.updateUser(parseInt(input.userId), { groupId: null });
    }),

  // Upsert check-in for user+date (CALENDAR SYSTEM)
  upsertCheckInForUserDate: protectedProcedure
    .input(z.object({
      userId: z.string(),
      dateISO: z.string(),
      nutritionDone: z.boolean(),
      hydrationDone: z.boolean(),
      movementDone: z.boolean(),
      scriptureDone: z.boolean(),
      lifeGroupAttended: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Admin check: ctx.user.role === "admin"
      // Normalizes date to day boundary
      // Checks if check-in exists for user+date
      // If exists: UPDATE
      // If not: CREATE
      // Returns: { success: true, action: "updated" | "created", checkInId }
    }),

  // Add attendance for user
  addUserAttendance: protectedProcedure
    .input(z.object({
      userId: z.string(),
      date: z.string(),
      attended: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Admin check: ctx.user.role === "admin"
      // Creates weeklyAttendance record
    }),

  // Create point adjustment
  createPointAdjustment: protectedProcedure
    .input(z.object({
      userId: z.number(),
      pointsDelta: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Admin check: ctx.user.role === "admin"
      // Creates pointAdjustments record
    }),

  // Get audit log
  getAuditLog: protectedProcedure.query(async ({ ctx }) => {
    // Admin check: ctx.user.role === "admin"
    // Returns all pointAdjustments with user names
  }),
})
```

### Community Router (Post Deletion)

```typescript
community: router({
  deletePost: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      const post = await db.getPostById(input.postId);
      
      // Can delete if: admin OR post owner
      if (user?.role !== "admin" && post?.userId !== ctx.user.id) {
        throw new Error("Only admins or post owners can delete posts");
      }
      
      await db.deletePost(input.postId);
    }),
})
```

---

## 3) AUTH + ROLES SUMMARY

**Authentication Method:** Custom JWT

- **Token Storage:** Cookie (COOKIE_NAME) OR Authorization header (`Bearer <token>`)
- **Token Verification:** `jose` library (`jwtVerify`)
- **JWT Secret:** `process.env.JWT_SECRET` (defaults to "default-secret-change-in-production")
- **User Identification:** JWT payload contains `userId`, then user fetched from DB

**Role Storage:**
- Stored in `users.role` column (enum: "user", "leader", "admin")
- Role is loaded from database on every request after JWT verification

**Groups:**
- Groups exist: `groups` table with `id`, `groupName`, `leaderUserId`, `challengeId`
- Users link to groups via `users.groupId` (foreign key)
- No separate membership table (direct foreign key relationship)

**Admin Scope:**
- **Global admin** (not per-group)
- Evidence: All admin checks are `ctx.user.role === "admin"` (no group context)
- Admin can manage ALL users, groups, challenges, posts

**Role Enforcement:**
- **Server-side:** `adminProcedure` middleware checks `ctx.user.role === "admin"`
- **Returns:** FORBIDDEN (403) if not admin
- **Used in:** All admin.* procedures, community.deletePost (admin OR owner)

---

## 4) POINTS SYSTEM SUMMARY

**Points Storage:**

1. **Daily Check-ins** (dailyCheckins table):
   - 4 boolean fields: nutritionDone, hydrationDone, movementDone, scriptureDone
   - Each = 1 point
   - Max 4 points/day

2. **Weekly Attendance** (weeklyAttendance table):
   - attendedWednesday boolean
   - Each attendance = 10 points

3. **Point Adjustments** (pointAdjustments table):
   - Manual admin adjustments
   - pointsDelta (can be positive or negative)
   - Includes reason and adjustedBy (admin user ID)

**Audit Mechanism:**
- **YES** - pointAdjustments table tracks:
  - date, userId, groupId, challengeId
  - pointsDelta, reason, adjustedBy
  - createdAt timestamp

**Leaderboard Calculation** (from db.ts getUserMetrics function):

```typescript
// Total points = daily check-ins + attendance + adjustments
totalPoints = 
  (count of nutritionDone) + 
  (count of hydrationDone) + 
  (count of movementDone) + 
  (count of scriptureDone) +
  (attendance count * 10) +
  (sum of pointAdjustments.pointsDelta)

// This week's points calculated similarly but filtered by weekStart date
```

**Points are calculated on-the-fly** (not cached in a separate total column)

---

## 5) ADMIN UI SUMMARY

### Admin Screens

1. **/app/admin-calendar.tsx**
   - **Actions:**
     - Select date (DateTimePicker on native, `<input type="date">` on web)
     - Select user from list
     - "Quick Add" check-in (all 4 categories)
     - "Custom" check-in (select specific categories)
     - "Mark Present" (add attendance)
   - **API Endpoints:**
     - `admin.upsertCheckInForUserDate` (payload: userId string, dateISO string, 4 booleans, notes)
     - `admin.addUserAttendance` (payload: userId string, date string, attended boolean)
   - **Payload Shape:**
     ```typescript
     // Check-in
     { userId: String(userId), dateISO: selectedDate.toISOString(), nutritionDone: true, ... }
     // Attendance
     { userId: String(userId), date: selectedDate.toISOString(), attended: true }
     ```

2. **/app/admin-users.tsx**
   - **Actions:**
     - View all users with stats (points, check-in count)
     - Change user role (user → leader → admin → user)
     - Remove user (2 options: "Remove from Group" OR "Delete Permanently")
   - **API Endpoints:**
     - `admin.getAllUsers` (query)
     - `admin.updateUserRole` (payload: userId string, role enum)
     - `admin.removeUserFromGroup` (payload: userId string)
     - `admin.removeUser` (payload: userId string)
   - **Payload Shape:**
     ```typescript
     { userId: String(userId) }
     { userId: String(userId), role: "user" | "leader" | "admin" }
     ```

3. **/app/admin-moderation.tsx**
   - **Actions:**
     - View all community posts
     - Delete post (admin only)
   - **API Endpoints:**
     - `community.getPosts` (query)
     - `community.deletePost` (payload: postId number)
   - **Payload Shape:**
     ```typescript
     { postId: Number(postId) }
     ```

### Hooks/Services Used

- **tRPC hooks:**
  - `trpc.admin.getAllUsers.useQuery()`
  - `trpc.admin.upsertCheckInForUserDate.useMutation()`
  - `trpc.admin.addUserAttendance.useMutation()`
  - `trpc.admin.removeUser.useMutation()`
  - `trpc.admin.removeUserFromGroup.useMutation()`
  - `trpc.community.getPosts.useQuery()`
  - `trpc.community.deletePost.useMutation()`

- **Query invalidation:**
  - `utils.admin.getAllUsers.invalidate()`
  - `utils.community.getPosts.invalidate()`

---

## 6) GAPS IDENTIFIED

### Structural Issues (Facts Only)

1. **Admin Middleware Not Used**
   - Admin procedures use `protectedProcedure` + manual `ctx.user.role === "admin"` check
   - `adminProcedure` middleware exists but is NOT used in any admin router procedures
   - Every admin procedure duplicates the same role check code

2. **Type Mismatch: userId**
   - Backend expects: `z.string()` then converts to `parseInt(input.userId)`
   - Frontend sends: `String(userId)` (explicit conversion)
   - Database stores: `integer` (users.id)
   - **Inconsistency:** API accepts string but DB uses integer

3. **Type Mismatch: postId**
   - Backend expects: `z.number()`
   - Frontend sends: `Number(postId)` (explicit conversion)
   - Database stores: `integer` (communityPosts.id)

4. **Date Format Inconsistency**
   - Backend accepts: `z.string()` then converts to `new Date(input.date)`
   - Frontend sends: `selectedDate.toISOString()` (ISO 8601 string)
   - Some procedures normalize to day boundary, some don't

5. **No Migration Files**
   - `drizzle/migrations/` folder does not exist
   - Migrations likely run programmatically via `server/migrations/run-migrations.ts`
   - No version history visible in filesystem

6. **No drizzle.config.ts**
   - Drizzle configuration not found in standard location
   - Schema location: `drizzle/schema.ts` (confirmed)
   - Connection string: `process.env.DATABASE_URL` (from db.ts)

7. **Community Feed Public Access**
   - `community.getPosts` uses `publicProcedure` (no auth required)
   - Posts visible to logged-out users
   - `community.deletePost` requires auth (admin OR owner)

8. **Points Calculation Performance**
   - Points calculated on-the-fly for every leaderboard/metrics request
   - No caching or materialized view
   - Queries all check-ins, attendance, adjustments per user

9. **Group-Challenge Relationship**
   - Groups have `challengeId` (one challenge per group)
   - Users inherit challenge from group
   - No direct user-to-challenge relationship
   - If user has no group, they have no challenge

10. **Admin Calendar Web Compatibility**
    - DateTimePicker not supported on web (Platform.OS === "web" check exists)
    - Web uses `<input type="date">` fallback
    - selectedDate defaults to `new Date()` (never null)

---

**INSPECTION COMPLETE — NO CHANGES MADE**
