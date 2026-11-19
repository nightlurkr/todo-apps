import React, { useState, useEffect, useRef } from 'react';
import type { 
  AppState, 
  ActiveTab, 
  DailyLog, 
  CollegeTask, 
  Project, 
  AppSettings 
} from './types';
import { 
  loadLocalState, 
  saveLocalState, 
  getTodayKey, 
  createEmptyDailyLog, 
  calculateCurrentStreak, 
  calculateAccountabilityScore 
} from './services/storage';
import { 
  getSupabaseClient, 
  fetchRemoteState, 
  syncStateToRemote 
} from './services/supabase';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Navbar } from './components/Navbar';
import { PinLockModal } from './components/PinLockModal';
import { SettingsModal } from './components/SettingsModal';
import { DashboardOverview } from './components/DashboardOverview';
import { DailyTracker } from './components/DailyTracker';
import { CollegeTracker } from './components/CollegeTracker';
import { ProjectTracker } from './components/ProjectTracker';
import { TimerModal } from './components/TimerModal';

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => loadLocalState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const loaded = loadLocalState();
    return !!(loaded.settings.pinEnabled && loaded.settings.pin);
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [timerInitialMode, setTimerInitialMode] = useState<'deepWork' | 'college'>('deepWork');

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error' | 'offline'>('idle');

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);

  // 1. Detect #sync= hash from Magic Link or QR code scan (Ideal for HP connection)
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#sync=')) {
        const raw = hash.replace('#sync=', '');
        const parsed = JSON.parse(atob(raw));
        if (parsed.url && parsed.key) {
          const nextSettings = {
            ...state.settings,
            supabaseUrl: parsed.url,
            supabaseAnonKey: parsed.key,
          };
          const nextState = { ...state, settings: nextSettings };
          setState(nextState);
          saveLocalState(nextState);

          // Clean URL hash
          window.history.replaceState(null, '', window.location.pathname + window.location.search);

          const client = getSupabaseClient(parsed.url, parsed.key);
          if (client) {
            setSyncStatus('syncing');
            fetchRemoteState(client).then((remoteData) => {
              if (remoteData) {
                setState((prev) => {
                  const merged = {
                    ...prev,
                    ...remoteData,
                    settings: {
                      ...remoteData.settings,
                      supabaseUrl: parsed.url,
                      supabaseAnonKey: parsed.key,
                    },
                  };
                  saveLocalState(merged);
                  return merged;
                });
                setSyncStatus('synced');
                alert('🎉 Berhasil! HP Anda kini telah terhubung ke Supabase dan data komputer telah disinkronkan!');
              }
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to parse sync token from hash:', err);
    }
  }, []);

  // 2. Initial Remote Fetch & Supabase Realtime Subscription
  useEffect(() => {
    const client = getSupabaseClient(state.settings.supabaseUrl, state.settings.supabaseAnonKey);
    if (!client) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');

    fetchRemoteState(client)
      .then(async (remoteData) => {
        if (remoteData) {
          setState((prev) => {
            const merged: AppState = {
              ...prev,
              ...remoteData,
              settings: {
                ...remoteData.settings,
                supabaseUrl: prev.settings.supabaseUrl,
                supabaseAnonKey: prev.settings.supabaseAnonKey,
              },
            };
            saveLocalState(merged);
            return merged;
          });
          setSyncStatus('synced');
        } else {
          // If remote row is empty in Supabase, upload our current local state immediately!
          const ok = await syncStateToRemote(client, state);
          setSyncStatus(ok ? 'synced' : 'error');
        }
      })
      .catch((err) => {
        console.error('Initial fetch failed:', err);
        setSyncStatus('error');
      });

    const channel = client
      .channel('public:accountability_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accountability_sync' },
        (payload) => {
          if (payload.new && (payload.new as { data?: AppState }).data) {
            const incoming = (payload.new as { data: AppState }).data;
            setState((prev) => {
              const updated = {
                ...prev,
                dailyLogs: { ...prev.dailyLogs, ...(incoming.dailyLogs || {}) },
                collegeTasks: incoming.collegeTasks || prev.collegeTasks,
                projects: incoming.projects || prev.projects,
                habitDefinitions: incoming.habitDefinitions || prev.habitDefinitions,
              };
              saveLocalState(updated);
              return updated;
            });
            setSyncStatus('synced');
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [state.settings.supabaseUrl, state.settings.supabaseAnonKey]);

  // 3. Debounced save to localStorage & Supabase
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    saveLocalState(state);

    const client = getSupabaseClient(state.settings.supabaseUrl, state.settings.supabaseAnonKey);
    if (!client) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    syncTimerRef.current = setTimeout(async () => {
      const ok = await syncStateToRemote(client, state);
      setSyncStatus(ok ? 'synced' : 'error');
    }, 1000);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [state]);

  const currentDailyLog: DailyLog = state.dailyLogs[selectedDate] || createEmptyDailyLog(selectedDate);

  const handleUpdateDailyLog = (updatedLog: DailyLog) => {
    setState((prev) => ({
      ...prev,
      dailyLogs: {
        ...prev.dailyLogs,
        [selectedDate]: updatedLog,
      },
    }));
  };

  const handleAddHabit = (name: string, icon: string) => {
    const newHabit = {
      id: 'h-' + Date.now(),
      name,
      icon,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      habitDefinitions: [...prev.habitDefinitions, newHabit],
    }));
  };

  const handleDeleteHabit = (habitId: string) => {
    setState((prev) => ({
      ...prev,
      habitDefinitions: prev.habitDefinitions.filter((h) => h.id !== habitId),
    }));
  };

  const handleAddCollegeTask = (taskData: Omit<CollegeTask, 'id' | 'createdAt'>) => {
    const newTask: CollegeTask = {
      ...taskData,
      id: 'task-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      collegeTasks: [...prev.collegeTasks, newTask],
    }));
  };

  const handleUpdateCollegeTask = (updatedTask: CollegeTask) => {
    setState((prev) => ({
      ...prev,
      collegeTasks: prev.collegeTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    }));
  };

  const handleDeleteCollegeTask = (id: string) => {
    setState((prev) => ({
      ...prev,
      collegeTasks: prev.collegeTasks.filter((t) => t.id !== id),
    }));
  };

  const handleAddProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: 'proj-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
    }));
  };

  const handleDeleteProject = (id: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  const handleLogCompletedMinutes = (minutes: number, mode: 'deepWork' | 'college') => {
    const log = currentDailyLog;
    if (mode === 'deepWork') {
      handleUpdateDailyLog({
        ...log,
        deepWorkMinutes: (log.deepWorkMinutes || 0) + minutes,
        updatedAt: new Date().toISOString(),
      });
    } else {
      handleUpdateDailyLog({
        ...log,
        collegeStudyMinutes: (log.collegeStudyMinutes || 0) + minutes,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleOpenTimerFromDaily = (mode: 'deepWork' | 'college') => {
    setTimerInitialMode(mode);
    setActiveTab('timer');
  };

  // Immediate Save & Push Settings
  const handleSaveSettings = async (newSettings: AppSettings) => {
    const updatedState: AppState = {
      ...state,
      settings: newSettings,
    };
    setState(updatedState);
    saveLocalState(updatedState);

    const client = getSupabaseClient(newSettings.supabaseUrl, newSettings.supabaseAnonKey);
    if (client) {
      setSyncStatus('syncing');
      const ok = await syncStateToRemote(client, updatedState);
      setSyncStatus(ok ? 'synced' : 'error');
    }
  };

  const handleImportState = (newState: AppState) => {
    setState(newState);
    saveLocalState(newState);
  };

  // Manual Force Push to Cloud
  const handleForcePush = async (): Promise<boolean> => {
    const client = getSupabaseClient(state.settings.supabaseUrl, state.settings.supabaseAnonKey);
    if (!client) return false;
    setSyncStatus('syncing');
    const ok = await syncStateToRemote(client, state);
    setSyncStatus(ok ? 'synced' : 'error');
    return ok;
  };

  // Manual Force Pull from Cloud
  const handleForcePull = async (): Promise<boolean> => {
    const client = getSupabaseClient(state.settings.supabaseUrl, state.settings.supabaseAnonKey);
    if (!client) return false;
    setSyncStatus('syncing');
    const remoteData = await fetchRemoteState(client);
    if (remoteData) {
      setState((prev) => {
        const merged: AppState = {
          ...prev,
          ...remoteData,
          settings: {
            ...remoteData.settings,
            supabaseUrl: prev.settings.supabaseUrl,
            supabaseAnonKey: prev.settings.supabaseAnonKey,
          },
        };
        saveLocalState(merged);
        return merged;
      });
      setSyncStatus('synced');
      return true;
    }
    setSyncStatus('error');
    return false;
  };

  const handleSyncManual = async () => {
    const client = getSupabaseClient(state.settings.supabaseUrl, state.settings.supabaseAnonKey);
    if (!client) {
      setIsSettingsOpen(true);
      return;
    }
    setSyncStatus('syncing');
    const ok = await syncStateToRemote(client, state);
    setSyncStatus(ok ? 'synced' : 'error');
    if (ok) {
      alert('✅ Sinkronisasi berhasil! Data Anda tersimpan di cloud.');
    } else {
      alert('❌ Gagal menyinkronkan ke Supabase. Periksa internet atau buka menu Settings.');
    }
  };

  const streak = calculateCurrentStreak(state.dailyLogs);
  const todayScore = calculateAccountabilityScore(
    currentDailyLog,
    state.habitDefinitions.length,
    state.settings.deepWorkDailyTarget,
    state.settings.collegeDailyTarget
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      {/* Dynamic Animated Ambient Background */}
      <AnimatedBackground />

      {/* PIN Lock Screen if locked */}
      {isLocked && state.settings.pinEnabled && state.settings.pin && (
        <PinLockModal
          expectedPin={state.settings.pin}
          onUnlocked={() => setIsLocked(false)}
        />
      )}

      {/* Main Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streak={streak}
        syncStatus={syncStatus}
        isCloudConfigured={!!(state.settings.supabaseUrl && state.settings.supabaseAnonKey)}
        onSyncManual={handleSyncManual}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLockApp={() => setIsLocked(true)}
        pinEnabled={state.settings.pinEnabled}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        isToday={selectedDate === getTodayKey()}
        score={todayScore}
      />

      {/* Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
        {activeTab === 'overview' && (
          <DashboardOverview
            state={state}
            selectedDate={selectedDate}
            onNavigateTab={setActiveTab}
            onUpdateLog={handleUpdateDailyLog}
            streak={streak}
          />
        )}

        {activeTab === 'daily' && (
          <DailyTracker
            log={currentDailyLog}
            habits={state.habitDefinitions}
            deepWorkTarget={state.settings.deepWorkDailyTarget || 100}
            collegeTarget={state.settings.collegeDailyTarget || 100}
            onUpdateLog={handleUpdateDailyLog}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
            onOpenTimer={handleOpenTimerFromDaily}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'college' && (
          <CollegeTracker
            tasks={state.collegeTasks}
            onAddTask={handleAddCollegeTask}
            onUpdateTask={handleUpdateCollegeTask}
            onDeleteTask={handleDeleteCollegeTask}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectTracker
            projects={state.projects}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {activeTab === 'timer' && (
          <TimerModal
            initialMode={timerInitialMode}
            onLogCompletedMinutes={handleLogCompletedMinutes}
            deepWorkMinutesToday={currentDailyLog.deepWorkMinutes || 0}
            collegeMinutesToday={currentDailyLog.collegeStudyMinutes || 0}
            deepWorkTarget={state.settings.deepWorkDailyTarget || 100}
            collegeTarget={state.settings.collegeDailyTarget || 100}
          />
        )}
      </main>

      {/* Settings & Supabase Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={state.settings}
        onSaveSettings={handleSaveSettings}
        fullState={state}
        onImportState={handleImportState}
        onForcePush={handleForcePush}
        onForcePull={handleForcePull}
      />
    </div>
  );
};

export default App;
