import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ScreenContainer } from "./screen-container";
import { startOAuthLogin } from "@/constants/oauth";

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const { loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await startOAuthLogin();
    } catch (error) {
      console.error("Login error:", error);
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="items-center justify-center p-6">
      <View className="w-full max-w-sm items-center gap-8">
        {/* Logo placeholder */}
        <View className="w-32 h-32 rounded-full bg-primary items-center justify-center">
          <Text className="text-6xl">✝️</Text>
        </View>

        {/* App title */}
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-foreground">Fitness2Witness</Text>
          <Text className="text-base text-muted text-center">12 Weeks of Faith & Fitness</Text>
        </View>

        {/* Login button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoggingIn}
          className="w-full bg-primary px-6 py-4 rounded-full active:opacity-80"
        >
          {isLoggingIn ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-background text-center font-semibold text-lg">Sign In</Text>
          )}
        </TouchableOpacity>

        <Text className="text-sm text-muted text-center">
          Join your group's challenge and track your daily progress
        </Text>
      </View>
    </ScreenContainer>
  );
}
