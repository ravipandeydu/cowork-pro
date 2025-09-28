"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading, isHydrated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if the store has been hydrated and user is not authenticated
    if (isHydrated && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, isHydrated, router]);

  // Show loading state while checking authentication or before hydration
  if (!isHydrated || isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )
    );
  }

  // If not authenticated after hydration, don't render children (redirect will happen)
  if (!isAuthenticated || !user) {
    return null;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}