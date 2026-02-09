import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router } from "expo-router";

export default function CreateChallengeScreen() {
  const { data: user } = trpc.auth.me.useQuery();
  const createChallenge = trpc.groupChallenges.create.useMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [challengeType, setChallengeType] = useState<"running" | "steps" | "workouts" | "custom">("workouts");
  const [goalValue, setGoalValue] = useState("");
  const [goalUnit, setGoalUnit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isLeaderOrAdmin = user?.role === "leader" || user?.role === "admin";

  if (!isLeaderOrAdmin) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold text-foreground mb-2">Access Denied</Text>
        <Text className="text-base text-muted text-center">Only leaders and admins can create challenges</Text>
      </ScreenContainer>
    );
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a challenge title");
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert("Error", "Please enter start and end dates (YYYY-MM-DD)");
      return;
    }

    try {
      await createChallenge.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        challengeType,
        goalValue: goalValue ? parseFloat(goalValue) : undefined,
        goalUnit: goalUnit.trim() || undefined,
        startDate,
        endDate,
      });

      Alert.alert("Success", "Challenge created successfully!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to create challenge");
    }
  };

  const challengeTypes = [
    { value: "running", label: "🏃 Running", units: "miles" },
    { value: "steps", label: "👟 Steps", units: "steps" },
    { value: "workouts", label: "💪 Workouts", units: "workouts" },
    { value: "custom", label: "🎯 Custom", units: "" },
  ];

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground mb-2">Create Challenge</Text>
          <Text className="text-base text-muted">Set up a new group challenge</Text>
        </View>

        {/* Challenge Title */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Challenge Title *</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl p-4 text-foreground"
            placeholder="e.g., 100 Mile March"
            placeholderTextColor="#9BA1A6"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Description</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl p-4 text-foreground"
            placeholder="What's this challenge about?"
            placeholderTextColor="#9BA1A6"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Challenge Type */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Challenge Type *</Text>
          <View className="flex-row flex-wrap gap-2">
            {challengeTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                className={`px-4 py-3 rounded-xl border ${
                  challengeType === type.value
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
                onPress={() => {
                  setChallengeType(type.value as any);
                  if (type.units) setGoalUnit(type.units);
                }}
              >
                <Text
                  className={`font-semibold ${
                    challengeType === type.value ? "text-white" : "text-foreground"
                  }`}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Goal */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Goal (Optional)</Text>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 bg-surface border border-border rounded-xl p-4 text-foreground"
              placeholder="Value"
              placeholderTextColor="#9BA1A6"
              value={goalValue}
              onChangeText={setGoalValue}
              keyboardType="numeric"
            />
            <TextInput
              className="flex-1 bg-surface border border-border rounded-xl p-4 text-foreground"
              placeholder="Unit (e.g., miles)"
              placeholderTextColor="#9BA1A6"
              value={goalUnit}
              onChangeText={setGoalUnit}
            />
          </View>
        </View>

        {/* Dates */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Start Date *</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl p-4 text-foreground mb-3"
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9BA1A6"
            value={startDate}
            onChangeText={setStartDate}
          />
          <Text className="text-sm font-semibold text-foreground mb-2">End Date *</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl p-4 text-foreground"
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9BA1A6"
            value={endDate}
            onChangeText={setEndDate}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className="bg-primary rounded-xl p-4 mt-6 active:opacity-80"
          onPress={handleSubmit}
          disabled={createChallenge.isPending}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {createChallenge.isPending ? "Creating..." : "Create Challenge"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
