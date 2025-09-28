"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

interface RedirectIfAuthenticatedProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function RedirectIfAuthenticated({ 
  children, 
  redirectTo = "/dashboard" 
}: RedirectIfAuthenticatedProps) {
  const { isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if the store has been hydrated and user is authenticated
    if (isHydrated && !isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, isHydrated, redirectTo, router]);

  // Show loading state while checking authentication or before hydration
  if (!isHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If authenticated after hydration, don't render children (redirect will happen)
  if (isAuthenticated) {
    return null;
  }

  // User is not authenticated, render the login page
  return <>{children}</>;
}