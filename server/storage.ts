import { 
  users, habits, habitCompletions, coachingTips,
  type User, type InsertUser,
  type Habit, type InsertHabit,
  type HabitCompletion, type InsertHabitCompletion,
  type CoachingTip, type InsertCoachingTip
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getHabits(userId: number): Promise<Habit[]> {
    return await db.select().from(habits).where(
      and(
        eq(habits.userId, userId),
        eq(habits.isActive, true)
      )
    );
  }

  async getHabit(id: number): Promise<Habit | undefined> {
    const [habit] = await db.select().from(habits).where(eq(habits.id, id));
    return habit || undefined;
  }

  async createHabit(insertHabit: InsertHabit): Promise<Habit> {
    const [habit] = await db
      .insert(habits)
      .values(insertHabit)
      .returning();
    return habit;
  }

  async updateHabit(id: number, updates: Partial<Habit>): Promise<Habit | undefined> {
    const [habit] = await db
      .update(habits)
      .set(updates)
      .where(eq(habits.id, id))
      .returning();
    return habit || undefined;
  }

  async deleteHabit(id: number): Promise<boolean> {
    const result = await db
      .update(habits)
      .set({ isActive: false })
      .where(eq(habits.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getHabitCompletions(habitId: number): Promise<HabitCompletion[]> {
    return await db.select().from(habitCompletions).where(eq(habitCompletions.habitId, habitId));
  }

  async getHabitCompletionByDate(habitId: number, date: string): Promise<HabitCompletion | undefined> {
    const [completion] = await db
      .select()
      .from(habitCompletions)
      .where(and(
        eq(habitCompletions.habitId, habitId),
        eq(habitCompletions.date, date)
      ));
    return completion || undefined;
  }

  async createHabitCompletion(insertCompletion: InsertHabitCompletion): Promise<HabitCompletion> {
    const [completion] = await db
      .insert(habitCompletions)
      .values(insertCompletion)
      .returning();
    return completion;
  }

  async updateHabitCompletion(id: number, updates: Partial<HabitCompletion>): Promise<HabitCompletion | undefined> {
    const [completion] = await db
      .update(habitCompletions)
      .set(updates)
      .where(eq(habitCompletions.id, id))
      .returning();
    return completion || undefined;
  }

  async getCoachingTips(userId: number): Promise<CoachingTip[]> {
    return await db.select().from(coachingTips).where(eq(coachingTips.userId, userId));
  }

  async createCoachingTip(insertTip: InsertCoachingTip): Promise<CoachingTip> {
    const [tip] = await db
      .insert(coachingTips)
      .values(insertTip)
      .returning();
    return tip;
  }
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
      id,
      name: insertHabit.name,
      userId: insertHabit.userId,
      category: insertHabit.category,
      frequency: insertHabit.frequency || "daily",
      goal: insertHabit.goal || 1,
      unit: insertHabit.unit || "times",
      reminderTime: insertHabit.reminderTime || null,
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
      id,
      habitId: insertCompletion.habitId,
      date: insertCompletion.date,
      progress: insertCompletion.progress || 0,
      isCompleted: insertCompletion.isCompleted || false,
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

export const storage = new DatabaseStorage();
