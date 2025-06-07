import { 
  users, habits, habitCompletions, coachingTips, moodEntries, chatMessages, reminders,
  type User, type InsertUser,
  type Habit, type InsertHabit,
  type HabitCompletion, type InsertHabitCompletion,
  type CoachingTip, type InsertCoachingTip,
  type MoodEntry, type InsertMoodEntry,
  type ChatMessage, type InsertChatMessage,
  type Reminder, type InsertReminder
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
  
  // Mood tracking methods
  getMoodEntries(userId: number): Promise<MoodEntry[]>;
  getMoodEntryByDate(userId: number, date: string): Promise<MoodEntry | undefined>;
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  updateMoodEntry(id: number, updates: Partial<MoodEntry>): Promise<MoodEntry | undefined>;
  
  // Chat methods
  getChatMessages(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Reminder methods
  getReminders(userId: number): Promise<Reminder[]>;
  getRemindersByHabit(habitId: number): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, updates: Partial<Reminder>): Promise<Reminder | undefined>;
  deleteReminder(id: number): Promise<boolean>;
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

  async getMoodEntries(userId: number): Promise<MoodEntry[]> {
    return await db.select().from(moodEntries).where(eq(moodEntries.userId, userId));
  }

  async getMoodEntryByDate(userId: number, date: string): Promise<MoodEntry | undefined> {
    const [entry] = await db
      .select()
      .from(moodEntries)
      .where(and(
        eq(moodEntries.userId, userId),
        eq(moodEntries.date, date)
      ));
    return entry || undefined;
  }

  async createMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    const [entry] = await db
      .insert(moodEntries)
      .values(insertEntry)
      .returning();
    return entry;
  }

  async updateMoodEntry(id: number, updates: Partial<MoodEntry>): Promise<MoodEntry | undefined> {
    const [entry] = await db
      .update(moodEntries)
      .set(updates)
      .where(eq(moodEntries.id, id))
      .returning();
    return entry || undefined;
  }

  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.userId, userId));
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getReminders(userId: number): Promise<Reminder[]> {
    return await db.select().from(reminders).where(eq(reminders.userId, userId));
  }

  async getRemindersByHabit(habitId: number): Promise<Reminder[]> {
    return await db.select().from(reminders).where(eq(reminders.habitId, habitId));
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const [reminder] = await db
      .insert(reminders)
      .values(insertReminder)
      .returning();
    return reminder;
  }

  async updateReminder(id: number, updates: Partial<Reminder>): Promise<Reminder | undefined> {
    const [reminder] = await db
      .update(reminders)
      .set(updates)
      .where(eq(reminders.id, id))
      .returning();
    return reminder || undefined;
  }

  async deleteReminder(id: number): Promise<boolean> {
    const result = await db
      .update(reminders)
      .set({ isActive: false })
      .where(eq(reminders.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private habits: Map<number, Habit>;
  private habitCompletions: Map<number, HabitCompletion>;
  private coachingTips: Map<number, CoachingTip>;
  private moodEntries: Map<number, MoodEntry>;
  private chatMessages: Map<number, ChatMessage>;
  private reminders: Map<number, Reminder>;
  private currentUserId: number;
  private currentHabitId: number;
  private currentCompletionId: number;
  private currentTipId: number;
  private currentMoodId: number;
  private currentChatId: number;
  private currentReminderId: number;

  constructor() {
    this.users = new Map();
    this.habits = new Map();
    this.habitCompletions = new Map();
    this.coachingTips = new Map();
    this.moodEntries = new Map();
    this.chatMessages = new Map();
    this.reminders = new Map();
    this.currentUserId = 2;
    this.currentHabitId = 7;
    this.currentCompletionId = 1;
    this.currentTipId = 3;
    this.currentMoodId = 1;
    this.currentChatId = 1;
    this.currentReminderId = 1;

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create default user
    const user: User = {
      id: 1,
      username: "demo",
      password: "demo"
    };
    this.users.set(1, user);

    // Create sample habits
    const sampleHabits: Habit[] = [
      {
        id: 1,
        userId: 1,
        name: "Morning Exercise",
        category: "health",
        frequency: "daily",
        goal: 1,
        unit: "times",
        reminderTime: null,
        streak: 5,
        isActive: true,
        createdAt: new Date("2025-06-06T23:26:36.403Z")
      },
      {
        id: 2,
        userId: 1,
        name: "Drink 8 glasses of water",
        category: "health",
        frequency: "daily",
        goal: 8,
        unit: "glasses",
        reminderTime: null,
        streak: 3,
        isActive: true,
        createdAt: new Date("2025-06-06T23:43:48.047Z")
      },
      {
        id: 3,
        userId: 1,
        name: "10-minute meditation",
        category: "mindfulness",
        frequency: "daily",
        goal: 10,
        unit: "minutes",
        reminderTime: null,
        streak: 7,
        isActive: true,
        createdAt: new Date("2025-06-06T23:43:48.047Z")
      },
      {
        id: 4,
        userId: 1,
        name: "Read for 30 minutes",
        category: "learning",
        frequency: "daily",
        goal: 30,
        unit: "minutes",
        reminderTime: null,
        streak: 2,
        isActive: true,
        createdAt: new Date("2025-06-06T23:43:48.047Z")
      },
      {
        id: 5,
        userId: 1,
        name: "50 push-ups",
        category: "fitness",
        frequency: "daily",
        goal: 50,
        unit: "times",
        reminderTime: null,
        streak: 1,
        isActive: true,
        createdAt: new Date("2025-06-06T23:43:48.047Z")
      },
      {
        id: 6,
        userId: 1,
        name: "Write in gratitude journal",
        category: "mindfulness",
        frequency: "daily",
        goal: 1,
        unit: "times",
        reminderTime: null,
        streak: 4,
        isActive: true,
        createdAt: new Date("2025-06-06T23:43:48.047Z")
      }
    ];

    sampleHabits.forEach(habit => {
      this.habits.set(habit.id, habit);
    });

    // Create sample coaching tips
    const sampleTips: CoachingTip[] = [
      {
        id: 1,
        userId: 1,
        tip: "Start small and build momentum. Even 5 minutes of exercise is better than none.",
        category: "motivation",
        createdAt: new Date()
      },
      {
        id: 2,
        userId: 1,
        tip: "Track your water intake to stay hydrated throughout the day.",
        category: "health",
        createdAt: new Date()
      }
    ];

    sampleTips.forEach(tip => {
      this.coachingTips.set(tip.id, tip);
    });
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

  async getMoodEntries(userId: number): Promise<MoodEntry[]> {
    return Array.from(this.moodEntries.values()).filter(entry => entry.userId === userId);
  }

  async getMoodEntryByDate(userId: number, date: string): Promise<MoodEntry | undefined> {
    return Array.from(this.moodEntries.values()).find(
      entry => entry.userId === userId && entry.date === date
    );
  }

  async createMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = this.currentMoodId++;
    const entry: MoodEntry = {
      id,
      userId: insertEntry.userId,
      date: insertEntry.date,
      mood: insertEntry.mood,
      energy: insertEntry.energy,
      notes: insertEntry.notes || null,
      createdAt: new Date(),
    };
    this.moodEntries.set(id, entry);
    return entry;
  }

  async updateMoodEntry(id: number, updates: Partial<MoodEntry>): Promise<MoodEntry | undefined> {
    const entry = this.moodEntries.get(id);
    if (!entry) return undefined;
    
    const updatedEntry = { ...entry, ...updates };
    this.moodEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(message => message.userId === userId);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getReminders(userId: number): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(reminder => reminder.userId === userId);
  }

  async getRemindersByHabit(habitId: number): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(reminder => reminder.habitId === habitId);
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const id = this.currentReminderId++;
    const reminder: Reminder = {
      id,
      habitId: insertReminder.habitId,
      userId: insertReminder.userId,
      time: insertReminder.time,
      isActive: insertReminder.isActive ?? true,
      lastSent: null,
      createdAt: new Date(),
    };
    this.reminders.set(id, reminder);
    return reminder;
  }

  async updateReminder(id: number, updates: Partial<Reminder>): Promise<Reminder | undefined> {
    const reminder = this.reminders.get(id);
    if (!reminder) return undefined;
    
    const updatedReminder = { ...reminder, ...updates };
    this.reminders.set(id, updatedReminder);
    return updatedReminder;
  }

  async deleteReminder(id: number): Promise<boolean> {
    const reminder = this.reminders.get(id);
    if (!reminder) return false;
    
    reminder.isActive = false;
    this.reminders.set(id, reminder);
    return true;
  }
}

export const storage = new MemStorage();
