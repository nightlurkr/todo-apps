import type {
  AppState,
  DailyLog,
  HabitDefinition,
  PrayerName,
  SyncedState,
  Task,
  WorkMode,
  WorkSession,
} from '../types';

const STORAGE_KEY = 'dailyos_user_state_v1';
export const CHALLENGE_LENGTH = 100;

/* ------------------------------------------------------------------ *
 * Tanggal — selalu WIB, apa pun timezone perangkat.
 * ------------------------------------------------------------------ */

const WIB = 'Asia/Jakarta';

/** YYYY-MM-DD di zona WIB. 'en-CA' memang memberi format ISO. */
export function dateKeyOf(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: WIB });
}

export function getTodayKey(): string {
  return dateKeyOf(new Date());
}

export function shiftDateKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  // Tengah hari UTC supaya pergeseran hari tidak terpeleset karena offset.
  const base = new Date(Date.UTC(y, m - 1, d, 12));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export function daysBetween(fromKey: string, toKey: string): number {
  const a = Date.parse(fromKey + 'T12:00:00Z');
  const b = Date.parse(toKey + 'T12:00:00Z');
  return Math.round((b - a) / 86400000);
}

/** Hanya hari ini dan kemarin yang boleh diubah. */
export function isEditableDate(key: string): boolean {
  const diff = daysBetween(key, getTodayKey());
  return diff === 0 || diff === 1;
}

export function challengeDayNumber(startKey: string, key = getTodayKey()): number {
  return daysBetween(startKey, key) + 1;
}

export function formatDateLabel(key: string): string {
  return new Date(key + 'T12:00:00Z').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/* ------------------------------------------------------------------ *
 * Default
 * ------------------------------------------------------------------ */

export const PRAYERS: { id: PrayerName; label: string; icon: string }[] = [
  { id: 'subuh', label: 'Subuh', icon: '🌅' },
  { id: 'dzuhur', label: 'Dzuhur', icon: '☀️' },
  { id: 'ashar', label: 'Ashar', icon: '🌤️' },
  { id: 'maghrib', label: 'Maghrib', icon: '🌇' },
  { id: 'isya', label: 'Isya', icon: '🌌' },
];

export function createEmptyDailyLog(date: string): DailyLog {
  return {
    date,
    prayers: { subuh: false, dzuhur: false, ashar: false, maghrib: false, isya: false },
    customHabits: {},
    sessions: [],
    dailyNotes: '',
    updatedAt: new Date().toISOString(),
  };
}

export const DEFAULT_HABITS: HabitDefinition[] = [
  { id: 'quran', name: "Baca Al-Qur'an / Dzikir", icon: '📖', createdAt: '2000-01-01T00:00:00.000Z' },
  { id: 'exercise', name: 'Workout / Fisik Ringan', icon: '🏃‍♂️', createdAt: '2000-01-01T00:00:00.000Z' },
  { id: 'water', name: 'Minum Air 2-3 Liter', icon: '💧', createdAt: '2000-01-01T00:00:00.000Z' },
  { id: 'sleep', name: 'Tidur Teratur & Cukup', icon: '🌙', createdAt: '2000-01-01T00:00:00.000Z' },
];

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const defaultEnvUrl = env.VITE_SUPABASE_URL || '';
const defaultEnvKey = env.VITE_SUPABASE_ANON_KEY || '';

export function createInitialState(): AppState {
  const today = getTodayKey();
  return {
    version: 2,
    challengeStartDate: today,
    settings: {
      pin: '1234',
      pinEnabled: false,
      supabaseUrl: defaultEnvUrl,
      supabaseAnonKey: defaultEnvKey,
      deepWorkDailyTarget: 100,
      collegeDailyTarget: 100,
    },
    habitDefinitions: DEFAULT_HABITS,
    dailyLogs: { [today]: createEmptyDailyLog(today) },
    tasks: [],
  };
}

/* ------------------------------------------------------------------ *
 * Sesi kerja & skor
 * ------------------------------------------------------------------ */

export function minutesFor(log: DailyLog | undefined, mode: WorkMode): number {
  if (!log?.sessions) return 0;
  return log.sessions.reduce((sum, s) => (s.mode === mode ? sum + (s.minutes || 0) : sum), 0);
}

/** Habit yang berlaku pada tanggal tertentu (belum diarsip saat itu). */
export function activeHabitsOn(habits: HabitDefinition[], dateKey: string): HabitDefinition[] {
  return habits.filter((h) => {
    const created = (h.createdAt || '').slice(0, 10);
    if (created && created > dateKey) return false;
    if (h.archivedAt && h.archivedAt.slice(0, 10) <= dateKey) return false;
    return true;
  });
}

export interface DayStats {
  score: number; // 0-100
  perfect: boolean;
  prayersDone: number;
  deepWorkMinutes: number;
  collegeMinutes: number;
  habitsDone: number;
  habitsTotal: number;
  surplus: boolean;
  hasData: boolean;
}

export function getDayStats(
  log: DailyLog | undefined,
  habits: HabitDefinition[],
  dateKey: string,
  deepTarget = 100,
  collegeTarget = 100
): DayStats {
  const activeHabits = activeHabitsOn(habits, dateKey);
  const prayersDone = log ? Object.values(log.prayers || {}).filter(Boolean).length : 0;
  const deep = minutesFor(log, 'deepWork');
  const college = minutesFor(log, 'college');
  const habitsDone = log
    ? activeHabits.filter((h) => log.customHabits?.[h.id]).length
    : 0;

  const prayerScore = (prayersDone / 5) * 35;
  const deepScore = Math.min(1, deep / (deepTarget || 100)) * 25;
  const collegeScore = Math.min(1, college / (collegeTarget || 100)) * 25;
  const habitScore = activeHabits.length
    ? (habitsDone / activeHabits.length) * 15
    : 15;

  const perfect =
    prayersDone === 5 &&
    deep >= (deepTarget || 100) &&
    college >= (collegeTarget || 100) &&
    habitsDone === activeHabits.length;

  const raw = prayerScore + deepScore + collegeScore + habitScore;
  // Jangan pernah tampilkan 100% untuk hari yang belum sempurna.
  const score = perfect ? 100 : Math.min(99, Math.round(raw));

  return {
    score,
    perfect,
    prayersDone,
    deepWorkMinutes: deep,
    collegeMinutes: college,
    habitsDone,
    habitsTotal: activeHabits.length,
    surplus: deep > (deepTarget || 100) || college > (collegeTarget || 100),
    hasData: !!log && (prayersDone > 0 || deep > 0 || college > 0 || habitsDone > 0),
  };
}

/** Streak = hari sempurna berturut-turut. Hari ini boleh belum selesai. */
export function calculateStreak(state: AppState): number {
  const { dailyLogs, habitDefinitions, settings } = state;
  let streak = 0;
  let key = getTodayKey();

  for (let i = 0; i < 400; i++) {
    const stats = getDayStats(
      dailyLogs[key],
      habitDefinitions,
      key,
      settings.deepWorkDailyTarget,
      settings.collegeDailyTarget
    );
    if (stats.perfect) {
      streak++;
    } else if (i > 0) {
      break; // hari lampau yang tidak sempurna memutus streak
    }
    key = shiftDateKey(key, -1);
    if (key < state.challengeStartDate) break;
  }
  return streak;
}

export function countMisses(state: AppState): number {
  const today = getTodayKey();
  let misses = 0;
  let key = state.challengeStartDate;
  while (key < today) {
    const stats = getDayStats(
      state.dailyLogs[key],
      state.habitDefinitions,
      key,
      state.settings.deepWorkDailyTarget,
      state.settings.collegeDailyTarget
    );
    if (!stats.perfect) misses++;
    key = shiftDateKey(key, 1);
  }
  return misses;
}

/* ------------------------------------------------------------------ *
 * Migrasi dari versi 1
 * ------------------------------------------------------------------ */

interface LegacyLog {
  date?: string;
  prayers?: Record<PrayerName, boolean>;
  deepWorkMinutes?: number;
  collegeStudyMinutes?: number;
  customHabits?: Record<string, boolean>;
  sessions?: WorkSession[];
  dailyNotes?: string;
  updatedAt?: string;
}

const LEGACY_NOTE = 'Dicatat sebelum sistem log sesi';

function migrateLog(dateKey: string, raw: LegacyLog): DailyLog {
  const base = createEmptyDailyLog(dateKey);
  const sessions: WorkSession[] = Array.isArray(raw.sessions) ? [...raw.sessions] : [];

  if (!raw.sessions) {
    if (raw.deepWorkMinutes) {
      sessions.push({
        id: `legacy-dw-${dateKey}`,
        mode: 'deepWork',
        minutes: raw.deepWorkMinutes,
        note: LEGACY_NOTE,
        source: 'manual',
        at: dateKey + 'T12:00:00.000Z',
      });
    }
    if (raw.collegeStudyMinutes) {
      sessions.push({
        id: `legacy-cl-${dateKey}`,
        mode: 'college',
        minutes: raw.collegeStudyMinutes,
        note: LEGACY_NOTE,
        source: 'manual',
        at: dateKey + 'T12:00:00.000Z',
      });
    }
  }

  return {
    ...base,
    date: dateKey,
    prayers: { ...base.prayers, ...(raw.prayers || {}) },
    customHabits: raw.customHabits || {},
    sessions,
    dailyNotes: raw.dailyNotes || '',
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

interface LegacyTask {
  id: string;
  course?: string;
  title: string;
  description?: string;
  dueDate?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  category?: string;
  targetDate?: string;
  tasks?: { id: string; title: string; completed: boolean }[];
  subtasks?: { id: string; title: string; completed: boolean }[];
  notes?: string;
  kind?: string;
}

function migrateCollegeTask(raw: LegacyTask): Task {
  return {
    id: raw.id,
    kind: 'college',
    title: raw.title,
    description: raw.description,
    course: raw.course,
    dueDate: raw.dueDate,
    status: raw.status === 'submitted' ? 'done' : raw.status === 'in_progress' ? 'in_progress' : 'todo',
    subtasks: raw.subtasks || [],
    notes: raw.notes,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  };
}

function migrateProject(raw: LegacyTask): Task {
  return {
    id: raw.id,
    kind: 'project',
    title: raw.title,
    description: raw.description,
    course: raw.category,
    dueDate: raw.targetDate || undefined,
    status: raw.status === 'completed' ? 'done' : raw.status === 'on_hold' ? 'todo' : 'in_progress',
    subtasks: raw.tasks || raw.subtasks || [],
    notes: raw.notes,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  };
}

interface LegacyState {
  version?: number;
  challengeStartDate?: string;
  settings?: Partial<AppState['settings']>;
  habitDefinitions?: HabitDefinition[];
  dailyLogs?: Record<string, LegacyLog>;
  tasks?: LegacyTask[];
  collegeTasks?: LegacyTask[];
  projects?: LegacyTask[];
}

export function migrateState(parsed: LegacyState): AppState {
  const initial = createInitialState();
  const today = getTodayKey();

  const dailyLogs: Record<string, DailyLog> = {};
  for (const [key, raw] of Object.entries(parsed.dailyLogs || {})) {
    dailyLogs[key] = migrateLog(key, raw || {});
  }
  if (!dailyLogs[today]) dailyLogs[today] = createEmptyDailyLog(today);

  let tasks: Task[];
  if (parsed.tasks) {
    tasks = parsed.tasks.map((t) => ({
      ...migrateCollegeTask(t),
      kind: (t.kind === 'project' ? 'project' : 'college') as Task['kind'],
      subtasks: t.subtasks || t.tasks || [],
      deletedAt: t.deletedAt,
    }));
  } else {
    tasks = [
      ...(parsed.collegeTasks || []).map(migrateCollegeTask),
      ...(parsed.projects || []).map(migrateProject),
    ];
  }

  const settings = { ...initial.settings, ...(parsed.settings || {}) };
  if (!settings.supabaseUrl && defaultEnvUrl) settings.supabaseUrl = defaultEnvUrl;
  if (!settings.supabaseAnonKey && defaultEnvKey) settings.supabaseAnonKey = defaultEnvKey;

  const logKeys = Object.keys(dailyLogs).sort();
  const start =
    parsed.challengeStartDate ||
    (logKeys.length ? logKeys[0] : today);

  return {
    version: 2,
    challengeStartDate: start,
    settings,
    habitDefinitions: parsed.habitDefinitions ?? DEFAULT_HABITS,
    dailyLogs,
    tasks,
  };
}

/* ------------------------------------------------------------------ *
 * Local storage
 * ------------------------------------------------------------------ */

export function loadLocalState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    return migrateState(JSON.parse(raw) as LegacyState);
  } catch (err) {
    console.error('Gagal memuat state lokal:', err);
    return createInitialState();
  }
}

export function saveLocalState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Gagal menyimpan ke localStorage:', err);
  }
}

/* ------------------------------------------------------------------ *
 * Merge — SATU fungsi untuk fetch awal, realtime, dan force pull.
 * Dulu ketiganya beda: fetch awal menimpa state utuh, dan itulah
 * sebabnya centang bisa balik lagi beberapa ratus milidetik kemudian.
 * ------------------------------------------------------------------ */

function mergeLogs(local: DailyLog | undefined, remote: DailyLog | undefined): DailyLog | undefined {
  if (!local) return remote;
  if (!remote) return local;

  // Sesi digabung per id, jadi dua perangkat bisa menambah sesi berbeda
  // di hari yang sama tanpa saling menimpa.
  const byId = new Map<string, WorkSession>();
  for (const s of local.sessions || []) byId.set(s.id, s);
  for (const s of remote.sessions || []) byId.set(s.id, s);
  const sessions = [...byId.values()].sort((a, b) => a.at.localeCompare(b.at));

  const remoteNewer =
    new Date(remote.updatedAt || 0).getTime() > new Date(local.updatedAt || 0).getTime();
  const winner = remoteNewer ? remote : local;

  return {
    ...winner,
    sessions,
    updatedAt: remoteNewer ? remote.updatedAt : local.updatedAt,
  };
}

function mergeById<T extends { id: string; updatedAt?: string; archivedAt?: string; deletedAt?: string }>(
  local: T[],
  remote: T[]
): T[] {
  const byId = new Map<string, T>();
  for (const item of local) byId.set(item.id, item);
  for (const item of remote) {
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, item);
      continue;
    }
    // Penghapusan/arsip selalu menang, supaya tidak hidup lagi.
    if (item.deletedAt || item.archivedAt) {
      byId.set(item.id, item);
      continue;
    }
    if (existing.deletedAt || existing.archivedAt) continue;
    const a = new Date(existing.updatedAt || 0).getTime();
    const b = new Date(item.updatedAt || 0).getTime();
    if (b > a) byId.set(item.id, item);
  }
  return [...byId.values()];
}

export function mergeState(local: AppState, remote: Partial<SyncedState> | null): AppState {
  if (!remote) return local;

  const dailyLogs: Record<string, DailyLog> = { ...local.dailyLogs };
  for (const key of Object.keys(remote.dailyLogs || {})) {
    const merged = mergeLogs(local.dailyLogs[key], remote.dailyLogs![key]);
    if (merged) dailyLogs[key] = merged;
  }

  return {
    ...local,
    // settings tidak pernah ikut cloud: PIN, URL, dan key tetap milik perangkat ini.
    challengeStartDate:
      remote.challengeStartDate && remote.challengeStartDate < local.challengeStartDate
        ? remote.challengeStartDate
        : local.challengeStartDate,
    habitDefinitions: mergeById(local.habitDefinitions, remote.habitDefinitions || []),
    dailyLogs,
    tasks: mergeById(local.tasks, remote.tasks || []),
  };
}

/** Buang tombstone yang sudah lewat 30 hari supaya payload tidak membengkak. */
export function pruneTombstones(tasks: Task[]): Task[] {
  const cutoff = Date.now() - 30 * 86400000;
  return tasks.filter((t) => !t.deletedAt || Date.parse(t.deletedAt) > cutoff);
}

export function visibleTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.deletedAt);
}

/** Versi pendek untuk header yang sempit di HP. */
export function formatDateShort(key: string): string {
  return new Date(key + 'T12:00:00Z').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
