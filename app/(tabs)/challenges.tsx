import { ScrollView, Text, View, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router } from "expo-router";

export default function ChallengesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: user } = trpc.auth.me.useQuery();
  const { data: challenges = [], refetch } = trpc.groupChallenges.getAll.useQuery();
  const joinChallenge = trpc.groupChallenges.join.useMutation();

  const isLeaderOrAdmin = user?.role === "leader" || user?.role === "admin";

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleJoinChallenge = async (challengeId: number) => {
    try {
      await joinChallenge.mutateAsync({ challengeId });
      Alert.alert("Success", "You've joined the challenge!");
      refetch();
    } catch (error) {
      Alert.alert("Error", "Failed to join challenge");
    }
  };

  const activeChallenges = challenges.filter((c) => {
    const now = new Date();
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);
    return now >= start && now <= end;
  });

  const upcomingChallenges = challenges.filter((c) => {
    const now = new Date();
    const start = new Date(c.startDate);
    return now < start;
  });

  const pastChallenges = challenges.filter((c) => {
    const now = new Date();
    const end = new Date(c.endDate);
    return now > end;
  });

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Group Challenges</Text>
          <Text className="text-base text-muted">Compete and grow together</Text>
        </View>

        {/* Create Challenge Button (Leaders/Admins only) */}
        {isLeaderOrAdmin && (
          <TouchableOpacity
            className="bg-primary rounded-xl p-4 mb-6 active:opacity-80"
            onPress={() => router.push("/create-challenge")}
          >
            <Text className="text-white text-center font-semibold text-lg">+ Create New Challenge</Text>
          </TouchableOpacity>
        )}

        {/* Active Challenges */}
        {activeChallenges.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-foreground mb-3">🔥 Active Challenges</Text>
            {activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onJoin={handleJoinChallenge}
                status="active"
              />
            ))}
          </View>
        )}

        {/* Upcoming Challenges */}
        {upcomingChallenges.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-foreground mb-3">📅 Upcoming Challenges</Text>
            {upcomingChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onJoin={handleJoinChallenge}
                status="upcoming"
              />
            ))}
          </View>
        )}

        {/* Past Challenges */}
        {pastChallenges.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-foreground mb-3">✅ Past Challenges</Text>
            {pastChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} status="past" />
            ))}
          </View>
        )}

        {/* Empty State */}
        {challenges.length === 0 && (
          <View className="items-center justify-center py-12">
            <Text className="text-6xl mb-4">🏆</Text>
            <Text className="text-xl font-semibold text-foreground mb-2">No Challenges Yet</Text>
            <Text className="text-base text-muted text-center">
              {isLeaderOrAdmin
                ? "Create the first challenge to get your group motivated!"
                : "Check back soon for upcoming challenges"}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function ChallengeCard({
  challenge,
  onJoin,
  status,
}: {
  challenge: any;
  onJoin?: (id: number) => void;
  status: "active" | "upcoming" | "past";
}) {
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
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <TouchableOpacity
      className="bg-surface rounded-xl p-4 mb-3 border border-border active:opacity-80"
      onPress={() => router.push(`/challenge-detail?id=${challenge.id}`)}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-2xl mr-2">{getChallengeIcon(challenge.challengeType)}</Text>
            <Text className="text-lg font-bold text-foreground flex-1">{challenge.title}</Text>
          </View>
          {challenge.description && (
            <Text className="text-sm text-muted mb-2">{challenge.description}</Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xs text-muted">
            {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
          </Text>
          {challenge.goalValue && challenge.goalUnit && (
            <Text className="text-sm text-foreground font-semibold mt-1">
              Goal: {challenge.goalValue} {challenge.goalUnit}
            </Text>
          )}
        </View>

        {status === "active" && onJoin && (
          <TouchableOpacity
            className="bg-primary px-4 py-2 rounded-lg active:opacity-80"
            onPress={(e) => {
              e.stopPropagation();
              onJoin(challenge.id);
            }}
          >
            <Text className="text-white font-semibold text-sm">Join</Text>
          </TouchableOpacity>
        )}

        {status === "upcoming" && (
          <View className="bg-warning/20 px-3 py-1 rounded-lg">
            <Text className="text-warning font-semibold text-xs">Upcoming</Text>
          </View>
        )}

        {status === "past" && (
          <View className="bg-muted/20 px-3 py-1 rounded-lg">
            <Text className="text-muted font-semibold text-xs">Completed</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
