export type PrayerName = 'subuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya';

export interface HabitDefinition {
  id: string;
  name: string;
  icon?: string;
  targetUnit?: string; // e.g. "kali", "menit"
  createdAt: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  prayers: Record<PrayerName, boolean>;
  deepWorkMinutes: number;
  collegeStudyMinutes: number;
  customHabits: Record<string, boolean>; // habitId -> boolean
  dailyNotes?: string;
  updatedAt: string;
}

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'submitted';

export interface CollegeTask {
  id: string;
  course: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD or ISO
  priority: Priority;
  status: TaskStatus;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold';

export interface Project {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: ProjectStatus;
  targetDate?: string;
  tasks: Subtask[];
  notes?: string;
  createdAt: string;
}

export interface AppSettings {
  pin: string; // 4-6 digits (optional/default)
  pinEnabled: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  deepWorkDailyTarget: number; // default 100
  collegeDailyTarget: number; // default 100
  lastSyncedAt?: string;
}

export interface AppState {
  version: number;
  settings: AppSettings;
  habitDefinitions: HabitDefinition[];
  dailyLogs: Record<string, DailyLog>; // date YYYY-MM-DD -> DailyLog
  collegeTasks: CollegeTask[];
  projects: Project[];
}

export type ActiveTab = 'overview' | 'daily' | 'college' | 'projects' | 'timer';
