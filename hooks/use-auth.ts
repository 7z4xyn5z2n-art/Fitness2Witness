import type { User } from "@/lib/_core/auth";

// Mock user data for frontend independence
const mockUser: User = {
  id: 1,
  name: "Demo User",
  phoneNumber: "5551234567",
  role: "user",
  groupId: 1,
};

export function useAuth() {
  const logout = () => {
    // Mock logout - just show alert
    console.log("Logout called");
  };

  return {
    user: mockUser,
    loading: false,
    error: null,
    refetch: async () => {},
    logout,
  };
}
