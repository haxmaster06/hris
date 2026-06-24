"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPublicPath = 
    pathname === "/login" || 
    pathname.startsWith("/high-level-control") || 
    pathname.startsWith("/landlord");

  console.log("[AuthGuard] Render state:", {
    hasHydrated,
    mounted,
    isAuthenticated,
    isPublicPath,
    pathname
  });

  useEffect(() => {
    if (hasHydrated && mounted) {
      console.log("[AuthGuard] Hydrated & Mounted check:", {
        isAuthenticated,
        isPublicPath
      });
      if (!isAuthenticated && !isPublicPath) {
        console.warn("[AuthGuard] Unauthenticated user on protected path. Redirecting to /login");
        router.push("/login");
      }
    }
  }, [hasHydrated, isAuthenticated, isPublicPath, mounted, router]);

  // Render loading state if store hasn't hydrated or we aren't client-mounted yet
  if (!hasHydrated || !mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Prevent flash of page content if protected route is being accessed while unauthenticated
  if (!isAuthenticated && !isPublicPath) {
    return null;
  }

  return <>{children}</>;
}
