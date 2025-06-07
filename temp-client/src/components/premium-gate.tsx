import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Lock } from "lucide-react";
import { Link } from "wouter";

interface PremiumGateProps {
  feature: string;
  description: string;
  children: React.ReactNode;
  requiredPlan?: "pro" | "premium";
}

export function PremiumGate({ feature, description, children, requiredPlan = "pro" }: PremiumGateProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { data: subscription } = useQuery({
    queryKey: ['/api/subscription-status'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasAccess = subscription?.plan === requiredPlan || 
                   subscription?.plan === "premium" || 
                   (requiredPlan === "pro" && subscription?.plan === "premium");

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showUpgrade) {
    return (
      <Card className="max-w-md mx-auto border-primary border-2">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-4">
            {requiredPlan === "premium" ? (
              <Sparkles className="w-8 h-8 text-primary" />
            ) : (
              <Crown className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-xl">Unlock {feature}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <Badge variant="secondary" className="text-sm">
            {requiredPlan === "premium" ? "Premium Feature" : "Pro Feature"}
          </Badge>
          
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href={`/subscribe?plan=${requiredPlan}`}>
                Upgrade to {requiredPlan === "premium" ? "Premium" : "Pro"}
              </Link>
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => setShowUpgrade(false)}>
              Continue with Free Plan
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            7-day free trial • Cancel anytime
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
        <Button 
          onClick={() => setShowUpgrade(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Lock className="w-4 h-4 mr-2" />
          Unlock {feature}
        </Button>
      </div>
    </div>
  );
}

export function useSubscription() {
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['/api/subscription-status'],
    staleTime: 5 * 60 * 1000,
  });

  return {
    subscription,
    isLoading,
    isPro: subscription?.plan === "pro" || subscription?.plan === "premium",
    isPremium: subscription?.plan === "premium",
    isFree: subscription?.plan === "free" || !subscription?.plan,
    maxHabits: subscription?.features?.max_habits || 3,
    hasAICoaching: subscription?.features?.ai_coaching || false,
    hasAdvancedAnalytics: subscription?.features?.advanced_analytics || false,
    hasVoiceCommands: subscription?.features?.voice_commands || false,
  };
}