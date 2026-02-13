import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function AdminScreen() {
  const colors = useColors();

  const adminSections = [
    {
      title: "User Management",
      description: "Manage users, assign roles, and view activity",
      route: "/admin-users",
      icon: "👥",
    },
    {
      title: "Group Settings",
      description: "Edit group information and settings",
      route: "/admin-group",
      icon: "⚙️",
    },
    {
      title: "Content Moderation",
      description: "Review and moderate community posts and comments",
      route: "/admin-moderation",
      icon: "🛡️",
    },
    {
      title: "Day Editor",
      description: "Edit check-ins, attendance, and posts for specific days",
      route: "/admin-day-editor",
      icon: "📅",
    },
  ];

  return (
    <ScreenContainer className="p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">
              Admin Panel
            </Text>
            <Text className="text-base text-muted">
              Manage your group, users, and content
            </Text>
          </View>

          {/* Admin Sections */}
          <View className="gap-4">
            {adminSections.map((section, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(section.route as any)}
                className="bg-surface rounded-2xl p-5 border border-border"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                }}
              >
                <View className="flex-row items-center gap-4">
                  <Text className="text-4xl">{section.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground mb-1">
                      {section.title}
                    </Text>
                    <Text className="text-sm text-muted">
                      {section.description}
                    </Text>
                  </View>
                  <Text className="text-2xl text-muted">›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
