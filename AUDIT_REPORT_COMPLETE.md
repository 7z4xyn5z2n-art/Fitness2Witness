# READ-ONLY AUDIT REPORT - COMPLETE

---

## SECTION 1 — SERVER ROUTER PROCEDURES

### File: `/home/ubuntu/fitness2witness/server/routers.ts`

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

### community.getPosts (lines 378-410)

**FULL CODE BLOCK:**

```typescript
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
```

---

## SECTION 2 — ADMIN NAVIGATION/LAYOUT FILES

### File: `/home/ubuntu/fitness2witness/app/(tabs)/admin.tsx`

**FULL CONTENTS (84 lines):**

```typescript
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function AdminScreen() {
  const colors = useColors();

  const adminSections = [
    {
      title: "User Management",
      description: "Manage users, assign roles, and view activity",
      route: "/admin-users",
      icon: "👥",
    },
    {
      title: "Group Settings",
      description: "Edit group information and settings",
      route: "/admin-group",
      icon: "⚙️",
    },
    {
      title: "Content Moderation",
      description: "Review and moderate community posts and comments",
      route: "/admin-moderation",
      icon: "🛡️",
    },
    {
      title: "Calendar & Logs",
      description: "View and edit user check-ins and attendance",
      route: "/admin-calendar",
      icon: "📅",
    },
  ];

  return (
    <ScreenContainer className="p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">
              Admin Panel
            </Text>
            <Text className="text-base text-muted">
              Manage your group, users, and content
            </Text>
          </View>

          {/* Admin Sections */}
          <View className="gap-4">
            {adminSections.map((section, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(section.route as any)}
                className="bg-surface rounded-2xl p-5 border border-border"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                }}
              >
                <View className="flex-row items-center gap-4">
                  <Text className="text-4xl">{section.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground mb-1">
                      {section.title}
                    </Text>
                    <Text className="text-sm text-muted">
                      {section.description}
                    </Text>
                  </View>
                  <Text className="text-2xl text-muted">›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
```

---

### Additional Admin Navigation References

**File: `/home/ubuntu/fitness2witness/app/admin-group.tsx`**

Lines 81-82:
```typescript
onPress={() => router.push("/admin-calendar")}
```

Lines 123-124:
```typescript
onPress={() => router.push("/admin-users")}
```

**File: `/home/ubuntu/fitness2witness/app/(tabs)/analytics.tsx`**

Lines 46-47:
```typescript
onPress={() => router.push("/admin-calendar")}
```

---

**READ-ONLY AUDIT COMPLETE — NO FILES MODIFIED**
