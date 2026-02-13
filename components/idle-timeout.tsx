import { useEffect, useRef, useState } from "react";
import { Platform, Modal, View, Text, TouchableOpacity, Alert } from "react-native";
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
  
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

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
    const loadSavedTimeout = async () => {
      try {
        let savedTimeout: string | null = null;
        if (Platform.OS === "web") {
          savedTimeout = localStorage.getItem("idle_timeout_ms");
        } else {
          savedTimeout = await SecureStore.getItemAsync("idle_timeout_ms");
        }
        
        if (savedTimeout) {
          const timeoutMs = parseInt(savedTimeout, 10);
          if (!isNaN(timeoutMs) && timeoutMs > 0) {
            setIdleTimeoutMs(timeoutMs);
          }
        }
      } catch (error) {
        console.error("[IdleTimeout] Error loading saved timeout:", error);
      }
    };
    
    loadSavedTimeout();
  }, []);

  // Reset timer on route change
  useEffect(() => {
    if (!shouldDisable) {
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

    // Web: Add event listeners
    if (Platform.OS === "web") {
      const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
      events.forEach((event) => {
        window.addEventListener(event, pingActivity);
      });

      // Cleanup
      return () => {
        events.forEach((event) => {
          window.removeEventListener(event, pingActivity);
        });
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }

    // Start interval checker (every 500ms for smooth countdown)
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
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
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
