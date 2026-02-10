import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

type Period = "week" | "overall";

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState<Period>("week");

  const { data: leaderboard, isLoading, refetch } = trpc.metrics.getGroupLeaderboard.useQuery({ period });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 gap-6">
        {/* Header */}
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-foreground">Leaderboard</Text>
          <Text className="text-base text-muted">See how your group is doing</Text>
        </View>

        {/* Period Selector */}
        <View className="flex-row bg-surface rounded-full p-1">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-full ${period === "week" ? "bg-primary" : ""}`}
            onPress={() => setPeriod("week")}
          >
            <Text className={`text-center font-semibold ${period === "week" ? "text-background" : "text-muted"}`}>
              This Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 py-3 rounded-full ${period === "overall" ? "bg-primary" : ""}`}
            onPress={() => setPeriod("overall")}
          >
            <Text className={`text-center font-semibold ${period === "overall" ? "text-background" : "text-muted"}`}>
              Overall
            </Text>
          </TouchableOpacity>
        </View>

        {/* Leaderboard List */}
        {isLoading && !leaderboard ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
            <Text className="text-base text-muted mt-4">Loading leaderboard...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {!leaderboard || leaderboard.length === 0 ? (
              <View className="flex-1 items-center justify-center py-12">
                <Text className="text-xl font-semibold text-muted">No rankings yet</Text>
                <Text className="text-sm text-muted mt-2">Complete check-ins to appear on the leaderboard!</Text>
              </View>
            ) : (
              <View className="gap-3">
                {leaderboard.map((entry, index) => (
                  <View
                    key={entry.userId}
                    className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-4">
                      <View className={`w-10 h-10 rounded-full items-center justify-center ${
                        index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-orange-600" : "bg-muted"
                      }`}>
                        <Text className="text-lg font-bold text-background">{index + 1}</Text>
                      </View>
                      <Text className="text-base font-semibold text-foreground">{entry.name}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-primary">{entry.points} pts</Text>
                      <Text className="text-xs text-muted">of {entry.maxPoints}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}
