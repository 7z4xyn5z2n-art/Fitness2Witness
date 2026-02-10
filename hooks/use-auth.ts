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

      // Clear session token from secure storage
      if (Platform.OS !== "web") {
        await SecureStore.deleteItemAsync("session_token");
      } else {
        // For web, clear from localStorage
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("session_token");
          // Also clear cookies
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
        }
      }

      // Invalidate all queries
      utils.invalidate();

      // Redirect to home/welcome screen
      router.replace("/");
      
      // Force reload to clear all cached data (web only)
      if (Platform.OS === "web" && typeof window !== "undefined") {
        setTimeout(() => window.location.reload(), 100);
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Even if backend call fails, still clear local session
      if (Platform.OS !== "web") {
        await SecureStore.deleteItemAsync("session_token");
      }
      router.replace("/");
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
