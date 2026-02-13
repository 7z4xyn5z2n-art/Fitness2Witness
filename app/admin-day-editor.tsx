import { Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function AdminDayEditorScreen() {
  const colors = useColors();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");

  // Check-in state
  const [nutritionDone, setNutritionDone] = useState(false);
  const [hydrationDone, setHydrationDone] = useState(false);
  const [movementDone, setMovementDone] = useState(false);
  const [scriptureDone, setScriptureDone] = useState(false);

  // Attendance state
  const [attended, setAttended] = useState(false);

  // Day adjustment state
  const [pointsDelta, setPointsDelta] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("");

  // Post edit state
  const [editPostId, setEditPostId] = useState<number | null>(null);
  const [editPostText, setEditPostText] = useState("");
  const [editPostType, setEditPostType] = useState<
    "Encouragement" | "Testimony" | "Photo" | "Video" | "Announcement"
  >("Encouragement");
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: users, refetch: refetchUsers } = trpc.admin.getAllUsers.useQuery();
  const utils = trpc.useUtils();

  // Day snapshot query
  const {
    data: daySnapshot,
    refetch: refetchSnapshot,
    isLoading: snapshotLoading,
  } = trpc.admin.getDaySnapshot.useQuery(
    {
      userId: String(selectedUserId),
      dateISO: selectedDate,
    },
    {
      enabled: !!selectedUserId && !!selectedDate,
    }
  );

  // Posts query
  const {
    data: posts,
    refetch: refetchPosts,
    isLoading: postsLoading,
  } = trpc.admin.getPostsForModeration.useQuery(
    {
      userId: selectedUserId || undefined,
      dateISO: selectedDate || undefined,
    },
    {
      enabled: !!selectedUserId && !!selectedDate,
    }
  );

  // Mutations
  const upsertCheckInMutation = trpc.admin.upsertCheckInForUserDate.useMutation();
  const addAttendanceMutation = trpc.admin.addUserAttendance.useMutation();
  const createPointAdjustmentMutation = trpc.admin.createPointAdjustmentForDate.useMutation();
  const updatePostMutation = trpc.admin.updatePost.useMutation();
  const deletePostMutation = trpc.community.deletePost.useMutation();

  // Load snapshot data into state when it changes
  useState(() => {
    if (daySnapshot?.dailyCheckin) {
      setNutritionDone(daySnapshot.dailyCheckin.nutritionDone);
      setHydrationDone(daySnapshot.dailyCheckin.hydrationDone);
      setMovementDone(daySnapshot.dailyCheckin.movementDone);
      setScriptureDone(daySnapshot.dailyCheckin.scriptureDone);
    } else {
      setNutritionDone(false);
      setHydrationDone(false);
      setMovementDone(false);
      setScriptureDone(false);
    }

    if (daySnapshot?.attendance) {
      setAttended(daySnapshot.attendance.attendedWednesday);
    } else {
      setAttended(false);
    }
  });

  const handleUserSelect = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
  };

  const handleSaveCheckIn = async () => {
    if (!selectedUserId || !selectedDate) {
      Alert.alert("Error", "Please select a user and date");
      return;
    }

    try {
      const payload = {
        userId: String(selectedUserId),
        dateISO: selectedDate,
        nutritionDone,
        hydrationDone,
        movementDone,
        scriptureDone,
      };
      console.log("Save check-in payload:", payload);
      console.log("Payload types:", {
        userId: typeof payload.userId,
        dateISO: typeof payload.dateISO,
        nutritionDone: typeof payload.nutritionDone,
        hydrationDone: typeof payload.hydrationDone,
        movementDone: typeof payload.movementDone,
        scriptureDone: typeof payload.scriptureDone,
      });

      await upsertCheckInMutation.mutateAsync(payload);
      await refetchSnapshot();
      await utils.admin.getAllUsers.invalidate();
      await refetchUsers();
      Alert.alert("Success", "Check-in saved successfully");
    } catch (error: any) {
      console.error("Save check-in error:", error);
      Alert.alert("Error", error.message || "Failed to save check-in");
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedUserId || !selectedDate) {
      Alert.alert("Error", "Please select a user and date");
      return;
    }

    try {
      const payload = {
        userId: String(selectedUserId),
        date: selectedDate,
        attended,
      };
      console.log("Save attendance payload:", payload);
      console.log("Payload types:", {
        userId: typeof payload.userId,
        date: typeof payload.date,
        attended: typeof payload.attended,
      });

      await addAttendanceMutation.mutateAsync(payload);
      await refetchSnapshot();
      await utils.admin.getAllUsers.invalidate();
      await refetchUsers();
      Alert.alert("Success", "Attendance saved successfully");
    } catch (error: any) {
      console.error("Save attendance error:", error);
      Alert.alert("Error", error.message || "Failed to save attendance");
    }
  };

  const handleApplyDayAdjustment = async () => {
    if (!selectedUserId || !selectedDate) {
      Alert.alert("Error", "Please select a user and date");
      return;
    }

    if (!pointsDelta || !reason) {
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
        userId: selectedUserId,
        dateISO: selectedDate,
        pointsDelta: pointsNum,
        reason,
        category: category || undefined,
      };
      console.log("Day adjustment payload:", payload);
      console.log("Payload types:", {
        userId: typeof payload.userId,
        dateISO: typeof payload.dateISO,
        pointsDelta: typeof payload.pointsDelta,
        reason: typeof payload.reason,
        category: typeof payload.category,
      });

      await createPointAdjustmentMutation.mutateAsync(payload);
      await refetchSnapshot();
      await utils.admin.getAllUsers.invalidate();
      await refetchUsers();
      setPointsDelta("");
      setReason("");
      setCategory("");
      Alert.alert(
        "Success",
        `Applied ${pointsNum > 0 ? "+" : ""}${pointsNum} points for ${selectedUserName}`
      );
    } catch (error: any) {
      console.error("Day adjustment error:", error);
      Alert.alert("Error", error.message || "Failed to apply adjustment");
    }
  };

  const handleEditPost = (post: any) => {
    setEditPostId(post.id);
    setEditPostText(post.postText || "");
    setEditPostType(post.postType);
    setShowEditModal(true);
  };

  const handleSavePostEdit = async () => {
    if (!editPostId) return;

    try {
      const payload = {
        postId: editPostId,
        postText: editPostText,
        postType: editPostType,
      };
      console.log("Update post payload:", payload);
      console.log("Payload types:", {
        postId: typeof payload.postId,
        postText: typeof payload.postText,
        postType: typeof payload.postType,
      });

      await updatePostMutation.mutateAsync(payload);
      await refetchPosts();
      setShowEditModal(false);
      setEditPostId(null);
      Alert.alert("Success", "Post updated successfully");
    } catch (error: any) {
      console.error("Update post error:", error);
      Alert.alert("Error", error.message || "Failed to update post");
    }
  };

  const handleDeletePost = (postId: number, postText: string) => {
    Alert.alert(
      "Delete Post",
      `Are you sure you want to permanently delete this post?\n\n"${postText?.substring(0, 100)}..."`,
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
              await refetchPosts();
              Alert.alert("Success", "Post deleted successfully");
            } catch (error: any) {
              console.error("Delete post error:", error);
              Alert.alert("Error", error.message || "Failed to delete post");
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-bold text-foreground mb-2">Admin Day Editor</Text>
            <Text className="text-base text-muted">Edit check-ins, attendance, and posts for a specific day</Text>
          </View>
        </View>

        {/* Date Selector */}
        <View className="bg-surface rounded-xl p-4 mb-4" style={{ borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-lg font-bold text-foreground mb-3">📅 Select Date</Text>
          {Platform.OS === "web" ? (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.foreground,
                fontSize: 16,
              }}
            />
          ) : (
            <TextInput
              className="bg-background rounded-lg p-3 text-foreground"
              style={{ borderWidth: 1, borderColor: colors.border }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              value={selectedDate}
              onChangeText={setSelectedDate}
            />
          )}
        </View>

        {/* User Selector */}
        <View className="bg-surface rounded-xl p-4 mb-4" style={{ borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-lg font-bold text-foreground mb-3">👤 Select User</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
            {users?.map((user) => (
              <TouchableOpacity
                key={user.id}
                onPress={() => handleUserSelect(user.id, user.name)}
                className="px-4 py-2 rounded-lg mr-2"
                style={{
                  backgroundColor: selectedUserId === user.id ? colors.primary : colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  className="font-semibold"
                  style={{ color: selectedUserId === user.id ? "#fff" : colors.foreground }}
                >
                  {user.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedUserId && selectedDate && (
          <>
            {/* CARD 1: Daily Check-In */}
            <View className="bg-surface rounded-xl p-4 mb-4" style={{ borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-lg font-bold text-foreground mb-3">✅ Daily Check-In</Text>

              {snapshotLoading ? (
                <Text className="text-muted">Loading...</Text>
              ) : (
                <>
                  <View className="gap-3 mb-4">
                    <TouchableOpacity
                      onPress={() => setNutritionDone(!nutritionDone)}
                      className="flex-row items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                    >
                      <Text className="text-foreground">🥗 Nutrition</Text>
                      <Text className="text-lg">{nutritionDone ? "✅" : "⬜"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setHydrationDone(!hydrationDone)}
                      className="flex-row items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                    >
                      <Text className="text-foreground">💧 Hydration</Text>
                      <Text className="text-lg">{hydrationDone ? "✅" : "⬜"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setMovementDone(!movementDone)}
                      className="flex-row items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                    >
                      <Text className="text-foreground">🏃 Movement</Text>
                      <Text className="text-lg">{movementDone ? "✅" : "⬜"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setScriptureDone(!scriptureDone)}
                      className="flex-row items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                    >
                      <Text className="text-foreground">📖 Scripture</Text>
                      <Text className="text-lg">{scriptureDone ? "✅" : "⬜"}</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={handleSaveCheckIn}
                    disabled={upsertCheckInMutation.isPending}
                    className="bg-primary rounded-lg p-3 items-center"
                    style={{ opacity: upsertCheckInMutation.isPending ? 0.5 : 1 }}
                  >
                    <Text className="text-white font-semibold">
                      {upsertCheckInMutation.isPending ? "Saving..." : "Save Check-In"}
                    </Text>
                  </TouchableOpacity>

                  {/* Day Points Adjustment Section */}
                  <View className="mt-6 pt-6" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Text className="text-base font-bold text-foreground mb-3">
                      ⚖️ Adjust Points For This Day (+/-)
                    </Text>

                    <TextInput
                      className="bg-background rounded-lg p-3 text-foreground mb-2"
                      style={{ borderWidth: 1, borderColor: colors.border }}
                      placeholder="Points (e.g., -1, +5)"
                      placeholderTextColor={colors.muted}
                      value={pointsDelta}
                      onChangeText={setPointsDelta}
                      keyboardType="numeric"
                    />

                    <TextInput
                      className="bg-background rounded-lg p-3 text-foreground mb-2"
                      style={{ borderWidth: 1, borderColor: colors.border }}
                      placeholder="Reason (required)"
                      placeholderTextColor={colors.muted}
                      value={reason}
                      onChangeText={setReason}
                    />

                    <TextInput
                      className="bg-background rounded-lg p-3 text-foreground mb-3"
                      style={{ borderWidth: 1, borderColor: colors.border }}
                      placeholder="Category (optional)"
                      placeholderTextColor={colors.muted}
                      value={category}
                      onChangeText={setCategory}
                    />

                    <TouchableOpacity
                      onPress={handleApplyDayAdjustment}
                      disabled={createPointAdjustmentMutation.isPending}
                      className="bg-primary rounded-lg p-3 items-center"
                      style={{ opacity: createPointAdjustmentMutation.isPending ? 0.5 : 1 }}
                    >
                      <Text className="text-white font-semibold">
                        {createPointAdjustmentMutation.isPending ? "Applying..." : "Apply Adjustment"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Day Breakdown */}
                  {daySnapshot && (
                    <View className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <Text className="text-sm font-semibold text-foreground mb-2">Day Breakdown:</Text>
                      <Text className="text-sm text-muted">
                        Check-in: {daySnapshot.dayBreakdown.checkInPoints} pts
                      </Text>
                      <Text className="text-sm text-muted">
                        Attendance: {daySnapshot.dayBreakdown.attendancePoints} pts
                      </Text>
                      <Text className="text-sm text-muted">
                        Adjustments: {daySnapshot.dayBreakdown.dayAdjustmentsSum} pts
                      </Text>
                      <Text className="text-base font-bold text-foreground mt-2">
                        Total: {daySnapshot.dayBreakdown.dayTotal} pts
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* CARD 2: Life Group Attendance */}
            <View className="bg-surface rounded-xl p-4 mb-4" style={{ borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-lg font-bold text-foreground mb-3">🙏 Life Group Attendance (10 pts)</Text>

              <TouchableOpacity
                onPress={() => setAttended(!attended)}
                className="flex-row items-center justify-between p-3 rounded-lg mb-4"
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
              >
                <Text className="text-foreground">Attended Life Group</Text>
                <Text className="text-lg">{attended ? "✅" : "⬜"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveAttendance}
                disabled={addAttendanceMutation.isPending}
                className="bg-primary rounded-lg p-3 items-center"
                style={{ opacity: addAttendanceMutation.isPending ? 0.5 : 1 }}
              >
                <Text className="text-white font-semibold">
                  {addAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* CARD 3: Posts Moderation */}
            <View className="bg-surface rounded-xl p-4 mb-4" style={{ borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-lg font-bold text-foreground mb-3">📝 Posts Moderation</Text>

              {postsLoading ? (
                <Text className="text-muted">Loading posts...</Text>
              ) : posts && posts.length > 0 ? (
                posts.map((post) => (
                  <View
                    key={post.id}
                    className="bg-background rounded-lg p-3 mb-3"
                    style={{ borderWidth: 1, borderColor: colors.border }}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">{post.authorName}</Text>
                        <Text className="text-xs text-muted">
                          {new Date(post.createdAt).toLocaleDateString()} at{" "}
                          {new Date(post.createdAt).toLocaleTimeString()}
                        </Text>
                      </View>
                      <Text className="text-xs text-muted">{post.postType}</Text>
                    </View>

                    <Text className="text-foreground mb-3">{post.postText}</Text>

                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleEditPost(post)}
                        className="flex-1 bg-primary rounded-lg p-2 items-center"
                      >
                        <Text className="text-white font-semibold">Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeletePost(post.id, post.postText || "")}
                        className="flex-1 rounded-lg p-2 items-center"
                        style={{ backgroundColor: colors.error }}
                      >
                        <Text className="text-white font-semibold">Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-muted">No posts for this user/date</Text>
              )}
            </View>
          </>
        )}

        {/* Edit Post Modal */}
        {showEditModal && (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <View
              className="bg-surface rounded-xl p-6 m-4"
              style={{ borderWidth: 1, borderColor: colors.border, width: "90%", maxWidth: 500 }}
            >
              <Text className="text-xl font-bold text-foreground mb-4">Edit Post</Text>

              <TextInput
                className="bg-background rounded-lg p-3 text-foreground mb-3"
                style={{ borderWidth: 1, borderColor: colors.border, minHeight: 100 }}
                placeholder="Post text"
                placeholderTextColor={colors.muted}
                value={editPostText}
                onChangeText={setEditPostText}
                multiline
              />

              <View className="flex-row gap-2 mb-4">
                {(["Encouragement", "Testimony", "Photo", "Video", "Announcement"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setEditPostType(type)}
                    className="px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: editPostType === type ? colors.primary : colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: editPostType === type ? "#fff" : colors.foreground }}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => {
                    setShowEditModal(false);
                    setEditPostId(null);
                  }}
                  className="flex-1 bg-background rounded-lg p-3 items-center"
                  style={{ borderWidth: 1, borderColor: colors.border }}
                >
                  <Text className="text-foreground font-semibold">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSavePostEdit}
                  disabled={updatePostMutation.isPending}
                  className="flex-1 bg-primary rounded-lg p-3 items-center"
                  style={{ opacity: updatePostMutation.isPending ? 0.5 : 1 }}
                >
                  <Text className="text-white font-semibold">
                    {updatePostMutation.isPending ? "Saving..." : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
