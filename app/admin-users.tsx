import { ScrollView, Text, View, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type UserRole = "user" | "leader" | "admin";

export default function AdminUsersScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: users, refetch } = trpc.admin.getAllUsers.useQuery();
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation();
  const removeUserMutation = trpc.admin.removeUser.useMutation();
  const removeFromGroupMutation = trpc.admin.removeUserFromGroup.useMutation();
  const deactivateUserMutation = trpc.admin.deactivateUser.useMutation();

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
              await removeFromGroupMutation.mutateAsync({ userId });
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
              await removeUserMutation.mutateAsync({ userId });
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
                <View className="flex-row gap-2">
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
    </ScreenContainer>
  );
}
