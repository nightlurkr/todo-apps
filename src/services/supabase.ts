import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppState, SyncedState } from '../types';
import { pruneTombstones } from './storage';

let cachedClient: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

const ROW_ID = 'ryan_accountability';

/** Id per tab/perangkat, dipakai untuk mengabaikan siaran kita sendiri. */
export const CLIENT_ID = (() => {
  try {
    const existing = sessionStorage.getItem('dailyos_client_id');
    if (existing) return existing;
    const generated = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    sessionStorage.setItem('dailyos_client_id', generated);
    return generated;
  } catch {
    return 'client_' + Math.random().toString(36).substring(2, 9);
  }
})();

export type RemotePayload = SyncedState & { _clientId?: string };

export function getSupabaseClient(url?: string, key?: string): SupabaseClient | null {
  const targetUrl = url || '';
  const targetKey = key || '';

  if (!targetUrl || !targetKey) {
    cachedClient = null;
    return null;
  }
  if (cachedClient && currentUrl === targetUrl && currentKey === targetKey) {
    return cachedClient;
  }
  try {
    cachedClient = createClient(targetUrl, targetKey);
    currentUrl = targetUrl;
    currentKey = targetKey;
    return cachedClient;
  } catch (err) {
    console.error('Gagal membuat client Supabase:', err);
    return null;
  }
}

/** Hanya bagian ini yang pernah meninggalkan perangkat. PIN & key tidak ikut. */
export function toSyncedState(state: AppState): SyncedState {
  return {
    version: state.version,
    challengeStartDate: state.challengeStartDate,
    habitDefinitions: state.habitDefinitions,
    dailyLogs: state.dailyLogs,
    tasks: pruneTombstones(state.tasks),
  };
}

export const SQL_SCHEMA_SCRIPT = `-- Jalankan SQL ini di menu "SQL Editor" pada dashboard Supabase Anda:

CREATE TABLE IF NOT EXISTS accountability_sync (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE accountability_sync ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON accountability_sync;
CREATE POLICY "Allow all for anon" ON accountability_sync
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE accountability_sync;
`;

export async function testSupabaseConnection(
  url: string,
  key: string
): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, key);
    const { error } = await client.from('accountability_sync').select('user_id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message:
            'Tabel "accountability_sync" belum dibuat di Supabase. Jalankan script SQL di tab SQL Editor Supabase Anda.',
        };
      }
      return { success: false, message: `Koneksi gagal: ${error.message}` };
    }
    return { success: true, message: 'Koneksi ke Supabase berhasil!' };
  } catch (err) {
    return {
      success: false,
      message: `Error koneksi: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function fetchRemoteState(client: SupabaseClient): Promise<RemotePayload | null> {
  try {
    const { data, error } = await client
      .from('accountability_sync')
      .select('data')
      .eq('user_id', ROW_ID)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // baris belum ada
      console.warn('Gagal mengambil data dari Supabase:', error);
      return null;
    }
    return (data?.data as RemotePayload) || null;
  } catch (err) {
    console.error('Remote fetch error:', err);
    return null;
  }
}

export async function syncStateToRemote(
  client: SupabaseClient,
  state: AppState,
  clientId: string = CLIENT_ID
): Promise<boolean> {
  try {
    const { error } = await client.from('accountability_sync').upsert({
      user_id: ROW_ID,
      data: { ...toSyncedState(state), _clientId: clientId },
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Gagal sync ke Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Sync gagal:', err);
    return false;
  }
}
