import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface VoiceCommand {
  command: string;
  action: string;
  habitId?: number;
  confidence?: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [lastCommand, setLastCommand] = useState<string>("");
  const [commandStatus, setCommandStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const queryClient = useQueryClient();

  const { data: habits = [] } = useQuery({
    queryKey: ["/api/habits"]
  });

  const executeCommandMutation = useMutation({
    mutationFn: async (command: VoiceCommand) => {
      const response = await fetch("/api/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command)
      });
      if (!response.ok) throw new Error("Failed to execute command");
      return response.json();
    },
    onSuccess: (data, command) => {
      setCommandStatus("success");
      setStatusMessage(data.message || "Command completed successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      
      if (isSpeechEnabled) {
        speak(data.message || "Done", "success");
      }
    },
    onError: (error) => {
      setCommandStatus("error");
      setStatusMessage("Sorry, I couldn't understand that command");
      
      if (isSpeechEnabled) {
        speak("I didn't understand that. Try saying 'complete meditation' or 'mark exercise as done'", "error");
      }
    }
  });

  const speak = (text: string, type: "success" | "error" | "info" = "info") => {
    if (!isSpeechEnabled || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = type === "success" ? 1.1 : type === "error" ? 0.9 : 1.0;
    utterance.volume = 0.8;

    // Use a clearer voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const parseVoiceCommand = (transcript: string): VoiceCommand | null => {
    const text = transcript.toLowerCase().trim();
    
    // ADHD-friendly command patterns
    const completionPatterns = [
      /(?:complete|finish|done|mark|check off|tick)\s+(.+?)(?:\s+(?:as\s+)?(?:complete|done|finished))?$/,
      /(.+?)\s+(?:is\s+)?(?:complete|done|finished)$/,
      /i\s+(?:completed|finished|did)\s+(.+)$/
    ];

    const addPatterns = [
      /(?:add|create|new)\s+habit\s+(.+)$/,
      /start\s+tracking\s+(.+)$/
    ];

    const statusPatterns = [
      /(?:how\s+am\s+i\s+doing|progress|status|how's\s+my\s+day)$/,
      /what\s+habits\s+do\s+i\s+have\s+left$/
    ];

    // Check for completion commands
    for (const pattern of completionPatterns) {
      const match = text.match(pattern);
      if (match) {
        const habitName = match[1].trim();
        const matchingHabit = (habits as any[]).find((habit: any) => 
          habit.name.toLowerCase().includes(habitName) ||
          habitName.includes(habit.name.toLowerCase())
        );

        if (matchingHabit) {
          return {
            command: text,
            action: "complete_habit",
            habitId: matchingHabit.id
          };
        } else {
          // Fuzzy matching for ADHD users who might not remember exact names
          const similarHabit = (habits as any[]).find((habit: any) => {
            const habitWords = habit.name.toLowerCase().split(' ');
            const commandWords = habitName.split(' ');
            return habitWords.some((hw: string) => commandWords.some((cw: string) => 
              cw.includes(hw) || hw.includes(cw)
            ));
          });

          if (similarHabit) {
            return {
              command: text,
              action: "complete_habit",
              habitId: similarHabit.id
            };
          }
        }
      }
    }

    // Check for add habit commands
    for (const pattern of addPatterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          command: text,
          action: "add_habit",
          habitId: undefined
        };
      }
    }

    // Check for status commands
    for (const pattern of statusPatterns) {
      if (pattern.test(text)) {
        return {
          command: text,
          action: "get_status"
        };
      }
    }

    return null;
  };

  const startListening = () => {
    if (!isVoiceEnabled || !window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setStatusMessage("Voice recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
      setCommandStatus("idle");
      setStatusMessage("Listening... Try saying 'complete meditation' or 'mark exercise as done'");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      setLastCommand(transcript);
      setCommandStatus("processing");
      setStatusMessage(`Processing: "${transcript}"`);

      const command = parseVoiceCommand(transcript);
      
      if (command) {
        command.confidence = confidence;
        executeCommandMutation.mutate(command);
      } else {
        setCommandStatus("error");
        setStatusMessage("Command not recognized. Try 'complete [habit name]' or 'how am I doing?'");
        
        if (isSpeechEnabled) {
          speak("I didn't recognize that command. Try saying 'complete' followed by your habit name.", "error");
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setCommandStatus("error");
      if (event.error === 'no-speech') {
        setStatusMessage("No speech detected. Please try again.");
      } else if (event.error === 'not-allowed') {
        setStatusMessage("Microphone access denied. Please enable microphone permissions.");
      } else {
        setStatusMessage(`Voice recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const getStatusIcon = () => {
    switch (commandStatus) {
      case "processing": return <MessageCircle className="w-4 h-4 text-blue-500 animate-pulse" />;
      case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = () => {
    switch (commandStatus) {
      case "processing": return "border-blue-200 bg-blue-50";
      case "success": return "border-green-200 bg-green-50";
      case "error": return "border-red-200 bg-red-50";
      default: return "border-gray-200 bg-gray-50";
    }
  };

  // Clear status after 5 seconds
  useEffect(() => {
    if (commandStatus !== "idle") {
      const timer = setTimeout(() => {
        setCommandStatus("idle");
        setStatusMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [commandStatus]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mic className="w-5 h-5 text-green-500" />
            <span>Voice Commands</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Voice</span>
              <Switch
                checked={isVoiceEnabled}
                onCheckedChange={setIsVoiceEnabled}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Speech</span>
              <Switch
                checked={isSpeechEnabled}
                onCheckedChange={setIsSpeechEnabled}
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Control Button */}
        <div className="flex justify-center">
          <Button
            onClick={isListening ? stopListening : startListening}
            disabled={!isVoiceEnabled || executeCommandMutation.isPending}
            className={`w-24 h-24 rounded-full ${
              isListening 
                ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </Button>
        </div>

        {/* Status Display */}
        {(statusMessage || lastCommand) && (
          <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-start space-x-2">
              {getStatusIcon()}
              <div className="flex-1">
                {lastCommand && (
                  <p className="text-sm font-medium text-gray-800 mb-1">
                    Last command: "{lastCommand}"
                  </p>
                )}
                {statusMessage && (
                  <p className="text-sm text-gray-600">{statusMessage}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADHD-Friendly Command Examples */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 className="font-medium text-purple-800 mb-3 flex items-center space-x-2">
            <MessageCircle className="w-4 h-4" />
            <span>Simple Commands</span>
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-white">
                "Complete meditation"
              </Badge>
              <Badge variant="outline" className="bg-white">
                "Mark exercise as done"
              </Badge>
              <Badge variant="outline" className="bg-white">
                "Finished reading"
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-white">
                "How am I doing?"
              </Badge>
              <Badge variant="outline" className="bg-white">
                "What's my progress?"
              </Badge>
              <Badge variant="outline" className="bg-white">
                "Habits left today"
              </Badge>
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-purple-100 rounded border border-purple-200">
            <p className="text-xs text-purple-700">
              <strong>ADHD/Autism Tips:</strong> Speak clearly and use simple phrases. 
              You don't need exact habit names - "water" works for "Drink 8 glasses of water".
              The system understands natural speech patterns.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => speak("Here are your habits for today", "info")}
            disabled={!isSpeechEnabled}
            className="flex items-center space-x-2"
          >
            <Volume2 className="w-4 h-4" />
            <span>Read Today's Habits</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => speak("Say 'complete' followed by your habit name to mark it done", "info")}
            disabled={!isSpeechEnabled}
            className="flex items-center space-x-2"
          >
            <Volume2 className="w-4 h-4" />
            <span>Voice Help</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}