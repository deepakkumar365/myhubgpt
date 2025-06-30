"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";

export function AuthRedirect() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Define public paths that don't require authentication
    const isPublicPath = pathname === '/myhub-tools';
    
    // If user is not authenticated and not on a public path, redirect to Myhub tools
    if (!isAuthenticated && !isPublicPath) {
      router.push('/myhub-tools');
    }
    
    // If user is authenticated and on a public path, redirect to home
    if (isAuthenticated && isPublicPath) {
      router.push('/');
    }
  }, [isAuthenticated, pathname, router]);

  // This component doesn't render anything
  return null;
}