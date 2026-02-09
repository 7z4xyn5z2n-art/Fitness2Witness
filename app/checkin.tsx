import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { BadgeNotification } from "@/components/badge-notification";

export default function CheckinScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [nutritionDone, setNutritionDone] = useState(false);
  const [hydrationDone, setHydrationDone] = useState(false);
  const [movementDone, setMovementDone] = useState(false);
  const [scriptureDone, setScriptureDone] = useState(false);
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [workoutLog, setWorkoutLog] = useState("");
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState<any>(null);

  const checkBadgesMutation = trpc.badges.checkAndAward.useMutation();

  const submitMutation = trpc.checkins.submit.useMutation({
    onSuccess: async () => {
      utils.checkins.getTodayCheckin.invalidate();
      utils.metrics.getMyMetrics.invalidate();
      
      // Check for new badges
      try {
        const newBadges = await checkBadgesMutation.mutateAsync();
        if (newBadges && newBadges.length > 0) {
          utils.badges.getMyBadges.invalidate();
          // Show badge notification for the first new badge
          const badge = newBadges[0];
          setEarnedBadge(badge);
          setShowBadgeNotification(true);
          
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          return; // Don't show success alert, badge notification will handle it
        }
      } catch (error) {
        // Silently fail badge check
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert("Success!", "Your check-in has been recorded.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const totalPoints = [nutritionDone, hydrationDone, movementDone, scriptureDone].filter(Boolean).length;

  const handleToggle = (setter: (value: boolean) => void, currentValue: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setter(!currentValue);
  };

  const handleTakePhoto = async () => {
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
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 || null);
    }
  };

  const handleChoosePhoto = async () => {
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
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 || null);
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate({
      date: new Date().toISOString(),
      nutritionDone,
      hydrationDone,
      movementDone,
      scriptureDone,
      notes: notes || undefined,
      proofPhotoBase64: photoBase64 || undefined,
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
            <Text className="text-base text-muted mt-2">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</Text>
          </View>

          {/* Categories */}
          <View className="bg-surface rounded-2xl p-6 shadow-sm border border-border gap-4">
            {/* Nutrition */}
            <TouchableOpacity
              onPress={() => handleToggle(setNutritionDone, nutritionDone)}
              className={`flex-row items-center p-4 rounded-xl border-2 ${nutritionDone ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${nutritionDone ? "border-primary bg-primary" : "border-muted"}`}>
                {nutritionDone && <Text className="text-background text-sm">✓</Text>}
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">Nutrition</Text>
                <Text className="text-sm text-muted">Healthy eating today</Text>
              </View>
              <Text className="text-sm font-bold text-primary">1 pt</Text>
            </TouchableOpacity>

            {/* Hydration */}
            <TouchableOpacity
              onPress={() => handleToggle(setHydrationDone, hydrationDone)}
              className={`flex-row items-center p-4 rounded-xl border-2 ${hydrationDone ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${hydrationDone ? "border-primary bg-primary" : "border-muted"}`}>
                {hydrationDone && <Text className="text-background text-sm">✓</Text>}
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">Hydration</Text>
                <Text className="text-sm text-muted">Adequate water intake</Text>
              </View>
              <Text className="text-sm font-bold text-primary">1 pt</Text>
            </TouchableOpacity>

            {/* Movement */}
            <TouchableOpacity
              onPress={() => handleToggle(setMovementDone, movementDone)}
              className={`flex-row items-center p-4 rounded-xl border-2 ${movementDone ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${movementDone ? "border-primary bg-primary" : "border-muted"}`}>
                {movementDone && <Text className="text-background text-sm">✓</Text>}
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">Movement/Fitness</Text>
                <Text className="text-sm text-muted">Exercise or activity</Text>
              </View>
              <Text className="text-sm font-bold text-primary">1 pt</Text>
            </TouchableOpacity>

            {/* Scripture */}
            <TouchableOpacity
              onPress={() => handleToggle(setScriptureDone, scriptureDone)}
              className={`flex-row items-center p-4 rounded-xl border-2 ${scriptureDone ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${scriptureDone ? "border-primary bg-primary" : "border-muted"}`}>
                {scriptureDone && <Text className="text-background text-sm">✓</Text>}
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">Scripture/Prayer</Text>
                <Text className="text-sm text-muted">Devotional time</Text>
              </View>
              <Text className="text-sm font-bold text-primary">1 pt</Text>
            </TouchableOpacity>
          </View>

          {/* Points Summary */}
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <Text className="text-center text-lg font-bold text-foreground">
              Today's Total: {totalPoints} / 4 points
            </Text>
          </View>

          {/* Notes */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">Notes (Optional)</Text>
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

          {/* Workout Log */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">Workout Details (Optional)</Text>
            <Text className="text-sm text-muted mb-2">Describe your workout for AI analysis (e.g., "30 min run, 5 miles" or "Bench press 3x10 @ 185lbs, squats 4x8 @ 225lbs")</Text>
            <TextInput
              value={workoutLog}
              onChangeText={setWorkoutLog}
              placeholder="Describe your workout..."
              placeholderTextColor="#9BA1A6"
              multiline
              numberOfLines={4}
              className="bg-surface border border-border rounded-xl p-4 text-foreground"
              style={{ textAlignVertical: "top" }}
            />
          </View>

          {/* Photo Upload */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">Proof Photo (Optional)</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={handleTakePhoto} className="flex-1 bg-surface border border-border rounded-xl p-4 items-center">
                <Text className="text-foreground font-semibold">📷 Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleChoosePhoto} className="flex-1 bg-surface border border-border rounded-xl p-4 items-center">
                <Text className="text-foreground font-semibold">🖼️ Choose Photo</Text>
              </TouchableOpacity>
            </View>
            {photoUri && (
              <View className="mt-3">
                <Image source={{ uri: photoUri }} className="w-full h-48 rounded-xl" resizeMode="cover" />
              </View>
            )}
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
            router.back();
          }}
        />
      )}
    </ScreenContainer>
  );
}
