import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, GraduationCap, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playChimeSound } from '../services/audio';
import { minutesFor } from '../services/storage';
import type { DailyLog, WorkMode } from '../types';

interface Props {
  mode: WorkMode;
  onChangeMode: (mode: WorkMode) => void;
  /** Timer tidak menulis apa pun sendiri — menit baru masuk setelah catatan diisi. */
  onSessionFinished: (mode: WorkMode, minutes: number) => void;
  log?: DailyLog;
  deepWorkTarget: number;
  collegeTarget: number;
}

const PRESETS = [15, 25, 45, 50, 100];

export const TimerModal: React.FC<Props> = ({
  mode,
  onChangeMode,
  onSessionFinished,
  log,
  deepWorkTarget,
  collegeTarget,
}) => {
  const [durationMins, setDurationMins] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setSecondsRemaining((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Efek terpisah: menembakkan penyelesaian dari dalam updater state bikin
  // sesi tercatat dobel di StrictMode.
  useEffect(() => {
    if (!isRunning || secondsRemaining > 0) return;
    setIsRunning(false);
    setSecondsRemaining(durationMins * 60);
    playChimeSound('timer');
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    onSessionFinished(mode, durationMins);
  }, [isRunning, secondsRemaining, durationMins, mode, onSessionFinished]);

  const selectPreset = (mins: number) => {
    setIsRunning(false);
    setDurationMins(mins);
    setSecondsRemaining(mins * 60);
  };

  const finishEarly = () => {
    const elapsed = Math.floor((durationMins * 60 - secondsRemaining) / 60);
    if (elapsed < 1) {
      alert('Sesi belum mencapai 1 menit.');
      return;
    }
    setIsRunning(false);
    setSecondsRemaining(durationMins * 60);
    playChimeSound('complete');
    onSessionFinished(mode, elapsed);
  };

  const switchMode = (next: WorkMode) => {
    if (isRunning && !confirm('Timer sedang berjalan. Ganti mode dan reset timer?')) return;
    setIsRunning(false);
    setSecondsRemaining(durationMins * 60);
    onChangeMode(next);
  };

  const formatTime = (total: number) =>
    `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

  const deep = mode === 'deepWork';
  const todayMins = minutesFor(log, mode);
  const target = deep ? deepWorkTarget : collegeTarget;
  const pct = Math.min(100, (todayMins / target) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24">
      <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
        {(
          [
            ['deepWork', 'Deep Work', <Zap className="w-4 h-4" key="z" />, deepWorkTarget],
            ['college', 'Belajar Kuliah', <GraduationCap className="w-4 h-4" key="g" />, collegeTarget],
          ] as [WorkMode, string, React.ReactNode, number][]
        ).map(([id, label, icon, t]) => (
          <button
            key={id}
            onClick={() => switchMode(id)}
            className={`flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition ${
              mode === id
                ? id === 'deepWork'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-cyan-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {icon}
            <span>
              {label} <span className="opacity-70">({t}m)</span>
            </span>
          </button>
        ))}
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-5">
          <span className="relative flex h-2.5 w-2.5">
            {isRunning && (
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  deep ? 'bg-indigo-400' : 'bg-cyan-400'
                }`}
              />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isRunning ? (deep ? 'bg-indigo-500' : 'bg-cyan-500') : 'bg-slate-500'
              }`}
            />
          </span>
          <span className="text-xs uppercase tracking-widest font-bold text-slate-400">
            {isRunning ? 'Sedang Fokus' : 'Timer Siap'}
          </span>
        </div>

        <div className="font-mono text-6xl sm:text-8xl font-black tracking-tight text-white mb-6 select-none">
          {formatTime(secondsRemaining)}
        </div>

        <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-2xl p-3 mb-7">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Hari ini</span>
            <span className="font-bold text-white">
              {todayMins} / {target} menit
              {todayMins > target && (
                <span className="text-amber-400 ml-1">+{todayMins - target}</span>
              )}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                todayMins >= target ? 'bg-emerald-500' : deep ? 'bg-indigo-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mb-7">
          <button
            onClick={() => {
              setIsRunning(false);
              setSecondsRemaining(durationMins * 60);
            }}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 active:scale-95"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsRunning((v) => !v)}
            className={`px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-2 active:scale-95 transition ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : deep
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isRunning ? 'Pause' : 'Mulai Fokus'}</span>
          </button>

          {isRunning && (
            <button
              onClick={finishEarly}
              className="p-3.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 active:scale-95"
              title="Selesai sekarang & catat"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-slate-400 mr-1">Durasi:</span>
          {PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => selectPreset(m)}
              disabled={isRunning}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                durationMins === m
                  ? deep
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {m}m
            </button>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 mt-6 max-w-sm">
          Setelah sesi selesai kamu wajib menulis apa yang dikerjakan. Tanpa itu, menitnya tidak
          masuk hitungan.
        </p>
      </div>
    </div>
  );
};
