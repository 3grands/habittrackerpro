import { 
  users, habits, habitCompletions, coachingTips,
  type User, type InsertUser,
  type Habit, type InsertHabit,
  type HabitCompletion, type InsertHabitCompletion,
  type CoachingTip, type InsertCoachingTip
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Habit methods
  getHabits(userId: number): Promise<Habit[]>;
  getHabit(id: number): Promise<Habit | undefined>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: number, updates: Partial<Habit>): Promise<Habit | undefined>;
  deleteHabit(id: number): Promise<boolean>;

  // Habit completion methods
  getHabitCompletions(habitId: number): Promise<HabitCompletion[]>;
  getHabitCompletionByDate(habitId: number, date: string): Promise<HabitCompletion | undefined>;
  createHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion>;
  updateHabitCompletion(id: number, updates: Partial<HabitCompletion>): Promise<HabitCompletion | undefined>;
  
  // Coaching methods
  getCoachingTips(userId: number): Promise<CoachingTip[]>;
  createCoachingTip(tip: InsertCoachingTip): Promise<CoachingTip>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private habits: Map<number, Habit>;
  private habitCompletions: Map<number, HabitCompletion>;
  private coachingTips: Map<number, CoachingTip>;
  private currentUserId: number;
  private currentHabitId: number;
  private currentCompletionId: number;
  private currentTipId: number;

  constructor() {
    this.users = new Map();
    this.habits = new Map();
    this.habitCompletions = new Map();
    this.coachingTips = new Map();
    this.currentUserId = 1;
    this.currentHabitId = 1;
    this.currentCompletionId = 1;
    this.currentTipId = 1;

    // Create default user for demo
    this.createUser({ username: "demo", password: "demo" });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getHabits(userId: number): Promise<Habit[]> {
    return Array.from(this.habits.values()).filter(
      (habit) => habit.userId === userId && habit.isActive
    );
  }

  async getHabit(id: number): Promise<Habit | undefined> {
    return this.habits.get(id);
  }

  async createHabit(insertHabit: InsertHabit): Promise<Habit> {
    const id = this.currentHabitId++;
    const habit: Habit = {
      ...insertHabit,
      id,
      streak: 0,
      isActive: true,
      createdAt: new Date(),
    };
    this.habits.set(id, habit);
    return habit;
  }

  async updateHabit(id: number, updates: Partial<Habit>): Promise<Habit | undefined> {
    const habit = this.habits.get(id);
    if (!habit) return undefined;
    
    const updatedHabit = { ...habit, ...updates };
    this.habits.set(id, updatedHabit);
    return updatedHabit;
  }

  async deleteHabit(id: number): Promise<boolean> {
    const habit = this.habits.get(id);
    if (!habit) return false;
    
    habit.isActive = false;
    this.habits.set(id, habit);
    return true;
  }

  async getHabitCompletions(habitId: number): Promise<HabitCompletion[]> {
    return Array.from(this.habitCompletions.values()).filter(
      (completion) => completion.habitId === habitId
    );
  }

  async getHabitCompletionByDate(habitId: number, date: string): Promise<HabitCompletion | undefined> {
    return Array.from(this.habitCompletions.values()).find(
      (completion) => completion.habitId === habitId && completion.date === date
    );
  }

  async createHabitCompletion(insertCompletion: InsertHabitCompletion): Promise<HabitCompletion> {
    const id = this.currentCompletionId++;
    const completion: HabitCompletion = {
      ...insertCompletion,
      id,
      completedAt: insertCompletion.isCompleted ? new Date() : null,
    };
    this.habitCompletions.set(id, completion);
    return completion;
  }

  async updateHabitCompletion(id: number, updates: Partial<HabitCompletion>): Promise<HabitCompletion | undefined> {
    const completion = this.habitCompletions.get(id);
    if (!completion) return undefined;
    
    const updatedCompletion = { 
      ...completion, 
      ...updates,
      completedAt: updates.isCompleted ? new Date() : completion.completedAt
    };
    this.habitCompletions.set(id, updatedCompletion);
    return updatedCompletion;
  }

  async getCoachingTips(userId: number): Promise<CoachingTip[]> {
    return Array.from(this.coachingTips.values()).filter(
      (tip) => tip.userId === userId
    );
  }

  async createCoachingTip(insertTip: InsertCoachingTip): Promise<CoachingTip> {
    const id = this.currentTipId++;
    const tip: CoachingTip = {
      ...insertTip,
      id,
      createdAt: new Date(),
    };
    this.coachingTips.set(id, tip);
    return tip;
  }
}

export const storage = new MemStorage();
