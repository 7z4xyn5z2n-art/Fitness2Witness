import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BadgeNotification } from "@/components/badge-notification";

type CategoryPhotos = {
  nutrition: { uri: string; base64: string } | null;
  hydration: { uri: string; base64: string } | null;
  movement: { uri: string; base64: string } | null;
  scripture: { uri: string; base64: string } | null;
};

export default function CheckinScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  
  // Date selection state (must be before queries that use it)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch user targets from InBody scan
  const { data: targets } = trpc.bodyMetrics.getMyTargets.useQuery();

  // Fetch existing check-in for selected date
  const { data: existingForDate, refetch: refetchForDate } = trpc.checkins.getByDate.useQuery(
    { date: selectedDate.toISOString() }
  );

  const [nutritionDone, setNutritionDone] = useState(false);
  const [hydrationDone, setHydrationDone] = useState(false);
  const [movementDone, setMovementDone] = useState(false);
  const [scriptureDone, setScriptureDone] = useState(false);
  
  // Enhanced nutrition tracking
  const [carbCount, setCarbCount] = useState("");
  
  // Enhanced movement tracking
  const [workoutType, setWorkoutType] = useState("");
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [workoutIntensity, setWorkoutIntensity] = useState<"low" | "moderate" | "high">("moderate");
  
  const [notes, setNotes] = useState("");
  const [categoryPhotos, setCategoryPhotos] = useState<CategoryPhotos>({
    nutrition: null,
    hydration: null,
    movement: null,
    scripture: null,
  });
  
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState<any>(null);

  const checkBadgesMutation = trpc.badges.checkAndAward.useMutation();

  // Populate UI states when selectedDate or existingForDate changes
  useEffect(() => {
    if (!existingForDate) {
      setNutritionDone(false);
      setHydrationDone(false);
      setMovementDone(false);
      setScriptureDone(false);
      setNotes("");
      setWorkoutType("");
      setWorkoutDuration("");
      setCarbCount("");
      setCategoryPhotos({ nutrition: null, hydration: null, movement: null, scripture: null });
      return;
    }

    setNutritionDone(!!existingForDate.nutritionDone);
    setHydrationDone(!!existingForDate.hydrationDone);
    setMovementDone(!!existingForDate.movementDone);
    setScriptureDone(!!existingForDate.scriptureDone);
    setNotes(existingForDate.notes ?? "");
    // do not auto-load photos or workout details (user can re-enter if editing)
  }, [selectedDate, existingForDate]);

  const submitMutation = trpc.checkins.submit.useMutation({
    onSuccess: async () => {
      // Invalidate queries to refresh data
      await utils.checkins.getTodayCheckin.invalidate();
      await utils.checkins.getMyCheckins.invalidate();
      await utils.metrics.getMyMetrics.invalidate();
      
      // Check for new badges
      try {
        const newBadges = await checkBadgesMutation.mutateAsync();
        if (newBadges && newBadges.length > 0) {
          await utils.badges.getMyBadges.invalidate();
          const badge = newBadges[0];
          setEarnedBadge(badge);
          setShowBadgeNotification(true);
          
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          // Badge notification will handle navigation when dismissed
          return;
        }
      } catch (error) {
        // Silently fail badge check
        console.warn("Badge check failed:", error);
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Navigate to community feed after successful check-in
      router.push("/community");
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to submit check-in. Please try again.");
    },
  });

  const totalPoints = [nutritionDone, hydrationDone, movementDone, scriptureDone].filter(Boolean).length;

  const handleToggle = (setter: (value: boolean) => void, currentValue: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setter(!currentValue);
  };

  const handleTakePhoto = async (category: keyof CategoryPhotos) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera permission is required to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setCategoryPhotos(prev => ({
        ...prev,
        [category]: {
          uri: result.assets[0].uri,
          base64: result.assets[0].base64 || "",
        }
      }));
    }
  };

  const handleChoosePhoto = async (category: keyof CategoryPhotos) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Photo library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setCategoryPhotos(prev => ({
        ...prev,
        [category]: {
          uri: result.assets[0].uri,
          base64: result.assets[0].base64 || "",
        }
      }));
    }
  };

  const handleSubmit = () => {
    // Build workout log from detailed inputs
    let workoutLog = "";
    if (workoutType || workoutDuration || workoutIntensity) {
      workoutLog = `Type: ${workoutType || "Not specified"}, Duration: ${workoutDuration || "Not specified"} min, Intensity: ${workoutIntensity}`;
    }

    // Build combined notes with nutrition details
    let combinedNotes = notes;
    if (carbCount) {
      const nutritionNote = `Carbs: ${carbCount}g`;
      combinedNotes = combinedNotes ? `${combinedNotes}\n${nutritionNote}` : nutritionNote;
    }

    submitMutation.mutate({
      date: selectedDate.toISOString(),
      nutritionDone,
      hydrationDone,
      movementDone,
      scriptureDone,
      notes: combinedNotes || undefined,
      // For now, send the first available photo (we'll need to update backend to support multiple photos)
      proofPhotoBase64: categoryPhotos.nutrition?.base64 || categoryPhotos.hydration?.base64 || categoryPhotos.movement?.base64 || categoryPhotos.scripture?.base64 || undefined,
      workoutLog: workoutLog || undefined,
    });
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View>
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-primary text-base">← Back</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground">Daily Check-In</Text>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              className="mt-2 flex-row items-center gap-2"
            >
              <Text className="text-base text-muted">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </Text>
              <Text className="text-primary text-sm">(tap to change)</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (date) setSelectedDate(date);
                }}
              />
            )}
          </View>

          {/* Categories with Photos */}
          <View className="gap-6">
            {/* Nutrition */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <TouchableOpacity
                onPress={() => handleToggle(setNutritionDone, nutritionDone)}
                className={`flex-row items-center p-4 rounded-xl border-2 ${nutritionDone ? "border-primary bg-muted" : "border-border"}`}
              >
                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${nutritionDone ? "border-primary bg-primary" : "border-muted"}`}>
                  {nutritionDone && <Text className="text-background text-sm">✓</Text>}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">🥗 Nutrition</Text>
                  <Text className="text-sm text-muted">Healthy eating today</Text>
                </View>
                <Text className="text-sm font-bold text-primary">1 pt</Text>
              </TouchableOpacity>

              {nutritionDone && (
                <View className="mt-4 gap-3">
                  <View>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-semibold text-foreground">Carb Count (Optional)</Text>
                      {targets?.recommendedCarbs && carbCount && (
                        <Text className="text-xs text-primary font-semibold">
                          {carbCount}g / {targets.recommendedCarbs}g target
                        </Text>
                      )}
                    </View>
                    <TextInput
                      value={carbCount}
                      onChangeText={setCarbCount}
                      placeholder={targets?.recommendedCarbs ? `Target: ${targets.recommendedCarbs}g per day` : "Enter carbs in grams..."}
                      placeholderTextColor="#9BA1A6"
                      keyboardType="numeric"
                      className="bg-background border border-border rounded-xl p-3 text-foreground"
                    />
                    {targets?.recommendedCarbs && carbCount && (
                      <View className="mt-2">
                        <View className="h-2 bg-border rounded-full overflow-hidden">
                          <View 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min((parseFloat(carbCount) / targets.recommendedCarbs) * 100, 100)}%` }}
                          />
                        </View>
                        <Text className="text-xs text-muted mt-1">
                          {((parseFloat(carbCount) / targets.recommendedCarbs) * 100).toFixed(0)}% of daily target
                        </Text>
                      </View>
                    )}
                  </View>

                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">Proof Photo</Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity onPress={() => handleTakePhoto('nutrition')} className="flex-1 bg-background border border-border rounded-xl p-3 items-center">
                        <Text className="text-foreground text-sm">📷 Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleChoosePhoto('nutrition')} className="flex-1 bg-background border border-border rounded-xl p-3 items-center">
                        <Text className="text-foreground text-sm">🖼️ Gallery</Text>
                      </TouchableOpacity>
                    </View>
                    {categoryPhotos.nutrition && (
                      <Image source={{ uri: categoryPhotos.nutrition.uri }} className="w-full h-32 rounded-xl mt-2" resizeMode="cover" />
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Hydration */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <TouchableOpacity
                onPress={() => handleToggle(setHydrationDone, hydrationDone)}
                className={`flex-row items-center p-4 rounded-xl border-2 ${hydrationDone ? "border-primary bg-muted" : "border-border"}`}
              >
                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${hydrationDone ? "border-primary bg-primary" : "border-muted"}`}>
                  {hydrationDone && <Text className="text-background text-sm">✓</Text>}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">💧 Hydration</Text>
                  <Text className="text-sm text-muted">Adequate water intake</Text>
                </View>
                <Text className="text-sm font-bold text-primary">1 pt</Text>
              </TouchableOpacity>

              {hydrationDone && (
                <View className="mt-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">Proof Photo</Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity onPress={() => handleTakePhoto('hydration')} className="flex-1 bg-background border border-border rounded-xl p-3 items-center">
                      <Text className="text-foreground text-sm">📷 Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleChoosePhoto('hydration')} className="flex-1 bg-background border border-border rounded-xl p-3 items-center">
                      <Text className="text-foreground text-sm">🖼️ Gallery</Text>
                    </TouchableOpacity>
                  </View>
                  {categoryPhotos.hydration && (
                    <Image source={{ uri: categoryPhotos.hydration.uri }} className="w-full h-32 rounded-xl mt-2" resizeMode="cover" />
                  )}
                </View>
              )}
            </View>

            {/* Movement */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <TouchableOpacity
                onPress={() => handleToggle(setMovementDone, movementDone)}
                className={`flex-row items-center p-4 rounded-xl border-2 ${movementDone ? "border-primary bg-muted" : "border-border"}`}
              >
                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${movementDone ? "border-primary bg-primary" : "border-muted"}`}>
                  {movementDone && <Text className="text-background text-sm">✓</Text>}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">🏃 Movement</Text>
                  <Text className="text-sm text-muted">Exercise or activity</Text>
                </View>
                <Text className="text-sm font-bold text-primary">1 pt</Text>
              </TouchableOpacity>

              {movementDone && (
                <View className="mt-4 gap-3">
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">Workout Type</Text>
                    <TextInput
                      value={workoutType}
                      onChangeText={setWorkoutType}
                      placeholder="e.g., Running, Weightlifting, Yoga..."
                      placeholderTextColor="#9BA1A6"
                      className="bg-background border border-border rounded-xl p-3 text-foreground"
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">Duration (minutes)</Text>
                    <TextInput
                      value={workoutDuration}
                      onChangeText={setWorkoutDuration}
                      placeholder="e.g., 30"
                      placeholderTextColor="#9BA1A6"
                      keyboardType="numeric"
                      className="bg-background border border-border rounded-xl p-3 text-foreground"
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">Intensity</Text>
                    <View className="flex-row gap-2">
                      {(["low", "moderate", "high"] as const).map((intensity) => (
                        <TouchableOpacity
                          key={intensity}
                          onPress={() => setWorkoutIntensity(intensity)}
                          className={`flex-1 p-3 rounded-xl border-2 ${workoutIntensity === intensity ? "border-primary bg-muted" : "border-border bg-background"}`}
                        >
                          <Text className={`text-center text-sm font-semibold ${workoutIntensity === intensity ? "text-primary" : "text-muted"}`}>
                            {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">Proof Photo</Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity onPress={() => handleTakePhoto('movement')} className="flex-1 bg-background border border-border rounded-xl p-3 items-center">
                        <Text className="text-foreground text-sm">📷 Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleChoosePhoto('movement')} className="flex-1 bg-background border border-border rounded-xl p-3 items-center">
                        <Text className="text-foreground text-sm">🖼️ Gallery</Text>
                      </TouchableOpacity>
                    </View>
                    {categoryPhotos.movement && (
                      <Image source={{ uri: categoryPhotos.movement.uri }} className="w-full h-32 rounded-xl mt-2" resizeMode="cover" />
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Scripture */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <TouchableOpacity
                onPress={() => handleToggle(setScriptureDone, scriptureDone)}
                className={`flex-row items-center p-4 rounded-xl border-2 ${scriptureDone ? "border-primary bg-muted" : "border-border"}`}
              >
                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${scriptureDone ? "border-primary bg-primary" : "border-muted"}`}>
                  {scriptureDone && <Text className="text-background text-sm">✓</Text>}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">📖 Scripture/Prayer</Text>
                  <Text className="text-sm text-muted">Devotional time</Text>
                </View>
                <Text className="text-sm font-bold text-primary">1 pt</Text>
              </TouchableOpacity>

              {scriptureDone && (
                <View className="mt-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">Proof Photo</Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity onPress={() => handleTakePhoto('scripture')} className="flex-1 bg-background border border-border rounded-xl p-3 items-center">
                      <Text className="text-foreground text-sm">📷 Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleChoosePhoto('scripture')} className="flex-1 bg-background border border-border rounded-xl p-3 items-center">
                      <Text className="text-foreground text-sm">🖼️ Gallery</Text>
                    </TouchableOpacity>
                  </View>
                  {categoryPhotos.scripture && (
                    <Image source={{ uri: categoryPhotos.scripture.uri }} className="w-full h-32 rounded-xl mt-2" resizeMode="cover" />
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Points Summary */}
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <Text className="text-center text-lg font-bold text-foreground">
              Today's Total: {totalPoints} / 4 points
            </Text>
          </View>

          {/* General Notes */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">General Notes (Optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about your day..."
              placeholderTextColor="#9BA1A6"
              multiline
              numberOfLines={3}
              className="bg-surface border border-border rounded-xl p-4 text-foreground"
              style={{ textAlignVertical: "top" }}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitMutation.isPending}
            className="bg-primary px-6 py-4 rounded-full active:opacity-80"
          >
            {submitMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-background text-center font-semibold text-lg">Submit Check-In</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Badge Notification Modal */}
      {earnedBadge && (
        <BadgeNotification
          visible={showBadgeNotification}
          badgeName={earnedBadge.badgeName}
          badgeEmoji={earnedBadge.badgeEmoji}
          badgeDescription={earnedBadge.badgeDescription}
          onDismiss={() => {
            setShowBadgeNotification(false);
            router.push("/community");
          }}
        />
      )}
    </ScreenContainer>
  );
}
