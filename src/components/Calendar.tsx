import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AppState, Task } from '../types';
import { getDayStats, daysBetween, CHALLENGE_LENGTH } from '../services/storage';

interface Props {
  state: AppState;
  tasks: Task[];
  todayKey: string;
  selectedDate: string;
  onSelectDate: (key: string) => void;
}

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Merah di 0%, kuning di tengah, hijau di 100%. Satu interpolasi, bukan 5 tingkat. */
function scoreColor(pct: number): React.CSSProperties {
  const hue = pct * 1.2; // 0 = merah, 120 = hijau
  const light = 16 + (pct / 100) * 22;
  return {
    backgroundColor: `hsl(${hue} 62% ${light}%)`,
    borderColor: `hsl(${hue} 60% ${light + 14}%)`,
  };
}

export const Calendar: React.FC<Props> = ({ state, tasks, todayKey, selectedDate, onSelectDate }) => {
  const [cursor, setCursor] = useState(() => selectedDate.slice(0, 7)); // YYYY-MM
  const [year, month] = cursor.split('-').map(Number);

  const dueByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!t.dueDate || t.status === 'done') continue;
      (map[t.dueDate] ||= []).push(t);
    }
    return map;
  }, [tasks]);

  const cells = useMemo(() => {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Minggu
    const lead = (firstDow + 6) % 7; // mulai Senin

    const out: ({ key: string; day: number } | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ key: `${year}-${pad(month)}-${pad(d)}`, day: d });
    }
    return out;
  }, [year, month]);

  const shiftMonth = (delta: number) => {
    const d = new Date(Date.UTC(year, month - 1 + delta, 1));
    setCursor(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`);
  };

  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">Kalender Konsistensi</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shiftMonth(-1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-300 w-28 text-center capitalize">
            {monthLabel}
          </span>
          <button
            onClick={() => shiftMonth(1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-sm mx-auto w-full">
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[10px] font-semibold text-slate-500 text-center py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`pad-${i}`} />;

          const { key, day } = cell;
          const dayIndex = daysBetween(state.challengeStartDate, key);
          const inChallenge = dayIndex >= 0 && dayIndex < CHALLENGE_LENGTH;
          const isFuture = key > todayKey;
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;

          const stats = getDayStats(
            state.dailyLogs[key],
            state.habitDefinitions,
            key,
            state.settings.deepWorkDailyTarget,
            state.settings.collegeDailyTarget
          );

          const due = dueByDate[key] || [];
          // Hari lampau tanpa data tetap diwarnai merah — itu memang miss,
          // bukan hari yang tidak ada.
          // Hari ini belum selesai, jadi jangan dicat merah sebelum ada datanya.
          const showScore = inChallenge && !isFuture && (key !== todayKey || stats.hasData);

          return (
            <button
              key={key}
              onClick={() => onSelectDate(key)}
              disabled={isFuture && due.length === 0}
              style={showScore ? scoreColor(stats.score) : undefined}
              className={`relative aspect-square rounded-lg border flex flex-col items-center justify-center transition
                ${showScore ? 'text-white' : 'bg-slate-800/40 border-slate-700/40 text-slate-500'}
                ${isFuture && due.length === 0 ? 'opacity-40' : 'hover:brightness-125'}
                ${isSelected ? 'ring-2 ring-white/80' : ''}
                ${isToday && !isSelected ? 'ring-1 ring-slate-300/70' : ''}
                ${stats.surplus ? 'shadow-[inset_0_0_0_2px_rgba(251,191,36,0.75)]' : ''}
              `}
              title={
                showScore
                  ? `${key} — ${stats.score}%${stats.perfect ? ' (sempurna)' : ''}${
                      stats.surplus ? ' · surplus' : ''
                    }`
                  : key
              }
            >
              <span className={`text-xs font-bold leading-none ${showScore ? '' : ''}`}>{day}</span>
              {showScore && (
                <span className="hidden sm:block text-[9px] font-medium opacity-80 leading-none mt-0.5">
                  {stats.score}%
                </span>
              )}
              {due.length > 0 && (
                <span
                  className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      daysBetween(todayKey, key) < 0
                        ? '#f43f5e'
                        : daysBetween(todayKey, key) <= 2
                        ? '#fb923c'
                        : '#60a5fa',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={scoreColor(0)} /> 0%
          <span className="w-3 h-3 rounded ml-1" style={scoreColor(50)} /> 50%
          <span className="w-3 h-3 rounded ml-1" style={scoreColor(100)} /> 100%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-800 shadow-[inset_0_0_0_2px_rgba(251,191,36,0.75)]" />
          lewat target
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> ada deadline
        </span>
      </footer>
    </section>
  );
};
