import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
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
    try {
      await logoutMutation.mutateAsync();
      if (Platform.OS !== "web") {
        await SecureStore.deleteItemAsync("auth_token");
      } else if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_token");
      }
      utils.auth.me.setData(undefined, null);
      await utils.invalidate();
      router.replace("/auth");
    } catch {
      if (Platform.OS !== "web") {
        await SecureStore.deleteItemAsync("auth_token");
      } else if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_token");
      }
      utils.auth.me.setData(undefined, null);
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
