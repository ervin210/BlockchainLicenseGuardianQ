import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

/**
 * Enhanced useAuth hook with more resilient session handling
 * 
 * Includes retry mechanism, session validation, and auto-recovery
 */
export function useAuth() {
  const [sessionChecked, setSessionChecked] = useState(false);
  
  // Query user data with improved error handling
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: 2,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Session recovery mechanism - if we get an error, try to recover
  useEffect(() => {
    if (error && !sessionChecked) {
      console.log("Auth error detected, attempting recovery...");
      setSessionChecked(true);
      
      // Set a delayed retry (this helps avoid redirect loops)
      const timer = setTimeout(() => {
        refetch();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [error, refetch, sessionChecked]);

  return {
    user,
    isLoading: isLoading && !sessionChecked,
    error,
    refetch,
    isAuthenticated: !!user,
  };
}