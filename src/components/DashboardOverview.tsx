import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  ChevronRight,
  Flame,
  GraduationCap,
  Play,
  Plus,
  Target,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AppState, PrayerName, Task, WorkMode } from '../types';
import {
  CHALLENGE_LENGTH,
  createEmptyDailyLog,
  daysBetween,
  getDayStats,
  isEditableDate,
  PRAYERS,
} from '../services/storage';
import { playChimeSound } from '../services/audio';
import { Calendar } from './Calendar';
import { DayPanel } from './DayPanel';

interface Props {
  state: AppState;
  tasks: Task[];
  todayKey: string;
  selectedDate: string;
  onSelectDate: (key: string) => void;
  streak: number;
  misses: number;
  dayNumber: number;
  onTogglePrayer: (dateKey: string, prayer: PrayerName) => void;
  onToggleHabit: (dateKey: string, habitId: string) => void;
  onAddHabit: (name: string, icon: string) => void;
  onArchiveHabit: (habitId: string) => void;
  onDeleteSession: (dateKey: string, sessionId: string) => void;
  onSaveNotes: (dateKey: string, notes: string) => void;
  onQuickStart: (mode: WorkMode) => void;
  onLogManual: (mode: WorkMode, dateKey: string) => void;
  onOpenTasks: () => void;
  onSetChallengeStart: (dateKey: string) => void;
}

/** Makin dekat deadline, makin panas warnanya. */
function urgency(daysLeft: number) {
  if (daysLeft < 0)
    return { ring: 'border-rose-500/60 bg-rose-500/10', text: 'text-rose-300', label: 'Terlewat' };
  if (daysLeft === 0)
    return { ring: 'border-rose-500/50 bg-rose-500/10', text: 'text-rose-300', label: 'Hari ini' };
  if (daysLeft === 1)
    return { ring: 'border-orange-500/50 bg-orange-500/10', text: 'text-orange-300', label: 'Besok' };
  if (daysLeft <= 3)
    return {
      ring: 'border-amber-500/40 bg-amber-500/10',
      text: 'text-amber-300',
      label: `${daysLeft} hari lagi`,
    };
  if (daysLeft <= 7)
    return {
      ring: 'border-sky-500/35 bg-sky-500/10',
      text: 'text-sky-300',
      label: `${daysLeft} hari lagi`,
    };
  return {
    ring: 'border-slate-700/60 bg-slate-800/30',
    text: 'text-slate-400',
    label: `${daysLeft} hari lagi`,
  };
}

export const DashboardOverview: React.FC<Props> = (props) => {
  const {
    state,
    tasks,
    todayKey,
    selectedDate,
    onSelectDate,
    streak,
    misses,
    dayNumber,
    onTogglePrayer,
    onQuickStart,
    onLogManual,
    onOpenTasks,
    onSetChallengeStart,
  } = props;
  const [editStart, setEditStart] = useState(false);

  const todayLog = state.dailyLogs[todayKey] || createEmptyDailyLog(todayKey);
  const deepTarget = state.settings.deepWorkDailyTarget || 100;
  const collegeTarget = state.settings.collegeDailyTarget || 100;
  const stats = getDayStats(todayLog, state.habitDefinitions, todayKey, deepTarget, collegeTarget);

  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'done' && t.dueDate)
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
        .slice(0, 6),
    [tasks]
  );

  const handlePrayer = (p: PrayerName) => {
    const willBeDone = !todayLog.prayers?.[p];
    onTogglePrayer(todayKey, p);
    if (willBeDone && stats.prayersDone === 4) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      playChimeSound('complete');
    }
  };

  const workCards: { mode: WorkMode; label: string; icon: React.ReactNode; mins: number; target: number }[] = [
    {
      mode: 'deepWork',
      label: 'Deep Work',
      icon: <Zap className="w-4 h-4" />,
      mins: stats.deepWorkMinutes,
      target: deepTarget,
    },
    {
      mode: 'college',
      label: 'Belajar Kuliah',
      icon: <GraduationCap className="w-4 h-4" />,
      mins: stats.collegeMinutes,
      target: collegeTarget,
    },
  ];

  return (
    <div className="space-y-4 pb-24">
      {/* Status 100 hari */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {editStart ? (
          <input
            type="date"
            autoFocus
            value={state.challengeStartDate}
            max={todayKey}
            onChange={(e) => onSetChallengeStart(e.target.value)}
            onBlur={() => setEditStart(false)}
            className="bg-slate-900 border border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
          />
        ) : (
          <button
            onClick={() => setEditStart(true)}
            title="Klik untuk mengubah tanggal mulai tantangan 100 hari"
            className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl px-3 py-2"
          >
            <Target className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">
              Hari {Math.max(1, dayNumber)} <span className="text-slate-500">/ {CHALLENGE_LENGTH}</span>
            </span>
          </button>
        )}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white">{streak} hari sempurna</span>
        </div>
        <div
          className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${
            misses > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <span className={`text-xs font-bold ${misses > 0 ? 'text-rose-300' : 'text-emerald-400'}`}>
            {misses} miss
          </span>
        </div>
        <div className="flex-1" />
        <div className="text-right">
          <div
            className={`text-xl font-black leading-none ${
              stats.perfect ? 'text-emerald-400' : 'text-white'
            }`}
          >
            {stats.score}%
          </div>
          <div className="text-[10px] text-slate-500">skor hari ini</div>
        </div>
      </div>

      {/* 1. DEADLINE — paling atas, paling penting */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <header className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <CalendarClock className="w-4 h-4 text-amber-400" />
            Deadline Terdekat
          </h2>
          <button
            onClick={onOpenTasks}
            className="flex items-center gap-0.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Semua tugas <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </header>

        {upcoming.length === 0 ? (
          <button
            onClick={onOpenTasks}
            className="w-full py-6 text-center text-xs text-slate-500 hover:text-slate-300 border border-dashed border-slate-700 rounded-xl"
          >
            Belum ada deadline. Klik untuk menambah tugas.
          </button>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((t) => {
              const left = daysBetween(todayKey, t.dueDate!);
              const u = urgency(left);
              const doneSub = t.subtasks.filter((s) => s.completed).length;
              return (
                <li key={t.id}>
                  <button
                    onClick={onOpenTasks}
                    className={`w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 text-left transition hover:brightness-110 ${u.ring}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {t.course || (t.kind === 'project' ? 'Project' : 'Tugas')}
                        {t.subtasks.length > 0 && ` · ${doneSub}/${t.subtasks.length} subtask`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-xs font-bold ${u.text}`}>{u.label}</div>
                      <div className="text-[10px] text-slate-500">{t.dueDate}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 2. SHOLAT hari ini */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white">Sholat 5 Waktu</h2>
          <span
            className={`text-xs font-bold ${
              stats.prayersDone === 5 ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {stats.prayersDone}/5
          </span>
        </header>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {PRAYERS.map((p) => {
            const done = !!todayLog.prayers?.[p.id];
            return (
              <button
                key={p.id}
                onClick={() => handlePrayer(p.id)}
                className={`py-3 rounded-xl border transition active:scale-95 ${
                  done
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:border-slate-600'
                }`}
              >
                <div className="text-lg leading-none">{p.icon}</div>
                <div className="text-[10px] font-semibold mt-1.5">{p.label}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. KALENDER + LOG */}
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Calendar
          state={state}
          tasks={tasks}
          todayKey={todayKey}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
        />
        <DayPanel
          state={state}
          dateKey={selectedDate}
          todayKey={todayKey}
          tasks={tasks}
          hidePrayers={selectedDate === todayKey}
          onTogglePrayer={props.onTogglePrayer}
          onToggleHabit={props.onToggleHabit}
          onAddHabit={props.onAddHabit}
          onArchiveHabit={props.onArchiveHabit}
          onDeleteSession={props.onDeleteSession}
          onSaveNotes={props.onSaveNotes}
          onLogManual={props.onLogManual}
        />
      </div>

      {/* 4. DEEP WORK & BELAJAR */}
      <div className="grid sm:grid-cols-2 gap-4">
        {workCards.map((c) => {
          const pct = Math.min(100, (c.mins / c.target) * 100);
          const done = c.mins >= c.target;
          const deep = c.mode === 'deepWork';
          return (
            <section
              key={c.mode}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5"
            >
              <header className="flex items-center justify-between mb-3">
                <h2
                  className={`flex items-center gap-2 text-sm font-bold ${
                    deep ? 'text-indigo-300' : 'text-cyan-300'
                  }`}
                >
                  {c.icon}
                  {c.label}
                </h2>
                <span className={`text-xs font-bold ${done ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {c.mins}
                  <span className="text-slate-500">/{c.target}m</span>
                  {c.mins > c.target && (
                    <span className="text-amber-400 ml-1">+{c.mins - c.target}</span>
                  )}
                </span>
              </header>

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    done ? 'bg-emerald-500' : deep ? 'bg-indigo-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onQuickStart(c.mode)}
                  className={`flex-[2] flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition ${
                    deep ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-cyan-600 hover:bg-cyan-500'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Quick Start
                </button>
                <button
                  onClick={() => onLogManual(c.mode, todayKey)}
                  disabled={!isEditableDate(todayKey)}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700"
                  title="Catat waktu yang dikerjakan di luar timer"
                >
                  <Plus className="w-3.5 h-3.5" /> Manual
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
