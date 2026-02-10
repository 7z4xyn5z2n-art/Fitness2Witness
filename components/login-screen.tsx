import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "./screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export function LoginScreen() {
  const colors = useColors();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      setIsLoading(false);
      Alert.alert("Login Failed", error.message);
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      setIsLoading(false);
      Alert.alert("Registration Failed", error.message);
    },
  });

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, "");
    // Limit to 10 digits
    const limited = digits.slice(0, 10);
    setPhoneNumber(limited);
  };

  const handleLogin = () => {
    if (!phoneNumber) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    if (phoneNumber.length !== 10) {
      Alert.alert("Error", "Phone number must be 10 digits");
      return;
    }
    setIsLoading(true);
    loginMutation.mutate({ phoneNumber });
  };

  const handleRegister = () => {
    if (!phoneNumber || !name) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (phoneNumber.length !== 10) {
      Alert.alert("Error", "Phone number must be 10 digits");
      return;
    }
    if (name.trim().length < 2) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }
    setIsLoading(true);
    registerMutation.mutate({ phoneNumber, name: name.trim() });
  };

  return (
    <ScreenContainer className="items-center justify-center p-6">
      <View className="w-full max-w-sm items-center gap-6">
        {/* Logo */}
        <View className="w-32 h-32 rounded-full bg-primary items-center justify-center">
          <Text className="text-6xl">✝️</Text>
        </View>

        {/* App title */}
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-foreground">Fitness2Witness</Text>
          <Text className="text-base text-muted text-center">12 Weeks of Faith & Fitness</Text>
        </View>

        {/* Login Form */}
        {mode === "login" && (
          <View className="w-full gap-4">
            <TextInput
              className="w-full bg-surface px-4 py-3 rounded-lg text-foreground"
              placeholder="Phone Number (10 digits)"
              placeholderTextColor={colors.muted}
              value={phoneNumber}
              onChangeText={formatPhoneNumber}
              keyboardType="phone-pad"
              editable={!isLoading}
              maxLength={10}
            />
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="w-full bg-primary px-6 py-4 rounded-full active:opacity-80"
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-background text-center font-semibold text-lg">Sign In</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode("register")} disabled={isLoading}>
              <Text className="text-primary text-sm text-center">Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Register Form */}
        {mode === "register" && (
          <View className="w-full gap-4">
            <TextInput
              className="w-full bg-surface px-4 py-3 rounded-lg text-foreground"
              placeholder="Full Name"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!isLoading}
            />
            <TextInput
              className="w-full bg-surface px-4 py-3 rounded-lg text-foreground"
              placeholder="Phone Number (10 digits)"
              placeholderTextColor={colors.muted}
              value={phoneNumber}
              onChangeText={formatPhoneNumber}
              keyboardType="phone-pad"
              editable={!isLoading}
              maxLength={10}
            />
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              className="w-full bg-primary px-6 py-4 rounded-full active:opacity-80"
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-background text-center font-semibold text-lg">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode("login")}
              disabled={isLoading}
              className="items-center"
            >
              <Text className="text-primary text-sm">Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text className="text-sm text-muted text-center">
          Join your group's challenge and track your daily progress
        </Text>
      </View>
    </ScreenContainer>
  );
}
