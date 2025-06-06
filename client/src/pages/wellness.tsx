import { ArrowLeft, Home, ChartLine, Brain, Settings, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoodTracker } from "@/components/mood-tracker";
import { SmartReminders } from "@/components/smart-reminders";
import { SmartScheduling } from "@/components/smart-scheduling";
import { VoiceCommands } from "@/components/voice-commands";
import { NeurodiverseRecommendations } from "@/components/neurodiverse-recommendations";
import { Link, useLocation } from "wouter";

export default function WellnessPage() {
  const [location] = useLocation();

  return (
    <>
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Wellness</h1>
        </div>
      </div>

      <div className="p-4 pb-24">
        <Tabs defaultValue="mood" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="mood">Mood</TabsTrigger>
            <TabsTrigger value="scheduling">Schedule</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="mood" className="space-y-6">
            <MoodTracker />
            <SmartReminders />
          </TabsContent>

          <TabsContent value="scheduling" className="space-y-6">
            <SmartScheduling />
          </TabsContent>

          <TabsContent value="voice" className="space-y-6">
            <VoiceCommands />
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <NeurodiverseRecommendations />
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-3 ${location === "/" ? "text-primary" : "text-gray-400"}`}
            asChild
          >
            <Link href="/">
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Home</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-3 ${location === "/progress" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/progress">
              <ChartLine className="w-5 h-5 mb-1" />
              <span className="text-xs">Progress</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-3 ${location === "/coaching" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/coaching">
              <Brain className="w-5 h-5 mb-1" />
              <span className="text-xs">Coaching</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 px-3 ${location === "/wellness" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            asChild
          >
            <Link href="/wellness">
              <Heart className="w-5 h-5 mb-1" />
              <span className="text-xs">Wellness</span>
            </Link>
          </Button>
        </div>
      </nav>
    </>
  );
}