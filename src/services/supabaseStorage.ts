import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { BudgetItem, IndicatorTarget, AdditionalTransaction, AlihDayaContract, ImportLog, AppUser } from '../types';

export interface AppDataPayload {
  budgetItems: BudgetItem[];
  indicators: IndicatorTarget[];
  additionalTransactions: AdditionalTransaction[];
  alihDayaContracts: AlihDayaContract[];
  importLogs: ImportLog[];
  selectedYear?: number;
  selectedMonth?: number;
  users?: AppUser[];
}

const APP_STATE_ID = 'main_madiun_anggaran_state';
const TABLE_NAME = 'app_state';

/**
 * SQL DDL Schema helper for users setting up Supabase table:
 * 
 * create table if not exists public.app_state (
 *   id text primary key,
 *   data jsonb not null,
 *   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * alter table public.app_state enable row level security;
 * create policy "Allow public read/write app_state" on public.app_state for all using (true) with check (true);
 */

export async function fetchRemoteState(): Promise<AppDataPayload | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('data')
      .eq('id', APP_STATE_ID)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return null;
    }

    if (data && data.data) {
      return data.data as AppDataPayload;
    }
    return null;
  } catch (err) {
    console.error('Failed to load data from Supabase:', err);
    return null;
  }
}

export async function saveRemoteState(payload: AppDataPayload): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured yet' };
  }

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(
        {
          id: APP_STATE_ID,
          data: payload,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.warn('Supabase save error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to save data to Supabase:', err);
    return { success: false, error: err?.message || 'Unknown save error' };
  }
}
