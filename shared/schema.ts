import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  frequency: text("frequency").notNull().default("daily"), // daily, weekly, custom
  goal: integer("goal").notNull().default(1),
  unit: text("unit").notNull().default("times"),
  reminderTime: text("reminder_time"),
  streak: integer("streak").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const habitCompletions = pgTable("habit_completions", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  progress: integer("progress").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

export const coachingTips = pgTable("coaching_tips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tip: text("tip").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  streak: true,
  createdAt: true,
}).extend({
  reminderTime: z.string().optional(),
});

export const insertHabitCompletionSchema = createInsertSchema(habitCompletions).omit({
  id: true,
  completedAt: true,
});

export const insertCoachingTipSchema = createInsertSchema(coachingTips).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type InsertHabitCompletion = z.infer<typeof insertHabitCompletionSchema>;
export type CoachingTip = typeof coachingTips.$inferSelect;
export type InsertCoachingTip = z.infer<typeof insertCoachingTipSchema>;
