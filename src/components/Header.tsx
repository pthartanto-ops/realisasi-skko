import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Download, 
  Database,
  Users,
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MONTH_NAMES } from '../utils/formatters';
import { exportFullReportToExcel } from '../utils/excelExporter';
import { ActiveTab, ROLE_PERMISSIONS } from '../types';
import { SupabaseSyncModal } from './SupabaseSyncModal';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab,
  onOpenMobileSidebar,
  isSidebarCollapsed,
  onToggleSidebar
}) => {
  const { 
    budgetItems, 
    indicators, 
    additionalTransactions, 
    selectedYear, 
    selectedMonth, 
    availableYears,
    setSelectedYear, 
    setSelectedMonth, 
    isSupabaseEnabled,
    supabaseSyncStatus,
    currentUser,
    logoutUser,
    canAccessTab
  } = useApp();

  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = () => {
    exportFullReportToExcel(budgetItems, indicators, additionalTransactions, selectedYear, selectedMonth + 1);
  };

  if (!currentUser) return null;

  const roleConfig = ROLE_PERMISSIONS[currentUser.role] || ROLE_PERMISSIONS.user;

  // Active Tab display label
  const tabTitles: Record<ActiveTab, string> = {
    dashboard: 'Dashboard Utama',
    performance: 'Indikator & Kinerja',
    reports: 'Laporan & Ringkasan',
    prognosa: 'Prognosa Anggaran',
    alih_daya: 'Monitoring Kontrak',
    matrix: 'Matriks Monitoring',
    budget_input: 'Input & Edit Anggaran',
    realization_input: 'Input Realisasi Manual',
    realization_import: 'Import Excel',
    user_management: 'Manajemen User'
  };

  return (
    <header className="bg-black text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="w-full px-3 sm:px-6 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Left Section: Sidebar Toggles & App Title */}
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Buka Menu Navigasi"
              aria-label="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5 text-blue-400" />
            </button>

            {/* Desktop Sidebar Collapse Toggle */}
            <button
              onClick={onToggleSidebar}
              className="hidden lg:flex p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition-colors cursor-pointer shrink-0"
              title={isSidebarCollapsed ? 'Perluas Menu Samping' : 'Ciutkan Menu Samping'}
              aria-label={isSidebarCollapsed ? 'Perluas Menu Samping' : 'Ciutkan Menu Samping'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-blue-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Header Titles */}
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base md:text-lg font-black tracking-wide text-white uppercase drop-shadow-xs">
                  MONITORING REALISASI ANGGARAN OPERASI
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-500/40">
                  {tabTitles[activeTab]}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium tracking-tight flex items-center gap-1.5">
                <span className="text-[#FFE600] font-bold">PT PLN (Persero)</span>
                <span>•</span>
                <span>Unit Pelaksana Transmisi Madiun</span>
              </div>
            </div>
          </div>

          {/* Right Section: Period Filters, Sync, Export, & User Profile */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 shrink-0">
            {/* Period Filters */}
            <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 text-xs">
              <div className="flex items-center gap-1.5 px-2 py-0.5 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-400 font-medium">Tahun:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-slate-950 text-white font-semibold rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-blue-500 text-xs cursor-pointer"
                >
                  {(availableYears || [2024, 2025, 2026, 2027]).map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              <div className="h-4 w-px bg-slate-700" />

              <div className="flex items-center gap-1.5 px-2 py-0.5 text-slate-300">
                <span className="text-slate-400 font-medium">Cut-off s.d.:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-slate-950 text-white font-semibold rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-blue-500 text-xs cursor-pointer"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Action Buttons: Supabase & Export Excel */}
            <div className="flex items-center gap-1.5">
              <button
                id="btn-supabase-sync"
                onClick={() => setIsSupabaseModalOpen(true)}
                className={`p-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer border ${
                  isSupabaseEnabled
                    ? supabaseSyncStatus === 'syncing'
                      ? 'bg-amber-600/30 text-amber-300 border-amber-500/40 animate-pulse'
                      : supabaseSyncStatus === 'error'
                      ? 'bg-red-900/30 text-red-300 border-red-500/40'
                      : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/70 border-emerald-500/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                }`}
                title="Status & Pengaturan Database Cloud Supabase"
              >
                <Database className={`w-4 h-4 ${isSupabaseEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />
              </button>

              <button
                id="btn-export-header-excel"
                onClick={handleExport}
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40 shadow-xs transition-colors cursor-pointer flex items-center justify-center shrink-0"
                title="Export seluruh data pemantauan ke file Excel (.xlsx)"
                aria-label="Export seluruh data pemantauan ke file Excel (.xlsx)"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile & Quick Logout */}
            <div className="flex items-center gap-1.5">
              {/* User Profile & Role Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  id="btn-user-profile-menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 text-left transition-all cursor-pointer shadow-xs"
                >
                  {/* Initials Avatar */}
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs bg-[#E11D48] text-white shadow-xs">
                    {currentUser.nama
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()}
                  </div>

                  <div className="text-left leading-tight hidden sm:block">
                    <span className="text-xs font-bold text-white block uppercase tracking-wide">
                      {currentUser.nama}
                    </span>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-medium">
                      {currentUser.jabatan}
                    </span>
                  </div>

                  {/* Role badge with Dropdown Arrow */}
                  <div className="flex items-center gap-1 text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded border uppercase tracking-wider bg-[#3B111F] text-rose-300 border-rose-500/50">
                    <span>{currentUser.role.toUpperCase()}</span>
                    <ChevronDown className="w-3 h-3 text-rose-300" />
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 py-2 z-50 animate-fade-in">
                    {/* User Profile Card inside Dropdown */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-[#E11D48] text-white">
                          {currentUser.nama
                            .split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 leading-tight">
                            {currentUser.nama}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            NIP: {currentUser.nip}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 mb-1">
                        <span className="font-semibold text-slate-700">Jabatan:</span> {currentUser.jabatan}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-medium">Role:</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-rose-50 text-rose-700 border-rose-200">
                          {roleConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Shortcuts & Logout */}
                    <div className="p-3 space-y-2">
                      {canAccessTab('user_management') && (
                        <button
                          onClick={() => {
                            setActiveTab('user_management');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>Kelola Profil &amp; Role Pengguna</span>
                        </button>
                      )}

                      <button
                        id="btn-logout-user-menu"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsLogoutModalOpen(true);
                        }}
                        className="w-full px-3 py-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Keluar / Ganti Akun</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Logout Button */}
              <button
                id="btn-header-quick-logout"
                onClick={() => setIsLogoutModalOpen(true)}
                title={`Keluar / Ganti Akun dari ${currentUser.nama}`}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* In-App Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Konfirmasi Keluar &amp; Ganti Akun
            </h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Untuk berganti akun atau mengakhiri sesi kerja, Anda perlu keluar dari akun <strong className="text-slate-900">{currentUser.nama}</strong> ({currentUser.jabatan}) terlebih dahulu. Anda akan dialihkan ke layar login untuk memasukkan NIP &amp; Password akun yang ingin digunakan.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                id="btn-cancel-logout"
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-logout-action"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  logoutUser();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ya, Keluar &amp; Menuju Login</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
