# READ-ONLY AUDIT REPORT - ADMIN PROCEDURES

---

## SECTION 1 — ADMIN PROCEDURES

### File: `/home/ubuntu/fitness2witness/server/routers.ts`

---

### admin.createPointAdjustment (lines 831-868)

**FULL CODE BLOCK:**

```typescript
createPointAdjustment: protectedProcedure
  .input(
    z.object({
      userId: z.number(),
      pointsDelta: z.number(),
      reason: z.string(),
      category: z.string().optional(), // Optional category for bonus points
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
      category: input.category, // Optional category for bonus points
      adjustedBy: ctx.user.id,
    });

    return { success: true, adjustmentId };
  }),
```

---

### admin.getAuditLog (lines 870-890)

**FULL CODE BLOCK:**

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

---

### admin.upsertCheckInForUserDate (lines 957-1018)

**FULL CODE BLOCK:**

```typescript
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
```

---

### admin.addUserAttendance (lines 1020-1060)

**FULL CODE BLOCK:**

```typescript
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
```

---

### admin.getAllUsers (lines 613-636)

**FULL CODE BLOCK:**

```typescript
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
```

---

## SECTION 2 — AUDIT UI

**NO FRONTEND UI FOUND FOR admin.getAuditLog**

---

## SECTION 3 — LEADERBOARD / TOTALS API

### Leaderboard API Procedure

**File:** `/home/ubuntu/fitness2witness/server/routers.ts`

**metrics.getGroupLeaderboard (lines 184-212):**

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

---

### User Metrics Totals Function

**File:** `/home/ubuntu/fitness2witness/server/db.ts`

**getUserMetrics (lines 1165-1236):**

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

  const weekAdjustments = adjustments.filter(a => new Date(a.date) >= weekStart);
  const thisWeekAdjustmentPoints = weekAdjustments.reduce((sum, adj) => sum + adj.pointsDelta, 0);
  
  const thisWeekTotal = thisWeekDailyPoints + thisWeekAttendancePoints + thisWeekAdjustmentPoints;

  // Calculate weekly percentage (max 38 points per week: 7 days * 4 categories + 10 for attendance)
  const weeklyPercent = (thisWeekTotal / 38) * 100;

  // Calculate overall percentage (max 456 points for 12 weeks: 12 * 38)
  const overallPercent = (totalPoints / 456) * 100;

  return {
    totalPoints,
    thisWeekTotal,
    thisWeekDailyPoints,
    thisWeekAttendancePoints,
    weeklyPercent,
    overallPercent,
    thisWeekAdjustments: weekAdjustments.length,
  };
}
```

---

**READ-ONLY AUDIT COMPLETE — NO FILES MODIFIED**
