import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Download, Heart, TrendingUp, Crown, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MarketplaceSkeleton } from "@/components/marketplace-skeleton";

interface HabitPack {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  habits: string[];
  rating: number;
  downloads: number;
  creator: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  tags: string[];
  isPremium: boolean;
  previewImage?: string;
}

const FEATURED_HABIT_PACKS: HabitPack[] = [
  {
    id: "morning-routine-pro",
    name: "Morning Routine Mastery",
    description: "Transform your mornings with 12 scientifically-backed habits that boost energy and focus all day",
    category: "Productivity",
    price: 14.99,
    originalPrice: 24.99,
    habits: [
      "5-minute meditation",
      "Hydration ritual (32oz water)",
      "10-minute stretching",
      "Gratitude journaling",
      "Goal review & planning",
      "Cold shower (2 minutes)"
    ],
    rating: 4.8,
    downloads: 12847,
    creator: "Dr. Sarah Chen",
    difficulty: "intermediate",
    duration: "30 days",
    tags: ["morning", "energy", "focus", "bestseller"],
    isPremium: true
  },
  {
    id: "adhd-focus-system",
    name: "ADHD Focus System",
    description: "Neurodivergent-friendly habits designed with executive function support and sensory considerations",
    category: "Neurodiversity",
    price: 19.99,
    habits: [
      "Pomodoro with movement breaks",
      "Visual task planning",
      "Fidget-friendly study setup",
      "Dopamine reward system",
      "Energy level tracking",
      "Hyperfocus recovery routine"
    ],
    rating: 4.9,
    downloads: 8234,
    creator: "ADHD Coach Marcus",
    difficulty: "beginner",
    duration: "21 days",
    tags: ["adhd", "focus", "neurodivergent", "executive-function"],
    isPremium: true
  },
  {
    id: "fitness-transformation",
    name: "90-Day Fitness Revolution",
    description: "Progressive fitness habits that build from 5-minute walks to complete lifestyle transformation",
    category: "Health & Fitness",
    price: 29.99,
    originalPrice: 39.99,
    habits: [
      "Daily movement (progressive)",
      "Protein tracking",
      "Pre-workout prep ritual",
      "Recovery & stretching",
      "Sleep optimization",
      "Meal prep consistency"
    ],
    rating: 4.7,
    downloads: 15692,
    creator: "Fit Coach Jennifer",
    difficulty: "beginner",
    duration: "90 days",
    tags: ["fitness", "health", "transformation", "progressive"],
    isPremium: false
  },
  {
    id: "entrepreneur-mindset",
    name: "Entrepreneur Success Habits",
    description: "Daily practices of high-performing entrepreneurs: networking, learning, and growth-focused routines",
    category: "Business",
    price: 34.99,
    habits: [
      "Industry news review",
      "Skill development (30 min)",
      "Network building activity",
      "Revenue-generating task",
      "Reflection & strategy",
      "Personal brand building"
    ],
    rating: 4.6,
    downloads: 6789,
    creator: "Business Mentor Alex",
    difficulty: "advanced",
    duration: "60 days",
    tags: ["business", "entrepreneur", "networking", "growth"],
    isPremium: true
  }
];

export function HabitMarketplace() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial loading for smooth UX
  useState(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const purchaseHabitPack = useMutation({
    mutationFn: async (packId: string) => {
      return apiRequest("POST", `/api/marketplace/purchase/${packId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Habit Pack Purchased!",
        description: "Your new habits have been added to your dashboard",
      });
    },
    onError: () => {
      toast({
        title: "Purchase Failed",
        description: "Please check your subscription or payment method",
        variant: "destructive",
      });
    },
  });

  const categories = ["all", "Productivity", "Health & Fitness", "Neurodiversity", "Business", "Wellness"];

  const filteredPacks = FEATURED_HABIT_PACKS.filter(pack => 
    selectedCategory === "all" || pack.category === selectedCategory
  ).sort((a, b) => {
    if (sortBy === "popular") return b.downloads - a.downloads;
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    return 0;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          Habit Marketplace
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover expert-curated habit packs designed by coaches, therapists, and productivity experts. 
          Transform your life with proven systems.
        </p>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
        
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      {/* Featured Banner */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Limited Time: 40% Off All Premium Packs</h3>
              <p className="opacity-90">Unlock your potential with expert-designed habit systems</p>
            </div>
            <Zap className="h-12 w-12 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* Habit Packs Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPacks.map((pack) => (
          <Card key={pack.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
            {pack.originalPrice && (
              <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                Save ${(pack.originalPrice - pack.price).toFixed(0)}
              </Badge>
            )}
            
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {pack.name}
                    {pack.isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
                  </CardTitle>
                  <CardDescription className="mt-2">{pack.description}</CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {pack.rating}
                </div>
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  {pack.downloads.toLocaleString()}
                </div>
                <Badge variant="outline" className="text-xs">
                  {pack.difficulty}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Included Habits:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {pack.habits.slice(0, 4).map((habit, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {habit}
                    </li>
                  ))}
                  {pack.habits.length > 4 && (
                    <li className="text-xs opacity-75">
                      +{pack.habits.length - 4} more habits...
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex flex-wrap gap-1">
                {pack.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">${pack.price}</span>
                  {pack.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${pack.originalPrice}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  by {pack.creator}
                </span>
              </div>
              
              <Button 
                onClick={() => purchaseHabitPack.mutate(pack.id)}
                disabled={purchaseHabitPack.isPending}
                className="flex items-center gap-2"
              >
                {purchaseHabitPack.isPending ? (
                  "Processing..."
                ) : (
                  <>
                    <Heart className="h-4 w-4" />
                    Get Pack
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Creator Program CTA */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h3 className="text-xl font-semibold mb-2">Become a Habit Creator</h3>
          <p className="opacity-90 mb-4">
            Share your expertise and earn revenue by creating habit packs for our community
          </p>
          <Button variant="secondary" size="lg">
            Join Creator Program
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}