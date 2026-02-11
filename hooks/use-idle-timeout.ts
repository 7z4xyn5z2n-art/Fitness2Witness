import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";

/**
 * Hook to automatically logout user after 5 minutes of inactivity (web only).
 * Resets timer on mousemove, keydown, click, scroll, touchstart.
 */
export function useIdleTimeout() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    // Only run on web
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    const handleLogout = () => {
      console.log("Idle timeout reached (5 minutes), logging out...");
      
      // Clear token
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_token");
        console.log("Token cleared due to idle timeout");
      }
      
      // Navigate to auth
      router.replace("/auth");
    };

    const resetTimer = () => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout
      timeoutRef.current = setTimeout(handleLogout, IDLE_TIMEOUT_MS);
    };

    // Initialize timer
    resetTimer();

    // Event listeners to reset timer on user activity
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [router]);
}
