# READ-ONLY AUDIT REPORT - ADMIN PROCEDURES

---

## File: `/home/ubuntu/fitness2witness/server/routers.ts`

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

**READ-ONLY AUDIT COMPLETE — NO FILES MODIFIED**
