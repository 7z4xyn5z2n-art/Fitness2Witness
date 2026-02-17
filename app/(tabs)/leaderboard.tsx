import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { trpc } from "@/lib/trpc";

type Period = "day" | "week" | "overall";

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState<Period>("week");

  const { data: leaderboard, isLoading, refetch } = trpc.metrics.getGroupLeaderboard.useQuery({ period });

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch, period])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getTopThreeStyle = (index: number) => {
    if (index === 0) {
      return {
        badge: "bg-yellow-500",
        border: "border-yellow-500 border-2",
        trophy: "🥇",
        shadow: "shadow-lg",
      };
    }
    if (index === 1) {
      return {
        badge: "bg-gray-400",
        border: "border-gray-400 border-2",
        trophy: "🥈",
        shadow: "shadow-md",
      };
    }
    if (index === 2) {
      return {
        badge: "bg-orange-600",
        border: "border-orange-600 border-2",
        trophy: "🥉",
        shadow: "shadow-md",
      };
    }
    return {
      badge: "bg-muted",
      border: "border-border",
      trophy: "",
      shadow: "",
    };
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
            className={`flex-1 py-3 rounded-full ${period === "day" ? "bg-primary" : ""}`}
            onPress={() => setPeriod("day")}
          >
            <Text className={`text-center font-semibold ${period === "day" ? "text-background" : "text-muted"}`}>
              Day
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-3 rounded-full ${period === "week" ? "bg-primary" : ""}`}
            onPress={() => setPeriod("week")}
          >
            <Text className={`text-center font-semibold ${period === "week" ? "text-background" : "text-muted"}`}>
              Week
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
                {leaderboard.map((entry, index) => {
                  const style = getTopThreeStyle(index);
                  const isTopThree = index < 3;

                  return (
                    <View
                      key={entry.userId}
                      className={`bg-surface rounded-2xl ${isTopThree ? "p-5" : "p-4"} border ${style.border} ${style.shadow} flex-row items-center justify-between`}
                    >
                      <View className="flex-row items-center gap-4">
                        {/* Rank Badge */}
                        <View className={`${isTopThree ? "w-14 h-14" : "w-10 h-10"} rounded-full items-center justify-center ${style.badge}`}>
                          <Text className={`${isTopThree ? "text-2xl" : "text-lg"} font-bold text-background`}>
                            {index + 1}
                          </Text>
                        </View>
                        
                        {/* Name with Trophy */}
                        <View>
                          <View className="flex-row items-center gap-2">
                            {style.trophy && <Text className="text-2xl">{style.trophy}</Text>}
                            <Text className={`${isTopThree ? "text-lg" : "text-base"} font-bold text-foreground`}>
                              {entry.name}
                            </Text>
                          </View>
                          {isTopThree && (
                            <Text className="text-xs text-muted mt-1">
                              {index === 0 ? "🏆 Top Performer" : index === 1 ? "🌟 Runner Up" : "💪 Bronze Medal"}
                            </Text>
                          )}
                        </View>
                      </View>
                      
                      {/* Points */}
                      <View className="items-end">
                        <Text className={`${isTopThree ? "text-2xl" : "text-lg"} font-bold text-primary`}>
                          {entry.points}
                        </Text>
                        <Text className="text-xs text-muted">of {entry.maxPoints} pts</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}
