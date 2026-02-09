import { ScrollView, Text, View, TouchableOpacity, RefreshControl } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function GroupManagementScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const { data: users, refetch: refetchUsers } = trpc.admin.getAllUsers.useQuery();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchUsers();
    setRefreshing(false);
  };

  const totalMembers = users?.length || 0;
  const leaders = users?.filter((u) => u.role === "leader").length || 0;
  const admins = users?.filter((u) => u.role === "admin").length || 0;
  const regularUsers = users?.filter((u) => u.role === "user").length || 0;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-bold text-foreground mb-2">Group Management</Text>
            <Text className="text-base text-muted">Manage group settings and statistics</Text>
          </View>
        </View>

        {/* Group Statistics */}
        <View className="bg-surface rounded-xl p-5 mb-6" style={{ borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-lg font-bold text-foreground mb-4">📊 Group Statistics</Text>

          <View className="flex-row flex-wrap gap-4">
            <View className="flex-1 min-w-[45%] bg-background rounded-lg p-4">
              <Text className="text-xs text-muted mb-1">Total Members</Text>
              <Text className="text-3xl font-bold text-foreground">{totalMembers}</Text>
            </View>

            <View className="flex-1 min-w-[45%] bg-background rounded-lg p-4">
              <Text className="text-xs text-muted mb-1">Regular Users</Text>
              <Text className="text-3xl font-bold" style={{ color: "#10B981" }}>
                {regularUsers}
              </Text>
            </View>

            <View className="flex-1 min-w-[45%] bg-background rounded-lg p-4">
              <Text className="text-xs text-muted mb-1">Leaders</Text>
              <Text className="text-3xl font-bold" style={{ color: "#F59E0B" }}>
                {leaders}
              </Text>
            </View>

            <View className="flex-1 min-w-[45%] bg-background rounded-lg p-4">
              <Text className="text-xs text-muted mb-1">Admins</Text>
              <Text className="text-3xl font-bold" style={{ color: "#EF4444" }}>
                {admins}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-surface rounded-xl p-5 mb-6" style={{ borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-lg font-bold text-foreground mb-4">⚡ Quick Actions</Text>

          <TouchableOpacity
            onPress={() => router.push("/admin-calendar")}
            className="bg-primary/10 py-4 px-4 rounded-lg mb-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">📅</Text>
              <View>
                <Text className="text-base font-semibold text-foreground">Admin Calendar</Text>
                <Text className="text-xs text-muted">View and edit check-ins & attendance</Text>
              </View>
            </View>
            <Text className="text-xl text-muted">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/challenges")}
            className="bg-primary/10 py-4 px-4 rounded-lg mb-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">🏆</Text>
              <View>
                <Text className="text-base font-semibold text-foreground">Manage Challenges</Text>
                <Text className="text-xs text-muted">Create and manage group challenges</Text>
              </View>
            </View>
            <Text className="text-xl text-muted">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/analytics")}
            className="bg-primary/10 py-4 px-4 rounded-lg mb-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">📈</Text>
              <View>
                <Text className="text-base font-semibold text-foreground">View Analytics</Text>
                <Text className="text-xs text-muted">Leader dashboard and metrics</Text>
              </View>
            </View>
            <Text className="text-xl text-muted">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/admin-users")}
            className="bg-primary/10 py-4 px-4 rounded-lg flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">👥</Text>
              <View>
                <Text className="text-base font-semibold text-foreground">User Management</Text>
                <Text className="text-xs text-muted">Manage users and assign roles</Text>
              </View>
            </View>
            <Text className="text-xl text-muted">›</Text>
          </TouchableOpacity>
        </View>

        {/* Group Info */}
        <View className="bg-surface rounded-xl p-5" style={{ borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-lg font-bold text-foreground mb-4">ℹ️ Group Information</Text>

          <View className="gap-3">
            <View>
              <Text className="text-xs text-muted mb-1">Group Name</Text>
              <Text className="text-base font-semibold text-foreground">Fitness2Witness</Text>
            </View>

            <View>
              <Text className="text-xs text-muted mb-1">Challenge Duration</Text>
              <Text className="text-base font-semibold text-foreground">12 Weeks</Text>
            </View>

            <View>
              <Text className="text-xs text-muted mb-1">Weekly Points Available</Text>
              <Text className="text-base font-semibold text-foreground">38 points</Text>
              <Text className="text-xs text-muted mt-1">
                (7 days × 4 categories) + (1 Wednesday attendance × 10 points)
              </Text>
            </View>

            <View>
              <Text className="text-xs text-muted mb-1">Total Challenge Points</Text>
              <Text className="text-base font-semibold text-foreground">456 points</Text>
              <Text className="text-xs text-muted mt-1">38 points/week × 12 weeks</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
