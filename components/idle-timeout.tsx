import { useEffect, useRef, useState } from "react";
import { Platform, Modal, View, Text, TouchableOpacity, Alert, AppState } from "react-native";
import { router, usePathname } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { pingActivity, getIdleState, subscribeIdle, setIdleTimeoutMs } from "@/lib/idle";
import { useColors } from "@/hooks/use-colors";

interface IdleTimeoutProps {
  disabled?: boolean;
}

export function IdleTimeout({ disabled = false }: IdleTimeoutProps) {
  const colors = useColors();
  const pathname = usePathname();
  const logoutTriggeredRef = useRef<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const logout = async () => {
    if (logoutTriggeredRef.current) return;
    logoutTriggeredRef.current = true;

    try {
      if (Platform.OS === "web") {
        localStorage.removeItem("auth_token");
      } else {
        await SecureStore.deleteItemAsync("auth_token");
      }
    } catch (error) {
      console.error("[IdleTimeout] Error removing token:", error);
    }

    setShowWarning(false);
    router.replace("/auth");
  };

  const handleStayLoggedIn = () => {
    pingActivity();
    setShowWarning(false);
  };

  const handleLogoutNow = () => {
    logout();
  };

  // Check if we're on an auth screen
  const isAuthScreen = pathname?.includes("auth") || pathname?.includes("login") || pathname?.includes("register");

  // Check if user is authenticated
  const isAuthenticated = () => {
    if (Platform.OS === "web") {
      return !!localStorage.getItem("auth_token");
    }
    return true; // Assume authenticated for native
  };

  // Determine if timeout should be disabled
  const shouldDisable = disabled || isAuthScreen || !isAuthenticated();

  // Load saved timeout duration on mount
  useEffect(() => {
    const forceTimeout = async () => {
      try {
        const ms = 480000; // 8 minutes
        setIdleTimeoutMs(ms);

        // Persist so future loads match (prevents old 3-min overrides)
        if (Platform.OS === "web") {
          localStorage.setItem("idle_timeout_ms", String(ms));
        } else {
          await SecureStore.setItemAsync("idle_timeout_ms", String(ms));
        }
      } catch (error) {
        // Do not block app if storage fails
      }
    };

    forceTimeout();
  }, []);

  // Reset timer on route change
  useEffect(() => {
    if (!shouldDisable) {
      logoutTriggeredRef.current = false;
      pingActivity();
    }
  }, [pathname, shouldDisable]);

  // Set up activity listeners and interval checker
  useEffect(() => {
    if (shouldDisable) {
      // Clean up interval if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setShowWarning(false);
      return;
    }

    // Reset timer on mount
    pingActivity();

    // Web: Add event listeners (do not return early; interval must still run on web)
    let webEvents: string[] | null = null;
    if (Platform.OS === "web") {
      webEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
      webEvents.forEach((event) => {
        window.addEventListener(event, pingActivity);
      });
    }

    // Native: stop timers in background to reduce battery drain
    const appStateSub =
      Platform.OS === "web"
        ? null
        : AppState.addEventListener("change", (nextState) => {
            appStateRef.current = nextState;
            if (nextState !== "active") {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              setShowWarning(false);
              return;
            }
            // On resume: evaluate immediately
            const state = getIdleState();
            if (state.remainingMs <= 0 && !logoutTriggeredRef.current) {
              logout();
              return;
            }
          });
    // Web: pause interval when tab is hidden (battery + correctness)
    const onVisibility =
      Platform.OS !== "web"
        ? null
        : () => {
            if (document.hidden) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              setShowWarning(false);
              return;
            }
            // On visible: evaluate immediately
            const state = getIdleState();
            if (state.remainingMs <= 0 && !logoutTriggeredRef.current) {
              logout();
              return;
            }
          };
    if (Platform.OS === "web") {
      document.addEventListener("visibilitychange", onVisibility as any);
    }

    // Start interval checker (every 1000ms to reduce battery usage)
    intervalRef.current = setInterval(() => {
      const state = getIdleState();
      
      // Update warning modal state
      if (state.showWarning) {
        setShowWarning(true);
        setRemainingSeconds(Math.ceil(state.remainingMs / 1000));
      } else {
        setShowWarning(false);
      }
      
      // Trigger logout if timeout reached
      if (state.remainingMs <= 0 && !logoutTriggeredRef.current) {
        logout();
      }
    }, 1000);

    return () => {
      // Remove web event listeners if they were attached
      if (Platform.OS === "web" && webEvents) {
        webEvents.forEach((event) => {
          window.removeEventListener(event, pingActivity);
        });
      }
      // Remove web visibility listener
      if (Platform.OS === "web") {
        document.removeEventListener("visibilitychange", onVisibility as any);
      }
      // Remove native app state listener
      if (appStateSub) {
        appStateSub.remove();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldDisable]);

  if (shouldDisable) {
    return null;
  }

  return (
    <Modal
      visible={showWarning}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground, marginBottom: 16, textAlign: 'center' }}>
            ⚠️ Session Expiring
          </Text>
          
          <Text style={{ fontSize: 16, color: colors.foreground, marginBottom: 8, textAlign: 'center' }}>
            You'll be logged out in {remainingSeconds} second{remainingSeconds !== 1 ? 's' : ''} due to inactivity.
          </Text>
          
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 24, textAlign: 'center' }}>
            Click "Stay Logged In" to continue your session.
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={handleLogoutNow}
              style={{ flex: 1, backgroundColor: colors.background, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ textAlign: 'center', fontWeight: '600', color: colors.foreground }}>
                Log Out Now
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleStayLoggedIn}
              style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8 }}
            >
              <Text style={{ textAlign: 'center', fontWeight: '600', color: colors.background }}>
                Stay Logged In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
