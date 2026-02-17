/**
 * Centralized idle timer state management
 * Tracks user activity and manages timeout/warning state
 */

interface IdleState {
  lastActivityAt: number;
  timeoutMs: number;
  warningMs: number;
  showWarning: boolean;
  remainingMs: number;
}

type IdleListener = (state: IdleState) => void;

// Internal state
let lastActivityAt = Date.now();
let timeoutMs = 480000; // 8 minutes default
const warningMs = 30000; // 30 seconds warning
let showWarning = false;
let remainingMs = timeoutMs;

// Listeners for UI updates
const listeners: IdleListener[] = [];

/**
 * Set the idle timeout duration in milliseconds
 */
export function setIdleTimeoutMs(ms: number): void {
  timeoutMs = ms;
  remainingMs = ms;
  notifyListeners();
}

/**
 * Get the current idle timeout duration
 */
export function getIdleTimeoutMs(): number {
  return timeoutMs;
}

/**
 * Reset the activity timer (user is active)
 */
export function pingActivity(): void {
  lastActivityAt = Date.now();
  showWarning = false;
  remainingMs = timeoutMs;
  notifyListeners();
}

/**
 * Get the current idle state
 */
export function getIdleState(): IdleState {
  const elapsed = Date.now() - lastActivityAt;
  remainingMs = Math.max(0, timeoutMs - elapsed);
  
  // Update warning state based on elapsed time
  if (elapsed >= timeoutMs - warningMs && elapsed < timeoutMs) {
    showWarning = true;
  } else if (elapsed >= timeoutMs) {
    showWarning = false; // Timeout reached, warning no longer relevant
  }
  
  return {
    lastActivityAt,
    timeoutMs,
    warningMs,
    showWarning,
    remainingMs,
  };
}

/**
 * Subscribe to idle state changes
 * Returns an unsubscribe function
 */
export function subscribeIdle(fn: IdleListener): () => void {
  listeners.push(fn);
  return () => {
    const index = listeners.indexOf(fn);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Notify all listeners of state changes
 */
function notifyListeners(): void {
  const state = getIdleState();
  listeners.forEach((fn) => fn(state));
}
