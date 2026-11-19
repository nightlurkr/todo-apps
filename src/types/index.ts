export type PrayerName = 'subuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya';

export type WorkMode = 'deepWork' | 'college';

export interface HabitDefinition {
  id: string;
  name: string;
  icon?: string;
  createdAt: string;
  /** Soft delete. Hari sebelum tanggal ini tetap menghitung habit ini. */
  archivedAt?: string;
}

export interface WorkSession {
  id: string;
  mode: WorkMode;
  minutes: number;
  /** Wajib diisi. Tanpa catatan, sesi tidak boleh masuk. */
  note: string;
  source: 'timer' | 'manual';
  at: string; // ISO
}

export interface DailyLog {
  date: string; // YYYY-MM-DD (WIB)
  prayers: Record<PrayerName, boolean>;
  customHabits: Record<string, boolean>; // habitId -> boolean
  sessions: WorkSession[];
  dailyNotes?: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskKind = 'college' | 'project';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  kind: TaskKind;
  title: string;
  description?: string;
  /** Mata kuliah / kategori project */
  course?: string;
  dueDate?: string; // YYYY-MM-DD, kosong = ongoing tanpa deadline
  status: TaskStatus;
  subtasks: Subtask[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  /** Tombstone, supaya penghapusan tidak hidup lagi saat sync. */
  deletedAt?: string;
}

export interface AppSettings {
  pin: string;
  pinEnabled: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  deepWorkDailyTarget: number; // default 100
  collegeDailyTarget: number; // default 100
  lastSyncedAt?: string;
}

export interface AppState {
  version: number;
  /** Hari ke-1 dari tantangan 100 hari (YYYY-MM-DD WIB). */
  challengeStartDate: string;
  settings: AppSettings;
  habitDefinitions: HabitDefinition[];
  dailyLogs: Record<string, DailyLog>;
  tasks: Task[];
}

/** Bagian state yang ikut ke cloud. `settings` sengaja tidak disertakan. */
export type SyncedState = Pick<
  AppState,
  'version' | 'challengeStartDate' | 'habitDefinitions' | 'dailyLogs' | 'tasks'
>;

export type ActiveTab = 'overview' | 'tasks' | 'timer';
