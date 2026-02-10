import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "./screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export function LoginScreen() {
  const colors = useColors();
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      Alert.alert("Login Failed", error.message);
      setIsLoading(false);
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      Alert.alert("Registration Failed", error.message);
      setIsLoading(false);
    },
  });

  const resetRequestMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      Alert.alert(
        "Reset Email Sent",
        data.message + (data.resetToken ? `\n\nToken: ${data.resetToken}` : "")
      );
      setIsLoading(false);
    },
    onError: (error) => {
      Alert.alert("Reset Failed", error.message);
      setIsLoading(false);
    },
  });

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: (data) => {
      Alert.alert("Success", data.message);
      setMode("login");
      setIsLoading(false);
    },
    onError: (error) => {
      Alert.alert("Reset Failed", error.message);
      setIsLoading(false);
    },
  });

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    setIsLoading(true);
    loginMutation.mutate({ email, password });
  };

  const handleRegister = () => {
    if (!email || !password || !name) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    registerMutation.mutate({ email, password, name });
  };

  const handleRequestReset = () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    setIsLoading(true);
    resetRequestMutation.mutate({ email });
  };

  const handleResetPassword = () => {
    if (!resetToken || !newPassword) {
      Alert.alert("Error", "Please enter reset token and new password");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    resetPasswordMutation.mutate({ token: resetToken, newPassword });
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
              placeholder="Email"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TextInput
              className="w-full bg-surface px-4 py-3 rounded-lg text-foreground"
              placeholder="Password"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
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
            <View className="flex-row justify-between">
              <TouchableOpacity onPress={() => setMode("register")} disabled={isLoading}>
                <Text className="text-primary text-sm">Create Account</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode("reset")} disabled={isLoading}>
                <Text className="text-primary text-sm">Forgot Password?</Text>
              </TouchableOpacity>
            </View>
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
              editable={!isLoading}
            />
            <TextInput
              className="w-full bg-surface px-4 py-3 rounded-lg text-foreground"
              placeholder="Email"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TextInput
              className="w-full bg-surface px-4 py-3 rounded-lg text-foreground"
              placeholder="Password (min 8 characters)"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
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

        {/* Password Reset Form */}
        {mode === "reset" && (
          <View className="w-full gap-4">
            <Text className="text-sm text-muted text-center">
              Enter your email to receive a password reset token
            </Text>
            <TextInput
              className="w-full bg-surface px-4 py-3 rounded-lg text-foreground"
              placeholder="Email"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={handleRequestReset}
              disabled={isLoading}
              className="w-full bg-primary px-6 py-4 rounded-full active:opacity-80"
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-background text-center font-semibold text-lg">
                  Send Reset Token
                </Text>
              )}
            </TouchableOpacity>

            <Text className="text-sm text-muted text-center mt-4">
              Have a reset token? Enter it below:
            </Text>
            <TextInput
              className="w-full bg-surface px-4 py-3 rounded-lg text-foreground"
              placeholder="Reset Token"
              placeholderTextColor={colors.muted}
              value={resetToken}
              onChangeText={setResetToken}
              editable={!isLoading}
            />
            <TextInput
              className="w-full bg-surface px-4 py-3 rounded-lg text-foreground"
              placeholder="New Password (min 8 characters)"
              placeholderTextColor={colors.muted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={isLoading}
              className="w-full bg-primary px-6 py-4 rounded-full active:opacity-80"
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-background text-center font-semibold text-lg">
                  Reset Password
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
