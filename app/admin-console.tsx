import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, RefreshControl, Platform, Modal } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function AdminConsoleScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  
  // User selection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Date selection
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Check-in state
  const [nutritionDone, setNutritionDone] = useState(false);
  const [hydrationDone, setHydrationDone] = useState(false);
  const [movementDone, setMovementDone] = useState(false);
  const [scriptureDone, setScriptureDone] = useState(false);
  const [notes, setNotes] = useState("");
  
  // Attendance state
  const [attended, setAttended] = useState(false);
  
  // Points adjustment state
  const [pointsDelta, setPointsDelta] = useState("");
  const [pointsReason, setPointsReason] = useState("");
  const [pointsCategory, setPointsCategory] = useState("");
  
  // Audit filters
  const [filterSelectedUserOnly, setFilterSelectedUserOnly] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  
  // Group filter for posts
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined);
  
  // Post Detail Modal state
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  
  // Bulk Select state
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<number>>(new Set());
  
  // Security Settings state
  const [idleTimeoutDuration, setIdleTimeoutDuration] = useState<number>(180000); // 3 minutes default
  
  // Manage Participant modal state
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageAction, setManageAction] = useState<'removeFromGroup' | 'deactivate' | 'delete' | null>(null);
  
  // Queries
  const { data: users, refetch: refetchUsers } = trpc.admin.getAllUsers.useQuery();
  const { data: groups } = trpc.admin.getAllGroups.useQuery();
  const { data: posts, refetch: refetchPosts } = trpc.admin.getPosts.useQuery(
    selectedGroupId ? { groupId: selectedGroupId } : undefined
  );
  const { data: auditLog, refetch: refetchAudit } = trpc.admin.getAuditLog.useQuery();
  
  // Mutations
  const utils = trpc.useUtils();
  const upsertCheckInMutation = trpc.admin.upsertCheckInForUserDate.useMutation();
  const addAttendanceMutation = trpc.admin.addUserAttendance.useMutation();
  const createPointAdjustmentMutation = trpc.admin.createPointAdjustment.useMutation();
  const deletePostMutation = trpc.community.deletePost.useMutation({
    onSuccess: () => {
      // Invalidate with correct query input based on current filter
      if (selectedGroupId) {
        utils.admin.getPosts.invalidate({ groupId: selectedGroupId });
      } else {
        utils.admin.getPosts.invalidate();
      }
    },
  });
  const removeUserMutation = trpc.admin.removeUser.useMutation();
  const removeFromGroupMutation = trpc.admin.removeUserFromGroup.useMutation();
  const deactivateUserMutation = trpc.admin.deactivateUser.useMutation();
  
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchUsers(), refetchPosts(), refetchAudit()]);
    setRefreshing(false);
  };
  
  // Filter users by search query
  const filteredUsers = users?.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  // Filter audit log
  const filteredAudit = auditLog?.filter((entry) => {
    if (filterSelectedUserOnly && selectedUser && entry.userId !== selectedUser.id) {
      return false;
    }
    if (filterCategory && !entry.category?.toLowerCase().includes(filterCategory.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];
  
  const handleSaveCheckIn = async () => {
    if (!selectedUser) {
      Alert.alert("Error", "Please select a user first");
      return;
    }
    
    try {
      const payload = {
        userId: String(selectedUser.id),
        day: selectedDate.toISOString(),
        nutritionDone,
        hydrationDone,
        movementDone,
        scriptureDone,
        notes,
      };
      console.log("Save check-in payload:", payload);
      console.log("Payload types:", {
        userId: typeof payload.userId,
        day: typeof payload.day,
        nutritionDone: typeof payload.nutritionDone,
        hydrationDone: typeof payload.hydrationDone,
        movementDone: typeof payload.movementDone,
        scriptureDone: typeof payload.scriptureDone,
        notes: typeof payload.notes,
      });
      
      await upsertCheckInMutation.mutateAsync(payload);
      Alert.alert("Success", "Check-in saved successfully");
      await refetchUsers();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save check-in");
    }
  };
  
  const handleAttendance = async () => {
    if (!selectedUser) {
      Alert.alert("Error", "Please select a user first");
      return;
    }
    
    try {
      const payload = {
        userId: String(selectedUser.id),
        day: selectedDate.toISOString(),
        attended,
      };
      console.log("Add attendance payload:", payload);
      console.log("Payload types:", {
        userId: typeof payload.userId,
        date: typeof payload.day,
        attended: typeof payload.attended,
      });
      
      await addAttendanceMutation.mutateAsync(payload);
      Alert.alert("Success", `Attendance ${attended ? 'marked' : 'unmarked'} successfully`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update attendance");
    }
  };
  
  const handlePointsAdjustment = async () => {
    if (!selectedUser) {
      Alert.alert("Error", "Please select a user first");
      return;
    }
    if (!pointsDelta || !pointsReason) {
      Alert.alert("Error", "Please enter points and reason");
      return;
    }
    
    const pointsNum = parseInt(pointsDelta);
    if (isNaN(pointsNum)) {
      Alert.alert("Error", "Points must be a valid number");
      return;
    }
    
    try {
      const payload = {
        userId: selectedUser.id,
        pointsDelta: pointsNum,
        reason: pointsReason,
        category: pointsCategory || undefined,
      };
      console.log("Points adjustment payload:", payload);
      console.log("Payload types:", {
        userId: typeof payload.userId,
        pointsDelta: typeof payload.pointsDelta,
        reason: typeof payload.reason,
        category: typeof payload.category,
      });
      
      await createPointAdjustmentMutation.mutateAsync(payload);
      Alert.alert("Success", `${pointsNum > 0 ? 'Added' : 'Deducted'} ${Math.abs(pointsNum)} points`);
      setPointsDelta("");
      setPointsReason("");
      setPointsCategory("");
      await Promise.all([refetchUsers(), refetchAudit()]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to adjust points");
    }
  };
  
  const handleQuickBonus = (amount: number) => {
    setPointsDelta(String(amount));
    setPointsCategory("bonus");
    Alert.prompt(
      "Quick Bonus",
      `Award ${amount} bonus points. Enter reason:`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Award",
          onPress: async (reason?: string) => {
            if (!reason) {
              Alert.alert("Error", "Reason is required");
              return;
            }
            setPointsReason(reason);
            // Trigger the adjustment
            if (!selectedUser) {
              Alert.alert("Error", "Please select a user first");
              return;
            }
            try {
              await createPointAdjustmentMutation.mutateAsync({
                userId: selectedUser.id,
                pointsDelta: amount,
                reason,
                category: "bonus",
              });
              Alert.alert("Success", `Awarded ${amount} bonus points`);
              setPointsDelta("");
              setPointsReason("");
              setPointsCategory("");
              await Promise.all([refetchUsers(), refetchAudit()]);
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to award bonus");
            }
          },
        },
      ],
      "plain-text"
    );
  };
  
  const handleDeletePost = (postId: number, postText: string) => {
    Alert.alert(
      "Delete Post",
      `Are you sure you want to delete this post?\n\n"${postText?.substring(0, 100)}..."`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const payload = { postId: Number(postId) };
              console.log("Delete post payload:", payload);
              console.log("Payload types:", { postId: typeof payload.postId });
              await deletePostMutation.mutateAsync(payload);
              Alert.alert("Success", "Post deleted successfully");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete post");
            }
          },
        },
      ]
    );
  };
  
  const handleViewPost = (post: any) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };
  
  const handleDeleteFromModal = async () => {
    if (!selectedPost) return;
    
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePostMutation.mutateAsync({ postId: Number(selectedPost.id) });
              setShowPostModal(false);
              setSelectedPost(null);
              Alert.alert("Success", "Post deleted successfully");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete post");
            }
          },
        },
      ]
    );
  };
  
  const togglePostSelection = (postId: number) => {
    const newSet = new Set(selectedPostIds);
    if (newSet.has(postId)) {
      newSet.delete(postId);
    } else {
      newSet.add(postId);
    }
    setSelectedPostIds(newSet);
  };
  
  const handleSelectAll = () => {
    if (!posts) return;
    const allIds = new Set(posts.map(p => p.id));
    setSelectedPostIds(allIds);
  };
  
  const handleClearSelection = () => {
    setSelectedPostIds(new Set());
  };
  
  const handleBulkDelete = async () => {
    if (selectedPostIds.size === 0) {
      Alert.alert("Error", "No posts selected");
      return;
    }
    
    Alert.alert(
      "Bulk Delete",
      `Are you sure you want to delete ${selectedPostIds.size} post(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            let deletedCount = 0;
            let failedCount = 0;
            const failedIds: number[] = [];
            
            for (const postId of Array.from(selectedPostIds)) {
              try {
                await deletePostMutation.mutateAsync({ postId: Number(postId) });
                deletedCount++;
              } catch (error) {
                failedCount++;
                failedIds.push(postId);
                console.error(`Failed to delete post ${postId}:`, error);
              }
            }
            
            // Invalidate query after all deletions
            if (selectedGroupId) {
              await utils.admin.getPosts.invalidate({ groupId: selectedGroupId });
            } else {
              await utils.admin.getPosts.invalidate();
            }
            
            // Clear selection
            setSelectedPostIds(new Set());
            setBulkSelectMode(false);
            
            // Show summary
            if (failedCount === 0) {
              Alert.alert("Success", `Deleted ${deletedCount} post(s) successfully`);
            } else {
              Alert.alert(
                "Partial Success",
                `Deleted: ${deletedCount}\nFailed: ${failedCount}\n\nFailed IDs: ${failedIds.join(", ")}`
              );
            }
          },
        },
      ]
    );
  };
  
  const handleManageParticipant = () => {
    if (!selectedUser) {
      Alert.alert("Error", "Please select a user first");
      return;
    }
    setShowManageModal(true);
  };
  
  const handleRemoveFromGroup = async () => {
    if (!selectedUser) return;
    
    if (manageAction !== 'removeFromGroup') {
      setManageAction('removeFromGroup');
      return;
    }
    
    try {
      const payload = { userId: String(selectedUser.id) };
      console.log("Remove from group payload:", payload);
      console.log("Payload types:", { userId: typeof payload.userId });
      
      await removeFromGroupMutation.mutateAsync(payload);
      
      setShowManageModal(false);
      setManageAction(null);
      Alert.alert("Success", `${selectedUser.name} removed from group`);
      
      await utils.admin.getAllUsers.invalidate();
      await refetchUsers();
    } catch (error: any) {
      console.error("Remove from group error:", error);
      Alert.alert("Error", error.message || "Failed to remove user from group");
    }
  };
  
  const handleDeactivateUser = async () => {
    if (!selectedUser) return;
    
    if (manageAction !== 'deactivate') {
      setManageAction('deactivate');
      return;
    }
    
    try {
      const payload = { userId: String(selectedUser.id) };
      console.log("Deactivate user payload:", payload);
      console.log("Payload types:", { userId: typeof payload.userId });
      
      await deactivateUserMutation.mutateAsync(payload);
      
      setShowManageModal(false);
      setManageAction(null);
      Alert.alert("Success", `${selectedUser.name} deactivated`);
      
      await utils.admin.getAllUsers.invalidate();
      await refetchUsers();
    } catch (error: any) {
      console.error("Deactivate user error:", error);
      Alert.alert("Error", error.message || "Failed to deactivate user");
    }
  };
  
  const handleDeletePermanently = async () => {
    if (!selectedUser) return;
    
    if (manageAction !== 'delete') {
      setManageAction('delete');
      return;
    }
    
    try {
      const payload = { userId: String(selectedUser.id) };
      console.log("Delete user permanently payload:", payload);
      console.log("Payload types:", { userId: typeof payload.userId });
      
      await removeUserMutation.mutateAsync(payload);
      
      setShowManageModal(false);
      setManageAction(null);
      setSelectedUser(null);
      Alert.alert("Success", `${selectedUser.name} deleted permanently`);
      
      await utils.admin.getAllUsers.invalidate();
      await refetchUsers();
    } catch (error: any) {
      console.error("Delete user error:", error);
      Alert.alert("Error", error.message || "Failed to delete user");
    }
  };
  
  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-bold text-foreground mb-2">Admin Command Center</Text>
            <Text className="text-base text-muted">Centralized admin hub</Text>
          </View>
        </View>
        
        {/* Security Settings */}
        <View className="bg-surface rounded-xl p-4 mb-4" style={{ borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-lg font-bold text-foreground mb-3">🔒 Security Settings</Text>
          
          <Text className="text-sm text-muted mb-2">Idle Timeout Duration</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={async () => {
                const newTimeout = 180000; // 3 minutes
                setIdleTimeoutDuration(newTimeout);
                const { setIdleTimeoutMs } = await import("@/lib/idle");
                setIdleTimeoutMs(newTimeout);
                try {
                  if (Platform.OS === "web") {
                    localStorage.setItem("idle_timeout_ms", String(newTimeout));
                  } else {
                    await SecureStore.setItemAsync("idle_timeout_ms", String(newTimeout));
                  }
                  Alert.alert("Success", "Idle timeout set to 3 minutes");
                } catch (error) {
                  console.error("Error saving timeout:", error);
                  Alert.alert("Error", "Failed to save timeout setting");
                }
              }}
              className={`flex-1 py-3 rounded-lg ${
                idleTimeoutDuration === 180000 ? 'bg-primary' : 'bg-background'
              }`}
              style={{ borderWidth: 1, borderColor: idleTimeoutDuration === 180000 ? colors.primary : colors.border }}
            >
              <Text className={`text-center font-semibold ${
                idleTimeoutDuration === 180000 ? 'text-background' : 'text-foreground'
              }`}>3 min</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={async () => {
                const newTimeout = 300000; // 5 minutes
                setIdleTimeoutDuration(newTimeout);
                const { setIdleTimeoutMs } = await import("@/lib/idle");
                setIdleTimeoutMs(newTimeout);
                try {
                  if (Platform.OS === "web") {
                    localStorage.setItem("idle_timeout_ms", String(newTimeout));
                  } else {
                    await SecureStore.setItemAsync("idle_timeout_ms", String(newTimeout));
                  }
                  Alert.alert("Success", "Idle timeout set to 5 minutes");
                } catch (error) {
                  console.error("Error saving timeout:", error);
                  Alert.alert("Error", "Failed to save timeout setting");
                }
              }}
              className={`flex-1 py-3 rounded-lg ${
                idleTimeoutDuration === 300000 ? 'bg-primary' : 'bg-background'
              }`}
              style={{ borderWidth: 1, borderColor: idleTimeoutDuration === 300000 ? colors.primary : colors.border }}
            >
              <Text className={`text-center font-semibold ${
                idleTimeoutDuration === 300000 ? 'text-background' : 'text-foreground'
              }`}>5 min</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={async () => {
                const newTimeout = 600000; // 10 minutes
                setIdleTimeoutDuration(newTimeout);
                const { setIdleTimeoutMs } = await import("@/lib/idle");
                setIdleTimeoutMs(newTimeout);
                try {
                  if (Platform.OS === "web") {
                    localStorage.setItem("idle_timeout_ms", String(newTimeout));
                  } else {
                    await SecureStore.setItemAsync("idle_timeout_ms", String(newTimeout));
                  }
                  Alert.alert("Success", "Idle timeout set to 10 minutes");
                } catch (error) {
                  console.error("Error saving timeout:", error);
                  Alert.alert("Error", "Failed to save timeout setting");
                }
              }}
              className={`flex-1 py-3 rounded-lg ${
                idleTimeoutDuration === 600000 ? 'bg-primary' : 'bg-background'
              }`}
              style={{ borderWidth: 1, borderColor: idleTimeoutDuration === 600000 ? colors.primary : colors.border }}
            >
              <Text className={`text-center font-semibold ${
                idleTimeoutDuration === 600000 ? 'text-background' : 'text-foreground'
              }`}>10 min</Text>
            </TouchableOpacity>
          </View>
          
          <Text className="text-xs text-muted mt-2">Users will be logged out after this period of inactivity</Text>
        </View>
        
        {/* User Selection */}
        <View className="bg-surface rounded-xl p-4 mb-4" style={{ borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-lg font-bold text-foreground mb-3">👤 Select User</Text>
          
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name..."
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-3"
            placeholderTextColor="#9CA3AF"
          />
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            {filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                onPress={() => setSelectedUser(user)}
                className={`mr-2 px-4 py-2 rounded-lg ${selectedUser?.id === user.id ? 'bg-primary' : 'bg-background'}`}
                style={{ borderWidth: 1, borderColor: colors.border }}
              >
                <Text className={`font-semibold ${selectedUser?.id === user.id ? 'text-background' : 'text-foreground'}`}>
                  {user.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {selectedUser && (
            <View className="bg-background rounded-lg p-3">
              <Text className="text-sm font-semibold text-foreground mb-1">{selectedUser.name}</Text>
              <Text className="text-xs text-muted mb-2">Total: {selectedUser.totalPoints} pts | Week: {selectedUser.weekPoints} pts | Check-ins: {selectedUser.checkInCount}</Text>
              <TouchableOpacity
                onPress={handleManageParticipant}
                className="bg-error/20 py-2 rounded-lg"
                style={{ borderWidth: 1, borderColor: colors.error }}
              >
                <Text className="text-center font-semibold text-error">Remove / Manage</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Date Selection */}
        <View className="bg-surface rounded-xl p-4 mb-4" style={{ borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-lg font-bold text-foreground mb-3">📅 Select Date</Text>
          
          {Platform.OS === "web" ? (
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                newDate.setHours(0, 0, 0, 0);
                setSelectedDate(newDate);
              }}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.foreground,
                fontSize: '16px',
                width: '100%',
              }}
            />
          ) : (
            <TouchableOpacity
              className="bg-background border border-border rounded-lg px-4 py-3"
              onPress={() => {
                Alert.alert("Date Selection", "Use the calendar icon to select a date");
              }}
            >
              <Text className="text-foreground">{selectedDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Daily Check-in Panel */}
        <View className="bg-surface rounded-xl p-4 mb-4" style={{ borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-lg font-bold text-foreground mb-3">✅ Daily Check-in</Text>
          
          <View className="gap-3 mb-3">
            <TouchableOpacity
              onPress={() => setNutritionDone(!nutritionDone)}
              className="flex-row items-center justify-between bg-background rounded-lg px-4 py-3"
            >
              <Text className="text-foreground">Nutrition</Text>
              <View className={`w-6 h-6 rounded ${nutritionDone ? 'bg-success' : 'bg-muted'}`} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setHydrationDone(!hydrationDone)}
              className="flex-row items-center justify-between bg-background rounded-lg px-4 py-3"
            >
              <Text className="text-foreground">Hydration</Text>
              <View className={`w-6 h-6 rounded ${hydrationDone ? 'bg-success' : 'bg-muted'}`} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setMovementDone(!movementDone)}
              className="flex-row items-center justify-between bg-background rounded-lg px-4 py-3"
            >
              <Text className="text-foreground">Movement</Text>
              <View className={`w-6 h-6 rounded ${movementDone ? 'bg-success' : 'bg-muted'}`} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setScriptureDone(!scriptureDone)}
              className="flex-row items-center justify-between bg-background rounded-lg px-4 py-3"
            >
              <Text className="text-foreground">Scripture</Text>
              <View className={`w-6 h-6 rounded ${scriptureDone ? 'bg-success' : 'bg-muted'}`} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (optional)"
            multiline
            numberOfLines={3}
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-3"
            placeholderTextColor="#9CA3AF"
            style={{ textAlignVertical: 'top' }}
          />
          
          <TouchableOpacity
            onPress={handleSaveCheckIn}
            className="bg-primary py-3 rounded-lg"
            disabled={upsertCheckInMutation.isPending}
          >
            <Text className="text-center font-semibold text-background">
              {upsertCheckInMutation.isPending ? "Saving..." : "Save Check-in"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Attendance Panel */}
        <View className="bg-surface rounded-xl p-4 mb-4" style={{ borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-lg font-bold text-foreground mb-3">📋 Weekly Attendance</Text>
          
          <TouchableOpacity
            onPress={() => setAttended(!attended)}
            className="flex-row items-center justify-between bg-background rounded-lg px-4 py-3 mb-3"
          >
            <Text className="text-foreground">Attended Life Group</Text>
            <View className={`w-6 h-6 rounded ${attended ? 'bg-success' : 'bg-muted'}`} />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleAttendance}
            className="bg-primary py-3 rounded-lg"
            disabled={addAttendanceMutation.isPending}
          >
            <Text className="text-center font-semibold text-background">
              {addAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Points / Bonus Panel */}
        <View className="bg-surface rounded-xl p-4 mb-4" style={{ borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-lg font-bold text-foreground mb-3">⭐ Points / Bonus</Text>
          
          {/* Quick Bonus Buttons */}
          <View className="flex-row gap-2 mb-3">
            <TouchableOpacity onPress={() => handleQuickBonus(5)} className="flex-1 bg-success/20 py-2 rounded-lg">
              <Text className="text-center font-semibold text-success">+5</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleQuickBonus(10)} className="flex-1 bg-success/20 py-2 rounded-lg">
              <Text className="text-center font-semibold text-success">+10</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleQuickBonus(25)} className="flex-1 bg-success/20 py-2 rounded-lg">
              <Text className="text-center font-semibold text-success">+25</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleQuickBonus(50)} className="flex-1 bg-success/20 py-2 rounded-lg">
              <Text className="text-center font-semibold text-success">+50</Text>
            </TouchableOpacity>
          </View>
          
          {/* Manual Adjustment */}
          <TextInput
            value={pointsDelta}
            onChangeText={setPointsDelta}
            placeholder="Points (e.g., 10 or -5)"
            keyboardType="numeric"
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-2"
            placeholderTextColor="#9CA3AF"
          />
          
          <TextInput
            value={pointsCategory}
            onChangeText={setPointsCategory}
            placeholder="Category (optional)"
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-2"
            placeholderTextColor="#9CA3AF"
          />
          
          <TextInput
            value={pointsReason}
            onChangeText={setPointsReason}
            placeholder="Reason (required)"
            multiline
            numberOfLines={2}
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-3"
            placeholderTextColor="#9CA3AF"
            style={{ textAlignVertical: 'top' }}
          />
          
          <TouchableOpacity
            onPress={handlePointsAdjustment}
            className="bg-primary py-3 rounded-lg"
            disabled={createPointAdjustmentMutation.isPending}
          >
            <Text className="text-center font-semibold text-background">
              {createPointAdjustmentMutation.isPending ? "Submitting..." : "Submit Adjustment"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Posts Moderation Panel */}
        <View className="bg-surface rounded-xl p-4 mb-4" style={{ borderWidth: 1, borderColor: colors.border }}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">🛡️ Posts Moderation</Text>
            <TouchableOpacity
              onPress={() => {
                setBulkSelectMode(!bulkSelectMode);
                if (bulkSelectMode) {
                  setSelectedPostIds(new Set());
                }
              }}
              className="px-3 py-2 rounded-lg bg-background"
              style={{ borderWidth: 1, borderColor: colors.border }}
            >
              <Text className="text-xs font-semibold text-foreground">
                {bulkSelectMode ? "Cancel" : "Select"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Group Filter */}
          <View className="mb-3">
            <Text className="text-xs text-muted mb-2">Filter by Group</Text>
            <View className="flex-row flex-wrap gap-2">
              <TouchableOpacity
                onPress={() => setSelectedGroupId(undefined)}
                className={`px-3 py-2 rounded-lg ${
                  selectedGroupId === undefined ? 'bg-primary' : 'bg-background'
                }`}
                style={{ borderWidth: 1, borderColor: selectedGroupId === undefined ? colors.primary : colors.border }}
              >
                <Text className={`text-xs font-semibold ${
                  selectedGroupId === undefined ? 'text-background' : 'text-foreground'
                }`}>All Groups</Text>
              </TouchableOpacity>
              
              {groups?.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => setSelectedGroupId(group.id)}
                  className={`px-3 py-2 rounded-lg ${
                    selectedGroupId === group.id ? 'bg-primary' : 'bg-background'
                  }`}
                  style={{ borderWidth: 1, borderColor: selectedGroupId === group.id ? colors.primary : colors.border }}
                >
                  <Text className={`text-xs font-semibold ${
                    selectedGroupId === group.id ? 'text-background' : 'text-foreground'
                  }`}>{group.groupName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Bulk Actions */}
          {bulkSelectMode && (
            <View className="flex-row gap-2 mb-3">
              <TouchableOpacity
                onPress={handleSelectAll}
                className="flex-1 bg-background py-2 rounded-lg"
                style={{ borderWidth: 1, borderColor: colors.border }}
              >
                <Text className="text-center text-xs font-semibold text-foreground">Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClearSelection}
                className="flex-1 bg-background py-2 rounded-lg"
                style={{ borderWidth: 1, borderColor: colors.border }}
              >
                <Text className="text-center text-xs font-semibold text-foreground">Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBulkDelete}
                disabled={selectedPostIds.size === 0}
                className="flex-1 bg-error/10 py-2 rounded-lg"
                style={{ opacity: selectedPostIds.size === 0 ? 0.5 : 1 }}
              >
                <Text className="text-center text-xs font-semibold text-error">
                  Delete ({selectedPostIds.size})
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <TouchableOpacity
                key={post.id}
                onPress={() => bulkSelectMode ? togglePostSelection(post.id) : handleViewPost(post)}
                className="bg-background rounded-lg p-3 mb-2"
                style={{ borderWidth: 1, borderColor: selectedPostIds.has(post.id) ? colors.primary : colors.border }}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      {bulkSelectMode && (
                        <View
                          className="w-5 h-5 rounded border-2"
                          style={{
                            borderColor: selectedPostIds.has(post.id) ? colors.primary : colors.border,
                            backgroundColor: selectedPostIds.has(post.id) ? colors.primary : 'transparent',
                          }}
                        >
                          {selectedPostIds.has(post.id) && (
                            <Text className="text-center text-xs text-background font-bold">✓</Text>
                          )}
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">{(post as any).authorName}</Text>
                        <Text className="text-xs text-muted">{new Date(post.createdAt).toLocaleDateString()}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="px-2 py-1 rounded bg-primary/10">
                    <Text className="text-xs font-semibold" style={{ color: colors.primary }}>{post.postType}</Text>
                  </View>
                </View>
                
                {post.postText && (
                  <Text className="text-sm text-foreground mb-2" numberOfLines={2}>{post.postText}</Text>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <Text className="text-center text-muted py-4">No posts found</Text>
          )}
        </View>
        
        {/* Audit Feed Panel */}
        <View className="bg-surface rounded-xl p-4 mb-4" style={{ borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-lg font-bold text-foreground mb-3">📋 Audit Feed</Text>
          
          {/* Filters */}
          <View className="mb-3">
            <TouchableOpacity
              onPress={() => setFilterSelectedUserOnly(!filterSelectedUserOnly)}
              className="flex-row items-center mb-2"
            >
              <View className={`w-5 h-5 rounded mr-2 ${filterSelectedUserOnly ? 'bg-primary' : 'bg-muted'}`} />
              <Text className="text-foreground">Selected user only</Text>
            </TouchableOpacity>
            
            <TextInput
              value={filterCategory}
              onChangeText={setFilterCategory}
              placeholder="Filter by category..."
              className="bg-background border border-border rounded-lg px-4 py-2 text-foreground"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          {/* Audit List */}
          {filteredAudit && filteredAudit.length > 0 ? (
            filteredAudit.slice(0, 10).map((entry, index) => (
              <View
                key={index}
                className="bg-background rounded-lg p-3 mb-2"
                style={{ borderWidth: 1, borderColor: colors.border }}
              >
                <View className="flex-row items-start justify-between mb-1">
                  <Text className="text-sm font-semibold text-foreground">{(entry as any).targetUserName}</Text>
                  <Text className={`text-sm font-bold ${entry.pointsDelta > 0 ? 'text-success' : 'text-error'}`}>
                    {entry.pointsDelta > 0 ? '+' : ''}{entry.pointsDelta}
                  </Text>
                </View>
                
                {entry.category && (
                  <View className="px-2 py-1 rounded bg-primary/10 self-start mb-1">
                    <Text className="text-xs font-semibold" style={{ color: colors.primary }}>{entry.category}</Text>
                  </View>
                )}
                
                <Text className="text-xs text-foreground mb-1">{entry.reason}</Text>
                <Text className="text-xs text-muted">
                  By {(entry as any).adminName} • {new Date(entry.day).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-center text-muted py-4">No audit entries found</Text>
          )}
        </View>
      </ScrollView>
      
      {/* Post Detail Modal */}
      <Modal
        visible={showPostModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPostModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-surface rounded-xl p-4 w-full max-w-md" style={{ borderWidth: 1, borderColor: colors.border }}>
            <Text className="text-xl font-bold text-foreground mb-4">Post Details</Text>
            
            {selectedPost && (
              <View>
                <View className="mb-3">
                  <Text className="text-xs text-muted mb-1">Author</Text>
                  <Text className="text-sm font-semibold text-foreground">{(selectedPost as any).authorName}</Text>
                </View>
                
                <View className="mb-3">
                  <Text className="text-xs text-muted mb-1">Date</Text>
                  <Text className="text-sm text-foreground">{new Date(selectedPost.createdAt).toLocaleString()}</Text>
                </View>
                
                <View className="mb-3">
                  <Text className="text-xs text-muted mb-1">Type</Text>
                  <View className="px-2 py-1 rounded bg-primary/10 self-start">
                    <Text className="text-xs font-semibold" style={{ color: colors.primary }}>{selectedPost.postType}</Text>
                  </View>
                </View>
                
                {selectedPost.postText && (
                  <View className="mb-3">
                    <Text className="text-xs text-muted mb-1">Content</Text>
                    <Text className="text-sm text-foreground">{selectedPost.postText}</Text>
                  </View>
                )}
                
                {selectedPost.postImageUrl && (
                  <View className="mb-3">
                    <Text className="text-xs text-muted mb-1">Image</Text>
                    <Text className="text-xs text-foreground">✓ Has image attachment</Text>
                  </View>
                )}
                
                {selectedPost.postVideoUrl && (
                  <View className="mb-3">
                    <Text className="text-xs text-muted mb-1">Video</Text>
                    <Text className="text-xs text-foreground">✓ Has video attachment</Text>
                  </View>
                )}
                
                <View className="mb-3">
                  <Text className="text-xs text-muted mb-1">Status</Text>
                  <View className="flex-row gap-2">
                    {selectedPost.isPinned && (
                      <View className="px-2 py-1 rounded bg-primary/10">
                        <Text className="text-xs font-semibold" style={{ color: colors.primary }}>Pinned</Text>
                      </View>
                    )}
                    <View className="px-2 py-1 rounded bg-background">
                      <Text className="text-xs text-foreground">{selectedPost.visibility}</Text>
                    </View>
                  </View>
                </View>
                
                <View className="flex-row gap-2 mt-4">
                  <TouchableOpacity
                    onPress={() => setShowPostModal(false)}
                    className="flex-1 bg-background py-3 rounded-lg"
                    style={{ borderWidth: 1, borderColor: colors.border }}
                  >
                    <Text className="text-center font-semibold text-foreground">Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDeleteFromModal}
                    className="flex-1 bg-error py-3 rounded-lg"
                  >
                    <Text className="text-center font-semibold text-background">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Manage Participant Modal */}
      <Modal
        visible={showManageModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowManageModal(false);
          setManageAction(null);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-surface rounded-2xl p-6 w-full max-w-md" style={{ borderWidth: 1, borderColor: colors.border }}>
            {selectedUser && (
              <View>
                <Text className="text-2xl font-bold text-foreground mb-2">Manage Participant</Text>
                <Text className="text-base text-muted mb-6">{selectedUser.name}</Text>
                
                {/* Remove from Group */}
                <TouchableOpacity
                  onPress={handleRemoveFromGroup}
                  className={`py-3 rounded-lg mb-3 ${
                    manageAction === 'removeFromGroup' ? 'bg-warning' : 'bg-background'
                  }`}
                  style={{ borderWidth: 1, borderColor: colors.border }}
                >
                  <Text className={`text-center font-semibold ${
                    manageAction === 'removeFromGroup' ? 'text-background' : 'text-foreground'
                  }`}>
                    {manageAction === 'removeFromGroup' ? 'Tap Again to Confirm' : 'Remove from Group'}
                  </Text>
                </TouchableOpacity>
                
                {/* Deactivate User */}
                <TouchableOpacity
                  onPress={handleDeactivateUser}
                  className={`py-3 rounded-lg mb-3 ${
                    manageAction === 'deactivate' ? 'bg-warning' : 'bg-background'
                  }`}
                  style={{ borderWidth: 1, borderColor: colors.border }}
                >
                  <Text className={`text-center font-semibold ${
                    manageAction === 'deactivate' ? 'text-background' : 'text-foreground'
                  }`}>
                    {manageAction === 'deactivate' ? 'Tap Again to Confirm' : 'Deactivate User'}
                  </Text>
                </TouchableOpacity>
                
                {/* Delete Permanently */}
                <TouchableOpacity
                  onPress={handleDeletePermanently}
                  className={`py-3 rounded-lg mb-4 ${
                    manageAction === 'delete' ? 'bg-error' : 'bg-background'
                  }`}
                  style={{ borderWidth: 1, borderColor: manageAction === 'delete' ? colors.error : colors.border }}
                >
                  <Text className={`text-center font-semibold ${
                    manageAction === 'delete' ? 'text-background' : 'text-error'
                  }`}>
                    {manageAction === 'delete' ? 'Tap Again to Confirm' : 'Delete Permanently'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => {
                    setShowManageModal(false);
                    setManageAction(null);
                  }}
                  className="bg-background py-3 rounded-lg"
                  style={{ borderWidth: 1, borderColor: colors.border }}
                >
                  <Text className="text-center font-semibold text-foreground">Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
