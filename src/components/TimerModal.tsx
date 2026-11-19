import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, GraduationCap, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playChimeSound } from '../services/audio';

interface TimerModalProps {
  initialMode?: 'deepWork' | 'college';
  onLogCompletedMinutes: (minutes: number, mode: 'deepWork' | 'college') => void;
  deepWorkMinutesToday: number;
  collegeMinutesToday: number;
  deepWorkTarget: number;
  collegeTarget: number;
}

export const TimerModal: React.FC<TimerModalProps> = ({
  initialMode = 'deepWork',
  onLogCompletedMinutes,
  deepWorkMinutesToday,
  collegeMinutesToday,
  deepWorkTarget,
  collegeTarget,
}) => {
  const [mode, setMode] = useState<'deepWork' | 'college'>(initialMode);
  const [selectedDurationMins, setSelectedDurationMins] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, selectedDurationMins, mode]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    playChimeSound('timer');
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    onLogCompletedMinutes(selectedDurationMins, mode);
    alert(`🎉 Sesi ${mode === 'deepWork' ? 'Deep Work' : 'Kuliah'} selama ${selectedDurationMins} menit selesai dan otomatis dicatat ke progress hari ini!`);
    setSecondsRemaining(selectedDurationMins * 60);
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(selectedDurationMins * 60);
  };

  const handleSelectPreset = (mins: number) => {
    setIsRunning(false);
    setSelectedDurationMins(mins);
    setSecondsRemaining(mins * 60);
  };

  const handleFinishEarly = () => {
    const elapsedSeconds = selectedDurationMins * 60 - secondsRemaining;
    const elapsedMins = Math.floor(elapsedSeconds / 60);
    if (elapsedMins < 1) {
      alert('Sesi belum mencapai 1 menit.');
      return;
    }

    if (confirm(`Selesaikan sekarang dan catat ${elapsedMins} menit ke ${mode === 'deepWork' ? 'Deep Work' : 'Kuliah'}?`)) {
      setIsRunning(false);
      onLogCompletedMinutes(elapsedMins, mode);
      playChimeSound('complete');
      confetti({ particleCount: 60, spread: 50 });
      setSecondsRemaining(selectedDurationMins * 60);
    }
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentDayMins = mode === 'deepWork' ? deepWorkMinutesToday : collegeMinutesToday;
  const currentTarget = mode === 'deepWork' ? deepWorkTarget : collegeTarget;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Mode Selector */}
      <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-lg">
        <button
          onClick={() => {
            if (!isRunning) {
              setMode('deepWork');
            } else if (confirm('Timer sedang berjalan. Ganti mode dan reset timer?')) {
              setIsRunning(false);
              setMode('deepWork');
              setSecondsRemaining(selectedDurationMins * 60);
            }
          }}
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-xs sm:text-sm font-semibold transition ${
            mode === 'deepWork'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>⚡ Deep Work (Target: {deepWorkTarget}m)</span>
        </button>

        <button
          onClick={() => {
            if (!isRunning) {
              setMode('college');
            } else if (confirm('Timer sedang berjalan. Ganti mode dan reset timer?')) {
              setIsRunning(false);
              setMode('college');
              setSecondsRemaining(selectedDurationMins * 60);
            }
          }}
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-xs sm:text-sm font-semibold transition ${
            mode === 'college'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>🎓 Belajar Kuliah (Target: {collegeTarget}m)</span>
        </button>
      </div>

      {/* Main Timer Display */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col items-center relative overflow-hidden text-center">
        {/* Glow ambient background */}
        <div className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${
          mode === 'deepWork' ? 'bg-indigo-500' : 'bg-cyan-500'
        }`} />
        <div className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${
          mode === 'deepWork' ? 'bg-violet-500' : 'bg-blue-500'
        }`} />

        {/* Status header */}
        <div className="flex items-center space-x-2 mb-6 z-10">
          <span className="relative flex h-2.5 w-2.5">
            {isRunning && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                mode === 'deepWork' ? 'bg-indigo-400' : 'bg-cyan-400'
              }`} />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isRunning
                ? mode === 'deepWork' ? 'bg-indigo-500' : 'bg-cyan-500'
                : 'bg-slate-500'
            }`} />
          </span>
          <span className="text-xs uppercase tracking-widest font-bold text-slate-400">
            {isRunning ? 'Sedang Fokus' : 'Timer Siap'}
          </span>
        </div>

        {/* Big Digital Clock */}
        <div className="font-mono text-6xl sm:text-8xl font-black tracking-tight text-white mb-6 select-none drop-shadow-lg z-10">
          {formatTime(secondsRemaining)}
        </div>

        {/* Today's Target progress bar */}
        <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-2xl p-3 mb-8 z-10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span>Pencapaian Hari Ini:</span>
            <span className="font-bold text-white">
              {currentDayMins} / {currentTarget} menit ({Math.min(100, Math.round((currentDayMins / currentTarget) * 100))}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                mode === 'deepWork' ? 'bg-indigo-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.min(100, (currentDayMins / currentTarget) * 100)}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4 mb-8 z-10">
          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition active:scale-95"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handleStartPause}
            className={`px-8 py-4 rounded-2xl font-bold text-base shadow-xl flex items-center space-x-2 transition active:scale-95 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25'
                : mode === 'deepWork'
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Mulai Fokus</span>
              </>
            )}
          </button>

          {isRunning && (
            <button
              onClick={handleFinishEarly}
              className="p-3.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition active:scale-95"
              title="Selesai & Catat Menit Sekarang"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Presets */}
        <div className="z-10 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-slate-400 mr-2">Durasi Sesi:</span>
          {[15, 25, 45, 50, 100].map((mins) => (
            <button
              key={mins}
              onClick={() => handleSelectPreset(mins)}
              disabled={isRunning}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                selectedDurationMins === mins
                  ? mode === 'deepWork'
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {mins}m {mins === 100 ? '(Full Target)' : ''}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
