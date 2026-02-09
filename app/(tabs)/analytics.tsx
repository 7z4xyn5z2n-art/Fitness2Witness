import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Redirect if not leader or admin
  if (user?.role !== "leader" && user?.role !== "admin") {
    router.replace("/");
    return null;
  }

  const { data: analytics, isLoading, refetch } = trpc.analytics.getGroupAnalytics.useQuery();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="mb-4">
          <Text className="text-3xl font-bold text-foreground">Analytics</Text>
          <Text className="text-base text-muted mt-1">Group insights and member tracking</Text>
          {user?.role === "admin" && (
            <TouchableOpacity
              onPress={() => router.push("/admin-calendar")}
              className="mt-3 bg-primary px-4 py-3 rounded-xl"
            >
              <Text className="text-background font-semibold text-center">📅 Admin Calendar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Participation Overview */}
        <View className="bg-surface rounded-2xl p-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">📊 Participation Overview</Text>
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-muted">This Week Check-ins</Text>
              <Text className="text-foreground font-semibold">
                {analytics?.participationRate?.toFixed(0) || 0}%
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted">Active Members</Text>
              <Text className="text-foreground font-semibold">
                {analytics?.activeMembers || 0} / {analytics?.totalMembers || 0}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted">Wednesday Attendance</Text>
              <Text className="text-foreground font-semibold">
                {analytics?.attendanceRate?.toFixed(0) || 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* Average Points */}
        <View className="bg-surface rounded-2xl p-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">📈 Average Points</Text>
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-muted">This Week Average</Text>
              <Text className="text-foreground font-semibold">
                {analytics?.avgWeeklyPoints?.toFixed(1) || 0} / 38
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted">Overall Average</Text>
              <Text className="text-foreground font-semibold">
                {analytics?.avgTotalPoints?.toFixed(1) || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Top Performers */}
        <View className="bg-surface rounded-2xl p-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">🏆 Top Performers This Week</Text>
          {analytics?.topPerformers && analytics.topPerformers.length > 0 ? (
            <View className="gap-3">
              {analytics.topPerformers.map((performer: any, index: number) => (
                <View key={performer.userId} className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                    </Text>
                    <Text className="text-foreground font-medium">{performer.userName}</Text>
                  </View>
                  <Text className="text-primary font-semibold">{performer.weeklyPoints} pts</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-muted">No check-ins this week yet</Text>
          )}
        </View>

        {/* Members Needing Follow-up */}
        <View className="bg-surface rounded-2xl p-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">⚠️ Members Needing Follow-up</Text>
          {analytics?.needsFollowUp && analytics.needsFollowUp.length > 0 ? (
            <View className="gap-3">
              {analytics.needsFollowUp.map((member: any) => (
                <View key={member.userId} className="border-b border-border pb-3">
                  <Text className="text-foreground font-medium">{member.userName}</Text>
                  <Text className="text-sm text-muted mt-1">{member.reason}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-success">✅ All members are on track!</Text>
          )}
        </View>

        {/* Engagement Metrics */}
        <View className="bg-surface rounded-2xl p-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">💬 Engagement Metrics</Text>
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-muted">Community Posts This Week</Text>
              <Text className="text-foreground font-semibold">
                {analytics?.postsThisWeek || 0}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted">Members Logging Workouts</Text>
              <Text className="text-foreground font-semibold">
                {analytics?.workoutLoggers || 0}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted">Body Metrics Tracked</Text>
              <Text className="text-foreground font-semibold">
                {analytics?.metricsTrackers || 0}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
