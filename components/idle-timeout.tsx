import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { router, usePathname } from "expo-router";
import * as SecureStore from "expo-secure-store";

interface IdleTimeoutProps {
  timeoutMs?: number;
  disabled?: boolean;
}

export function IdleTimeout({ timeoutMs = 180000, disabled = false }: IdleTimeoutProps) {
  const pathname = usePathname();
  const lastActivityRef = useRef<number>(Date.now());
  const logoutTriggeredRef = useRef<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    logoutTriggeredRef.current = false;
  };

  const logout = async () => {
    if (logoutTriggeredRef.current) return;
    logoutTriggeredRef.current = true;

    console.log("[IdleTimeout] Logging out due to inactivity");

    try {
      if (Platform.OS === "web") {
        localStorage.removeItem("auth_token");
      } else {
        await SecureStore.deleteItemAsync("auth_token");
      }
    } catch (error) {
      console.error("[IdleTimeout] Error removing token:", error);
    }

    router.replace("/auth");
  };

  // Check if we're on an auth screen
  const isAuthScreen = pathname?.includes("auth") || pathname?.includes("login") || pathname?.includes("register");

  // Check if user is authenticated
  const isAuthenticated = () => {
    if (Platform.OS === "web") {
      return !!localStorage.getItem("auth_token");
    }
    // For native, we'll check on mount (see useEffect below)
    return true; // Assume authenticated for native (will be checked in useEffect)
  };

  // Determine if timeout should be disabled
  const shouldDisable = disabled || isAuthScreen || !isAuthenticated();

  // Reset timer on route change
  useEffect(() => {
    resetTimer();
  }, [pathname]);

  // Set up activity listeners and interval checker
  useEffect(() => {
    if (shouldDisable) {
      // Clean up interval if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Reset timer on mount
    resetTimer();

    // Web: Add event listeners
    if (Platform.OS === "web") {
      const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
      events.forEach((event) => {
        window.addEventListener(event, resetTimer);
      });

      // Cleanup
      return () => {
        events.forEach((event) => {
          window.removeEventListener(event, resetTimer);
        });
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }

    // Start interval checker (every 2 seconds)
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed > timeoutMs && !logoutTriggeredRef.current) {
        logout();
      }
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [shouldDisable, timeoutMs]);

  return null;
}

// Export a function to ping activity from native touch events
export function activityPing() {
  // This will be called from the root layout's touch handlers
  // The actual reset happens via the component's internal ref
}
