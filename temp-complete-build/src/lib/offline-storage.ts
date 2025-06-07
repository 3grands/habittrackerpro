import { HabitWithProgress, HabitStats } from "./types";

interface OfflineAction {
  id: string;
  type: 'complete_habit' | 'undo_habit' | 'create_habit' | 'update_habit';
  habitId?: number;
  data?: any;
  timestamp: number;
}

interface OfflineData {
  habits: HabitWithProgress[];
  stats: HabitStats | null;
  lastSync: number;
  pendingActions: OfflineAction[];
}

const STORAGE_KEY = 'habit_tracker_offline';
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

class OfflineStorage {
  private data: OfflineData;
  private syncInProgress = false;

  constructor() {
    this.data = this.loadFromStorage();
    this.setupPeriodicSync();
    this.setupOnlineListener();
  }

  private loadFromStorage(): OfflineData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to parse offline data, using defaults');
      }
    }
    
    return {
      habits: [],
      stats: null,
      lastSync: 0,
      pendingActions: []
    };
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  private setupPeriodicSync(): void {
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.syncWithServer();
      }
    }, SYNC_INTERVAL);
  }

  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      if (!this.syncInProgress) {
        this.syncWithServer();
      }
    });
  }

  // Get cached data
  getHabits(): HabitWithProgress[] {
    return this.data.habits;
  }

  getStats(): HabitStats | null {
    return this.data.stats;
  }

  // Cache fresh data from server
  cacheHabits(habits: HabitWithProgress[]): void {
    this.data.habits = habits;
    this.data.lastSync = Date.now();
    this.saveToStorage();
  }

  cacheStats(stats: HabitStats): void {
    this.data.stats = stats;
    this.saveToStorage();
  }

  // Offline actions
  completeHabitOffline(habitId: number): void {
    // Update local data immediately
    const habit = this.data.habits.find(h => h.id === habitId);
    if (habit) {
      habit.isCompletedToday = true;
      habit.todayProgress = habit.goal;
      habit.streak += 1;

      // Queue action for sync
      this.addPendingAction({
        id: `complete_${habitId}_${Date.now()}`,
        type: 'complete_habit',
        habitId,
        timestamp: Date.now()
      });

      this.saveToStorage();
    }
  }

  undoHabitOffline(habitId: number): void {
    // Update local data immediately
    const habit = this.data.habits.find(h => h.id === habitId);
    if (habit) {
      habit.isCompletedToday = false;
      habit.todayProgress = 0;
      habit.streak = Math.max(0, habit.streak - 1);

      // Queue action for sync
      this.addPendingAction({
        id: `undo_${habitId}_${Date.now()}`,
        type: 'undo_habit',
        habitId,
        timestamp: Date.now()
      });

      this.saveToStorage();
    }
  }

  private addPendingAction(action: OfflineAction): void {
    this.data.pendingActions.push(action);
    
    // Limit pending actions to prevent storage bloat
    if (this.data.pendingActions.length > 100) {
      this.data.pendingActions = this.data.pendingActions.slice(-50);
    }
  }

  // Sync with server
  async syncWithServer(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) return;

    this.syncInProgress = true;
    
    try {
      // Process pending actions
      for (const action of this.data.pendingActions) {
        await this.processPendingAction(action);
      }
      
      // Clear processed actions
      this.data.pendingActions = [];
      
      // Fetch fresh data
      await this.fetchFreshData();
      
      this.data.lastSync = Date.now();
      this.saveToStorage();
      
      console.log('Offline sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processPendingAction(action: OfflineAction): Promise<void> {
    try {
      switch (action.type) {
        case 'complete_habit':
          await fetch(`/api/habits/${action.habitId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          break;
          
        case 'undo_habit':
          await fetch(`/api/habits/${action.habitId}/undo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          break;
          
        case 'create_habit':
          await fetch('/api/habits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data)
          });
          break;
          
        case 'update_habit':
          await fetch(`/api/habits/${action.habitId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data)
          });
          break;
      }
    } catch (error) {
      console.error(`Failed to process action ${action.type}:`, error);
      throw error;
    }
  }

  private async fetchFreshData(): Promise<void> {
    try {
      const [habitsResponse, statsResponse] = await Promise.all([
        fetch('/api/habits'),
        fetch('/api/habits/stats')
      ]);

      if (habitsResponse.ok) {
        const habits = await habitsResponse.json();
        this.data.habits = habits;
      }

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        this.data.stats = stats;
      }
    } catch (error) {
      console.error('Failed to fetch fresh data:', error);
      throw error;
    }
  }

  // Check if data is stale
  isDataStale(): boolean {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    return Date.now() - this.data.lastSync > maxAge;
  }

  // Check if offline
  isOffline(): boolean {
    return !navigator.onLine;
  }

  // Get sync status
  getSyncStatus(): { isOnline: boolean; isStale: boolean; pendingActions: number } {
    return {
      isOnline: navigator.onLine,
      isStale: this.isDataStale(),
      pendingActions: this.data.pendingActions.length
    };
  }

  // Force sync
  async forcSync(): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline');
    }
    
    await this.syncWithServer();
  }
}

export const offlineStorage = new OfflineStorage();