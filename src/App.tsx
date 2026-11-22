import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { AppState, ActiveTab, AppSettings, DailyLog, Task, WorkMode, WorkSession } from './types';
import {
  loadLocalState,
  saveLocalState,
  getTodayKey,
  createEmptyDailyLog,
  calculateStreak,
  mergeState,
  isEditableDate,
  challengeDayNumber,
  countMisses,
  visibleTasks,
} from './services/storage';
import { getSupabaseClient, fetchRemoteState, syncStateToRemote, CLIENT_ID } from './services/supabase';
import type { RemotePayload } from './services/supabase';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Navbar } from './components/Navbar';
import { PinLockModal } from './components/PinLockModal';
import { SettingsModal } from './components/SettingsModal';
import { DashboardOverview } from './components/DashboardOverview';
import { TaskTracker } from './components/TaskTracker';
import { TimerModal } from './components/TimerModal';
import { SessionNoteModal } from './components/SessionNoteModal';
import type { SessionDraft } from './components/SessionNoteModal';

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => loadLocalState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [todayKey, setTodayKey] = useState<string>(getTodayKey());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [isLocked, setIsLocked] = useState<boolean>(
    () => !!(state.settings.pinEnabled && state.settings.pin)
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [timerMode, setTimerMode] = useState<WorkMode>('deepWork');
  const [sessionDraft, setSessionDraft] = useState<SessionDraft | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error' | 'offline'>('idle');
  /**
   * Baru true setelah kita benar-benar tahu isi baris di cloud. Selama masih
   * false, perangkat ini tidak boleh mengunggah apa pun: itulah yang dulu
   * membuat HP menimpa data PC ketika fetch pertamanya gagal.
   */
  const [remoteReady, setRemoteReady] = useState(false);

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);

  const { supabaseUrl, supabaseAnonKey } = state.settings;

  /** Satu-satunya jalan masuk data remote ke state. */
  const applyRemote = useCallback((remote: RemotePayload | null) => {
    if (!remote) return;
    setState((prev) => {
      const merged = mergeState(prev, remote);
      saveLocalState(merged);
      return merged;
    });
  }, []);

  /* 1. Magic link / QR dari HP: #sync=<base64> */
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (!hash.startsWith('#sync=')) return;
      const parsed = JSON.parse(atob(hash.replace('#sync=', '')));
      if (!parsed.url || !parsed.key) return;

      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setState((prev) => {
        const next = {
          ...prev,
          settings: { ...prev.settings, supabaseUrl: parsed.url, supabaseAnonKey: parsed.key },
        };
        saveLocalState(next);
        return next;
      });
    } catch (err) {
      console.error('Token sync di URL tidak valid:', err);
    }
  }, []);

  /* 2. Fetch awal + realtime */
  useEffect(() => {
    const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
    if (!client) {
      setSyncStatus('offline');
      setRemoteReady(false);
      return;
    }

    let cancelled = false;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    setSyncStatus('syncing');

    const pull = async () => {
      const result = await fetchRemoteState(client);
      if (cancelled) return;

      if (result.status === 'found') {
        applyRemote(result.data);
        setRemoteReady(true);
        setSyncStatus('synced');
        return;
      }

      if (result.status === 'empty') {
        // Baris memang belum ada. Aman mengunggah isi perangkat ini.
        setRemoteReady(true);
        setSyncStatus('synced');
        return;
      }

      // Gagal menghubungi cloud. Jangan unggah apa pun, cukup coba lagi.
      attempt += 1;
      if (attempt < 4) {
        retryTimer = setTimeout(pull, attempt * 2000);
      } else {
        setSyncStatus('error');
      }
    };

    void pull();

    /*
     * HP jarang dimuat ulang, biasanya cuma dibangunkan dari background.
     * Kalau koneksi realtime sempat putus selagi layar mati, state di sini
     * jadi basi, dan dorongan berikutnya akan menimpa data cloud yang lebih
     * baru. Jadi setiap kali halaman kembali terlihat, tarik dulu.
     */
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      attempt = 0;
      void pull();
    };
    document.addEventListener('visibilitychange', onVisible);

    const channel = client
      .channel('public:accountability_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accountability_sync' },
        (payload) => {
          const data = (payload.new as { data?: RemotePayload })?.data;
          if (!data) return;
          if (data._clientId === CLIENT_ID) return; // siaran dari tab ini sendiri
          applyRemote(data);
          setRemoteReady(true);
          setSyncStatus('synced');
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', onVisible);
      client.removeChannel(channel);
    };
  }, [supabaseUrl, supabaseAnonKey, applyRemote]);

  /* 3a. Simpan lokal selalu, baik ada cloud maupun tidak */
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    saveLocalState(state);
  }, [state]);

  /* 3b. Dorong ke cloud, hanya setelah isi cloud diketahui */
  useEffect(() => {
    const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
    if (!client) {
      setSyncStatus('offline');
      return;
    }
    if (!remoteReady) return;

    setSyncStatus('syncing');
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      const ok = await syncStateToRemote(client, state);
      setSyncStatus(ok ? 'synced' : 'error');
    }, 600);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [state, remoteReady, supabaseUrl, supabaseAnonKey]);

  /* 4. Pergantian hari (00:00 WIB) saat app dibiarkan terbuka */
  useEffect(() => {
    const tick = () => {
      const now = getTodayKey();
      setTodayKey((prev) => {
        if (prev === now) return prev;
        setSelectedDate((cur) => (cur === prev ? now : cur));
        return now;
      });
    };
    const id = setInterval(tick, 30000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  /* ---------------- mutasi state ---------------- */

  const updateLog = useCallback(
    (dateKey: string, mutate: (log: DailyLog) => DailyLog) => {
      if (!isEditableDate(dateKey)) return;
      setState((prev) => {
        const current = prev.dailyLogs[dateKey] || createEmptyDailyLog(dateKey);
        const next = mutate(current);
        return {
          ...prev,
          dailyLogs: {
            ...prev.dailyLogs,
            [dateKey]: { ...next, updatedAt: new Date().toISOString() },
          },
        };
      });
    },
    []
  );

  const handleTogglePrayer = useCallback(
    (dateKey: string, prayer: keyof DailyLog['prayers']) => {
      updateLog(dateKey, (log) => ({
        ...log,
        prayers: { ...log.prayers, [prayer]: !log.prayers[prayer] },
        marksAt: { ...(log.marksAt || {}), [prayer]: new Date().toISOString() },
      }));
    },
    [updateLog]
  );

  const handleToggleHabit = useCallback(
    (dateKey: string, habitId: string) => {
      updateLog(dateKey, (log) => ({
        ...log,
        customHabits: { ...log.customHabits, [habitId]: !log.customHabits?.[habitId] },
        marksAt: { ...(log.marksAt || {}), [habitId]: new Date().toISOString() },
      }));
    },
    [updateLog]
  );

  const handleSaveNotes = useCallback(
    (dateKey: string, notes: string) => {
      updateLog(dateKey, (log) => ({ ...log, dailyNotes: notes }));
    },
    [updateLog]
  );

  const handleAddSession = useCallback(
    (dateKey: string, session: Omit<WorkSession, 'id' | 'at'>) => {
      const entry: WorkSession = {
        ...session,
        id: 's-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        at: new Date().toISOString(),
      };
      updateLog(dateKey, (log) => ({ ...log, sessions: [...(log.sessions || []), entry] }));
    },
    [updateLog]
  );

  const handleDeleteSession = useCallback(
    (dateKey: string, sessionId: string) => {
      updateLog(dateKey, (log) => ({
        ...log,
        sessions: (log.sessions || []).filter((s) => s.id !== sessionId),
      }));
    },
    [updateLog]
  );

  const handleAddHabit = useCallback((name: string, icon: string) => {
    setState((prev) => ({
      ...prev,
      habitDefinitions: [
        ...prev.habitDefinitions,
        { id: 'h-' + Date.now(), name, icon, createdAt: new Date().toISOString() },
      ],
    }));
  }, []);

  /** Arsip, bukan hapus: riwayat hari lampau tetap utuh. */
  const handleArchiveHabit = useCallback((habitId: string) => {
    setState((prev) => ({
      ...prev,
      habitDefinitions: prev.habitDefinitions.map((h) =>
        h.id === habitId ? { ...h, archivedAt: new Date().toISOString() } : h
      ),
    }));
  }, []);

  const handleSetChallengeStart = useCallback((dateKey: string) => {
    if (!dateKey) return;
    setState((prev) => ({ ...prev, challengeStartDate: dateKey }));
  }, []);

  const handleSaveTask = useCallback((task: Task) => {
    setState((prev) => {
      const exists = prev.tasks.some((t) => t.id === task.id);
      const stamped = { ...task, updatedAt: new Date().toISOString() };
      return {
        ...prev,
        tasks: exists
          ? prev.tasks.map((t) => (t.id === task.id ? stamped : t))
          : [...prev.tasks, stamped],
      };
    });
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, deletedAt: now, updatedAt: now } : t)),
    }));
  }, []);

  /* ---------------- timer & sesi ---------------- */

  const openSessionModal = useCallback((draft: SessionDraft) => setSessionDraft(draft), []);

  const handleConfirmSession = useCallback(
    (minutes: number, note: string) => {
      if (!sessionDraft) return;
      handleAddSession(sessionDraft.dateKey, {
        mode: sessionDraft.mode,
        minutes,
        note,
        source: sessionDraft.source,
      });
      setSessionDraft(null);
    },
    [sessionDraft, handleAddSession]
  );

  const handleQuickStart = useCallback((mode: WorkMode) => {
    setTimerMode(mode);
    setActiveTab('timer');
  }, []);

  /* ---------------- settings & sync manual ---------------- */

  const handleSaveSettings = useCallback((newSettings: AppSettings) => {
    setState((prev) => {
      const next = { ...prev, settings: newSettings };
      saveLocalState(next);
      return next;
    });
  }, []);

  const handleImportState = useCallback((imported: AppState) => {
    setState((prev) => {
      // Setting perangkat ini dipertahankan; yang diimpor hanya datanya.
      const next = { ...imported, settings: prev.settings };
      saveLocalState(next);
      return next;
    });
  }, []);

  const handleForcePush = useCallback(async (): Promise<boolean> => {
    const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
    if (!client) return false;
    setSyncStatus('syncing');
    const ok = await syncStateToRemote(client, state);
    setSyncStatus(ok ? 'synced' : 'error');
    return ok;
  }, [state, supabaseUrl, supabaseAnonKey]);

  const handleForcePull = useCallback(async (): Promise<boolean> => {
    const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
    if (!client) return false;
    setSyncStatus('syncing');
    const result = await fetchRemoteState(client);
    if (result.status !== 'found') {
      setSyncStatus(result.status === 'empty' ? 'synced' : 'error');
      return false;
    }
    applyRemote(result.data);
    setRemoteReady(true);
    setSyncStatus('synced');
    return true;
  }, [supabaseUrl, supabaseAnonKey, applyRemote]);

  const handleSyncManual = useCallback(async () => {
    const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
    if (!client) {
      setIsSettingsOpen(true);
      return;
    }
    setSyncStatus('syncing');
    const result = await fetchRemoteState(client);

    if (result.status === 'error') {
      setSyncStatus('error');
      alert('Gagal menghubungi cloud. Data di perangkat ini aman dan belum diunggah, coba lagi saat sinyal membaik.');
      return;
    }

    const merged = result.status === 'found' ? mergeState(state, result.data) : state;
    if (result.status === 'found') applyRemote(result.data);
    setRemoteReady(true);

    const ok = await syncStateToRemote(client, merged);
    setSyncStatus(ok ? 'synced' : 'error');
  }, [state, supabaseUrl, supabaseAnonKey, applyRemote]);

  /* ---------------- turunan ---------------- */

  const streak = useMemo(() => calculateStreak(state), [state]);
  const misses = useMemo(() => countMisses(state), [state]);
  const dayNumber = challengeDayNumber(state.challengeStartDate, todayKey);
  const tasks = useMemo(() => visibleTasks(state.tasks), [state.tasks]);
  const todayLog = state.dailyLogs[todayKey];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      <AnimatedBackground />

      {isLocked && state.settings.pinEnabled && state.settings.pin && (
        <PinLockModal expectedPin={state.settings.pin} onUnlocked={() => setIsLocked(false)} />
      )}

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streak={streak}
        misses={misses}
        dayNumber={dayNumber}
        syncStatus={syncStatus}
        isCloudConfigured={!!(supabaseUrl && supabaseAnonKey)}
        onSyncManual={handleSyncManual}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLockApp={() => setIsLocked(true)}
        pinEnabled={state.settings.pinEnabled}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 relative z-10">
        {activeTab === 'overview' && (
          <DashboardOverview
            state={state}
            tasks={tasks}
            todayKey={todayKey}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            streak={streak}
            misses={misses}
            dayNumber={dayNumber}
            onTogglePrayer={handleTogglePrayer}
            onToggleHabit={handleToggleHabit}
            onAddHabit={handleAddHabit}
            onArchiveHabit={handleArchiveHabit}
            onDeleteSession={handleDeleteSession}
            onSaveNotes={handleSaveNotes}
            onQuickStart={handleQuickStart}
            onLogManual={(mode, dateKey) =>
              openSessionModal({ mode, source: 'manual', dateKey })
            }
            onOpenTasks={() => setActiveTab('tasks')}
            onSetChallengeStart={handleSetChallengeStart}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskTracker tasks={tasks} todayKey={todayKey} onSave={handleSaveTask} onDelete={handleDeleteTask} />
        )}

        {activeTab === 'timer' && (
          <TimerModal
            mode={timerMode}
            onChangeMode={setTimerMode}
            onSessionFinished={(mode, minutes) =>
              openSessionModal({ mode, source: 'timer', minutes, dateKey: todayKey })
            }
            log={todayLog}
            deepWorkTarget={state.settings.deepWorkDailyTarget || 100}
            collegeTarget={state.settings.collegeDailyTarget || 100}
          />
        )}
      </main>

      {sessionDraft && (
        <SessionNoteModal
          draft={sessionDraft}
          todayKey={todayKey}
          onCancel={() => setSessionDraft(null)}
          onConfirm={handleConfirmSession}
        />
      )}

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
