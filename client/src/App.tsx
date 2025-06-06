import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileLayout } from "@/components/mobile-layout";
import HomePage from "@/pages/home";
import ProgressPage from "@/pages/progress";
import CoachingPage from "@/pages/coaching";
import WellnessPage from "@/pages/wellness";
import PricingPage from "@/pages/pricing";
import SubscribePage from "@/pages/subscribe";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/progress" component={ProgressPage} />
      <Route path="/coaching" component={CoachingPage} />
      <Route path="/wellness" component={WellnessPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/subscribe" component={SubscribePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MobileLayout>
          <Router />
        </MobileLayout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
