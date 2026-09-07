import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Calendar, 
  Download, 
  LayoutDashboard, 
  FileEdit, 
  Receipt,
  FileSpreadsheet, 
  TableProperties, 
  Target, 
  Calculator, 
  FileText,
  Briefcase,
  Database,
  Users,
  ChevronDown,
  User,
  LogOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MONTH_NAMES } from '../utils/formatters';
import { exportFullReportToExcel } from '../utils/excelExporter';
import { ActiveTab, ROLE_PERMISSIONS } from '../types';
import { SupabaseSyncModal } from './SupabaseSyncModal';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { 
    budgetItems, 
    indicators, 
    additionalTransactions, 
    alihDayaContracts,
    selectedYear, 
    selectedMonth, 
    availableYears,
    setSelectedYear, 
    setSelectedMonth, 
    isSupabaseEnabled,
    supabaseSyncStatus,
    users,
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

  // All available nav items in requested order:
  // 1. Dashboard Utama, 2. Indikator & Kinerja, 3. Laporan & Ringkasan,
  // 4. Prognosa Anggaran, 5. Monitoring Kontrak, 6. Matriks Monitoring,
  // 7. Input & Edit Anggaran, 8. Input Realisasi Manual, 9. Import Excel, 10. Manajemen User
  const allNavItems: { 
    id: ActiveTab; 
    label: string; 
    icon: React.FC<{ className?: string }>; 
    badge?: string;
    hasDividerBefore?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'performance', label: 'Indikator & Kinerja', icon: Target },
    { id: 'reports', label: 'Laporan & Ringkasan', icon: FileText },
    { id: 'prognosa', label: 'Prognosa Anggaran', icon: Calculator, hasDividerBefore: true },
    { id: 'alih_daya', label: 'Monitoring Kontrak', icon: Briefcase, badge: `${alihDayaContracts.length}` },
    { id: 'matrix', label: 'Matriks Monitoring', icon: TableProperties },
    { id: 'budget_input', label: 'Input & Edit Anggaran', icon: FileEdit, badge: `${budgetItems.filter(i => !i.isGroupHeader).length}`, hasDividerBefore: true },
    { id: 'realization_input', label: 'Input Realisasi Manual', icon: Receipt, badge: 'Manual' },
    { id: 'realization_import', label: 'Import Excel', icon: FileSpreadsheet, badge: 'Excel / CSV' },
    { id: 'user_management', label: 'Manajemen User', icon: Users, badge: `${users.length}`, hasDividerBefore: true }
  ];

  // Filter based on currently logged in user's role permissions
  const visibleNavItems = allNavItems.filter(item => canAccessTab(item.id));

  // If no active user, header does not render
  if (!currentUser) return null;

  const roleConfig = ROLE_PERMISSIONS[currentUser.role] || ROLE_PERMISSIONS.user;

  return (
    <header className="bg-black text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Banner Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
        {/* Row 1: Brand/Logo on Left, User Profile + Quick Logout & Filters on Right */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          {/* Brand with PLN Official Logo */}
          <div className="flex items-center gap-3">
            {/* PLN Yellow Box Emblem */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#FFE600] rounded-xs p-1 flex items-center justify-center shrink-0 shadow-md">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* 3 Blue Waves (Gelombang Air) */}
                <path
                  d="M 8 58 C 20 51 28 65 40 58 C 52 51 60 65 72 58 C 84 51 90 65 96 58"
                  stroke="#0096D6"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 8 68 C 20 61 28 75 40 68 C 52 61 60 75 72 68 C 84 61 90 75 96 68"
                  stroke="#0096D6"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 8 78 C 20 71 28 85 40 78 C 52 71 60 85 72 78 C 84 71 90 85 96 78"
                  stroke="#0096D6"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Red Lightning Bolt (Petir Merah) */}
                <polygon
                  points="58,6 26,50 48,50 36,94 74,38 52,38"
                  fill="#ED1C24"
                  stroke="#FFE600"
                  strokeWidth="1.5"
                  strokeLinejoin="miter"
                />
              </svg>
            </div>

            <div className="leading-tight">
              <div className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-white uppercase">
                PT PLN (PERSERO)
              </div>
              <div className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-white uppercase">
                UNIT PELAKSANA TRANSMISI MADIUN
              </div>
            </div>
          </div>

          {/* Right Column: User Profile Row + Period Filter Row */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* User Profile & Quick Logout */}
            <div className="flex items-center gap-2">
              {/* User Profile & Role Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  id="btn-user-profile-menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 text-left transition-all cursor-pointer shadow-xs"
                >
                  {/* Initials Avatar */}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-[#E11D48] text-white shadow-xs">
                    {currentUser.nama
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()}
                  </div>

                  <div className="text-left leading-tight">
                    <span className="text-xs font-bold text-white block uppercase tracking-wide">
                      {currentUser.nama}
                    </span>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-medium">
                      {currentUser.jabatan}
                    </span>
                  </div>

                  {/* Role badge with Dropdown Arrow */}
                  <div className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider bg-[#3B111F] text-rose-300 border-rose-500/50">
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
                <span>Logout</span>
              </button>
            </div>

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
          </div>
        </div>

        {/* Row 2: Centered Title with Action Buttons on Right */}
        <div className="relative flex items-center justify-between mt-3.5 pt-1 gap-2 sm:gap-4">
          {/* Left spacer matching right actions width to guarantee exact visual balance and avoid any overlap */}
          <div className="hidden sm:flex items-center gap-2 w-[76px] shrink-0 pointer-events-none" aria-hidden="true" />

          {/* Centered Large Title - with clean negative space & responsive scaling */}
          <div className="flex-1 flex justify-center text-center px-1">
            <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black tracking-wide sm:tracking-wider text-white uppercase text-center drop-shadow-xs">
              MONITORING REALISASI ANGGARAN OPERASI
            </h1>
          </div>

          {/* Right-aligned Actions (Database & Export Excel) */}
          <div className="flex items-center gap-2 shrink-0 z-10">
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
        </div>
      </div>

      {/* Navigation Sub-Bar */}
      <div className="bg-slate-950/95 border-t border-slate-800/80 border-b border-slate-900 shadow-inner px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <nav 
            id="main-navigation-bar" 
            aria-label="Navigasi Utama"
            className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-2 no-scrollbar scroll-smooth"
          >
            {visibleNavItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <React.Fragment key={item.id}>
                  {/* Subtle group separator between logical functional modules */}
                  {item.hasDividerBefore && idx > 0 && (
                    <div 
                      className="h-4.5 w-px bg-slate-800/90 my-auto mx-1 shrink-0 hidden md:block" 
                      aria-hidden="true" 
                    />
                  )}

                  <button
                    id={`nav-tab-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`group relative flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs whitespace-nowrap transition-all duration-150 cursor-pointer select-none shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white font-semibold shadow-sm shadow-blue-500/25 border border-blue-400/40 ring-1 ring-blue-400/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent hover:border-slate-700/60 font-medium'
                    }`}
                  >
                    <Icon 
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                      }`} 
                    />
                    <span className="tracking-tight">{item.label}</span>
                    {item.badge && (
                      <span 
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold transition-colors shrink-0 ${
                          isActive 
                            ? 'bg-blue-800/90 text-blue-100 border border-blue-400/30 shadow-xs' 
                            : 'bg-slate-800/90 text-slate-400 group-hover:text-slate-300 border border-slate-700/70'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {/* Active bottom glow accent */}
                    {isActive && (
                      <span className="absolute -bottom-2 left-2 right-2 h-0.5 bg-blue-400 rounded-full shadow-xs shadow-blue-400" />
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      </div>

      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* In-App Logout Confirmation Modal (Never blocked by iframe sandbox) */}
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
