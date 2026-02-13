import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";

export default function CheckinHistoryScreen() {
  const router = useRouter();
  const { data: checkins, isLoading } = trpc.checkins.getMyCheckins.useQuery();

  const renderWorkoutAnalysis = (analysisJson: string | null) => {
    if (!analysisJson) return null;

    try {
      const analysis = JSON.parse(analysisJson);
      return (
        <View className="mt-2 bg-primary/10 rounded-lg p-3 border border-primary/20">
          <Text className="text-xs font-semibold text-foreground mb-1">🤖 AI Workout Analysis</Text>
          {analysis.summary && (
            <Text className="text-xs text-muted mb-2">{analysis.summary}</Text>
          )}
          <View className="flex-row flex-wrap gap-2">
            {analysis.duration && (
              <View className="bg-surface px-2 py-1 rounded">
                <Text className="text-xs text-foreground">⏱️ {analysis.duration} min</Text>
              </View>
            )}
            {analysis.intensity && (
              <View className="bg-surface px-2 py-1 rounded">
                <Text className="text-xs text-foreground">💪 {analysis.intensity}</Text>
              </View>
            )}
            {analysis.estimatedCalories && (
              <View className="bg-surface px-2 py-1 rounded">
                <Text className="text-xs text-foreground">🔥 {analysis.estimatedCalories} cal</Text>
              </View>
            )}
          </View>
          {analysis.exercises && analysis.exercises.length > 0 && (
            <Text className="text-xs text-muted mt-2">
              Exercises: {analysis.exercises.join(", ")}
            </Text>
          )}
        </View>
      );
    } catch {
      return null;
    }
  };

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 gap-6">
        {/* Header */}
        <View>
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground">Check-In History</Text>
          <Text className="text-base text-muted mt-2">View your past check-ins and workouts</Text>
        </View>

        {/* History List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        ) : !checkins || checkins.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted text-center">No check-ins yet</Text>
          </View>
        ) : (
          <FlatList
            data={checkins}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const date = new Date(item.day);
              const points = [item.nutritionDone, item.hydrationDone, item.movementDone, item.scriptureDone].filter(Boolean).length;

              return (
                <View className="bg-surface rounded-2xl p-4 mb-3 border border-border">
                  {/* Date and Points */}
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-base font-semibold text-foreground">
                      {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </Text>
                    <Text className="text-sm font-semibold text-primary">{points} / 4 points</Text>
                  </View>

                  {/* Categories */}
                  <View className="flex-row flex-wrap gap-2 mb-3">
                    {item.nutritionDone && (
                      <View className="bg-primary/10 px-2 py-1 rounded">
                        <Text className="text-xs text-foreground">🥗 Nutrition</Text>
                      </View>
                    )}
                    {item.hydrationDone && (
                      <View className="bg-primary/10 px-2 py-1 rounded">
                        <Text className="text-xs text-foreground">💧 Hydration</Text>
                      </View>
                    )}
                    {item.movementDone && (
                      <View className="bg-primary/10 px-2 py-1 rounded">
                        <Text className="text-xs text-foreground">🏃 Movement</Text>
                      </View>
                    )}
                    {item.scriptureDone && (
                      <View className="bg-primary/10 px-2 py-1 rounded">
                        <Text className="text-xs text-foreground">📖 Scripture</Text>
                      </View>
                    )}
                  </View>

                  {/* Notes */}
                  {item.notes && (
                    <View className="mb-2">
                      <Text className="text-xs text-muted">{item.notes}</Text>
                    </View>
                  )}

                  {/* Workout Log */}
                  {item.workoutLog && (
                    <View className="mb-2">
                      <Text className="text-xs font-semibold text-foreground mb-1">Workout:</Text>
                      <Text className="text-xs text-muted">{item.workoutLog}</Text>
                      {renderWorkoutAnalysis(item.workoutAnalysis)}
                    </View>
                  )}

                  {/* Proof Photo */}
                  {item.proofPhotoUrl && (
                    <Image
                      source={{ uri: item.proofPhotoUrl }}
                      className="w-full h-32 rounded-lg mt-2"
                      resizeMode="cover"
                    />
                  )}
                </View>
              );
            }}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
