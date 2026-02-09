import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";

export default function DashboardScreen() {
  const router = useRouter();
  const { data: metrics, isLoading: metricsLoading } = trpc.metrics.getMyMetrics.useQuery();
  const { data: todayCheckin, isLoading: checkinLoading } = trpc.checkins.getTodayCheckin.useQuery();

  const isLoading = metricsLoading || checkinLoading;

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  const hasCheckedInToday = !!todayCheckin;

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">My Dashboard</Text>
            <Text className="text-base text-muted">Track your faith & fitness journey</Text>
          </View>

          {/* Points Summary Card */}
          <View className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Your Progress</Text>

            {/* This Week */}
            <View className="mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-muted">This Week</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {metrics?.thisWeekTotal || 0} / 38 points
                </Text>
              </View>
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(100, (metrics?.weeklyPercent || 0))}%` }}
                />
              </View>
            </View>

            {/* Overall */}
            <View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-muted">Overall (12 Weeks)</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {metrics?.totalPoints || 0} / 456 points
                </Text>
              </View>
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-secondary"
                  style={{ width: `${Math.min(100, (metrics?.overallPercent || 0))}%` }}
                />
              </View>
            </View>
          </View>

          {/* Check-in Button */}
          <TouchableOpacity
            onPress={() => router.push("/checkin" as any)}
            disabled={hasCheckedInToday}
            className={`px-6 py-4 rounded-full ${hasCheckedInToday ? "bg-success" : "bg-primary"} active:opacity-80`}
          >
            <Text className="text-background text-center font-semibold text-lg">
              {hasCheckedInToday ? "✓ Checked In Today" : "Log Today's Check-In"}
            </Text>
          </TouchableOpacity>

          {/* Breakdown Card */}
          <View className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">This Week Breakdown</Text>

            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Daily Points</Text>
                <Text className="text-sm font-semibold text-foreground">{metrics?.thisWeekDailyPoints || 0}</Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Wednesday Attendance</Text>
                <Text className="text-sm font-semibold text-foreground">{metrics?.thisWeekAttendancePoints || 0}</Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Adjustments</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {metrics?.thisWeekAdjustments ? (metrics.thisWeekAdjustments > 0 ? "+" : "") + metrics.thisWeekAdjustments : 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <Text className="text-sm text-foreground text-center">
              Complete your daily check-in to earn up to 4 points per day. Attend Wednesday Life Group for a 10-point bonus!
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
