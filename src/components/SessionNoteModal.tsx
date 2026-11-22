import React, { useEffect, useRef, useState } from 'react';
import { X, Zap, GraduationCap } from 'lucide-react';
import type { WorkMode } from '../types';
import { formatDateShort } from '../services/storage';

export interface SessionDraft {
  mode: WorkMode;
  source: 'timer' | 'manual';
  /** Tanggal tujuan sesi ini, bukan selalu hari ini. */
  dateKey: string;
  /** Terisi kalau datang dari timer; dari input manual dibiarkan kosong. */
  minutes?: number;
}

interface Props {
  draft: SessionDraft;
  todayKey: string;
  onCancel: () => void;
  onConfirm: (minutes: number, note: string) => void;
}

const PRESET_MINUTES = [15, 25, 30, 45, 50, 60, 100];

export const SessionNoteModal: React.FC<Props> = ({ draft, todayKey, onCancel, onConfirm }) => {
  const fromTimer = draft.source === 'timer';
  const [minutes, setMinutes] = useState<number>(draft.minutes ?? 25);
  const [note, setNote] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isDeep = draft.mode === 'deepWork';
  const valid = note.trim().length >= 3 && minutes > 0;

  const submit = () => {
    if (!valid) return;
    onConfirm(minutes, note.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDeep ? 'bg-indigo-500/15 text-indigo-300' : 'bg-cyan-500/15 text-cyan-300'
              }`}
            >
              {isDeep ? <Zap className="w-4.5 h-4.5" /> : <GraduationCap className="w-4.5 h-4.5" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                {isDeep ? 'Sesi Deep Work' : 'Sesi Belajar Kuliah'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {fromTimer ? 'Sesi timer selesai' : 'Catat waktu di luar timer'}
                {draft.dateKey !== todayKey && (
                  <>
                    {' '}
                    &middot;{' '}
                    <span className="text-amber-400 font-semibold">
                      untuk {formatDateShort(draft.dateKey)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Durasi (menit)</label>
            <input
              type="number"
              min={1}
              max={600}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, Number(e.target.value)))}
              disabled={fromTimer}
              className={`w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-slate-500 ${
                fromTimer ? 'opacity-60' : ''
              }`}
            />
            {!fromTimer && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESET_MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinutes(m)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                      minutes === m
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Apa yang dikerjakan? <span className="text-rose-400">wajib</span>
            </label>
            <textarea
              ref={inputRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
              }}
              rows={3}
              placeholder={
                isDeep
                  ? 'cth: Refactor merge sync di App.tsx, selesai sampai tes manual'
                  : 'cth: Baca bab 4 statistika + kerjakan 10 soal latihan'
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-slate-500 resize-none placeholder:text-slate-600"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Tanpa catatan, menit tidak dihitung. Ini yang bikin lognya berguna dibaca 100 hari lagi.
            </p>
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            Batal
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className={`flex-[2] py-2.5 rounded-xl text-sm font-bold transition ${
              valid
                ? isDeep
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Simpan {minutes > 0 ? `${minutes}m` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
