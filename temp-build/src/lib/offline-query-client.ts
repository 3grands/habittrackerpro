import { QueryClient } from "@tanstack/react-query";
import { offlineStorage } from "./offline-storage";

// Custom query function that handles offline scenarios
export const offlineQueryFn = async ({ queryKey }: { queryKey: string[] }) => {
  const [url] = queryKey;
  
  // If offline, return cached data
  if (!navigator.onLine) {
    console.log(`Offline: returning cached data for ${url}`);
    
    if (url === "/api/habits") {
      return offlineStorage.getHabits();
    }
    
    if (url === "/api/habits/stats") {
      const stats = offlineStorage.getStats();
      if (stats) return stats;
      
      // Return basic stats if no cached data
      return {
        todayProgress: "0/0",
        totalHabits: 0,
        totalStreak: 0,
        todayCompleted: 0,
        completionRate: 0,
        weeklyProgress: []
      };
    }
    
    throw new Error("No cached data available offline");
  }

  // Online: fetch from server and cache
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the data
    if (url === "/api/habits") {
      offlineStorage.cacheHabits(data);
    } else if (url === "/api/habits/stats") {
      offlineStorage.cacheStats(data);
    }
    
    return data;
  } catch (error) {
    // If online request fails, try cached data as fallback
    console.warn(`Failed to fetch ${url}, trying cached data:`, error);
    
    if (url === "/api/habits") {
      const cachedHabits = offlineStorage.getHabits();
      if (cachedHabits.length > 0) return cachedHabits;
    }
    
    if (url === "/api/habits/stats") {
      const cachedStats = offlineStorage.getStats();
      if (cachedStats) return cachedStats;
    }
    
    throw error;
  }
};

// Enhanced query client with offline support
export const createOfflineQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: offlineQueryFn,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error) => {
          // Don't retry if offline
          if (!navigator.onLine) return false;
          
          // Retry up to 2 times for network errors
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: (failureCount, error) => {
          // Don't retry mutations if offline
          if (!navigator.onLine) return false;
          return failureCount < 1;
        },
      },
    },
  });
};