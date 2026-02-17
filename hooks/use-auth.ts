import { trpc } from "@/lib/trpc";
import * as SecureStore from "expo-secure-store";
import { Alert, Platform } from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";

export function useAuth() {
  const utils = trpc.useUtils();
  const { data: user, isLoading, error, refetch } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  // Clear invalid token if auth query fails
  useEffect(() => {
    if (error && !isLoading) {
      console.log("Auth error detected, clearing invalid token:", error.message);

      if (Platform.OS !== "web") {
        SecureStore.deleteItemAsync("auth_token").catch(console.error);
      } else if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_token");
      }

      router.replace("/auth");
    }
  }, [error, isLoading]);

  const logout = async () => {
    return new Promise<void>((resolve) => {
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { text: "No", style: "cancel", onPress: () => resolve() },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              // Await server logout so cookies/session clear before redirect
              await logoutMutation.mutateAsync().catch(() => {});

              // Remove stored token
              if (Platform.OS !== "web") {
                await SecureStore.deleteItemAsync("auth_token");
              } else if (typeof window !== "undefined") {
                window.localStorage.removeItem("auth_token");
              }

              // Clear cached user immediately
              utils.auth.me.setData(undefined, null);

              // Invalidate everything so no screen keeps stale auth
              await utils.invalidate();

              router.replace("/auth");
            } finally {
              resolve();
            }
          },
        },
      ]);
    });
  };

  return {
    user,
    isLoading,
    loading: isLoading, // compatibility for screens using "loading"
    error,
    refetch,
    logout,
  };
}
