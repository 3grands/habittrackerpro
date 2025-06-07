import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Zap } from "lucide-react";
import { Link } from "wouter";

interface HabitLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: number;
  maxHabits: number;
}

export function HabitLimitModal({ open, onOpenChange, currentCount, maxHabits }: HabitLimitModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full border-primary border-2">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Habit Limit Reached</CardTitle>
          <CardDescription>
            You've reached the {maxHabits} habit limit for free accounts. 
            Upgrade to Pro for unlimited habits and AI-powered features.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{currentCount}/{maxHabits}</div>
              <div className="text-sm text-gray-600">Habits used</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-900">Upgrade to unlock:</div>
            <div className="space-y-2">
              {[
                "Unlimited habit tracking",
                "AI-powered coaching",
                "Smart scheduling",
                "Advanced analytics",
                "Voice commands"
              ].map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/subscribe?plan=Pro">
                <Crown className="w-4 h-4 mr-2" />
                Start 7-Day Free Trial
              </Link>
            </Button>
            
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Continue with Free Plan
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            No credit card required for trial • Cancel anytime
          </p>
        </CardContent>
      </Card>
    </div>
  );
}