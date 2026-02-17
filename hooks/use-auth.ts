import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import * as SecureStore from "expo-secure-store";
import { Alert, Platform } from "react-native";
import { useEffect } from "react";

export function useAuth() {
  const utils = trpc.useUtils();
  const { data: user, isLoading, error, refetch } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  // Clear invalid token if auth query fails
  useEffect(() => {
    if (error && !isLoading) {
      console.log("Auth error detected, clearing invalid token:", error.message);

      // Clear invalid token
      if (Platform.OS !== "web") {
        SecureStore.deleteItemAsync("auth_token").catch(console.error);
      } else if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_token");
      }

      // Redirect to auth screen
      router.replace("/auth");
    }
  }, [error, isLoading]);

  // ✅ Clean logout that always resolves after local logout finishes
  const logout = async () => {
    return new Promise<void>((resolve) => {
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { text: "No", style: "cancel", onPress: () => resolve() },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              // Best-effort server logout (do not block local logout)
              logoutMutation.mutateAsync().catch(() => {});

              // Remove stored token
              if (Platform.OS !== "web") {
                await SecureStore.deleteItemAsync("auth_token");
              } else if (typeof window !== "undefined") {
                window.localStorage.removeItem("auth_token");
              }

              // Clear cached auth state immediately
              utils.auth.me.setData(undefined, null);

              // Invalidate everything so no screen can keep stale auth
              await utils.invalidate();

              // Go to auth screen
              router.replace("/auth");
            } finally {
              resolve();
            }
          },
        },
      ]);
    });
  };

  // ✅ IMPORTANT: return the hook API (this is what was missing)
  return {
    user,
    isLoading,
    error,
    refetch,
    logout,
  };
}
