import { trpc } from "@/lib/trpc";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { useRouter } from "expo-router";

export function useAuth() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = async () => {
    console.log("LOGOUT STARTED");

    try {
      // Call backend logout
      await logoutMutation.mutateAsync().catch(() => {});

      // Remove stored token
      if (Platform.OS !== "web") {
        await SecureStore.deleteItemAsync("auth_token");
      } else if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_token");
      }

      // Clear all React Query cache
      await utils.invalidate();

      // Hard redirect for web (guaranteed)
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.href = "/auth";
        return;
      }

      // Native fallback
      router.replace("/auth");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return {
    user,
    isLoading,
    loading: isLoading,
    logout,
  };
}
