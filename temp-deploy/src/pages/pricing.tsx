import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Sparkles } from "lucide-react";
import { Link } from "wouter";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with habit tracking",
    features: [
      "Track up to 3 habits",
      "Basic progress tracking",
      "Simple reminders",
      "Weekly insights",
      "Mobile-friendly design"
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
    popular: false,
    icon: Zap
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "per month",
    description: "Advanced features for serious habit builders",
    features: [
      "Unlimited habits",
      "AI-powered coaching",
      "Smart scheduling & reminders",
      "Advanced analytics & trends",
      "Mood tracking integration",
      "Voice commands",
      "Context-aware notifications",
      "Streak protection",
      "ADHD/Autism support features"
    ],
    buttonText: "Start Pro Trial",
    buttonVariant: "default" as const,
    popular: true,
    icon: Crown
  },
  {
    name: "Premium",
    price: "$19.99",
    period: "per month",
    description: "Complete habit mastery with personalized insights",
    features: [
      "Everything in Pro",
      "Personalized AI recommendations",
      "Advanced pattern recognition",
      "Custom habit templates",
      "Priority support",
      "Data export & backup",
      "Team/family sharing",
      "Custom integrations",
      "Beta feature access"
    ],
    buttonText: "Go Premium",
    buttonVariant: "default" as const,
    popular: false,
    icon: Sparkles
  }
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free and upgrade as you build stronger habits. All plans include our core tracking features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={plan.name} 
                className={`relative ${plan.popular ? 'border-2 border-primary shadow-lg scale-105' : 'border border-gray-200'}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <div className="w-12 h-12 mx-auto bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">
                    {plan.price}
                    <span className="text-sm font-normal text-gray-500">/{plan.period}</span>
                  </div>
                  <CardDescription className="text-gray-600">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    variant={plan.buttonVariant}
                    asChild
                  >
                    <Link href={plan.name === "Free" ? "/" : "/subscribe"}>
                      {plan.buttonText}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-600">Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at your next billing cycle.</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">What happens to my data if I cancel?</h3>
              <p className="text-gray-600">Your data remains safe for 30 days after cancellation. You can reactivate anytime during this period to restore full access.</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial for paid plans?</h3>
              <p className="text-gray-600">Yes! Pro and Premium plans include a 7-day free trial. No credit card required to start.</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibrand text-gray-900 mb-2">Do you offer student discounts?</h3>
              <p className="text-gray-600">Yes! Students get 50% off all paid plans. Contact support with your student email for verification.</p>
            </div>
          </div>
        </div>

        {/* Back to App */}
        <div className="text-center mt-12">
          <Button variant="ghost" asChild>
            <Link href="/">← Back to App</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}