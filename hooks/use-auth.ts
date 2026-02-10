import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export function useAuth() {
  const utils = trpc.useUtils();
  const { data: user, isLoading, error, refetch } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = async () => {
    try {
      // Call backend logout endpoint via tRPC
      await logoutMutation.mutateAsync();

      // Clear auth token from secure storage
      if (Platform.OS !== "web") {
        await SecureStore.deleteItemAsync("auth_token");
      } else {
        // For web, clear from localStorage
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("auth_token");
          // Also clear cookies for backward compatibility
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
        }
      }

      // Invalidate all queries
      utils.invalidate();

      // Redirect to auth screen
      router.replace("/auth");
      
      // Force reload to clear all cached data (web only)
      if (Platform.OS === "web" && typeof window !== "undefined") {
        setTimeout(() => window.location.reload(), 100);
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Even if backend call fails, still clear local token
      if (Platform.OS !== "web") {
        await SecureStore.deleteItemAsync("auth_token");
      }
      router.replace("/auth");
    }
  };

  return {
    user: user || null,
    loading: isLoading,
    error,
    refetch,
    logout,
  };
}
