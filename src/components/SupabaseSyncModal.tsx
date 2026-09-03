import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, UploadCloud, DownloadCloud, KeyRound, ExternalLink, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({ isOpen, onClose }) => {
  const { 
    isSupabaseEnabled, 
    supabaseSyncStatus, 
    lastSyncTime, 
    syncToSupabase, 
    loadFromSupabase 
  } = useApp();

  const [loadingAction, setLoadingAction] = useState<'upload' | 'download' | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleUpload = async () => {
    setLoadingAction('upload');
    setFeedbackMsg(null);
    const res = await syncToSupabase();
    setLoadingAction(null);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: 'Berhasil mengunggah dan menyimpan seluruh data ke Supabase!' });
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'Gagal mengunggah data ke Supabase.' });
    }
  };

  const handleDownload = async () => {
    if (!confirm('Tindakan ini akan menimpa data yang sedang aktif dengan data terbaru dari database Supabase. Lanjutkan?')) {
      return;
    }
    setLoadingAction('download');
    setFeedbackMsg(null);
    const res = await loadFromSupabase();
    setLoadingAction(null);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: 'Berhasil menyinkronkan dan memuat data dari Supabase!' });
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'Gagal memuat data dari Supabase.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Database Supabase Storage</h2>
              <p className="text-xs text-slate-400">Sinkronisasi Cloud PostgreSQL Supabase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg border text-xs flex items-start gap-3 ${
            isSupabaseEnabled 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {isSupabaseEnabled ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold">
                {isSupabaseEnabled ? 'Koneksi Supabase Aktif' : 'Konfigurasi Supabase Belum Terpasang'}
              </div>
              <p className="text-slate-600 leading-relaxed">
                {isSupabaseEnabled ? (
                  <>Aplikasi terhubung ke Supabase. Data disimpan di cloud database secara otomatis setiap ada perubahan.</>
                ) : (
                  <>Tambahkan variable <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> pada project settings / environment variables aplikasi Anda.</>
                )}
              </p>
              {lastSyncTime && (
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  Sinkronisasi terakhir: {lastSyncTime.toLocaleTimeString('id-ID')} ({lastSyncTime.toLocaleDateString('id-ID')})
                </div>
              )}
            </div>
          </div>

          {feedbackMsg && (
            <div className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
              feedbackMsg.type === 'success' 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                : 'bg-red-100 text-red-800 border-red-300'
            }`}>
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleUpload}
              disabled={loadingAction !== null || !isSupabaseEnabled}
              className="flex flex-col items-start p-3.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left group disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  Simpan ke Cloud
                </span>
                {loadingAction === 'upload' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-500">
                Kirim seluruh data anggaran & alih daya saat ini ke tabel Supabase.
              </p>
            </button>

            <button
              onClick={handleDownload}
              disabled={loadingAction !== null || !isSupabaseEnabled}
              className="flex flex-col items-start p-3.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="font-semibold text-xs text-slate-900 group-hover:text-blue-700 flex items-center gap-1.5">
                  <DownloadCloud className="w-4 h-4 text-blue-600" />
                  Muat dari Cloud
                </span>
                {loadingAction === 'download' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />}
              </div>
              <p className="text-[11px] text-slate-500">
                Tarik data terbaru yang tersimpan di Supabase ke aplikasi lokal.
              </p>
            </button>
          </div>

          {/* Setup Guide for Supabase SQL */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <KeyRound className="w-3.5 h-3.5 text-slate-600" />
              <span>Struktur Tabel Supabase (SQL Editor)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Jalankan query SQL berikut di Supabase SQL Editor untuk membuat tabel penampung data:
            </p>
            <pre className="bg-slate-900 text-slate-100 p-2.5 rounded text-[10px] font-mono overflow-x-auto leading-relaxed">
{`create table if not exists public.app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.app_state enable row level security;
create policy "Allow public app_state" on public.app_state for all using (true) with check (true);`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <span>Buka Dashboard Supabase</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
