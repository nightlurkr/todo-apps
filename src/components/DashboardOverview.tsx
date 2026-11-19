import React from 'react';
import { 
  Flame, 
  GraduationCap, 
  Sparkles, 
  ArrowRight, 
  TrendingUp,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AppState, ActiveTab, DailyLog, PrayerName } from '../types';
import { calculateAccountabilityScore } from '../services/storage';
import { playChimeSound } from '../services/audio';

interface DashboardOverviewProps {
  state: AppState;
  selectedDate: string;
  onNavigateTab: (tab: ActiveTab) => void;
  onUpdateLog: (updatedLog: DailyLog) => void;
  streak: number;
}

const PRAYERS_LIST: { id: PrayerName; label: string; desc: string; icon: string }[] = [
  { id: 'subuh', label: 'Subuh', desc: 'Fajar', icon: '🌅' },
  { id: 'dzuhur', label: 'Dzuhur', desc: 'Siang', icon: '☀️' },
  { id: 'ashar', label: 'Ashar', desc: 'Sore', icon: '🌤️' },
  { id: 'maghrib', label: 'Maghrib', desc: 'Maghrib', icon: '🌇' },
  { id: 'isya', label: 'Isya', desc: 'Malam', icon: '🌌' },
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  state,
  selectedDate,
  onNavigateTab,
  onUpdateLog,
  streak,
}) => {
  const currentLog = state.dailyLogs[selectedDate] || {
    date: selectedDate,
    prayers: { subuh: false, dzuhur: false, ashar: false, maghrib: false, isya: false },
    deepWorkMinutes: 0,
    collegeStudyMinutes: 0,
    customHabits: {},
    updatedAt: '',
  };

  const deepWorkTarget = state.settings.deepWorkDailyTarget || 100;
  const collegeTarget = state.settings.collegeDailyTarget || 100;
  const habitCount = state.habitDefinitions.length;

  const score = calculateAccountabilityScore(currentLog, habitCount, deepWorkTarget, collegeTarget);
  const prayersDone = Object.values(currentLog.prayers).filter(Boolean).length;

  // Toggle Prayer directly from Overview
  const handleTogglePrayer = (prayerId: PrayerName) => {
    const nextVal = !currentLog.prayers[prayerId];
    const newPrayers = { ...currentLog.prayers, [prayerId]: nextVal };
    
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
      ...currentLog,
      prayers: newPrayers,
      updatedAt: new Date().toISOString(),
    });
  };

  const urgentTasks = state.collegeTasks
    .filter((t) => t.status !== 'submitted')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const activeProjects = state.projects
    .filter((p) => p.status === 'in_progress')
    .slice(0, 3);

  const getPast35Days = () => {
    const days: { dateStr: string; label: string; score: number }[] = [];
    const now = new Date();
    for (let i = 34; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const log = state.dailyLogs[str];
      const sc = log ? calculateAccountabilityScore(log, habitCount, deepWorkTarget, collegeTarget) : 0;
      days.push({
        dateStr: str,
        label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        score: sc,
      });
    }
    return days;
  };

  const heatmapDays = getPast35Days();

  // Authentic GitHub commit green ramp
  const getHeatmapColor = (sc: number) => {
    if (sc === 0) return 'bg-slate-800/80 border border-slate-700/50 text-slate-500';
    if (sc <= 25) return 'bg-[#0e4429] border border-[#006d32]/40 text-emerald-300';
    if (sc <= 50) return 'bg-[#006d32] border border-[#26a641]/40 text-emerald-100';
    if (sc <= 75) return 'bg-[#26a641] text-slate-950 font-bold shadow-sm shadow-[#26a641]/25';
    return 'bg-[#39d353] text-slate-950 font-extrabold shadow-md shadow-[#39d353]/35';
  };

  return (
    <div className="space-y-6 pb-20 relative z-10">
      {/* Hero Accountability Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Pusat Kontrol & Akuntabilitas
              </span>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {score >= 90
                ? 'Luar biasa! Target hari ini tercapai sempurna 🔥'
                : score >= 60
                ? 'Bagus sekali! Lanjutkan sisa target hari ini 💪'
                : 'Fokus dan mulailah langkah pertamamu hari ini 🚀'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Sholat 5 waktu terjaga, alokasikan 100 menit deep work & 100 menit tugas kuliah untuk kemajuan konsisten setiap hari.
            </p>
          </div>

          {/* Big Score Dial / Card */}
          <div className="flex items-center space-x-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 shrink-0 shadow-lg">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${score >= 80 ? 'text-[#39d353]' : 'text-indigo-500'} transition-all duration-700`}
                  strokeDasharray={`${score}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute font-mono font-black text-lg sm:text-xl text-white">
                {score}%
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">Accountability</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {prayersDone}/5 Sholat • {currentLog.deepWorkMinutes}m Deep Work • {currentLog.collegeStudyMinutes}m Kuliah
              </div>
              <div className="flex items-center space-x-1 text-amber-400 text-xs font-semibold mt-1">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>Streak: {streak} Hari Konsisten</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 5 Waktu Sholat Section (Bisa Langsung Dicentang di Overview) */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
              🕌
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">Sholat 5 Waktu</h3>
                <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Bisa dicentang langsung
                </span>
              </div>
              <p className="text-xs text-slate-400">Tunaikan tepat waktu & perbarui status harian Anda</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
            prayersDone === 5
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            {prayersDone} / 5 Selesai
          </div>
        </div>

        {/* 5 Prayers Grid Interactive */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PRAYERS_LIST.map((p) => {
            const isDone = !!currentLog.prayers[p.id];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleTogglePrayer(p.id)}
                className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between h-28 relative group overflow-hidden active:scale-95 ${
                  isDone
                    ? 'bg-gradient-to-b from-emerald-950/40 to-slate-900 border-emerald-500/40 text-white shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-950/60 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
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

      {/* 2 Focus Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Deep Work Card */}
        <div
          onClick={() => onNavigateTab('daily')}
          className="bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 cursor-pointer transition shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">⚡</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              currentLog.deepWorkMinutes >= deepWorkTarget ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-300'
            }`}>
              {currentLog.deepWorkMinutes}/{deepWorkTarget}m
            </span>
          </div>
          <div className="font-bold text-white text-sm group-hover:text-indigo-300 transition">
            100 Menit Deep Work
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {currentLog.deepWorkMinutes >= deepWorkTarget ? 'Target tercapai!' : `Kurang ${Math.max(0, deepWorkTarget - currentLog.deepWorkMinutes)} menit lagi`}
          </p>
        </div>

        {/* College Study Card */}
        <div
          onClick={() => onNavigateTab('daily')}
          className="bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4 cursor-pointer transition shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">🎓</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              currentLog.collegeStudyMinutes >= collegeTarget ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-300'
            }`}>
              {currentLog.collegeStudyMinutes}/{collegeTarget}m
            </span>
          </div>
          <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition">
            100 Menit Belajar Kuliah
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {currentLog.collegeStudyMinutes >= collegeTarget ? 'Target tercapai!' : `Kurang ${Math.max(0, collegeTarget - currentLog.collegeStudyMinutes)} menit lagi`}
          </p>
        </div>
      </div>

      {/* Grid: Urgent College Tasks & Active Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Urgent College Tasks Widget */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Deadline Kuliah Terdekat</h3>
              </div>
              <button
                onClick={() => onNavigateTab('college')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {urgentTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Tidak ada deadline tugas yang mendesak. Kerja bagus! ✨
              </div>
            ) : (
              <div className="space-y-2.5">
                {urgentTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onNavigateTab('college')}
                    className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                        {task.course}
                      </span>
                      <span className="text-xs font-semibold text-white block mt-0.5">
                        {task.title}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-amber-300 font-medium block">
                        {task.dueDate}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize">
                        {task.priority} Priority
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('college')}
            className="w-full mt-4 py-2 bg-slate-800/70 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5"
          >
            <span>Buka Tugas Kuliah</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active Projects Widget */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h3 className="font-bold text-white text-base">Personal Projects Aktif</h3>
              </div>
              <button
                onClick={() => onNavigateTab('projects')}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center space-x-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Belum ada project yang sedang aktif. Mulai rancang project baru! 🚀
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeProjects.map((p) => {
                  const completedCount = p.tasks.filter((t) => t.completed).length;
                  const total = p.tasks.length;
                  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => onNavigateTab('projects')}
                      className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-violet-500/30 cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white">{p.title}</span>
                        <span className="text-[10px] text-violet-300 font-mono">
                          {completedCount}/{total} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('projects')}
            className="w-full mt-4 py-2 bg-slate-800/70 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5"
          >
            <span>Buka Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 35-Day Consistency Heatmap Grid (GitHub Green Style) */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-[#39d353]" />
            <div>
              <h3 className="font-bold text-white text-base">Konsistensi 35 Hari Terakhir</h3>
              <p className="text-xs text-slate-400">GitHub-style commit heatmap kedisiplinan harian</p>
            </div>
          </div>
          {/* GitHub Green Scale Legend */}
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
            <span>Rendah</span>
            <span className="w-3 h-3 rounded-sm bg-slate-800/80 border border-slate-700/50" title="0%" />
            <span className="w-3 h-3 rounded-sm bg-[#0e4429] border border-[#006d32]/40" title="1-25%" />
            <span className="w-3 h-3 rounded-sm bg-[#006d32]" title="26-50%" />
            <span className="w-3 h-3 rounded-sm bg-[#26a641]" title="51-75%" />
            <span className="w-3 h-3 rounded-sm bg-[#39d353]" title="76-100%" />
            <span>Tinggi</span>
          </div>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-7 gap-2">
          {heatmapDays.map((d, index) => (
            <div
              key={index}
              className={`p-2 rounded-xl text-center flex flex-col items-center justify-center h-14 transition-all duration-200 hover:scale-105 cursor-pointer ${getHeatmapColor(
                d.score
              )}`}
              title={`${d.dateStr}: ${d.score}% selesai`}
            >
              <span className="text-[10px] opacity-75 font-medium">{d.label}</span>
              <span className="text-xs font-mono font-bold mt-0.5">{d.score}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
