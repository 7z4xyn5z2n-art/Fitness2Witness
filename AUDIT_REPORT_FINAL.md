# READ-ONLY AUDIT REPORT - FINAL

---

## SECTION 1 — ADMIN POINT ADJUSTMENT UI

### Files Found

**File:** `/home/ubuntu/fitness2witness/app/admin-users.tsx`

**FULL CONTENTS (344 lines):**

```typescript
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, Alert, Modal, TextInput, Platform } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type UserRole = "user" | "leader" | "admin";

export default function AdminUsersScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [bonusModalVisible, setBonusModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [bonusPoints, setBonusPoints] = useState<string>("");
  const [bonusReason, setBonusReason] = useState<string>("");
  const [bonusCategory, setBonusCategory] = useState<string>("");
  
  const { data: users, refetch } = trpc.admin.getAllUsers.useQuery();
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation();
  const removeUserMutation = trpc.admin.removeUser.useMutation();
  const removeFromGroupMutation = trpc.admin.removeUserFromGroup.useMutation();
  const deactivateUserMutation = trpc.admin.deactivateUser.useMutation();
  const createBonusPointsMutation = trpc.admin.createPointAdjustment.useMutation();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleRoleChange = async (userId: string, currentRole: UserRole) => {
    const roles: UserRole[] = ["user", "leader", "admin"];
    const currentIndex = roles.indexOf(currentRole);
    const nextRole = roles[(currentIndex + 1) % roles.length];

    try {
      await updateRoleMutation.mutateAsync({ userId, role: nextRole });
      await refetch();
    } catch (error) {
      Alert.alert("Error", "Failed to update user role");
    }
  };

  const handleRemoveUser = (userId: string, userName: string) => {
    Alert.alert(
      "Remove User",
      `Choose action for ${userName}:`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove from Group",
          onPress: async () => {
            try {
              const payload = { userId: String(userId) };
              console.log("Remove from group payload:", payload);
              console.log("Payload types:", { userId: typeof payload.userId });
              await removeFromGroupMutation.mutateAsync(payload);
              await refetch();
              Alert.alert("Success", `${userName} removed from group`);
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to remove user from group");
            }
          },
        },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            try {
              const payload = { userId: String(userId) };
              console.log("Delete user payload:", payload);
              console.log("Payload types:", { userId: typeof payload.userId });
              await removeUserMutation.mutateAsync(payload);
              await refetch();
              Alert.alert("Success", `${userName} deleted permanently`);
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete user");
            }
          },
        },
      ]
    );
  };

  const handleOpenBonusModal = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setBonusPoints("");
    setBonusReason("");
    setBonusCategory("");
    setBonusModalVisible(true);
  };

  const handleSubmitBonusPoints = async () => {
    if (!selectedUserId || !bonusPoints || !bonusReason) {
      Alert.alert("Error", "Please fill in points and reason");
      return;
    }

    const pointsNum = parseInt(bonusPoints);
    if (isNaN(pointsNum)) {
      Alert.alert("Error", "Points must be a valid number");
      return;
    }

    try {
      const payload = {
        userId: selectedUserId,
        pointsDelta: pointsNum,
        reason: bonusReason,
        category: bonusCategory || undefined,
      };
      console.log("Bonus points payload:", payload);
      console.log("Payload types:", {
        userId: typeof payload.userId,
        pointsDelta: typeof payload.pointsDelta,
        reason: typeof payload.reason,
        category: typeof payload.category,
      });
      
      await createBonusPointsMutation.mutateAsync(payload);
      await refetch();
      setBonusModalVisible(false);
      Alert.alert("Success", `${pointsNum > 0 ? 'Awarded' : 'Deducted'} ${Math.abs(pointsNum)} points ${pointsNum > 0 ? 'to' : 'from'} ${selectedUserName}`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to award bonus points");
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "#EF4444"; // red
      case "leader":
        return "#F59E0B"; // orange
      default:
        return "#6B7280"; // gray
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View className="gap-6">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-primary text-base">‹ Back</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-foreground mt-2">
                User Management
              </Text>
              <Text className="text-base text-muted mt-1">
                {users?.length || 0} users in group
              </Text>
            </View>
          </View>

          {/* User List */}
          <View className="gap-3">
            {users?.map((user) => (
              <View
                key={user.id}
                className="bg-surface rounded-2xl p-4 border border-border"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground">
                      {user.name}
                    </Text>
                    <Text className="text-sm text-muted">{user.phoneNumber ? `(${user.phoneNumber.slice(0,3)}) ${user.phoneNumber.slice(3,6)}-${user.phoneNumber.slice(6)}` : 'No phone'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRoleChange(String(user.id), user.role as UserRole)}
                    className="px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: getRoleBadgeColor(user.role as UserRole) + "20" }}
                  >
                    <Text
                      className="text-xs font-semibold uppercase"
                      style={{ color: getRoleBadgeColor(user.role as UserRole) }}
                    >
                      {user.role}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* User Stats */}
                <View className="flex-row gap-4 mb-3">
                  <View className="flex-1">
                    <Text className="text-xs text-muted">Total Points</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {user.totalPoints || 0}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted">This Week</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {user.weekPoints || 0}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted">Check-ins</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {user.checkInCount || 0}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row gap-2 mb-2">
                  <TouchableOpacity
                    onPress={() => handleRoleChange(String(user.id), user.role as UserRole)}
                    className="flex-1 bg-primary/10 py-2 rounded-lg"
                  >
                    <Text className="text-center text-sm font-semibold" style={{ color: colors.primary }}>
                      Change Role
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveUser(String(user.id), user.name || "Unknown")}
                    className="flex-1 bg-error/10 py-2 rounded-lg"
                  >
                    <Text className="text-center text-sm font-semibold text-error">
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => handleOpenBonusModal(user.id, user.name || "Unknown")}
                  className="bg-success/10 py-2 rounded-lg"
                >
                  <Text className="text-center text-sm font-semibold text-success">
                    ⭐ Award Bonus Points
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {users?.length === 0 && (
            <View className="py-12 items-center">
              <Text className="text-muted text-center">No users found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bonus Points Modal */}
      <Modal
        visible={bonusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBonusModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-background rounded-2xl p-6 mx-6 w-full max-w-md border border-border">
            <Text className="text-2xl font-bold text-foreground mb-4">
              Award Bonus Points
            </Text>
            <Text className="text-base text-muted mb-4">
              User: {selectedUserName}
            </Text>

            {/* Points Input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Points (use negative for deductions)
              </Text>
              <TextInput
                value={bonusPoints}
                onChangeText={setBonusPoints}
                placeholder="e.g., 10 or -5"
                keyboardType="numeric"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Category Input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Category (optional)
              </Text>
              <TextInput
                value={bonusCategory}
                onChangeText={setBonusCategory}
                placeholder="e.g., Scripture Memory, Workout Excellence"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Reason Input */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Reason (required)
              </Text>
              <TextInput
                value={bonusReason}
                onChangeText={setBonusReason}
                placeholder="Why are you awarding these points?"
                multiline
                numberOfLines={3}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor="#9CA3AF"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setBonusModalVisible(false)}
                className="flex-1 bg-surface py-3 rounded-lg border border-border"
              >
                <Text className="text-center font-semibold text-foreground">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitBonusPoints}
                className="flex-1 bg-success py-3 rounded-lg"
                disabled={createBonusPointsMutation.isPending}
              >
                <Text className="text-center font-semibold text-background">
                  {createBonusPointsMutation.isPending ? "Submitting..." : "Submit"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
```

### trpc.admin.getAuditLog Usage

**NO FRONTEND UI FOUND FOR admin.getAuditLog**

---

## SECTION 2 — ADMIN PROCEDURE CODE BLOCKS

### File: `/home/ubuntu/fitness2witness/server/routers.ts`

**admin.createPointAdjustment (lines 831-868):**

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

**admin.getAuditLog (lines 870-890):**

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

**admin.getAllUsers (lines 613-636):**

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

**community.getPosts (lines 378-410):**

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

## SECTION 3 — LEADERBOARD UI + API

### Leaderboard UI

**File:** `/home/ubuntu/fitness2witness/app/(tabs)/leaderboard.tsx`

**FULL CONTENTS (153 lines):**

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

### tRPC Procedure Used

**Line 11:** `trpc.metrics.getGroupLeaderboard.useQuery({ period })`

**Procedure Definition (server/routers.ts lines 184-212):**

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

### DB Function Used

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

## SECTION 4 — AUTH TOKEN WRITER

### localStorage.setItem("auth_token")

**File:** `/home/ubuntu/fitness2witness/app/auth.tsx`

**Occurrence 1 (lines 56-64):**

```typescript
// Store auth token FIRST
if (result.token) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("auth_token", result.token);
    }
  } else {
    await SecureStore.setItemAsync("auth_token", result.token);
  }
}
```

**Occurrence 2 (lines 76-85):**

```typescript
// Store auth token FIRST
if (result.token) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("auth_token", result.token);
    }
  } else {
    await SecureStore.setItemAsync("auth_token", result.token);
  }
}
```

### SecureStore.setItemAsync("auth_token")

**File:** `/home/ubuntu/fitness2witness/app/auth.tsx`

**Same occurrences as above (lines 62 and 83)**

### removeItem("auth_token")

**File:** `/home/ubuntu/fitness2witness/hooks/use-auth.ts`

**Occurrence 1 (lines 18-24) - Error handling:**

```typescript
// Clear invalid token
if (Platform.OS !== "web") {
  SecureStore.deleteItemAsync("auth_token").catch(console.error);
} else {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("auth_token");
  }
}
```

**Occurrence 2 (lines 40-65) - Logout function:**

```typescript
// Clear auth token from secure storage
if (Platform.OS !== "web") {
  await SecureStore.deleteItemAsync("auth_token");
  console.log("token removed from SecureStore");
} else {
  // For web, clear from localStorage
  if (typeof window !== "undefined") {
    console.log("removing token from localStorage...");
    window.localStorage.removeItem("auth_token");
    
    // Double-check token removal
    const tokenAfterRemoval = window.localStorage.getItem("auth_token");
    console.log("token after logout:", tokenAfterRemoval);
    if (tokenAfterRemoval !== null) {
      console.warn("Token still exists after removal, trying again...");
      window.localStorage.removeItem("auth_token");
      console.log("token after second removal:", window.localStorage.getItem("auth_token"));
    }
    
    // Also clear cookies for backward compatibility
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }
}
```

**Occurrence 3 (lines 78-85) - Error path:**

```typescript
// Even if backend call fails, still clear local token
if (Platform.OS !== "web") {
  await SecureStore.deleteItemAsync("auth_token");
} else {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("auth_token");
    console.log("token after logout (error path):", window.localStorage.getItem("auth_token"));
  }
}
```

### Logout Logic

**File:** `/home/ubuntu/fitness2witness/hooks/use-auth.ts`

**FULL logout function (lines 31-88):**

```typescript
const logout = async () => {
  console.log("logout clicked");
  console.log("token before logout:", Platform.OS === "web" && typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : "(native)");
  
  try {
    // Call backend logout endpoint via tRPC
    await logoutMutation.mutateAsync();

    // Clear auth token from secure storage
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync("auth_token");
      console.log("token removed from SecureStore");
    } else {
      // For web, clear from localStorage
      if (typeof window !== "undefined") {
        console.log("removing token from localStorage...");
        window.localStorage.removeItem("auth_token");
        
        // Double-check token removal
        const tokenAfterRemoval = window.localStorage.getItem("auth_token");
        console.log("token after logout:", tokenAfterRemoval);
        if (tokenAfterRemoval !== null) {
          console.warn("Token still exists after removal, trying again...");
          window.localStorage.removeItem("auth_token");
          console.log("token after second removal:", window.localStorage.getItem("auth_token"));
        }
        
        // Also clear cookies for backward compatibility
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
    }

    // Clear all tRPC/react-query cache
    console.log("clearing tRPC cache...");
    await utils.invalidate();

    console.log("logout successful, navigating to /auth");
    
    // Redirect to auth screen
    router.replace("/auth");
  } catch (error) {
    console.error("Logout error:", error);
    // Even if backend call fails, still clear local token
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync("auth_token");
    } else {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_token");
        console.log("token after logout (error path):", window.localStorage.getItem("auth_token"));
      }
    }
    router.replace("/auth");
  }
};
```

**File:** `/home/ubuntu/fitness2witness/app/(tabs)/profile.tsx`

**Logout button handler (lines 20-37):**

```typescript
const handleLogout = () => {
  Alert.alert("Logout", "Are you sure you want to logout?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Logout",
      style: "destructive",
      onPress: async () => {
        try {
          await logout();
          Alert.alert("Success", "You have been logged out successfully");
        } catch (error) {
          console.error("Logout failed:", error);
          Alert.alert("Error", "Failed to logout. Please try again.");
        }
      },
    },
  ]);
};
```

---

**READ-ONLY AUDIT COMPLETE — NO FILES MODIFIED**
