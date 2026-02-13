import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { pingActivity } from "@/lib/idle";

/**
 * tRPC React client for type-safe API calls.
 *
 * IMPORTANT (tRPC v11): The `transformer` must be inside `httpBatchLink`,
 * NOT at the root createClient level. This ensures client and server
 * use the same serialization format (superjson).
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Get the stored auth token from secure storage or localStorage
 */
async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("auth_token");
    }
    return null;
  } else {
    return await SecureStore.getItemAsync("auth_token");
  }
}

/**
 * Creates the tRPC client with proper configuration.
 * Call this once in your app's root layout.
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        // tRPC v11: transformer MUST be inside httpBatchLink, not at root
        transformer: superjson,
        // Custom headers to include Authorization token
        async headers() {
          const token = await getAuthToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        // Custom fetch to include credentials and track activity
        async fetch(url, options) {
          // Ping activity before API call
          pingActivity();
          
          try {
            const response = await fetch(url, {
              ...options,
              credentials: "include",
            });
            
            // Ping activity after successful API call
            pingActivity();
            
            return response;
          } catch (error) {
            // Ping activity even on error (user is still active)
            pingActivity();
            throw error;
          }
        },
      }),
    ],
  });
}
