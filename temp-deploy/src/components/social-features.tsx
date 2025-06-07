import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Trophy, Target, Share2, MessageCircle, ThumbsUp, Flame, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // days
  participants: number;
  reward: string;
  category: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  prize?: string;
}

interface LeaderboardEntry {
  id: string;
  username: string;
  avatar?: string;
  streak: number;
  totalHabits: number;
  completionRate: number;
  badges: string[];
  rank: number;
  points: number;
}

interface CommunityPost {
  id: string;
  username: string;
  avatar?: string;
  content: string;
  achievement?: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked: boolean;
  hashtags: string[];
}

const FEATURED_CHALLENGES: Challenge[] = [
  {
    id: "january-jumpstart",
    title: "January Jumpstart Challenge",
    description: "Build 3 new habits in 21 days. Join 10,000+ members starting their year strong!",
    difficulty: "medium",
    duration: 21,
    participants: 12847,
    reward: "Digital Badge + Premium Month",
    category: "New Year",
    startDate: "2025-01-01",
    endDate: "2025-01-21",
    isActive: true,
    prize: "$500 Amazon Gift Card for top performer"
  },
  {
    id: "fitness-february",
    title: "Fitness February",
    description: "Move your body every day for 28 days. Any movement counts - walking, stretching, or full workouts!",
    difficulty: "easy",
    duration: 28,
    participants: 8234,
    reward: "Fitness Champion Badge",
    category: "Health",
    startDate: "2025-02-01",
    endDate: "2025-02-28",
    isActive: false
  },
  {
    id: "mindful-march",
    title: "Mindful March Meditation",
    description: "Daily meditation practice for mental clarity. Includes guided sessions and progress tracking.",
    difficulty: "easy",
    duration: 31,
    participants: 6789,
    reward: "Mindfulness Master Badge",
    category: "Wellness",
    startDate: "2025-03-01",
    endDate: "2025-03-31",
    isActive: false
  }
];

const LEADERBOARD_DATA: LeaderboardEntry[] = [
  {
    id: "1",
    username: "HabitChampion2024",
    streak: 87,
    totalHabits: 156,
    completionRate: 94,
    badges: ["30-Day Streak", "Early Bird", "Consistency King"],
    rank: 1,
    points: 2840
  },
  {
    id: "2", 
    username: "MorningWarrior",
    streak: 62,
    totalHabits: 134,
    completionRate: 91,
    badges: ["Morning Person", "Fitness Fanatic"],
    rank: 2,
    points: 2650
  },
  {
    id: "3",
    username: "ZenMaster_Sarah",
    streak: 45,
    totalHabits: 98,
    completionRate: 96,
    badges: ["Meditation Master", "Mindful Achiever"],
    rank: 3,
    points: 2420
  }
];

const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "1",
    username: "FitnessJourney_Mike",
    content: "Just completed my 50th day of morning workouts! Started with 5 push-ups, now doing full 30-minute sessions. The compound effect is real! 💪",
    achievement: "50-Day Fitness Streak",
    likes: 124,
    comments: 18,
    timestamp: "2 hours ago",
    isLiked: false,
    hashtags: ["fitness", "consistency", "transformation"]
  },
  {
    id: "2",
    username: "StudyBuddy_Ana",
    content: "Reading habit update: Finished my 12th book this year! My goal was 10 books. The daily 20-minute reading habit really works. Next up: 'Atomic Habits' 📚",
    likes: 89,
    comments: 12,
    timestamp: "4 hours ago",
    isLiked: true,
    hashtags: ["reading", "learning", "goals"]
  },
  {
    id: "3",
    username: "MindfulMom_Lisa",
    content: "Meditation streak: 30 days! 🧘‍♀️ Started with just 2 minutes, now up to 15. My stress levels have never been lower. Thank you to this amazing community for the support!",
    achievement: "30-Day Meditation Master",
    likes: 156,
    comments: 24,
    timestamp: "6 hours ago",
    isLiked: false,
    hashtags: ["meditation", "mindfulness", "mentalhealth"]
  }
];

export function SocialFeatures() {
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard' | 'community'>('challenges');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      return apiRequest("POST", `/api/challenges/${challengeId}/join`);
    },
    onSuccess: () => {
      toast({
        title: "Challenge Joined!",
        description: "You're now part of the challenge. Good luck!",
      });
    },
  });

  const likePost = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("POST", `/api/community/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Users className="h-8 w-8 text-blue-500" />
          Community Hub
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Join challenges, compete on leaderboards, and connect with fellow habit builders worldwide
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center">
        <div className="bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'challenges' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('challenges')}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Challenges
          </Button>
          <Button
            variant={activeTab === 'leaderboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('leaderboard')}
            className="flex items-center gap-2"
          >
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Button>
          <Button
            variant={activeTab === 'community' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('community')}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Community
          </Button>
        </div>
      </div>

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Join 50,000+ Members in Global Challenges</h3>
                  <p className="opacity-90">Compete, stay motivated, and win amazing prizes</p>
                </div>
                <Trophy className="h-12 w-12 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_CHALLENGES.map((challenge) => (
              <Card key={challenge.id} className="relative hover:shadow-lg transition-shadow">
                {challenge.isActive && (
                  <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                    Active
                  </Badge>
                )}
                
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {challenge.title}
                    <Badge variant={challenge.difficulty === 'easy' ? 'default' : challenge.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                      {challenge.difficulty}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{challenge.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium">{challenge.duration} days</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Participants:</span>
                      <p className="font-medium">{challenge.participants.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground text-sm">Reward:</span>
                    <p className="font-medium text-green-600">{challenge.reward}</p>
                    {challenge.prize && (
                      <p className="text-sm text-orange-600 font-medium">🏆 Grand Prize: {challenge.prize}</p>
                    )}
                  </div>

                  <Badge variant="outline" className="w-fit">
                    {challenge.category}
                  </Badge>
                </CardContent>

                <div className="p-6 pt-0">
                  <Button 
                    className="w-full"
                    onClick={() => joinChallenge.mutate(challenge.id)}
                    disabled={!challenge.isActive || joinChallenge.isPending}
                  >
                    {challenge.isActive ? 'Join Challenge' : 'Coming Soon'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Global Leaderboard
              </CardTitle>
              <CardDescription>
                Top performers this month - based on consistency, streaks, and habit completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {LEADERBOARD_DATA.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-muted-foreground">#{entry.rank}</span>
                        {entry.rank === 1 && <Crown className="h-5 w-5 text-yellow-500" />}
                      </div>
                      
                      <Avatar>
                        <AvatarImage src={entry.avatar} />
                        <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <p className="font-medium">{entry.username}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Flame className="h-4 w-4 text-orange-500" />
                          {entry.streak} day streak
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold">{entry.points.toLocaleString()} pts</p>
                      <p className="text-sm text-muted-foreground">{entry.completionRate}% completion</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">Climb the Leaderboard</h3>
              <p className="opacity-90 mb-4">
                Complete habits consistently to earn points and unlock exclusive rewards
              </p>
              <Button variant="secondary" size="lg">
                View Your Rank
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Community Tab */}
      {activeTab === 'community' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Share Your Journey</CardTitle>
              <CardDescription>
                Celebrate achievements and inspire others in the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share an Update
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {COMMUNITY_POSTS.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={post.avatar} />
                      <AvatarFallback>{post.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{post.username}</p>
                        <span className="text-sm text-muted-foreground">{post.timestamp}</span>
                        {post.achievement && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            🏆 {post.achievement}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm leading-relaxed">{post.content}</p>
                      
                      <div className="flex flex-wrap gap-1">
                        {post.hashtags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-4 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => likePost.mutate(post.id)}
                          className={`flex items-center gap-1 ${post.isLiked ? 'text-red-500' : ''}`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          {post.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {post.comments}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}