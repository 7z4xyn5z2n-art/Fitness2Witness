import { View, Text, ScrollView, RefreshControl, TouchableOpacity, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";

type Period = "week" | "overall";

// Mock leaderboard data
const mockLeaderboard = [
  { id: 1, name: "Demo User 1", points: 38, rank: 1 },
  { id: 2, name: "Demo User 2", points: 35, rank: 2 },
  { id: 3, name: "Demo User 3", points: 32, rank: 3 },
];

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState<Period>("week");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const leaderboard = mockLeaderboard;

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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View className="gap-3">
            {leaderboard.map((entry, index) => (
              <View
                key={entry.id}
                className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-4">
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${
                    index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-orange-600" : "bg-muted"
                  }`}>
                    <Text className="text-lg font-bold text-background">{entry.rank}</Text>
                  </View>
                  <Text className="text-base font-semibold text-foreground">{entry.name}</Text>
                </View>
                <Text className="text-lg font-bold text-primary">{entry.points} pts</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
