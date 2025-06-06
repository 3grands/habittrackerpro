import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { offlineStorage } from "./offline-storage";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // If offline, return cached data
    if (!navigator.onLine) {
      console.log(`Offline: returning cached data for ${url}`);
      
      if (url === "/api/habits") {
        return offlineStorage.getHabits() as T;
      }
      
      if (url === "/api/habits/stats") {
        const stats = offlineStorage.getStats();
        if (stats) return stats as T;
        
        return {
          todayProgress: "0/0",
          totalHabits: 0,
          totalStreak: 0,
          todayCompleted: 0,
          completionRate: 0,
          weeklyProgress: []
        } as T;
      }
      
      throw new Error("No cached data available offline");
    }

    // Online: fetch from server
    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      // Cache the data
      if (url === "/api/habits") {
        offlineStorage.cacheHabits(data);
      } else if (url === "/api/habits/stats") {
        offlineStorage.cacheStats(data);
      }
      
      return data;
    } catch (error: any) {
      // If online request fails, try cached data as fallback
      console.warn(`Failed to fetch ${url}, trying cached data:`, error);
      
      if (url === "/api/habits") {
        const cachedHabits = offlineStorage.getHabits();
        if (cachedHabits.length > 0) return cachedHabits as T;
      }
      
      if (url === "/api/habits/stats") {
        const cachedStats = offlineStorage.getStats();
        if (cachedStats) return cachedStats as T;
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (!navigator.onLine) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        if (!navigator.onLine) return false;
        return failureCount < 1;
      },
    },
  },
});
