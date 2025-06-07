import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, ArrowLeft, Check } from "lucide-react";
import { Link } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = ({ selectedPlan }: { selectedPlan: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/?subscription=success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome to Pro!",
        description: "Your subscription is now active. Enjoy all premium features!",
      });
    }
    setIsLoading(false);
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Complete Your Subscription</CardTitle>
        <CardDescription>
          Start your {selectedPlan} plan today - cancel anytime
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Plan: {selectedPlan}</span>
              <Badge variant="secondary">7-day trial</Badge>
            </div>
            <div className="text-sm text-gray-600">
              Free for 7 days, then ${selectedPlan === "Pro" ? "9.99" : "19.99"}/month
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || isLoading}
          >
            {isLoading ? "Processing..." : "Start Free Trial"}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            By subscribing, you agree to our Terms of Service. Cancel anytime before trial ends to avoid charges.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("Pro");

  // Get plan from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan') || 'Pro';
    setSelectedPlan(plan);
  }, []);

  useEffect(() => {
    // Create subscription setup intent
    apiRequest("POST", "/api/create-subscription", { 
      plan: selectedPlan,
      trial_days: 7 
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error("Subscription setup error:", error);
      });
  }, [selectedPlan]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
            <p className="text-gray-600">Setting up your subscription...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pricing">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Plans
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Benefits */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Unlock Your Full Potential
            </h1>
            
            <div className="space-y-4 mb-8">
              {[
                "AI-powered habit coaching",
                "Smart scheduling & reminders",
                "Advanced analytics & insights",
                "Unlimited habit tracking",
                "Mood & wellness integration",
                "Voice command support",
                "ADHD/Autism-friendly features",
                "Streak protection & recovery"
              ].map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">💡 Why users love Pro:</h3>
              <blockquote className="text-gray-600 italic">
                "The AI coaching helped me build 5 new habits in just 3 weeks. The smart reminders actually work with my ADHD brain!"
              </blockquote>
              <cite className="text-sm text-gray-500 mt-2 block">- Sarah M., Pro user</cite>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm selectedPlan={selectedPlan} />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  );
}