import React from 'react';
import {
  Flame,
  Cloud,
  CloudOff,
  RefreshCw,
  Lock,
  Settings as SettingsIcon,
  Layers,
  ListTodo,
  Clock,
} from 'lucide-react';
import type { ActiveTab } from '../types';
import { CHALLENGE_LENGTH } from '../services/storage';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  streak: number;
  misses: number;
  dayNumber: number;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  isCloudConfigured: boolean;
  onSyncManual: () => void;
  onOpenSettings: () => void;
  onLockApp: () => void;
  pinEnabled: boolean;
}

const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Layers className="w-4 h-4" /> },
  { id: 'tasks', label: 'Tugas', icon: <ListTodo className="w-4 h-4" /> },
  { id: 'timer', label: 'Timer', icon: <Clock className="w-4 h-4" /> },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  streak,
  dayNumber,
  syncStatus,
  isCloudConfigured,
  onSyncManual,
  onOpenSettings,
  onLockApp,
  pinEnabled,
}) => {
  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold">
                D
              </div>
              <div className="min-w-0">
                <div className="font-bold text-white tracking-tight text-sm sm:text-base leading-tight">
                  DailyOS
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Hari {Math.max(1, dayNumber)} / {CHALLENGE_LENGTH}
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === item.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-1 rounded-lg text-xs font-semibold"
                title={`${streak} hari sempurna berturut-turut`}
              >
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>{streak}</span>
              </div>

              <button
                onClick={onSyncManual}
                className={`p-1.5 rounded-lg border transition ${
                  !isCloudConfigured
                    ? 'border-slate-800 bg-slate-900 text-slate-500'
                    : syncStatus === 'syncing'
                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                    : syncStatus === 'error'
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                    : 'border-slate-800 bg-slate-900/60 text-emerald-400'
                }`}
                title={
                  !isCloudConfigured
                    ? 'Cloud sync belum diatur — data hanya di perangkat ini'
                    : syncStatus === 'syncing'
                    ? 'Menyinkronkan...'
                    : syncStatus === 'error'
                    ? 'Gagal sync. Klik untuk coba lagi.'
                    : 'Tersinkron dengan Supabase'
                }
              >
                {!isCloudConfigured ? (
                  <CloudOff className="w-4 h-4" />
                ) : syncStatus === 'syncing' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
              </button>

              {pinEnabled && (
                <button
                  onClick={onLockApp}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-amber-400"
                  title="Kunci aplikasi"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-indigo-400"
                title="Pengaturan"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 px-2 py-1.5 flex items-center justify-around pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-500/20' : ''}`}>{item.icon}</div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
