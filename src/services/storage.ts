import type { AppState, DailyLog, HabitDefinition } from '../types';

const STORAGE_KEY = 'dailyos_user_state_v1';

export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createEmptyDailyLog(date: string): DailyLog {
  return {
    date,
    prayers: {
      subuh: false,
      dzuhur: false,
      ashar: false,
      maghrib: false,
      isya: false,
    },
    deepWorkMinutes: 0,
    collegeStudyMinutes: 0,
    customHabits: {},
    dailyNotes: '',
    updatedAt: new Date().toISOString(),
  };
}

export const DEFAULT_HABITS: HabitDefinition[] = [
  { id: 'quran', name: "Baca Al-Qur'an / Dzikir", icon: '📖', createdAt: new Date().toISOString() },
  { id: 'exercise', name: 'Workout / Fisik Ringan', icon: '🏃‍♂️', createdAt: new Date().toISOString() },
  { id: 'water', name: 'Minum Air 2-3 Liter', icon: '💧', createdAt: new Date().toISOString() },
  { id: 'sleep', name: 'Tidur Teratur & Cukup', icon: '🌙', createdAt: new Date().toISOString() },
];

export const INITIAL_STATE: AppState = {
  version: 1,
  settings: {
    pin: '1234',
    pinEnabled: false,
    supabaseUrl: '',
    supabaseAnonKey: '',
    deepWorkDailyTarget: 100,
    collegeDailyTarget: 100,
  },
  habitDefinitions: DEFAULT_HABITS,
  dailyLogs: {
    [getTodayKey()]: createEmptyDailyLog(getTodayKey()),
  },
  collegeTasks: [
    {
      id: 'task-demo-1',
      course: 'Tugas Kuliah',
      title: 'Contoh: Submit Paper / Resume Jurnal',
      description: 'Catat tugas kuliah, deadline, dan mata kuliah di sini.',
      dueDate: getTodayKey(),
      priority: 'high',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
    },
  ],
  projects: [
    {
      id: 'proj-demo-1',
      title: 'Personal Tracker & Dashboard App',
      description: 'Membangun sistem accountability pribadi, tugas kuliah, dan habit tracker.',
      category: 'Personal Project',
      status: 'in_progress',
      targetDate: '',
      tasks: [
        { id: 't1', title: 'Setup aplikasi & jalankan di laptop', completed: true },
        { id: 't2', title: 'Setup Supabase cloud sync untuk HP', completed: false },
        { id: 't3', title: 'Capai target 100 menit deep work pertama', completed: false },
      ],
      notes: 'Gunakan tab timer untuk menghitung waktu fokus otomatis.',
      createdAt: new Date().toISOString(),
    },
  ],
};

export function loadLocalState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    
    const today = getTodayKey();
    const dailyLogs = parsed.dailyLogs || {};
    if (!dailyLogs[today]) {
      dailyLogs[today] = createEmptyDailyLog(today);
    }

    return {
      version: 1,
      settings: { ...INITIAL_STATE.settings, ...(parsed.settings || {}) },
      habitDefinitions: parsed.habitDefinitions?.length ? parsed.habitDefinitions : DEFAULT_HABITS,
      dailyLogs,
      collegeTasks: parsed.collegeTasks || [],
      projects: parsed.projects || [],
    };
  } catch (err) {
    console.error('Failed to load local state:', err);
    return INITIAL_STATE;
  }
}

export function saveLocalState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function calculateAccountabilityScore(
  log: DailyLog,
  habitCount: number,
  deepWorkTarget: number = 100,
  collegeTarget: number = 100
): number {
  const prayersDone = Object.values(log.prayers).filter(Boolean).length;
  const prayerScore = (prayersDone / 5) * 35;

  const deepWorkScore = Math.min(1, (log.deepWorkMinutes || 0) / (deepWorkTarget || 100)) * 25;
  const collegeScore = Math.min(1, (log.collegeStudyMinutes || 0) / (collegeTarget || 100)) * 25;

  let customHabitScore = 15;
  if (habitCount > 0) {
    const doneCount = Object.values(log.customHabits || {}).filter(Boolean).length;
    customHabitScore = (Math.min(habitCount, doneCount) / habitCount) * 15;
  }

  return Math.round(prayerScore + deepWorkScore + collegeScore + customHabitScore);
}

export function calculateCurrentStreak(dailyLogs: Record<string, DailyLog>): number {
  let streak = 0;
  const now = new Date();
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const log = dailyLogs[key];
    
    if (log) {
      const prayersDone = Object.values(log.prayers).filter(Boolean).length;
      const workDone = (log.deepWorkMinutes || 0) + (log.collegeStudyMinutes || 0);
      const customDone = Object.values(log.customHabits || {}).filter(Boolean).length;
      
      if (prayersDone >= 3 || workDone >= 50 || customDone >= 1) {
        streak++;
      } else {
        if (i === 0) continue;
        break;
      }
    } else {
      if (i === 0) continue;
      break;
    }
  }

  return streak;
}
