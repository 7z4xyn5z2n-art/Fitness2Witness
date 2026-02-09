import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

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
            onPress={() => setPeriod("week")}
            className={`flex-1 py-3 rounded-full ${period === "week" ? "bg-primary" : ""}`}
          >
            <Text className={`text-center font-semibold ${period === "week" ? "text-background" : "text-foreground"}`}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPeriod("overall")}
            className={`flex-1 py-3 rounded-full ${period === "overall" ? "bg-primary" : ""}`}
          >
            <Text className={`text-center font-semibold ${period === "overall" ? "text-background" : "text-foreground"}`}>
              Overall
            </Text>
          </TouchableOpacity>
        </View>

        {/* Leaderboard List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={leaderboard}
            keyExtractor={(item, index) => `${item.userId}-${index}`}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item, index }) => {
              const percentage = (item.points / item.maxPoints) * 100;
              const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";

              return (
                <View className="bg-surface rounded-2xl p-4 mb-3 border border-border">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-2xl font-bold text-muted w-10">#{index + 1}</Text>
                    {medal && <Text className="text-2xl mr-2">{medal}</Text>}
                    <Text className="flex-1 text-lg font-semibold text-foreground">{item.name}</Text>
                    <Text className="text-lg font-bold text-primary">
                      {item.points} <Text className="text-sm text-muted">/ {item.maxPoints}</Text>
                    </Text>
                  </View>
                  <View className="h-2 bg-border rounded-full overflow-hidden">
                    <View className="h-full bg-primary" style={{ width: `${Math.min(100, percentage)}%` }} />
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Text className="text-muted text-center">No data available</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}
