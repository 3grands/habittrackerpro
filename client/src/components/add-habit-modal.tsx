import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { HabitLimitModal } from "@/components/habit-limit-modal";

const addHabitSchema = z.object({
  name: z.string().min(1, "Habit name is required"),
  category: z.string().min(1, "Category is required"),
  frequency: z.string().default("daily"),
  goal: z.number().min(1, "Goal must be at least 1"),
  unit: z.string().default("times"),
  reminderTime: z.string().optional(),
});

type AddHabitForm = z.infer<typeof addHabitSchema>;

interface AddHabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddHabitModal({ open, onOpenChange }: AddHabitModalProps) {
  const [selectedFrequency, setSelectedFrequency] = useState("daily");
  const [showLimitModal, setShowLimitModal] = useState(false);
  const queryClient = useQueryClient();
  
  // Check habit count and subscription limits
  const { data: habits } = useQuery({
    queryKey: ['/api/habits'],
  });
  
  const { data: subscription } = useQuery({
    queryKey: ['/api/subscription-status'],
  });
  
  const habitCount = Array.isArray(habits) ? habits.length : 0;
  const maxHabits = subscription?.features?.max_habits || 3;
  const isAtLimit = habitCount >= maxHabits && (!subscription?.plan || subscription?.plan === "free");

  const form = useForm<AddHabitForm>({
    resolver: zodResolver(addHabitSchema),
    defaultValues: {
      name: "",
      category: "health",
      frequency: "daily",
      goal: 1,
      unit: "times",
      reminderTime: "",
    },
  });

  const createHabitMutation = useMutation({
    mutationFn: async (data: AddHabitForm) => {
      return apiRequest("POST", "/api/habits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/stats"] });
      onOpenChange(false);
      form.reset();
    },
  });

  const onSubmit = (data: AddHabitForm) => {
    // Check habit limit before creating
    if (isAtLimit) {
      setShowLimitModal(true);
      return;
    }
    createHabitMutation.mutate(data);
  };

  const adjustGoal = (increment: boolean) => {
    const currentGoal = form.getValues("goal");
    const newGoal = increment ? currentGoal + 1 : Math.max(1, currentGoal - 1);
    form.setValue("goal", newGoal);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 bg-white rounded-t-3xl sm:rounded-3xl border-0 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-gray-800">Add New Habit</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Habit Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Drink 8 glasses of water"
                        className="px-4 py-3 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="px-4 py-3 rounded-xl">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="health">Health & Fitness</SelectItem>
                        <SelectItem value="productivity">Productivity</SelectItem>
                        <SelectItem value="mindfulness">Mindfulness</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Frequency</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["daily", "weekly", "custom"].map((freq) => (
                    <Button
                      key={freq}
                      type="button"
                      variant={selectedFrequency === freq ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedFrequency(freq);
                        form.setValue("frequency", freq);
                      }}
                      className={`rounded-xl text-sm font-medium ${
                        selectedFrequency === freq
                          ? "bg-primary text-white border-primary"
                          : "border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Goal</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustGoal(false)}
                    className="w-10 h-10 rounded-lg"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        className="flex-1 text-center font-semibold rounded-xl"
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustGoal(true)}
                    className="w-10 h-10 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-500">times per day</span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="reminderTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Reminder Time</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        className="px-4 py-3 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 py-3 rounded-xl"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createHabitMutation.isPending}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 rounded-xl"
                >
                  {createHabitMutation.isPending ? "Creating..." : "Add Habit"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
      </Dialog>
      
      <HabitLimitModal 
        open={showLimitModal}
        onOpenChange={setShowLimitModal}
        currentCount={habitCount}
        maxHabits={maxHabits}
      />
    </>
  );
}
