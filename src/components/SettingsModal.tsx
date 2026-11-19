import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  Shield, 
  Sliders, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import type { AppSettings, AppState } from '../types';
import { SQL_SCHEMA_SCRIPT, testSupabaseConnection } from '../services/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  fullState: AppState;
  onImportState: (newState: AppState) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  fullState,
  onImportState,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [isCopied, setIsCopied] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showSql, setShowSql] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SCRIPT);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!formData.supabaseUrl || !formData.supabaseAnonKey) {
      setTestResult({
        success: false,
        message: 'Masukkan Project URL dan Anon Key terlebih dahulu.',
      });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(formData.supabaseUrl, formData.supabaseAnonKey);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `dailyos_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.dailyLogs && parsed.settings) {
          onImportState(parsed);
          alert('Data berhasil diimpor!');
          onClose();
        } else {
          alert('Format file JSON tidak valid untuk DailyOS.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1 flex items-center space-x-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <span>Pengaturan & Cloud Sync</span>
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Konfigurasi sinkronisasi realtime ke HP/Laptop dengan Supabase, PIN keamanan, dan target harian.
        </p>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Section 1: Supabase Cloud Sync */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-200">Supabase Cloud Sync (Gratis)</h3>
              </div>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>Buka Supabase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Dengan menghubungkan Supabase, data Anda akan otomatis tersinkronisasi seketika (realtime) antara Laptop dan HP tanpa perlu biaya hosting.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyz.supabase.co"
                  value={formData.supabaseUrl}
                  onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value.trim() })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={formData.supabaseAnonKey}
                  onChange={(e) => setFormData({ ...formData, supabaseAnonKey: e.target.value.trim() })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Action Buttons for Supabase */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition"
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                  <span>Tes Koneksi</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-medium text-indigo-300 rounded-lg transition"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Script Disalin!' : 'Salin SQL Schema Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSql(!showSql)}
                  className="text-xs text-slate-400 hover:text-slate-200 py-1.5 px-2"
                >
                  {showSql ? 'Sembunyikan SQL' : 'Lihat SQL'}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-start space-x-2 border ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {showSql && (
                <div className="mt-2 bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <p className="text-[11px] text-slate-400 mb-2">
                    Jalankan script berikut di <strong>Supabase Dashboard &gt; SQL Editor &gt; New Query</strong>:
                  </p>
                  <pre className="text-[11px] font-mono text-indigo-300 overflow-x-auto p-2 bg-slate-950 rounded-lg max-h-40">
                    {SQL_SCHEMA_SCRIPT}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Keamanan PIN Pribadi */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-200">Keamanan PIN Pribadi</h3>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Kunci aplikasi dengan PIN agar privasi tugas dan rutinitas Anda tetap aman saat diakses di perangkat mana pun.
            </p>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pinEnabled}
                  onChange={(e) => setFormData({ ...formData, pinEnabled: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded bg-slate-900 border-slate-700"
                />
                <span className="text-xs text-slate-200 font-medium">Aktifkan Kunci PIN saat membuka aplikasi</span>
              </label>

              {formData.pinEnabled && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    PIN (4 - 6 Angka)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="1234"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    className="w-36 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono tracking-widest text-center"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Target Harian */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center space-x-2 mb-3">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-200">Target Harian</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Deep Work Harian (Menit)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={10}
                    max={600}
                    value={formData.deepWorkDailyTarget}
                    onChange={(e) => setFormData({ ...formData, deepWorkDailyTarget: Number(e.target.value) || 100 })}
                    className="w-24 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 text-center font-bold"
                  />
                  <span className="text-xs text-slate-400">menit (default: 100m)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Belajar Kuliah Harian (Menit)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={10}
                    max={600}
                    value={formData.collegeDailyTarget}
                    onChange={(e) => setFormData({ ...formData, collegeDailyTarget: Number(e.target.value) || 100 })}
                    className="w-24 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 text-center font-bold"
                  />
                  <span className="text-xs text-slate-400">menit (default: 100m)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Cadangan & Pemulihan */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Cadangan & Ekspor Data</h3>
            <p className="text-xs text-slate-400 mb-3">
              Anda selalu dapat mengunduh backup seluruh data Anda dalam format JSON untuk arsip atau dipindah secara manual.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Backup JSON</span>
              </button>

              <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Impor File Backup</span>
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition active:scale-95"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};
