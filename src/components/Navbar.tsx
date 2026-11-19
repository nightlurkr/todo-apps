import React from 'react';
import { 
  Flame, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Lock, 
  Settings as SettingsIcon, 
  CheckCircle2, 
  Layers,
  GraduationCap,
  Clock,
  Sparkles
} from 'lucide-react';
import type { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  streak: number;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  isCloudConfigured: boolean;
  onSyncManual: () => void;
  onOpenSettings: () => void;
  onLockApp: () => void;
  pinEnabled: boolean;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  isToday: boolean;
  score: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  streak,
  syncStatus,
  isCloudConfigured,
  onSyncManual,
  onOpenSettings,
  onLockApp,
  pinEnabled,
  selectedDate,
  onSelectDate,
  isToday,
  score,
}) => {
  const getTodayString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Layers className="w-4 h-4" /> },
    { id: 'daily', label: 'Daily Habits', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'college', label: 'Tugas Kuliah', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'timer', label: 'Focus Timer', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
                D
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white tracking-tight text-base sm:text-lg">DailyOS</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Pro
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">Accountability & Project Tracker</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Quick Actions (Date, Streak, Sync, Lock, Settings) */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Streak */}
              <div 
                className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-lg text-xs font-semibold"
                title={`${streak} hari berturut-turut konsisten!`}
              >
                <Flame className="w-4 h-4 fill-amber-400 text-amber-500 animate-pulse" />
                <span>{streak}d</span>
              </div>

              {/* Today Score Pill */}
              <div 
                className="hidden sm:flex items-center space-x-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-semibold"
                title="Accountability score hari ini"
              >
                <span>{score}%</span>
              </div>

              {/* Date Selector */}
              <div className="flex items-center bg-slate-800/60 border border-slate-700/60 rounded-lg p-0.5 text-xs text-slate-300">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onSelectDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 px-2 py-0.5 outline-none cursor-pointer"
                />
                {!isToday && (
                  <button
                    onClick={() => onSelectDate(getTodayString())}
                    className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-1.5 py-0.5 rounded font-medium ml-1 transition"
                    title="Kembali ke Hari Ini"
                  >
                    Today
                  </button>
                )}
              </div>

              {/* Cloud Sync Status */}
              <button
                onClick={onSyncManual}
                className={`p-1.5 rounded-lg border text-xs transition flex items-center space-x-1 ${
                  !isCloudConfigured
                    ? 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-400'
                    : syncStatus === 'syncing'
                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                    : syncStatus === 'error'
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                    : 'border-slate-800 bg-slate-900/60 text-emerald-400 hover:bg-slate-800'
                }`}
                title={
                  !isCloudConfigured
                    ? 'Cloud sync belum dikonfigurasi (Data disimpan offline di perangkat ini). Klik Settings untuk setup.'
                    : syncStatus === 'syncing'
                    ? 'Sedang sinkronisasi...'
                    : syncStatus === 'error'
                    ? 'Gagal sinkronisasi. Klik untuk retry.'
                    : 'Tersinkronisasi dengan Supabase Cloud'
                }
              >
                {!isCloudConfigured ? (
                  <CloudOff className="w-4 h-4" />
                ) : syncStatus === 'syncing' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
              </button>

              {/* PIN Lock button */}
              {pinEnabled && (
                <button
                  onClick={onLockApp}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition"
                  title="Kunci Aplikasi (PIN)"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}

              {/* Settings button */}
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition"
                title="Pengaturan & Supabase Sync"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-400 font-semibold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-500/20 text-indigo-300' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
