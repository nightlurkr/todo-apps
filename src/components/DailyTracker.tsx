import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Play, 
  FileText,
  Check,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { DailyLog, HabitDefinition, PrayerName } from '../types';
import { playChimeSound } from '../services/audio';

interface DailyTrackerProps {
  log: DailyLog;
  habits: HabitDefinition[];
  deepWorkTarget: number;
  collegeTarget: number;
  onUpdateLog: (updatedLog: DailyLog) => void;
  onAddHabit: (name: string, icon: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onOpenTimer: (mode: 'deepWork' | 'college') => void;
  selectedDate: string;
}

const PRAYERS_LIST: { id: PrayerName; label: string; desc: string; icon: string }[] = [
  { id: 'subuh', label: 'Subuh', desc: 'Fajar / Awal Hari', icon: '🌅' },
  { id: 'dzuhur', label: 'Dzuhur', desc: 'Tengah Hari', icon: '☀️' },
  { id: 'ashar', label: 'Ashar', desc: 'Sore Hari', icon: '🌤️' },
  { id: 'maghrib', label: 'Maghrib', desc: 'Terbenam Matahari', icon: '🌇' },
  { id: 'isya', label: 'Isya', desc: 'Malam Hari', icon: '🌌' },
];

const PRESET_EMOJIS = ['📖', '💧', '🏃‍♂️', '🌙', '🧘‍♂️', '💻', '🥗', '🎯', '✍️', '⚡', '🚴', '⭐'];

export const DailyTracker: React.FC<DailyTrackerProps> = ({
  log,
  habits,
  deepWorkTarget,
  collegeTarget,
  onUpdateLog,
  onAddHabit,
  onDeleteHabit,
  onOpenTimer,
  selectedDate,
}) => {
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('⭐');

  // Prayer toggling
  const togglePrayer = (prayer: PrayerName) => {
    const nextVal = !log.prayers[prayer];
    const newPrayers = { ...log.prayers, [prayer]: nextVal };
    
    // Check if all 5 prayers just completed
    const allDone = Object.values(newPrayers).filter(Boolean).length === 5;
    if (nextVal && allDone) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
      playChimeSound('complete');
    } else if (nextVal) {
      playChimeSound('complete');
    }

    onUpdateLog({
      ...log,
      prayers: newPrayers,
      updatedAt: new Date().toISOString(),
    });
  };

  // Habit toggling
  const toggleHabit = (habitId: string) => {
    const nextVal = !log.customHabits[habitId];
    if (nextVal) {
      playChimeSound('complete');
    }
    onUpdateLog({
      ...log,
      customHabits: {
        ...log.customHabits,
        [habitId]: nextVal,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // Minutes addition
  const addDeepWorkMinutes = (mins: number) => {
    const next = Math.max(0, (log.deepWorkMinutes || 0) + mins);
    if (next >= deepWorkTarget && (log.deepWorkMinutes || 0) < deepWorkTarget) {
      confetti({ particleCount: 70, spread: 60 });
      playChimeSound('streak');
    }
    onUpdateLog({
      ...log,
      deepWorkMinutes: next,
      updatedAt: new Date().toISOString(),
    });
  };

  const addCollegeMinutes = (mins: number) => {
    const next = Math.max(0, (log.collegeStudyMinutes || 0) + mins);
    if (next >= collegeTarget && (log.collegeStudyMinutes || 0) < collegeTarget) {
      confetti({ particleCount: 70, spread: 60 });
      playChimeSound('streak');
    }
    onUpdateLog({
      ...log,
      collegeStudyMinutes: next,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName.trim(), newHabitIcon);
    setNewHabitName('');
    setShowAddHabit(false);
  };

  const prayersDoneCount = Object.values(log.prayers).filter(Boolean).length;
  const deepWorkPercent = Math.min(100, Math.round(((log.deepWorkMinutes || 0) / deepWorkTarget) * 100));
  const collegePercent = Math.min(100, Math.round(((log.collegeStudyMinutes || 0) / collegeTarget) * 100));

  return (
    <div className="space-y-6 pb-20 relative z-10">
      {/* Header section with date title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Daily Accountability</span>
            <span className="text-sm font-normal text-slate-400">({selectedDate})</span>
          </h1>
          <p className="text-xs text-slate-400">
            Jaga komitmen sholat 5 waktu, 100 menit deep work, 100 menit kuliah, dan kebiasaan harian Anda.
          </p>
        </div>
      </div>

      {/* Grid: 2 Focus Target Cards (Deep Work & College Study) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deep Work 100m Card */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                ⚡
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Deep Work Session</h3>
                <p className="text-xs text-slate-400">Target Harian: {deepWorkTarget} Menit</p>
              </div>
            </div>
            <button
              onClick={() => onOpenTimer('deepWork')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Mulai Timer</span>
            </button>
          </div>

          {/* Progress bar & details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Progress Waktu</span>
              <span className={`font-mono font-bold ${log.deepWorkMinutes >= deepWorkTarget ? 'text-emerald-400' : 'text-indigo-300'}`}>
                {log.deepWorkMinutes} / {deepWorkTarget} menit ({deepWorkPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  log.deepWorkMinutes >= deepWorkTarget
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                    : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                }`}
                style={{ width: `${deepWorkPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Increment Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">Tambah Cepat:</span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => addDeepWorkMinutes(15)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                +15m
              </button>
              <button
                onClick={() => addDeepWorkMinutes(30)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                +30m
              </button>
              <button
                onClick={() => addDeepWorkMinutes(50)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                +50m
              </button>
              {log.deepWorkMinutes > 0 && (
                <button
                  onClick={() => addDeepWorkMinutes(-15)}
                  className="px-2 py-1 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-medium transition"
                  title="Kurangi 15m jika salah input"
                >
                  -15m
                </button>
              )}
            </div>
          </div>
        </div>

        {/* College Study 100m Card */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
                🎓
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Belajar / Kuliah</h3>
                <p className="text-xs text-slate-400">Target Harian: {collegeTarget} Menit</p>
              </div>
            </div>
            <button
              onClick={() => onOpenTimer('college')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Mulai Timer</span>
            </button>
          </div>

          {/* Progress bar & details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Progress Waktu</span>
              <span className={`font-mono font-bold ${log.collegeStudyMinutes >= collegeTarget ? 'text-emerald-400' : 'text-cyan-300'}`}>
                {log.collegeStudyMinutes} / {collegeTarget} menit ({collegePercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  log.collegeStudyMinutes >= collegeTarget
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${collegePercent}%` }}
              />
            </div>
          </div>

          {/* Quick Increment Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">Tambah Cepat:</span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => addCollegeMinutes(15)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                +15m
              </button>
              <button
                onClick={() => addCollegeMinutes(30)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                +30m
              </button>
              <button
                onClick={() => addCollegeMinutes(50)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                +50m
              </button>
              {log.collegeStudyMinutes > 0 && (
                <button
                  onClick={() => addCollegeMinutes(-15)}
                  className="px-2 py-1 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-medium transition"
                  title="Kurangi 15m jika salah input"
                >
                  -15m
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5 Waktu Sholat Section */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
              🕌
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Sholat 5 Waktu</h3>
              <p className="text-xs text-slate-400">Kewajiban harian mutlak & disiplin spiritual</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
            prayersDoneCount === 5
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            {prayersDoneCount} / 5 Selesai
          </div>
        </div>

        {/* 5 Prayers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PRAYERS_LIST.map((p) => {
            const isDone = !!log.prayers[p.id];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePrayer(p.id)}
                className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between h-28 relative group overflow-hidden active:scale-95 ${
                  isDone
                    ? 'bg-gradient-to-b from-emerald-950/40 to-slate-900 border-emerald-500/40 text-white shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-950/60 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <span className="text-xl">{p.icon}</span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                    isDone
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40'
                      : 'border border-slate-700 bg-slate-900 text-slate-600 group-hover:border-slate-500'
                  }`}>
                    <Check className={`w-3.5 h-3.5 ${isDone ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                </div>

                <div>
                  <div className="font-bold text-sm text-white group-hover:text-indigo-300 transition">
                    {p.label}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isDone ? 'Sudah Ditunaikan' : p.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Habits & Dailies (Bisa Ditambah & Dihapus Fleksibel) */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-lg">
              ✨
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">Kebiasaan & Rutinitas Tambahan</h3>
                <span className="text-[10px] font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                  {habits.length} Habit
                </span>
              </div>
              <p className="text-xs text-slate-400">Bisa ditambah dan dihapus sesuai kebutuhan harian Anda</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddHabit(!showAddHabit)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/25 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Habit</span>
          </button>
        </div>

        {/* Add Habit Form Modal/Dropdown */}
        {showAddHabit && (
          <form onSubmit={handleCreateHabit} className="mb-5 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Emoji"
                value={newHabitIcon}
                onChange={(e) => setNewHabitIcon(e.target.value)}
                className="w-16 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-center text-sm text-white focus:outline-none focus:border-violet-500"
              />
              <input
                type="text"
                placeholder="Nama kebiasaan (e.g. Baca Buku 15m, Tidur sebelum 23:00, Jogging)"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                autoFocus
              />
              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-violet-600/20"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddHabit(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
                >
                  Batal
                </button>
              </div>
            </div>

            {/* Quick Emoji Selection */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 mr-1">Pilih Cepat Icon:</span>
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewHabitIcon(emoji)}
                  className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition ${
                    newHabitIcon === emoji
                      ? 'bg-violet-600/30 border border-violet-500 text-white scale-110'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </form>
        )}

        {/* Habits List */}
        {habits.length === 0 ? (
          <div className="text-center py-8 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Belum ada kebiasaan tambahan yang terdaftar.</p>
            <button
              onClick={() => setShowAddHabit(true)}
              className="mt-2 text-xs text-violet-400 hover:text-violet-300 font-semibold"
            >
              + Tambah Kebiasaan Sekarang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {habits.map((h) => {
              const isDone = !!log.customHabits[h.id];
              return (
                <div
                  key={h.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-slate-950/70 border-violet-500/30 text-white'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  {/* Left Clickable Area (Toggles Habit) */}
                  <div 
                    onClick={() => toggleHabit(h.id)}
                    className="flex items-center space-x-3 cursor-pointer flex-1 mr-2 select-none"
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 ${
                      isDone
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/40'
                        : 'border border-slate-700 bg-slate-900 text-slate-600'
                    }`}>
                      <Check className={`w-3.5 h-3.5 ${isDone ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                    <span className="text-lg">{h.icon || '⭐'}</span>
                    <span className={`text-xs font-medium ${isDone ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                      {h.name}
                    </span>
                  </div>

                  {/* Right Action: Delete Habit Button (Always visible on mobile & desktop) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Apakah Anda yakin ingin menghapus habit "${h.name}"?`)) {
                        onDeleteHabit(h.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition shrink-0"
                    title={`Hapus habit "${h.name}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Notes / Reflections */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center space-x-2 mb-3">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-white text-base">Refleksi & Catatan Harian</h3>
        </div>
        <textarea
          rows={3}
          placeholder="Tuliskan catatan singkat pencapaian hari ini, kendala, atau evaluasi fokus..."
          value={log.dailyNotes || ''}
          onChange={(e) =>
            onUpdateLog({
              ...log,
              dailyNotes: e.target.value,
              updatedAt: new Date().toISOString(),
            })
          }
          className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
        />
      </div>
    </div>
  );
};
