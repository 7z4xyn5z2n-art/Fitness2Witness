import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import * as SecureStore from "expo-secure-store";
import { Platform, Alert } from "react-native";
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
      } else {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("auth_token");
        }
      }
      
      // Redirect to auth screen
      router.replace("/auth");
    }
  }, [error, isLoading]);

  const logout = async () => {
    return new Promise<void>((resolve, reject) => {
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { text: "No", style: "cancel", onPress: () => resolve() },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              // Best-effort server logout (do not block)
              logoutMutation.mutateAsync().catch(() => {});
              // Remove stored token
              if (Platform.OS !== "web") {
                await SecureStore.deleteItemAsync("auth_token");
              } else if (typeof window !== "undefined") {
                window.localStorage.removeItem("auth_token");
              }
              // Clear cached user immediately
              utils.auth.me.setData(undefined, null);
              // Invalidate all queries so UI cannot keep stale auth
              await utils.invalidate();
              router.replace("/auth");
              resolve();
            } catch (e) {
              // Force local logout even on error
              try {
                if (Platform.OS !== "web") {
                  await SecureStore.deleteItemAsync("auth_token");
                } else if (typeof window !== "undefined") {
                  window.localStorage.removeItem("auth_token");
                }
              } catch {}
              utils.auth.me.setData(undefined, null);
              router.replace("/auth");
              reject(e);
            }
          },
        },
      ]);
    });
  };

  return {
    user: user || null,
    loading: isLoading,
    error,
    refetch,
    logout,
  };
}
