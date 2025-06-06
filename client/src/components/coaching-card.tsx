import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { CoachingTip } from "@/lib/types";

export function CoachingCard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: tip } = useQuery<CoachingTip>({
    queryKey: ["/api/coaching/latest"],
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      setIsRefreshing(true);
      return apiRequest("POST", "/api/coaching/advice");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/latest"] });
    },
    onSettled: () => {
      setIsRefreshing(false);
    },
  });

  return (
    <div className="p-4">
      <div className="bg-gradient-to-r from-secondary to-blue-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Daily Coaching Tip</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refreshMutation.mutate()}
            disabled={isRefreshing}
            className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <p className="text-sm opacity-90 leading-relaxed mb-3">
          {tip?.tip || "Start small and be consistent. Focus on building one habit at a time for lasting success!"}
        </p>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Brain className="w-3 h-3" />
          </div>
          <span className="text-xs opacity-75">Powered by AI Coach</span>
        </div>
      </div>
    </div>
  );
}
