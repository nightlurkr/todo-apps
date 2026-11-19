import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppState } from '../types';

let cachedClient: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

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
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export const SQL_SCHEMA_SCRIPT = `-- Jalankan SQL ini di menu "SQL Editor" pada dashboard Supabase Anda:

CREATE TABLE IF NOT EXISTS accountability_sync (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Mengizinkan akses menggunakan anon key
ALTER TABLE accountability_sync ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON accountability_sync;
CREATE POLICY "Allow all for anon" ON accountability_sync
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Aktifkan Realtime agar otomatis sinkron ke HP dan Laptop seketika
ALTER PUBLICATION supabase_realtime ADD TABLE accountability_sync;
`;

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, key);
    const { error } = await client
      .from('accountability_sync')
      .select('user_id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Tabel "accountability_sync" belum dibuat di Supabase. Silakan jalankan script SQL di tab SQL Editor Supabase Anda.',
        };
      }
      return { success: false, message: `Koneksi gagal: ${error.message}` };
    }

    return { success: true, message: 'Koneksi ke Supabase berhasil!' };
  } catch (err) {
    return { success: false, message: `Error koneksi: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function fetchRemoteState(client: SupabaseClient): Promise<AppState | null> {
  try {
    const { data, error } = await client
      .from('accountability_sync')
      .select('data, updated_at')
      .eq('user_id', 'ryan_accountability')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.warn('Error fetching remote data from Supabase:', error);
      return null;
    }

    if (data && data.data) {
      return data.data as AppState;
    }
    return null;
  } catch (err) {
    console.error('Remote fetch error:', err);
    return null;
  }
}

export async function syncStateToRemote(client: SupabaseClient, state: AppState): Promise<boolean> {
  try {
    const { error } = await client
      .from('accountability_sync')
      .upsert({
        user_id: 'ryan_accountability',
        data: state,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error syncing to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Sync failed:', err);
    return false;
  }
}
