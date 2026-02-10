import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from "react-native";
import * as React from "react";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function DashboardScreen() {
  const router = useRouter();
  
  // Fetch user metrics from backend
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = trpc.metrics.getMyMetrics.useQuery();
  
  // Fetch today's check-in status
  const { data: todayCheckin, isLoading: checkinLoading, refetch: refetchCheckin } = trpc.checkins.getTodayCheckin.useQuery();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchMetrics(), refetchCheckin()]);
    setRefreshing(false);
  };

  const isLoading = metricsLoading || checkinLoading;
  const hasCheckedInToday = !!todayCheckin;

  if (isLoading && !metrics) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="text-base text-muted mt-4">Loading dashboard...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const weeklyPoints = metrics?.thisWeekTotal ?? 0;
  const totalPoints = metrics?.totalPoints ?? 0;
  const weeklyPercentage = Math.round(metrics?.weeklyPercent ?? 0);
  const overallPercentage = Math.round(metrics?.overallPercent ?? 0);

  // Calculate weekly average (this week's points / 7 days)
  const weeklyAverage = weeklyPoints / 7;

  // For streak calculation, we'd need additional API endpoint
  // For now, use placeholder values
  const currentStreak = 0;
  const longestStreak = 0;

  return (
    <ScreenContainer className="p-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">My Dashboard</Text>
            <Text className="text-base text-muted">Track your faith & fitness journey</Text>
          </View>

          {/* Weekly Summary Card */}
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <Text className="text-sm font-semibold text-foreground mb-2">📊 This Week's Summary</Text>
            <Text className="text-sm text-muted">Points: {weeklyPoints}/38 ({weeklyPercentage}%)</Text>
            <Text className="text-sm text-muted">Daily Avg: {weeklyAverage.toFixed(1)} points</Text>
            <Text className="text-sm text-primary mt-1">
              {weeklyPercentage >= 80 ? "🎉 Amazing work this week!" : "📈 Let's finish strong this week!"}
            </Text>
          </View>

          {/* Your Progress */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-xl font-bold text-foreground mb-4">Your Progress</Text>
            
            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-muted">This Week</Text>
                <Text className="text-base font-semibold text-foreground">{weeklyPoints} / 38 points ({weeklyPercentage}%)</Text>
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-muted">Overall (12 Weeks)</Text>
                <Text className="text-base font-semibold text-foreground">{totalPoints} / 456 points ({overallPercentage}%)</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-4">
            <TouchableOpacity
              className="bg-primary rounded-2xl p-5 items-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(modals)/checkin");
              }}
            >
              <Text className="text-lg font-bold text-background">
                {hasCheckedInToday ? "✅ Checked In Today" : "📝 Log Today's Check-In"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-surface border-2 border-primary rounded-2xl p-5 items-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(modals)/checkin-history");
              }}
            >
              <Text className="text-base font-semibold text-primary">📋 View Check-In History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-success rounded-2xl p-5 items-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(modals)/body-metrics");
              }}
            >
              <Text className="text-lg font-bold text-background">📊 Track Body Metrics</Text>
            </TouchableOpacity>
          </View>

          {/* This Week Breakdown */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-xl font-bold text-foreground mb-4">This Week Breakdown</Text>
            
            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-muted">🥗 Nutrition (0-7 pts)</Text>
                <Text className="text-base font-semibold text-foreground">-- pts</Text>
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-muted">💧 Hydration (0-7 pts)</Text>
                <Text className="text-base font-semibold text-foreground">-- pts</Text>
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-muted">🏃 Movement (0-7 pts)</Text>
                <Text className="text-base font-semibold text-foreground">-- pts</Text>
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-muted">📖 Scripture (0-7 pts)</Text>
                <Text className="text-base font-semibold text-foreground">-- pts</Text>
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-muted">⛪ Life Group (0-10 pts)</Text>
                <Text className="text-base font-semibold text-foreground">{metrics?.thisWeekAttendancePoints ?? 0} pts</Text>
              </View>
            </View>
            <Text className="text-xs text-muted mt-3">Note: Individual category breakdown coming soon. Total shown above.</Text>
          </View>

          {/* Current Streak */}
          <View className="bg-primary/10 rounded-2xl p-6 border border-primary/20">
            <Text className="text-xl font-bold text-foreground mb-2">🔥 Current Streak</Text>
            <Text className="text-3xl font-bold text-primary">{currentStreak} days</Text>
            <Text className="text-sm text-muted mt-1">Longest: {longestStreak} days</Text>
            <Text className="text-xs text-muted mt-2">Streak tracking coming soon!</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
