import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from "react-native";
import * as React from "react";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";

// Mock data for demonstration
const mockMetrics = {
  weeklyPoints: 0,
  totalPoints: 0,
  weeklyAverage: 0,
  currentStreak: 0,
  longestStreak: 0,
};

const mockCheckin = null; // No check-in today

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const hasCheckedInToday = !!mockCheckin;
  const metrics = mockMetrics;

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
            <Text className="text-sm text-muted">Points: {metrics.weeklyPoints}/38 (0%)</Text>
            <Text className="text-sm text-muted">Daily Avg: {metrics.weeklyAverage.toFixed(1)} points</Text>
            <Text className="text-sm text-primary mt-1">📈 Let's finish strong this week!</Text>
          </View>

          {/* Your Progress */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-xl font-bold text-foreground mb-4">Your Progress</Text>
            
            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-muted">This Week</Text>
                <Text className="text-base font-semibold text-foreground">{metrics.weeklyPoints} / 38 points</Text>
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-muted">Overall (12 Weeks)</Text>
                <Text className="text-base font-semibold text-foreground">{metrics.totalPoints} / 456 points</Text>
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
                <Text className="text-base text-muted">🙏 Prayer (0-7 pts)</Text>
                <Text className="text-base font-semibold text-foreground">0 pts</Text>
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-muted">📖 Bible Study (0-7 pts)</Text>
                <Text className="text-base font-semibold text-foreground">0 pts</Text>
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-muted">⛪ Church (0-3 pts)</Text>
                <Text className="text-base font-semibold text-foreground">0 pts</Text>
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-muted">🏃 Exercise (0-14 pts)</Text>
                <Text className="text-base font-semibold text-foreground">0 pts</Text>
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-muted">🥗 Nutrition (0-7 pts)</Text>
                <Text className="text-base font-semibold text-foreground">0 pts</Text>
              </View>
            </View>
          </View>

          {/* Current Streak */}
          <View className="bg-primary/10 rounded-2xl p-6 border border-primary/20">
            <Text className="text-xl font-bold text-foreground mb-2">🔥 Current Streak</Text>
            <Text className="text-3xl font-bold text-primary">{metrics.currentStreak} days</Text>
            <Text className="text-sm text-muted mt-1">Longest: {metrics.longestStreak} days</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
