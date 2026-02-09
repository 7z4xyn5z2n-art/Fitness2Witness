import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams();
  const challengeId = parseInt(id as string);

  const [refreshing, setRefreshing] = useState(false);
  const [progressValue, setProgressValue] = useState("");
  const [progressNotes, setProgressNotes] = useState("");

  const { data: challenges = [], refetch: refetchChallenges } = trpc.groupChallenges.getAll.useQuery();
  const { data: leaderboard = [], refetch: refetchLeaderboard } = trpc.groupChallenges.getLeaderboard.useQuery(
    { challengeId },
    { enabled: !!challengeId }
  );
  const { data: myProgress = [], refetch: refetchProgress } = trpc.groupChallenges.getMyProgress.useQuery(
    { challengeId },
    { enabled: !!challengeId }
  );

  const logProgress = trpc.groupChallenges.logProgress.useMutation();

  const challenge = challenges.find((c) => c.id === challengeId);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchChallenges(), refetchLeaderboard(), refetchProgress()]);
    setRefreshing(false);
  };

  const handleLogProgress = async () => {
    if (!progressValue.trim()) {
      Alert.alert("Error", "Please enter a progress value");
      return;
    }

    try {
      await logProgress.mutateAsync({
        challengeId,
        currentValue: parseFloat(progressValue),
        notes: progressNotes.trim() || undefined,
      });

      Alert.alert("Success", "Progress logged!");
      setProgressValue("");
      setProgressNotes("");
      refetchLeaderboard();
      refetchProgress();
    } catch (error) {
      Alert.alert("Error", "Failed to log progress");
    }
  };

  if (!challenge) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold text-foreground">Challenge not found</Text>
      </ScreenContainer>
    );
  }

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case "running":
        return "🏃";
      case "steps":
        return "👟";
      case "workouts":
        return "💪";
      default:
        return "🎯";
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const myTotal = myProgress.reduce((sum, p) => sum + (p.currentValue || 0), 0);

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-primary text-base">← Back</Text>
        </TouchableOpacity>

        {/* Challenge Header */}
        <View className="bg-surface rounded-xl p-6 mb-6 border border-border">
          <View className="flex-row items-center mb-3">
            <Text className="text-4xl mr-3">{getChallengeIcon(challenge.challengeType)}</Text>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">{challenge.title}</Text>
            </View>
          </View>

          {challenge.description && (
            <Text className="text-base text-muted mb-4">{challenge.description}</Text>
          )}

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-muted mb-1">Duration</Text>
              <Text className="text-sm text-foreground font-semibold">
                {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
              </Text>
            </View>
            {challenge.goalValue && challenge.goalUnit && (
              <View className="items-end">
                <Text className="text-xs text-muted mb-1">Goal</Text>
                <Text className="text-sm text-foreground font-semibold">
                  {challenge.goalValue} {challenge.goalUnit}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* My Progress */}
        <View className="bg-surface rounded-xl p-6 mb-6 border border-border">
          <Text className="text-xl font-bold text-foreground mb-4">📊 My Progress</Text>

          <View className="bg-primary/10 rounded-xl p-4 mb-4">
            <Text className="text-sm text-muted mb-1">Total Progress</Text>
            <Text className="text-3xl font-bold text-primary">
              {myTotal.toFixed(1)} {challenge.goalUnit || ""}
            </Text>
            {challenge.goalValue && (
              <Text className="text-sm text-muted mt-1">
                {((myTotal / challenge.goalValue) * 100).toFixed(0)}% of goal
              </Text>
            )}
          </View>

          {/* Log Progress */}
          <Text className="text-sm font-semibold text-foreground mb-2">Log New Progress</Text>
          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="flex-1 bg-background border border-border rounded-xl p-3 text-foreground"
              placeholder={`Enter ${challenge.goalUnit || "value"}`}
              placeholderTextColor="#9BA1A6"
              value={progressValue}
              onChangeText={setProgressValue}
              keyboardType="numeric"
            />
            <TouchableOpacity
              className="bg-primary rounded-xl px-6 justify-center active:opacity-80"
              onPress={handleLogProgress}
              disabled={logProgress.isPending}
            >
              <Text className="text-white font-semibold">
                {logProgress.isPending ? "..." : "Log"}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            className="bg-background border border-border rounded-xl p-3 text-foreground"
            placeholder="Notes (optional)"
            placeholderTextColor="#9BA1A6"
            value={progressNotes}
            onChangeText={setProgressNotes}
          />
        </View>

        {/* Leaderboard */}
        <View className="bg-surface rounded-xl p-6 border border-border">
          <Text className="text-xl font-bold text-foreground mb-4">🏆 Leaderboard</Text>

          {leaderboard.length === 0 ? (
            <Text className="text-center text-muted py-8">No participants yet</Text>
          ) : (
            leaderboard.map((entry, index) => (
              <View
                key={entry.userId}
                className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0"
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                      index === 0
                        ? "bg-warning"
                        : index === 1
                        ? "bg-muted/30"
                        : index === 2
                        ? "bg-error/30"
                        : "bg-surface"
                    }`}
                  >
                    <Text className="font-bold text-foreground">{index + 1}</Text>
                  </View>
                  <Text className="text-base font-semibold text-foreground flex-1">
                    {entry.userName}
                  </Text>
                </View>
                <Text className="text-lg font-bold text-primary">
                  {entry.totalProgress?.toFixed(1) || 0} {challenge.goalUnit || ""}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
