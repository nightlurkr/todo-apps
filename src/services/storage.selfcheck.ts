/**
 * Pemeriksaan cepat untuk logika yang paling gampang diam-diam rusak:
 * merge sync dan skor harian. Jalan otomatis di `npm run dev`, hasilnya
 * di console. Tidak ikut ter-bundle ke build produksi.
 */
import type { AppState, DailyLog, Task } from '../types';
import {
  createEmptyDailyLog,
  createInitialState,
  getDayStats,
  mergeState,
  migrateState,
  activeHabitsOn,
} from './storage';

function assert(ok: boolean, label: string) {
  if (!ok) console.error('❌ selfcheck gagal:', label);
  return ok;
}

function logWith(date: string, patch: Partial<DailyLog>): DailyLog {
  return { ...createEmptyDailyLog(date), ...patch };
}

export function runSelfCheck() {
  let pass = true;
  const D = '2026-01-01';

  const base: AppState = {
    ...createInitialState(),
    challengeStartDate: D,
    habitDefinitions: [{ id: 'h1', name: 'Olahraga', createdAt: '2000-01-01T00:00:00.000Z' }],
    dailyLogs: {},
    tasks: [],
  };

  /* 1. Centang lokal tidak boleh hilang ditimpa data remote yang lebih tua. */
  const local: AppState = {
    ...base,
    dailyLogs: {
      [D]: logWith(D, {
        prayers: { subuh: true, dzuhur: false, ashar: false, maghrib: false, isya: false },
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
    },
  };
  const stale = {
    dailyLogs: {
      [D]: logWith(D, { updatedAt: '2026-01-01T09:00:00.000Z' }),
    },
  };
  pass = assert(mergeState(local, stale).dailyLogs[D].prayers.subuh, 'remote lama menimpa centang lokal') && pass;

  /* 2. Sesi dari dua perangkat digabung, bukan saling menimpa. */
  const a: AppState = {
    ...base,
    dailyLogs: {
      [D]: logWith(D, {
        sessions: [{ id: 's1', mode: 'deepWork', minutes: 50, note: 'a', source: 'timer', at: '2026-01-01T01:00:00.000Z' }],
        updatedAt: '2026-01-01T01:00:00.000Z',
      }),
    },
  };
  const b = {
    dailyLogs: {
      [D]: logWith(D, {
        sessions: [{ id: 's2', mode: 'college' as const, minutes: 30, note: 'b', source: 'manual' as const, at: '2026-01-01T02:00:00.000Z' }],
        updatedAt: '2026-01-01T02:00:00.000Z',
      }),
    },
  };
  pass = assert(mergeState(a, b).dailyLogs[D].sessions.length === 2, 'sesi dua perangkat tidak digabung') && pass;

  /* 3. Tugas yang dihapus tidak boleh hidup lagi dari perangkat lain. */
  const deleted: Task = {
    id: 't1', kind: 'college', title: 'x', status: 'todo', subtasks: [],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T05:00:00.000Z',
    deletedAt: '2026-01-01T05:00:00.000Z',
  };
  const alive: Task = { ...deleted, deletedAt: undefined, updatedAt: '2026-01-01T04:00:00.000Z' };
  pass = assert(!!mergeState({ ...base, tasks: [deleted] }, { tasks: [alive] }).tasks[0].deletedAt, 'tugas terhapus hidup lagi') && pass;

  /* 4. Setting perangkat tidak pernah ditimpa cloud. */
  const withPin: AppState = { ...base, settings: { ...base.settings, pin: '9999' } };
  pass = assert(mergeState(withPin, { tasks: [] }).settings.pin === '9999', 'setting lokal tertimpa cloud') && pass;

  /* 5. Hari yang kurang sedikit pun tidak boleh tampil 100%. */
  const almost = getDayStats(
    logWith(D, {
      prayers: { subuh: true, dzuhur: true, ashar: true, maghrib: true, isya: true },
      customHabits: { h1: true },
      sessions: [
        { id: 'x', mode: 'deepWork', minutes: 100, note: 'n', source: 'timer', at: D },
        { id: 'y', mode: 'college', minutes: 99, note: 'n', source: 'timer', at: D },
      ],
    }),
    base.habitDefinitions, D, 100, 100
  );
  pass = assert(!almost.perfect && almost.score < 100, 'hari kurang 1 menit dihitung sempurna') && pass;

  /* 6. Habit yang diarsipkan tidak mengubah penilaian hari sebelum arsip. */
  const habits = [{ id: 'h1', name: 'x', createdAt: '2000-01-01T00:00:00.000Z', archivedAt: '2026-02-01T00:00:00.000Z' }];
  pass = assert(activeHabitsOn(habits, D).length === 1, 'arsip habit mengubah riwayat lampau') && pass;
  pass = assert(activeHabitsOn(habits, '2026-03-01').length === 0, 'habit terarsip masih dihitung') && pass;

  /* 7. Tugas yang sudah selesai tidak boleh balik jadi 'todo' saat dimuat ulang. */
  const reloaded = migrateState({
    version: 2,
    tasks: [
      { id: 'tx', kind: 'college', title: 'Sudah dikerjakan', status: 'done', subtasks: [],
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
    ],
  });
  pass = assert(reloaded.tasks[0].status === 'done', 'status selesai hilang saat state dimuat ulang') && pass;

  /* 8. Centang dari dua perangkat di hari yang sama harus sama-sama bertahan. */
  const pc: AppState = {
    ...base,
    dailyLogs: {
      [D]: logWith(D, {
        prayers: { subuh: true, dzuhur: false, ashar: false, maghrib: false, isya: false },
        marksAt: { subuh: '2026-01-01T06:00:00.000Z' },
        updatedAt: '2026-01-01T06:00:00.000Z',
      }),
    },
  };
  const hp = {
    dailyLogs: {
      [D]: logWith(D, {
        prayers: { subuh: false, dzuhur: true, ashar: false, maghrib: false, isya: false },
        marksAt: { dzuhur: '2026-01-01T12:00:00.000Z' },
        updatedAt: '2026-01-01T12:00:00.000Z',
      }),
    },
  };
  const bothDevices = mergeState(pc, hp).dailyLogs[D].prayers;
  pass = assert(bothDevices.subuh && bothDevices.dzuhur, 'centang perangkat lain hilang saat digabung') && pass;

  /* 9. Mencentang ulang tetap bisa membatalkan, bukan sekadar digabung. */
  const unchecked = {
    dailyLogs: {
      [D]: logWith(D, {
        prayers: { subuh: false, dzuhur: false, ashar: false, maghrib: false, isya: false },
        marksAt: { subuh: '2026-01-01T07:00:00.000Z' },
        updatedAt: '2026-01-01T07:00:00.000Z',
      }),
    },
  };
  pass = assert(!mergeState(pc, unchecked).dailyLogs[D].prayers.subuh, 'batal centang tidak ikut tersinkron') && pass;

  console[pass ? 'info' : 'error'](pass ? '✅ selfcheck storage lolos (9 kasus)' : '❌ selfcheck storage ADA YANG GAGAL');
}
