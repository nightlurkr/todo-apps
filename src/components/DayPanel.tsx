import React, { useState } from 'react';
import { Lock, Plus, Trash2, Zap, GraduationCap, CalendarClock, Archive } from 'lucide-react';
import type { AppState, PrayerName, Task, WorkMode } from '../types';
import {
  activeHabitsOn,
  createEmptyDailyLog,
  formatDateShort,
  getDayStats,
  isEditableDate,
  PRAYERS,
} from '../services/storage';

interface Props {
  state: AppState;
  dateKey: string;
  todayKey: string;
  tasks: Task[];
  /** Sholat sudah tampil di card terpisah untuk hari ini, jangan dobel. */
  hidePrayers?: boolean;
  onTogglePrayer: (dateKey: string, prayer: PrayerName) => void;
  onToggleHabit: (dateKey: string, habitId: string) => void;
  onAddHabit: (name: string, icon: string) => void;
  onArchiveHabit: (habitId: string) => void;
  onDeleteSession: (dateKey: string, sessionId: string) => void;
  onSaveNotes: (dateKey: string, notes: string) => void;
  onLogManual: (mode: WorkMode) => void;
}

const PRESET_EMOJIS = ['📖', '💧', '🏃‍♂️', '🌙', '🧘‍♂️', '💻', '🥗', '🎯', '✍️', '⚡'];

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });

export const DayPanel: React.FC<Props> = ({
  state,
  dateKey,
  todayKey,
  tasks,
  hidePrayers,
  onTogglePrayer,
  onToggleHabit,
  onAddHabit,
  onArchiveHabit,
  onDeleteSession,
  onSaveNotes,
  onLogManual,
}) => {
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitIcon, setHabitIcon] = useState('⭐');
  const [manageHabits, setManageHabits] = useState(false);

  const log = state.dailyLogs[dateKey] || createEmptyDailyLog(dateKey);
  const editable = isEditableDate(dateKey);
  const isToday = dateKey === todayKey;
  const habits = activeHabitsOn(state.habitDefinitions, dateKey);
  const deepTarget = state.settings.deepWorkDailyTarget || 100;
  const collegeTarget = state.settings.collegeDailyTarget || 100;
  const stats = getDayStats(log, state.habitDefinitions, dateKey, deepTarget, collegeTarget);

  const sessions = [...(log.sessions || [])].sort((a, b) => a.at.localeCompare(b.at));
  const dueToday = tasks.filter((t) => t.dueDate === dateKey && t.status !== 'done');

  const submitHabit = () => {
    const name = habitName.trim();
    if (!name) return;
    onAddHabit(name, habitIcon);
    setHabitName('');
    setHabitIcon('⭐');
    setShowAddHabit(false);
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <header className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-800">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white capitalize truncate">
            {isToday ? 'Hari Ini' : formatDateShort(dateKey)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isToday ? formatDateShort(dateKey) : dateKey}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!editable && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800/60 border border-slate-700/60 px-2 py-1 rounded-lg">
              <Lock className="w-3 h-3" /> terkunci
            </span>
          )}
          <div className="text-right">
            <div
              className={`text-2xl font-black leading-none ${
                stats.perfect ? 'text-emerald-400' : stats.score >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {stats.score}%
            </div>
            <div
              className={`text-[10px] font-bold tracking-wide mt-0.5 ${
                stats.perfect ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              {stats.perfect ? 'SEMPURNA' : dateKey < todayKey ? 'MISS' : 'BELUM SELESAI'}
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Sholat */}
        {!hidePrayers && (
          <div>
            <p className="text-[11px] font-semibold text-slate-400 mb-2">
              Sholat · {stats.prayersDone}/5
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {PRAYERS.map((p) => {
                const done = !!log.prayers?.[p.id];
                return (
                  <button
                    key={p.id}
                    disabled={!editable}
                    onClick={() => onTogglePrayer(dateKey, p.id)}
                    className={`py-2 rounded-xl border text-center transition ${
                      done
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-500'
                    } ${editable ? 'active:scale-95' : 'opacity-70 cursor-not-allowed'}`}
                  >
                    <div className="text-sm leading-none">{p.icon}</div>
                    <div className="text-[10px] font-semibold mt-1">{p.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Habit */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-slate-400">
              Habit · {stats.habitsDone}/{stats.habitsTotal}
            </p>
            {isToday && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setManageHabits((v) => !v)}
                  className="text-[10px] text-slate-500 hover:text-slate-300 px-1.5 py-0.5"
                >
                  {manageHabits ? 'Selesai' : 'Kelola'}
                </button>
                <button
                  onClick={() => setShowAddHabit((v) => !v)}
                  className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 px-1.5 py-0.5"
                >
                  <Plus className="w-3 h-3" /> Habit
                </button>
              </div>
            )}
          </div>

          {showAddHabit && isToday && (
            <div className="bg-slate-950/70 border border-slate-700 rounded-xl p-3 mb-2 space-y-2">
              <input
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitHabit()}
                placeholder="Nama habit baru"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
              <div className="flex flex-wrap gap-1">
                {PRESET_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setHabitIcon(e)}
                    className={`w-7 h-7 rounded-lg text-sm ${
                      habitIcon === e ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <button
                onClick={submitHabit}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Tambah
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            {habits.length === 0 && (
              <p className="text-xs text-slate-600 italic">Belum ada habit aktif.</p>
            )}
            {habits.map((h) => {
              const done = !!log.customHabits?.[h.id];
              return (
                <div key={h.id} className="flex items-center gap-2">
                  <button
                    disabled={!editable}
                    onClick={() => onToggleHabit(dateKey, h.id)}
                    className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition ${
                      done
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                    } ${editable ? 'active:scale-[0.99]' : 'opacity-70 cursor-not-allowed'}`}
                  >
                    <span
                      className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                        done ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'
                      }`}
                    >
                      {done ? '✓' : ''}
                    </span>
                    <span className="text-sm">{h.icon}</span>
                    <span className="text-xs font-medium truncate">{h.name}</span>
                  </button>
                  {manageHabits && isToday && (
                    <button
                      onClick={() => onArchiveHabit(h.id)}
                      title="Arsipkan (riwayat hari lampau tetap utuh)"
                      className="p-2 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline sesi */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-slate-400">Log Sesi Kerja</p>
            {editable && (
              <div className="flex gap-1">
                <button
                  onClick={() => onLogManual('deepWork')}
                  className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 px-2 py-1 rounded-lg"
                >
                  <Plus className="w-3 h-3" /> Deep Work
                </button>
                <button
                  onClick={() => onLogManual('college')}
                  className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2 py-1 rounded-lg"
                >
                  <Plus className="w-3 h-3" /> Kuliah
                </button>
              </div>
            )}
          </div>

          {sessions.length === 0 ? (
            <p className="text-xs text-slate-600 italic py-2">
              Belum ada sesi tercatat di hari ini.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {sessions.map((s) => {
                const deep = s.mode === 'deepWork';
                return (
                  <li
                    key={s.id}
                    className="flex items-start gap-2.5 bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2"
                  >
                    <span className="text-[10px] font-mono text-slate-500 pt-0.5 w-9 shrink-0">
                      {timeOf(s.at)}
                    </span>
                    <span
                      className={`shrink-0 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        deep
                          ? 'bg-indigo-500/15 text-indigo-300'
                          : 'bg-cyan-500/15 text-cyan-300'
                      }`}
                    >
                      {deep ? <Zap className="w-2.5 h-2.5" /> : <GraduationCap className="w-2.5 h-2.5" />}
                      {s.minutes}m
                    </span>
                    <span className="flex-1 min-w-0 text-xs text-slate-300 break-words">
                      {s.note}
                      {s.source === 'manual' && (
                        <span className="text-[10px] text-slate-600 ml-1.5">(manual)</span>
                      )}
                    </span>
                    {editable && (
                      <button
                        onClick={() => onDeleteSession(dateKey, s.id)}
                        className="p-1 rounded text-slate-600 hover:text-rose-400 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800">
            {([
              ['deepWork', 'Deep Work', stats.deepWorkMinutes, deepTarget] as const,
              ['college', 'Kuliah', stats.collegeMinutes, collegeTarget] as const,
            ]).map(([mode, label, mins, target]) => (
              <div key={mode} className="text-[11px]">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-slate-400">{label}</span>
                  <span className={mins >= target ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                    {mins}/{target}m
                    {mins > target && <span className="text-amber-400 ml-1">+{mins - target}</span>}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      mode === 'deepWork' ? 'bg-indigo-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${Math.min(100, (mins / target) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deadline hari itu */}
        {dueToday.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-400 mb-2">Jatuh Tempo</p>
            <ul className="space-y-1.5">
              {dueToday.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-2 bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
                >
                  <CalendarClock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{t.title}</span>
                  {t.course && <span className="text-[10px] text-slate-500 shrink-0">{t.course}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Catatan harian */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 mb-2">Catatan Harian</p>
          <textarea
            key={dateKey}
            defaultValue={log.dailyNotes || ''}
            disabled={!editable}
            onBlur={(e) => onSaveNotes(dateKey, e.target.value)}
            rows={2}
            placeholder={editable ? 'Refleksi singkat hari ini...' : ''}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-slate-600 resize-none placeholder:text-slate-600 disabled:opacity-60"
          />
        </div>
      </div>
    </section>
  );
};
