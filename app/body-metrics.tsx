import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LineChart } from "react-native-chart-kit";
import { useColors } from "@/hooks/use-colors";

export default function BodyMetricsScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const colors = useColors();
  const screenWidth = Dimensions.get("window").width - 48;

  const { data: metrics, isLoading } = trpc.bodyMetrics.getMyMetrics.useQuery();

  const [inBodyPhoto, setInBodyPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Calculate AI insights and projections
  const aiInsights = useMemo(() => {
    if (!metrics || metrics.length < 2) {
      return null;
    }

    const sortedMetrics = [...metrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recentMetrics = sortedMetrics.slice(-4); // Last 4 weeks

    // Calculate weight trend
    const weightData = recentMetrics.filter(m => m.weight).map(m => ({ date: new Date(m.date), value: m.weight! }));
    let weightTrend = "stable";
    let weightVelocity = 0;
    let weightProjection = null;

    if (weightData.length >= 2) {
      const firstWeight = weightData[0].value;
      const lastWeight = weightData[weightData.length - 1].value;
      const daysDiff = (weightData[weightData.length - 1].date.getTime() - weightData[0].date.getTime()) / (1000 * 60 * 60 * 24);
      
      weightVelocity = (lastWeight - firstWeight) / (daysDiff / 7); // lbs per week
      
      if (weightVelocity < -0.5) weightTrend = "losing";
      else if (weightVelocity > 0.5) weightTrend = "gaining";
      
      // Project 12 weeks forward
      const weeksToProject = 12;
      weightProjection = lastWeight + (weightVelocity * weeksToProject);
    }

    // Calculate body fat trend
    const bodyFatData = recentMetrics.filter(m => m.bodyFatPercent).map(m => ({ date: new Date(m.date), value: m.bodyFatPercent! }));
    let bodyFatTrend = "stable";
    let bodyFatVelocity = 0;

    if (bodyFatData.length >= 2) {
      const firstBF = bodyFatData[0].value;
      const lastBF = bodyFatData[bodyFatData.length - 1].value;
      const daysDiff = (bodyFatData[bodyFatData.length - 1].date.getTime() - bodyFatData[0].date.getTime()) / (1000 * 60 * 60 * 24);
      
      bodyFatVelocity = (lastBF - firstBF) / (daysDiff / 7); // % per week
      
      if (bodyFatVelocity < -0.3) bodyFatTrend = "decreasing";
      else if (bodyFatVelocity > 0.3) bodyFatTrend = "increasing";
    }

    // Generate recommendations
    const recommendations = [];
    
    if (weightTrend === "losing" && Math.abs(weightVelocity) > 2) {
      recommendations.push("⚠️ You're losing weight rapidly (>2 lbs/week). Consider increasing calorie intake to preserve muscle mass.");
    } else if (weightTrend === "losing" && bodyFatTrend === "decreasing") {
      recommendations.push("✅ Great progress! You're losing weight while reducing body fat percentage.");
    } else if (weightTrend === "stable" && bodyFatTrend === "decreasing") {
      recommendations.push("💪 Excellent body recomposition! You're maintaining weight while reducing body fat.");
    } else if (weightTrend === "gaining" && bodyFatTrend === "increasing") {
      recommendations.push("📊 Weight and body fat are both increasing. Consider reviewing your nutrition and activity levels.");
    }

    return {
      weightTrend,
      weightVelocity,
      weightProjection,
      bodyFatTrend,
      bodyFatVelocity,
      recommendations,
    };
  }, [metrics]);

  const analyzeInBodyMutation = trpc.bodyMetrics.analyzeInBodyScan.useMutation({
    onSuccess: (data: any) => {
      // AI has extracted metrics and saved them automatically
      utils.bodyMetrics.getMyMetrics.invalidate();
      setIsAnalyzing(false);
      setInBodyPhoto(null);
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        "Success!", 
        `InBody scan analyzed and saved!\n\nExtracted metrics:\n• Weight: ${data.weight || 'N/A'} lbs\n• Body Fat: ${data.bodyFatPercent || 'N/A'}%\n• Muscle Mass: ${data.muscleMass || 'N/A'} lbs`,
        [{ text: "OK" }]
      );
    },
    onError: (error: any) => {
      setIsAnalyzing(false);
      Alert.alert("Error", error.message || "Failed to analyze InBody scan. Please try again or ensure the photo is clear.");
    },
  });

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera permission is required to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setInBodyPhoto(result.assets[0].uri);
    }
  };

  const handlePickPhoto = async () => {
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

  // Prepare chart data
  const weightChartData = useMemo(() => {
    if (!metrics || metrics.length === 0) return null;
    
    const sortedMetrics = [...metrics]
      .filter(m => m.weight)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-12); // Last 12 entries
    
    if (sortedMetrics.length === 0) return null;

    return {
      labels: sortedMetrics.map((_, i) => `W${i + 1}`),
      datasets: [{
        data: sortedMetrics.map(m => m.weight!),
        color: () => colors.primary,
        strokeWidth: 2,
      }],
    };
  }, [metrics, colors]);

  const bodyFatChartData = useMemo(() => {
    if (!metrics || metrics.length === 0) return null;
    
    const sortedMetrics = [...metrics]
      .filter(m => m.bodyFatPercent)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-12);
    
    if (sortedMetrics.length === 0) return null;

    return {
      labels: sortedMetrics.map((_, i) => `W${i + 1}`),
      datasets: [{
        data: sortedMetrics.map(m => m.bodyFatPercent!),
        color: () => colors.warning,
        strokeWidth: 2,
      }],
    };
  }, [metrics, colors]);

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
              <Text className="text-base text-muted mt-2">Track your InBody scan results over time</Text>
            </View>

            {/* AI Insights & Projections */}
            {aiInsights && aiInsights.recommendations.length > 0 && (
              <View className="bg-primary/10 rounded-2xl p-6 border border-primary/20">
                <Text className="text-lg font-bold text-foreground mb-3">🤖 AI Insights</Text>
                
                <View className="gap-3 mb-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-muted">Weight Trend:</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {aiInsights.weightTrend === "losing" ? "📉 Losing" : aiInsights.weightTrend === "gaining" ? "📈 Gaining" : "➡️ Stable"}
                      {aiInsights.weightVelocity !== 0 && ` (${Math.abs(aiInsights.weightVelocity).toFixed(1)} lbs/week)`}
                    </Text>
                  </View>

                  {aiInsights.weightProjection && (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted">12-Week Projection:</Text>
                      <Text className="text-sm font-semibold text-primary">
                        {aiInsights.weightProjection.toFixed(1)} lbs
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-muted">Body Fat Trend:</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {aiInsights.bodyFatTrend === "decreasing" ? "📉 Decreasing" : aiInsights.bodyFatTrend === "increasing" ? "📈 Increasing" : "➡️ Stable"}
                      {aiInsights.bodyFatVelocity !== 0 && ` (${Math.abs(aiInsights.bodyFatVelocity).toFixed(2)}%/week)`}
                    </Text>
                  </View>
                </View>

                <View className="bg-background/50 rounded-xl p-4">
                  {aiInsights.recommendations.map((rec, i) => (
                    <Text key={i} className="text-sm text-foreground mb-2 last:mb-0">{rec}</Text>
                  ))}
                </View>
              </View>
            )}

            {/* Weight Trend Chart */}
            {weightChartData && (
              <View className="bg-surface rounded-2xl p-6 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-4">Weight Trend</Text>
                <LineChart
                  data={weightChartData}
                  width={screenWidth - 48}
                  height={220}
                  chartConfig={{
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    decimalPlaces: 1,
                    color: (opacity = 1) => colors.primary,
                    labelColor: (opacity = 1) => colors.muted,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: "5",
                      strokeWidth: "2",
                      stroke: colors.primary
                    }
                  }}
                  bezier
                  style={{ marginVertical: 8, borderRadius: 16 }}
                />
              </View>
            )}

            {/* Body Fat Trend Chart */}
            {bodyFatChartData && (
              <View className="bg-surface rounded-2xl p-6 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-4">Body Fat % Trend</Text>
                <LineChart
                  data={bodyFatChartData}
                  width={screenWidth - 48}
                  height={220}
                  chartConfig={{
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    decimalPlaces: 1,
                    color: (opacity = 1) => colors.warning,
                    labelColor: (opacity = 1) => colors.muted,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: "5",
                      strokeWidth: "2",
                      stroke: colors.warning
                    }
                  }}
                  bezier
                  style={{ marginVertical: 8, borderRadius: 16 }}
                />
              </View>
            )}

            {/* InBody Scan Upload - Primary Action */}
            <View className="bg-surface rounded-2xl p-6 border-2 border-primary">
              <Text className="text-xl font-bold text-foreground mb-2">📸 Scan Your InBody Results</Text>
              <Text className="text-sm text-muted mb-4">
                Take a photo of your InBody printout and our AI will automatically extract and track all your metrics!
              </Text>

              {inBodyPhoto ? (
                <View>
                  <Image source={{ uri: inBodyPhoto }} className="w-full h-64 rounded-xl mb-4" resizeMode="contain" />
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={handleAnalyzeInBodyScan}
                      disabled={isAnalyzing}
                      className="flex-1 bg-primary px-4 py-4 rounded-full active:opacity-80"
                    >
                      {isAnalyzing ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-background text-center font-semibold text-base">🤖 Analyze with AI</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setInBodyPhoto(null)}
                      className="bg-error px-4 py-4 rounded-full active:opacity-80"
                    >
                      <Text className="text-background text-center font-semibold text-base">✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View className="gap-3">
                  <TouchableOpacity
                    onPress={handleTakePhoto}
                    className="bg-primary px-6 py-4 rounded-full active:opacity-80"
                  >
                    <Text className="text-background text-center font-semibold text-lg">📷 Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handlePickPhoto}
                    className="bg-surface border-2 border-primary px-6 py-4 rounded-full active:opacity-80"
                  >
                    <Text className="text-primary text-center font-semibold text-lg">🖼️ Upload from Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Scan History */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">📊 Your Scan History</Text>

              {isLoading ? (
                <ActivityIndicator />
              ) : metrics && metrics.length > 0 ? (
                <View className="gap-3">
                  {metrics.slice(0, 10).map((metric) => (
                    <View key={metric.id} className="bg-background rounded-xl p-4 border border-border">
                      <Text className="text-sm text-muted mb-2">
                        {new Date(metric.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </Text>
                      <View className="flex-row flex-wrap gap-3">
                        {metric.weight && (
                          <View className="bg-primary/10 px-3 py-1 rounded-full">
                            <Text className="text-xs text-primary font-semibold">⚖️ {metric.weight} lbs</Text>
                          </View>
                        )}
                        {metric.bodyFatPercent && (
                          <View className="bg-warning/10 px-3 py-1 rounded-full">
                            <Text className="text-xs text-warning font-semibold">📉 {metric.bodyFatPercent}% BF</Text>
                          </View>
                        )}
                        {metric.muscleMass && (
                          <View className="bg-success/10 px-3 py-1 rounded-full">
                            <Text className="text-xs text-success font-semibold">💪 {metric.muscleMass} lbs</Text>
                          </View>
                        )}
                      </View>
                      {metric.notes && <Text className="text-sm text-muted mt-2">{metric.notes}</Text>}
                    </View>
                  ))}
                </View>
              ) : (
                <View className="items-center py-8">
                  <Text className="text-6xl mb-4">📸</Text>
                  <Text className="text-lg font-semibold text-foreground mb-2">No scans yet</Text>
                  <Text className="text-sm text-muted text-center">Upload your first InBody scan to start tracking your progress!</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
