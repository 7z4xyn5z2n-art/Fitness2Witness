import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";

export default function CreateChallengeScreen() {
  const { data: user } = trpc.auth.me.useQuery();
  const createChallenge = trpc.groupChallenges.create.useMutation();
  // TODO: Add getGroupMembers query when backend endpoint is ready
  // const { data: groupMembers } = trpc.users.getGroupMembers.useQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [challengeType, setChallengeType] = useState<"running" | "steps" | "workouts" | "custom">("workouts");
  const [goalValue, setGoalValue] = useState("");
  const [goalUnit, setGoalUnit] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 1 week from now
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [selectedInvites, setSelectedInvites] = useState<number[]>([]);

  // Mock group members for now - will be replaced with real API call
  const groupMembers = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" },
    { id: 3, name: "Mike Johnson" },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a challenge title");
      return;
    }

    if (startDate >= endDate) {
      Alert.alert("Error", "End date must be after start date");
      return;
    }

    if (visibility === "private" && selectedInvites.length === 0) {
      Alert.alert("Error", "Please select at least one person to invite for private challenges");
      return;
    }

    try {
      await createChallenge.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        challengeType,
        goalValue: goalValue ? parseFloat(goalValue) : undefined,
        goalUnit: goalUnit.trim() || undefined,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        // TODO: Add visibility and invites when backend supports it
        // visibility,
        // invitedUserIds: visibility === "private" ? selectedInvites : undefined,
      });

      Alert.alert(
        "Success", 
        visibility === "public" 
          ? "Challenge created and visible to all group members!" 
          : `Challenge created! Invitations sent to ${selectedInvites.length} member(s).`
      );
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to create challenge");
    }
  };

  const toggleInvite = (userId: number) => {
    setSelectedInvites(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
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
          <Text className="text-base text-muted">Set up a new challenge for your group</Text>
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
          <TouchableOpacity 
            onPress={() => setShowStartDatePicker(true)}
            className="bg-surface border border-border rounded-xl p-4 mb-3"
          >
            <Text className="text-foreground">{startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowStartDatePicker(Platform.OS === "ios");
                if (date) setStartDate(date);
              }}
            />
          )}

          <Text className="text-sm font-semibold text-foreground mb-2">End Date *</Text>
          <TouchableOpacity 
            onPress={() => setShowEndDatePicker(true)}
            className="bg-surface border border-border rounded-xl p-4"
          >
            <Text className="text-foreground">{endDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              minimumDate={startDate}
              onChange={(event, date) => {
                setShowEndDatePicker(Platform.OS === "ios");
                if (date) setEndDate(date);
              }}
            />
          )}
        </View>

        {/* Visibility */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Who can join? *</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className={`flex-1 px-4 py-3 rounded-xl border ${
                visibility === "public"
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
              }`}
              onPress={() => setVisibility("public")}
            >
              <Text className={`text-center font-semibold ${visibility === "public" ? "text-white" : "text-foreground"}`}>
                🌍 Everyone in Group
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 px-4 py-3 rounded-xl border ${
                visibility === "private"
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
              }`}
              onPress={() => setVisibility("private")}
            >
              <Text className={`text-center font-semibold ${visibility === "private" ? "text-white" : "text-foreground"}`}>
                🔒 Invite Only
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Invite List (only for private challenges) */}
        {visibility === "private" && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Select People to Invite</Text>
            <View className="bg-surface border border-border rounded-xl p-4">
              {groupMembers.length > 0 ? (
                groupMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    className="flex-row items-center py-3 border-b border-border last:border-b-0"
                    onPress={() => toggleInvite(member.id)}
                  >
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                      selectedInvites.includes(member.id) ? "border-primary bg-primary" : "border-muted"
                    }`}>
                      {selectedInvites.includes(member.id) && <Text className="text-background text-sm">✓</Text>}
                    </View>
                    <Text className="text-foreground">{member.name}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text className="text-muted text-center py-4">No group members available</Text>
              )}
            </View>
            {selectedInvites.length > 0 && (
              <Text className="text-sm text-muted mt-2">
                {selectedInvites.length} member(s) selected
              </Text>
            )}
          </View>
        )}

        {/* Info Card */}
        <View className="bg-primary/10 rounded-xl p-4 border border-primary/20 mb-4">
          <Text className="text-sm text-foreground">
            💡 <Text className="font-semibold">Tip:</Text> {visibility === "public" 
              ? "All group members will see this challenge and can join anytime." 
              : "Only invited members will receive a notification and can accept or decline."}
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className="bg-primary rounded-xl p-4 mt-2 active:opacity-80"
          onPress={handleSubmit}
          disabled={createChallenge.isPending}
        >
          {createChallenge.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Create Challenge
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
