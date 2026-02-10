import { trpc } from "@/lib/trpc";
import type { User } from "@/lib/_core/auth";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user as User | null,
    loading: isLoading,
    error: error ? new Error(error.message) : null,
    refetch,
    logout,
  };
}
