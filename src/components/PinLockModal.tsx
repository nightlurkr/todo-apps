import React, { useState, useEffect } from 'react';
import { Lock, Delete, ShieldCheck } from 'lucide-react';

interface PinLockModalProps {
  expectedPin: string;
  onUnlocked: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({ expectedPin, onUnlocked }) => {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === expectedPin.length) {
        checkPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  const handleClear = () => {
    setPin('');
    setIsError(false);
  };

  const checkPin = (entered: string) => {
    if (entered === expectedPin) {
      onUnlocked();
    } else {
      setIsError(true);
      setTimeout(() => {
        setPin('');
        setIsError(false);
      }, 700);
    }
  };

  // Allow physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, expectedPin]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/5">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-white mb-1">Aplikasi Terkunci</h2>
        <p className="text-xs text-slate-400 mb-6 text-center">
          Masukkan PIN pribadi Anda untuk membuka DailyOS.
        </p>

        {/* PIN Dots */}
        <div className={`flex items-center space-x-3 mb-8 ${isError ? 'animate-bounce text-rose-500' : ''}`}>
          {Array.from({ length: Math.max(expectedPin.length, 4) }).map((_, index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  isError
                    ? 'bg-rose-500 scale-110 shadow-lg shadow-rose-500/50'
                    : isFilled
                    ? 'bg-indigo-500 scale-125 shadow-lg shadow-indigo-500/50'
                    : 'bg-slate-700/80'
                }`}
              />
            );
          })}
        </div>

        {isError && (
          <p className="text-xs font-semibold text-rose-400 mb-4 animate-pulse">
            PIN salah. Silakan coba lagi.
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-indigo-600/40 border border-slate-700/50 text-xl font-semibold text-white transition active:scale-95 flex items-center justify-center shadow-sm"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-800/30 hover:bg-slate-800/60 text-xs font-medium text-slate-400 transition flex items-center justify-center"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-indigo-600/40 border border-slate-700/50 text-xl font-semibold text-white transition active:scale-95 flex items-center justify-center shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-800/30 hover:bg-slate-800/60 active:bg-slate-700/60 text-slate-300 transition flex items-center justify-center"
            title="Hapus"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Single-User Private Access</span>
        </div>
      </div>
    </div>
  );
};
