import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Calendar, 
  Download, 
  TrendingUp, 
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
  ShieldCheck,
  UserCheck,
  ChevronDown,
  User
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MONTH_NAMES, formatRupiahShort, formatPercent } from '../utils/formatters';
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
    setSelectedYear, 
    setSelectedMonth, 
    isSupabaseEnabled,
    supabaseSyncStatus,
    users,
    currentUser,
    switchUser,
    canAccessTab
  } = useApp();

  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

  const totalBudget = budgetItems
    .filter(i => !i.isGroupHeader)
    .reduce((sum, item) => sum + (item.budgetAnnual || 0), 0);

  const totalRealizationYTD = budgetItems
    .filter(i => !i.isGroupHeader)
    .reduce((sum, item) => {
      let itemYTD = 0;
      for (let m = 0; m <= selectedMonth; m++) {
        itemYTD += (item.realizationMonthly?.[m] || 0);
      }
      return sum + itemYTD;
    }, 0);

  const absorptionRate = totalBudget > 0 ? (totalRealizationYTD / totalBudget) * 100 : 0;

  const handleExport = () => {
    exportFullReportToExcel(budgetItems, indicators, additionalTransactions, selectedYear, selectedMonth + 1);
  };

  const handleSwitchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    switchUser(userId);
    // If target user cannot access the current active tab, switch to dashboard
    const targetAllowed = ROLE_PERMISSIONS[target.role]?.allowedTabs || [];
    if (!targetAllowed.includes(activeTab)) {
      setActiveTab('dashboard');
    }
    setIsUserMenuOpen(false);
  };

  // All available nav items
  const allNavItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'alih_daya', label: 'Monitoring Alih Daya', icon: Briefcase, badge: `${alihDayaContracts.length}` },
    { id: 'prognosa', label: 'Prognosa Anggaran', icon: Calculator },
    { id: 'budget_input', label: 'Input & Edit Anggaran', icon: FileEdit, badge: `${budgetItems.filter(i => !i.isGroupHeader).length}` },
    { id: 'realization_input', label: 'Input Realisasi Manual', icon: Receipt, badge: 'Manual' },
    { id: 'realization_import', label: 'Import Excel', icon: FileSpreadsheet, badge: 'Excel / CSV' },
    { id: 'matrix', label: 'Matriks Monitoring', icon: TableProperties },
    { id: 'performance', label: 'Indikator & Kinerja', icon: Target },
    { id: 'reports', label: 'Laporan & Ringkasan', icon: FileText },
    { id: 'user_management', label: 'Manajemen User', icon: Users, badge: `${users.length}` }
  ];

  // Filter based on currently logged in user's role permissions
  const visibleNavItems = allNavItems.filter(item => canAccessTab(item.id));

  const roleConfig = ROLE_PERMISSIONS[currentUser.role] || ROLE_PERMISSIONS.user;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Pemantauan Realisasi Anggaran
              </h1>
              <p className="text-xs text-slate-400">
                Dashboard Monitoring, Input Anggaran Manual & Import Realisasi Excel
              </p>
            </div>
          </div>

          {/* Quick Metrics & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Period Filters */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg p-1 text-xs">
              <div className="flex items-center gap-1.5 px-2 py-1 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-400">Tahun:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-slate-900 text-white font-semibold rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-blue-500 text-xs cursor-pointer"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                </select>
              </div>

              <div className="h-4 w-px bg-slate-700" />

              <div className="flex items-center gap-1.5 px-2 py-1 text-slate-300">
                <span className="text-slate-400">Cut-off s.d.:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-slate-900 text-white font-semibold rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-blue-500 text-xs cursor-pointer"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/70 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Realisasi s/d {MONTH_NAMES[selectedMonth]}</span>
                <span className="font-bold text-white">{formatRupiahShort(totalRealizationYTD)}</span>
              </div>
              <div className="h-5 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400 block text-[10px]">Serapan YTD</span>
                <span className={`font-bold flex items-center gap-1 ${
                  absorptionRate > 95 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  <TrendingUp className="w-3 h-3" />
                  {formatPercent(absorptionRate, 1)}
                </span>
              </div>
            </div>

            {/* Actions & User Profile */}
            <div className="flex items-center gap-2">
              <button
                id="btn-supabase-sync"
                onClick={() => setIsSupabaseModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer border ${
                  isSupabaseEnabled
                    ? supabaseSyncStatus === 'syncing'
                      ? 'bg-amber-600/30 text-amber-300 border-amber-500/40 animate-pulse'
                      : supabaseSyncStatus === 'error'
                      ? 'bg-red-900/30 text-red-300 border-red-500/40'
                      : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/70 border-emerald-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                }`}
                title="Status & Pengaturan Database Cloud Supabase"
              >
                <Database className={`w-3.5 h-3.5 ${isSupabaseEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="hidden xl:inline">
                  {isSupabaseEnabled ? (supabaseSyncStatus === 'syncing' ? 'Menyimpan...' : 'Supabase DB') : 'Setup Supabase'}
                </span>
              </button>

              <button
                id="btn-export-header-excel"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                title="Export seluruh data pemantauan ke file Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Export Excel</span>
              </button>

              {/* User Profile & Role Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  id="btn-user-profile-menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-left transition-all cursor-pointer shadow-xs"
                >
                  {/* Initials Avatar */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    currentUser.role === 'admin' 
                      ? 'bg-rose-500 text-white' 
                      : currentUser.role === 'management'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {currentUser.nama
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()}
                  </div>

                  <div className="hidden sm:block text-left leading-tight">
                    <span className="text-xs font-semibold text-white block max-w-[130px] truncate">
                      {currentUser.nama}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {currentUser.jabatan}
                    </span>
                  </div>

                  {/* Role badge */}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                    currentUser.role === 'admin'
                      ? 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                      : currentUser.role === 'management'
                      ? 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                      : 'bg-blue-950/70 text-blue-300 border-blue-500/40'
                  }`}>
                    {roleConfig.label}
                  </span>

                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 py-2 z-50 animate-fade-in">
                    {/* User Profile Card inside Dropdown */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          currentUser.role === 'admin'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : currentUser.role === 'management'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          currentUser.role === 'admin'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : currentUser.role === 'management'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {roleConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Role simulation switcher */}
                    <div className="px-3 py-2">
                      <span className="text-[11px] font-bold text-slate-500 block px-1 mb-1.5 uppercase tracking-wider">
                        Ganti Pengguna / Simulasi Role:
                      </span>
                      <div className="space-y-1">
                        {users.map(u => {
                          const isSelected = u.id === currentUser.id;
                          return (
                            <button
                              key={u.id}
                              onClick={() => handleSwitchUser(u.id)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                isSelected 
                                  ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200' 
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <span className="block truncate leading-tight">{u.nama}</span>
                                <span className="text-[10px] text-slate-500 block font-normal truncate">
                                  {u.jabatan}
                                </span>
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 uppercase ${
                                u.role === 'admin'
                                  ? 'bg-rose-100 text-rose-700'
                                  : u.role === 'management'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {ROLE_PERMISSIONS[u.role]?.label || u.role}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Shortcut to User Management */}
                    <div className="pt-2 px-3 border-t border-slate-100">
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Bar */}
      <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto py-1.5 no-scrollbar">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                    isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </header>
  );
};
