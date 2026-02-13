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
          text: "Deactivate User",
          onPress: async () => {
            try {
              const payload = { userId: String(userId) };
              console.log("Deactivate user payload:", payload);
              console.log("Payload types:", { userId: typeof payload.userId });
              await deactivateUserMutation.mutateAsync(payload);
              await refetch();
              Alert.alert("Success", `${userName} deactivated`);
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to deactivate user");
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

          {/* Admin Command Center Link */}
          <TouchableOpacity
            onPress={() => router.push("/admin-console")}
            className="bg-primary/10 py-4 px-4 rounded-xl flex-row items-center justify-between"
            style={{ borderWidth: 1, borderColor: colors.primary }}
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">⚡</Text>
              <View>
                <Text className="text-base font-semibold text-foreground">Admin Command Center</Text>
                <Text className="text-xs text-muted">Centralized admin hub</Text>
              </View>
            </View>
            <Text className="text-xl text-muted">›</Text>
          </TouchableOpacity>

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
