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
    console.log("logout clicked");
    console.log("token before logout:", Platform.OS === "web" && typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : "(native)");
    
    try {
      // Call backend logout endpoint via tRPC
      await logoutMutation.mutateAsync();

      // Clear auth token from secure storage
      if (Platform.OS !== "web") {
        await SecureStore.deleteItemAsync("auth_token");
        console.log("token removed from SecureStore");
      } else {
        // For web, clear from localStorage
        if (typeof window !== "undefined") {
          console.log("removing token from localStorage...");
          window.localStorage.removeItem("auth_token");
          
          // Double-check token removal
          const tokenAfterRemoval = window.localStorage.getItem("auth_token");
          console.log("token after logout:", tokenAfterRemoval);
          if (tokenAfterRemoval !== null) {
            console.warn("Token still exists after removal, trying again...");
            window.localStorage.removeItem("auth_token");
            console.log("token after second removal:", window.localStorage.getItem("auth_token"));
          }
          
          // Also clear cookies for backward compatibility
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
        }
      }

      // Clear all tRPC/react-query cache
      console.log("clearing tRPC cache...");
      await utils.invalidate();

      console.log("logout successful, navigating to /auth");
      
      // Redirect to auth screen
      router.replace("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if backend call fails, still clear local token
      if (Platform.OS !== "web") {
        await SecureStore.deleteItemAsync("auth_token");
      } else {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("auth_token");
          console.log("token after logout (error path):", window.localStorage.getItem("auth_token"));
        }
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
