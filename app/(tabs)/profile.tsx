import { Alert, ScrollView, Text, TouchableOpacity, View, Dimensions, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { LineChart, BarChart } from "react-native-chart-kit";
import { useColors } from "@/hooks/use-colors";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { data: metrics } = trpc.metrics.getMyMetrics.useQuery();
  const { data: weeklyProgress, isLoading: loadingWeekly } = trpc.metrics.getWeeklyProgress.useQuery();
  const { data: categoryData, isLoading: loadingCategory } = trpc.metrics.getCategoryConsistency.useQuery();
  const { data: bodyMetrics, isLoading: loadingBody } = trpc.bodyMetrics.getMyMetrics.useQuery();
  const { data: badges } = trpc.badges.getMyBadges.useQuery();
  
  const colors = useColors();
  const screenWidth = Dimensions.get("window").width - 48; // padding

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-4">
            <View className="w-24 h-24 rounded-full bg-primary items-center justify-center">
              <Text className="text-5xl text-background font-bold">{user?.name?.[0] || "?"}</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-foreground">{user?.name || "User"}</Text>
              <Text className="text-base text-muted">{user?.email}</Text>
            </View>
          </View>

          {/* Badges Section */}
          {badges && badges.length > 0 && (
            <View className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">🏆 Achievements</Text>
              <View className="flex-row flex-wrap gap-3">
                {badges.map((badge) => (
                  <View key={badge.id} className="bg-primary/10 rounded-xl p-3 border border-primary/20" style={{ width: '48%' }}>
                    <Text className="text-2xl mb-1">🏅</Text>
                    <Text className="text-sm font-semibold text-foreground">{badge.badgeName}</Text>
                    <Text className="text-xs text-muted mt-1">{badge.badgeDescription}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Stats Card */}
          <View className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Your Stats</Text>
            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">This Week Points</Text>
                <Text className="text-sm font-semibold text-foreground">{metrics?.thisWeekTotal || 0} / 38</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Total Points</Text>
                <Text className="text-sm font-semibold text-foreground">{metrics?.totalPoints || 0} / 456</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Completion</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {Math.round(metrics?.overallPercent || 0)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Weekly Progress Chart */}
          <View className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Weekly Progress Trend</Text>
            {loadingWeekly ? (
              <ActivityIndicator size="small" />
            ) : weeklyProgress && weeklyProgress.length > 0 ? (
              <LineChart
                data={{
                  labels: weeklyProgress.map(w => `W${w.week}`),
                  datasets: [{ data: weeklyProgress.map(w => w.points) }]
                }}
                width={screenWidth - 48}
                height={220}
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => colors.primary,
                  labelColor: (opacity = 1) => colors.muted,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: colors.primary
                  }
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            ) : (
              <Text className="text-sm text-muted text-center">No data yet</Text>
            )}
          </View>

          {/* Category Consistency Chart */}
          <View className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Category Consistency</Text>
            {loadingCategory ? (
              <ActivityIndicator size="small" />
            ) : categoryData && categoryData.length > 0 ? (
              <BarChart
                data={{
                  labels: categoryData.map(c => c.category.slice(0, 3)),
                  datasets: [{ data: categoryData.map(c => c.percentage) }]
                }}
                width={screenWidth - 48}
                height={220}
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => colors.primary,
                  labelColor: (opacity = 1) => colors.muted,
                  style: { borderRadius: 16 }
                }}
                yAxisLabel=""
                yAxisSuffix="%"
                fromZero
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            ) : (
              <Text className="text-sm text-muted text-center">No data yet</Text>
            )}
          </View>

          {/* Body Metrics Progress */}
          {bodyMetrics && bodyMetrics.length > 0 && (
            <View className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">Body Metrics Trend</Text>
              {loadingBody ? (
                <ActivityIndicator size="small" />
              ) : (
                <LineChart
                  data={{
                    labels: bodyMetrics.slice(-6).map((_: any, i: number) => `W${i + 1}`),
                    datasets: [
                      { data: bodyMetrics.slice(-6).map((m: any) => m.weight || 0), color: () => colors.primary },
                      { data: bodyMetrics.slice(-6).map((m: any) => m.bodyFatPercent || 0), color: () => colors.warning },
                    ],
                    legend: ["Weight (lbs)", "Body Fat (%)"]
                  }}
                  width={screenWidth - 48}
                  height={220}
                  chartConfig={{
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    decimalPlaces: 1,
                    color: (opacity = 1) => colors.primary,
                    labelColor: (opacity = 1) => colors.muted,
                    style: { borderRadius: 16 }
                  }}
                  bezier
                  style={{ marginVertical: 8, borderRadius: 16 }}
                />
              )}
            </View>
          )}

          {/* Info Card */}
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <Text className="text-sm text-foreground text-center font-semibold mb-2">
              Fitness2Witness
            </Text>
            <Text className="text-xs text-muted text-center">
              12 Weeks of Faith & Fitness Challenge
            </Text>
          </View>

          {/* Export Stats Button */}
          <TouchableOpacity
            onPress={() => {
              const statsText = `Fitness2Witness Progress Report\n\n` +
                `Name: ${user?.name}\n` +
                `This Week: ${metrics?.thisWeekTotal || 0}/38 points\n` +
                `Total: ${metrics?.totalPoints || 0}/456 points\n` +
                `Completion: ${Math.round(metrics?.overallPercent || 0)}%\n` +
                `Badges Earned: ${badges?.length || 0}\n\n` +
                `Generated: ${new Date().toLocaleDateString()}`;
              
              Alert.alert(
                "Export Stats",
                "Copy your progress summary to share or save.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Copy",
                    onPress: () => {
                      // In a real app, use Clipboard API
                      Alert.alert("Stats Summary", statsText);
                    },
                  },
                ]
              );
            }}
            className="bg-success px-6 py-4 rounded-full active:opacity-80"
          >
            <Text className="text-background text-center font-semibold text-lg">📊 Export Stats</Text>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-error px-6 py-4 rounded-full active:opacity-80"
          >
            <Text className="text-background text-center font-semibold text-lg">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
