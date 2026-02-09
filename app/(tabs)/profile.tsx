import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { data: metrics } = trpc.metrics.getMyMetrics.useQuery();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-4">
            <View className="w-24 h-24 rounded-full bg-primary items-center justify-center">
              <Text className="text-5xl text-background font-bold">{user?.name?.[0] || "?"}</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-foreground">{user?.name || "User"}</Text>
              <Text className="text-base text-muted">{user?.email}</Text>
            </View>
          </View>

          {/* Stats Card */}
          <View className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Your Stats</Text>
            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">This Week Points</Text>
                <Text className="text-sm font-semibold text-foreground">{metrics?.thisWeekTotal || 0} / 38</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Total Points</Text>
                <Text className="text-sm font-semibold text-foreground">{metrics?.totalPoints || 0} / 456</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Completion</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {Math.round(metrics?.overallPercent || 0)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <Text className="text-sm text-foreground text-center font-semibold mb-2">
              Fitness2Witness
            </Text>
            <Text className="text-xs text-muted text-center">
              12 Weeks of Faith & Fitness Challenge
            </Text>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-error px-6 py-4 rounded-full active:opacity-80"
          >
            <Text className="text-background text-center font-semibold text-lg">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
