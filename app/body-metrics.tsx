import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

export default function BodyMetricsScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: metrics, isLoading } = trpc.bodyMetrics.getMyMetrics.useQuery();

  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [notes, setNotes] = useState("");
  const [inBodyPhoto, setInBodyPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeInBodyMutation = trpc.bodyMetrics.analyzeInBodyScan.useMutation({
    onSuccess: (data: any) => {
      if (data.weight) setWeight(data.weight.toString());
      if (data.bodyFatPercent) setBodyFat(data.bodyFatPercent.toString());
      if (data.muscleMass) setMuscleMass(data.muscleMass.toString());
      setIsAnalyzing(false);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "InBody scan analyzed! Review the extracted metrics and save.");
    },
    onError: (error: any) => {
      setIsAnalyzing(false);
      Alert.alert("Error", error.message || "Failed to analyze InBody scan");
    },
  });

  const createMetricMutation = trpc.bodyMetrics.create.useMutation({
    onSuccess: () => {
      utils.bodyMetrics.getMyMetrics.invalidate();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "Body metrics saved!");
      setWeight("");
      setBodyFat("");
      setMuscleMass("");
      setNotes("");
      setInBodyPhoto(null);
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleSubmit = () => {
    if (!weight && !bodyFat && !muscleMass) {
      Alert.alert("Empty Entry", "Please enter at least one metric.");
      return;
    }

    createMetricMutation.mutate({
      date: new Date().toISOString(),
      weight: weight ? parseFloat(weight) : undefined,
      bodyFatPercent: bodyFat ? parseFloat(bodyFat) : undefined,
      muscleMass: muscleMass ? parseFloat(muscleMass) : undefined,
      notes: notes.trim() || undefined,
    });
  };

  const handlePickInBodyPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setInBodyPhoto(result.assets[0].uri);
    }
  };

  const handleAnalyzeInBodyScan = async () => {
    if (!inBodyPhoto) {
      Alert.alert("No Photo", "Please upload an InBody scan photo first.");
      return;
    }

    setIsAnalyzing(true);

    // Convert image to base64
    const response = await fetch(inBodyPhoto);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(",")[1];
      analyzeInBodyMutation.mutate({ imageBase64: base64Data });
    };
  };

  return (
    <ScreenContainer className="p-6">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-6">
            {/* Header */}
            <View>
              <TouchableOpacity onPress={() => router.back()} className="mb-4">
                <Text className="text-primary text-base">← Back</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-foreground">Body Metrics</Text>
              <Text className="text-base text-muted mt-2">Track your body composition progress</Text>
            </View>

            {/* InBody Scan Upload */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">📸 Upload InBody Scan</Text>
              <Text className="text-sm text-muted mb-4">
                Take a photo of your InBody analysis results and we'll automatically extract your metrics!
              </Text>

              {inBodyPhoto ? (
                <View className="mb-4">
                  <View className="bg-border rounded-xl h-48 items-center justify-center mb-3">
                    <Text className="text-muted">🖼️ InBody Scan Photo</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={handleAnalyzeInBodyScan}
                      disabled={isAnalyzing}
                      className="flex-1 bg-primary px-4 py-3 rounded-full active:opacity-80"
                    >
                      {isAnalyzing ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-background text-center font-semibold">Analyze with AI</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setInBodyPhoto(null)}
                      className="bg-error px-4 py-3 rounded-full active:opacity-80"
                    >
                      <Text className="text-background text-center font-semibold">Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePickInBodyPhoto}
                  className="bg-primary/10 border-2 border-dashed border-primary rounded-xl p-6 items-center active:opacity-80"
                >
                  <Text className="text-4xl mb-2">📷</Text>
                  <Text className="text-primary font-semibold">Upload InBody Scan Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Entry Form */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">Log Today's Metrics</Text>

              {/* Weight */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Weight (lbs)</Text>
                <TextInput
                  className="text-foreground text-base p-3 bg-background rounded-xl border border-border"
                  placeholder="e.g., 185.5"
                  placeholderTextColor="#9BA1A6"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Body Fat % */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Body Fat %</Text>
                <TextInput
                  className="text-foreground text-base p-3 bg-background rounded-xl border border-border"
                  placeholder="e.g., 18.5"
                  placeholderTextColor="#9BA1A6"
                  value={bodyFat}
                  onChangeText={setBodyFat}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Muscle Mass */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Muscle Mass (lbs)</Text>
                <TextInput
                  className="text-foreground text-base p-3 bg-background rounded-xl border border-border"
                  placeholder="e.g., 145.2"
                  placeholderTextColor="#9BA1A6"
                  value={muscleMass}
                  onChangeText={setMuscleMass}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Notes */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Notes (Optional)</Text>
                <TextInput
                  className="text-foreground text-base p-3 bg-background rounded-xl border border-border min-h-[80px]"
                  placeholder="How are you feeling? Any observations?"
                  placeholderTextColor="#9BA1A6"
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={createMetricMutation.isPending}
                className="bg-primary px-6 py-4 rounded-full active:opacity-80"
              >
                {createMetricMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-background text-center font-semibold text-lg">Save Metrics</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* History */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">Your History</Text>

              {isLoading ? (
                <ActivityIndicator />
              ) : metrics && metrics.length > 0 ? (
                <View className="gap-3">
                  {metrics.slice(0, 10).map((metric) => (
                    <View key={metric.id} className="bg-background rounded-xl p-4 border border-border">
                      <Text className="text-sm text-muted mb-2">{new Date(metric.date).toLocaleDateString()}</Text>
                      <View className="flex-row flex-wrap gap-3">
                        {metric.weight && (
                          <View className="bg-primary/10 px-3 py-1 rounded-full">
                            <Text className="text-xs text-primary font-semibold">Weight: {metric.weight} lbs</Text>
                          </View>
                        )}
                        {metric.bodyFatPercent && (
                          <View className="bg-warning/10 px-3 py-1 rounded-full">
                            <Text className="text-xs text-warning font-semibold">BF: {metric.bodyFatPercent}%</Text>
                          </View>
                        )}
                        {metric.muscleMass && (
                          <View className="bg-success/10 px-3 py-1 rounded-full">
                            <Text className="text-xs text-success font-semibold">Muscle: {metric.muscleMass} lbs</Text>
                          </View>
                        )}
                      </View>
                      {metric.notes && <Text className="text-sm text-muted mt-2">{metric.notes}</Text>}
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-muted text-center py-6">No metrics logged yet. Start tracking today!</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

