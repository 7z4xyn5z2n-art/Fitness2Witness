# READ-ONLY AUDIT REPORT - addUserAttendance

---

## File: `/home/ubuntu/fitness2witness/server/routers.ts`

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

READ-ONLY AUDIT COMPLETE — NO FILES MODIFIED
