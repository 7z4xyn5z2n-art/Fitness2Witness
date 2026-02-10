import { Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, "");
    // Limit to 10 digits
    return digits.slice(0, 10);
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const displayPhoneNumber = (phone: string) => {
    if (phone.length === 0) return "";
    if (phone.length <= 3) return `(${phone}`;
    if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  };

  const handleSubmit = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    if (!isLogin && !name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await loginMutation.mutateAsync({ phoneNumber });
        Alert.alert("Success", "Logged in successfully!");
        router.replace("/(tabs)");
      } else {
        await registerMutation.mutateAsync({ name: name.trim(), phoneNumber });
        Alert.alert("Success", "Account created successfully!");
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      Alert.alert(
        "Error",
        error.message || (isLogin ? "Login failed. Please check your phone number." : "Registration failed. This number may already be registered.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Header */}
          <View className="items-center mb-12">
            <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-4">
              <Text className="text-5xl">💪</Text>
            </View>
            <Text className="text-3xl font-bold text-foreground mb-2">Fitness2Witness</Text>
            <Text className="text-base text-muted text-center">
              12 Weeks of Faith & Fitness
            </Text>
          </View>

          {/* Toggle Login/Register */}
          <View className="flex-row bg-surface rounded-full p-1 mb-8">
            <TouchableOpacity
              onPress={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-full ${isLogin ? "bg-primary" : ""}`}
            >
              <Text className={`text-center font-semibold ${isLogin ? "text-white" : "text-muted"}`}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-full ${!isLogin ? "bg-primary" : ""}`}
            >
              <Text className={`text-center font-semibold ${!isLogin ? "text-white" : "text-muted"}`}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View className="gap-4">
            {!isLogin && (
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Full Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="John Doe"
                  placeholderTextColor="#9BA1A6"
                  className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-base"
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
            )}

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Phone Number</Text>
              <TextInput
                value={displayPhoneNumber(phoneNumber)}
                onChangeText={handlePhoneChange}
                placeholder="(555) 123-4567"
                placeholderTextColor="#9BA1A6"
                className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-base"
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={14} // (555) 555-5555
              />
              <Text className="text-xs text-muted mt-1">
                Enter your 10-digit phone number
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className="bg-primary rounded-full py-4 mt-4 active:opacity-80"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Text */}
          <View className="mt-8">
            <Text className="text-xs text-muted text-center">
              {isLogin
                ? "Don't have an account? Switch to Register above."
                : "Already have an account? Switch to Login above."}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
