import { ActivityIndicator, Alert, FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function AttendanceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Check if user is admin or leader
  const isAuthorized = user?.role === "admin" || user?.role === "leader";

  const { data: groupMembers, isLoading } = trpc.attendance.getGroupMembers.useQuery(undefined, {
    enabled: isAuthorized,
  });

  const { data: thisWeekAttendance } = trpc.attendance.getThisWeekAttendance.useQuery(undefined, {
    enabled: isAuthorized,
  });

  const markAttendanceMutation = trpc.attendance.markAttendance.useMutation({
    onSuccess: () => {
      utils.attendance.getThisWeekAttendance.invalidate();
      utils.metrics.getMyMetrics.invalidate();
      utils.metrics.getGroupLeaderboard.invalidate();

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());

  const toggleUser = (userId: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    if (selectedUsers.size === 0) {
      Alert.alert("No Selection", "Please select at least one person who attended.");
      return;
    }

    Alert.alert(
      "Confirm Attendance",
      `Mark ${selectedUsers.size} ${selectedUsers.size === 1 ? "person" : "people"} as attended Wednesday Life Group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            markAttendanceMutation.mutate({
              userIds: Array.from(selectedUsers),
              day: new Date().toISOString(),
            });
            setSelectedUsers(new Set());
          },
        },
      ]
    );
  };

  if (!isAuthorized) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <View className="items-center gap-4">
          <Text className="text-2xl">🔒</Text>
          <Text className="text-lg font-semibold text-foreground text-center">
            Admin or Leader Access Required
          </Text>
          <Text className="text-base text-muted text-center">
            Only admins and group leaders can mark Wednesday attendance.
          </Text>
          <TouchableOpacity onPress={() => router.back()} className="bg-primary px-6 py-3 rounded-full mt-4">
            <Text className="text-background font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  // Check who already has attendance this week
  const attendedThisWeek = new Set(thisWeekAttendance?.map((a: { userId: number }) => a.userId) || []);

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View>
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-primary text-base">← Back</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground">Wednesday Attendance</Text>
            <Text className="text-base text-muted mt-2">Mark who attended Life Group this week (+10 points)</Text>
          </View>

          {/* Already Attended This Week */}
          {attendedThisWeek.size > 0 && (
            <View className="bg-success/10 rounded-2xl p-4 border border-success/20">
              <Text className="text-sm font-semibold text-success mb-2">
                ✓ Already Marked This Week ({attendedThisWeek.size})
              </Text>
              <Text className="text-xs text-muted">
                {groupMembers
                  ?.filter((m: { id: number; name: string | null }) => attendedThisWeek.has(m.id))
                  .map((m: { id: number; name: string | null }) => m.name)
                  .join(", ")}
              </Text>
            </View>
          )}

          {/* Member List */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Select Attendees ({selectedUsers.size} selected)
            </Text>

            <FlatList
              data={groupMembers}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const isSelected = selectedUsers.has(item.id);
                const alreadyMarked = attendedThisWeek.has(item.id);

                return (
                  <TouchableOpacity
                    onPress={() => !alreadyMarked && toggleUser(item.id)}
                    disabled={alreadyMarked}
                    className={`flex-row items-center p-4 rounded-xl mb-3 border-2 ${
                      alreadyMarked
                        ? "border-success/30 bg-success/5"
                        : isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border"
                    }`}
                  >
                    <View
                      className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                        alreadyMarked
                          ? "border-success bg-success"
                          : isSelected
                            ? "border-primary bg-primary"
                            : "border-muted"
                      }`}
                    >
                      {(isSelected || alreadyMarked) && <Text className="text-background text-sm">✓</Text>}
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">{item.name}</Text>
                      {alreadyMarked && <Text className="text-xs text-success">Already marked this week</Text>}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View className="items-center justify-center py-12">
                  <Text className="text-muted text-center">No group members found</Text>
                </View>
              }
            />
          </View>

          {/* Submit Button */}
          {selectedUsers.size > 0 && (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={markAttendanceMutation.isPending}
              className="bg-primary px-6 py-4 rounded-full active:opacity-80"
            >
              {markAttendanceMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-background text-center font-semibold text-lg">
                  Mark {selectedUsers.size} {selectedUsers.size === 1 ? "Person" : "People"} as Attended
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
