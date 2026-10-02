import React from 'react';
import { 
  LayoutDashboard, 
  FileEdit, 
  Receipt,
  FileSpreadsheet, 
  TableProperties, 
  Target, 
  Calculator, 
  FileText,
  Briefcase,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Database
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActiveTab, ROLE_PERMISSIONS } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  const { 
    budgetItems, 
    alihDayaContracts, 
    users, 
    currentUser, 
    canAccessTab,
    isSupabaseEnabled,
    supabaseSyncStatus
  } = useApp();

  if (!currentUser) return null;

  const roleConfig = ROLE_PERMISSIONS[currentUser.role] || ROLE_PERMISSIONS.user;

  // Nav items categorized logically for vertical sidebar display
  const navSections: NavSection[] = [
    {
      title: 'Monitoring & Kinerja',
      items: [
        { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
        { id: 'performance', label: 'Indikator & Kinerja', icon: Target },
        { id: 'reports', label: 'Laporan & Ringkasan', icon: FileText }
      ]
    },
    {
      title: 'Perencanaan & Kontrak',
      items: [
        { id: 'prognosa', label: 'Prognosa Anggaran', icon: Calculator },
        { 
          id: 'alih_daya', 
          label: 'Monitoring Kontrak', 
          icon: Briefcase, 
          badge: `${alihDayaContracts.length}` 
        },
        { id: 'matrix', label: 'Matriks Monitoring', icon: TableProperties }
      ]
    },
    {
      title: 'Input Transaksi',
      items: [
        { 
          id: 'budget_input', 
          label: 'Input & Edit Anggaran', 
          icon: FileEdit, 
          badge: `${budgetItems.filter(i => !i.isGroupHeader).length}` 
        },
        { 
          id: 'realization_input', 
          label: 'Input Realisasi Manual', 
          icon: Receipt, 
          badge: 'Manual' 
        },
        { 
          id: 'realization_import', 
          label: 'Import Excel', 
          icon: FileSpreadsheet, 
          badge: 'Excel / CSV' 
        }
      ]
    },
    {
      title: 'Pengaturan Sistem',
      items: [
        { 
          id: 'user_management', 
          label: 'Manajemen User', 
          icon: Users, 
          badge: `${users.length}` 
        }
      ]
    }
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 select-none">
      {/* Top Header in Sidebar: PLN Branding */}
      <div className="p-3.5 border-b border-slate-800/90 flex items-center justify-between shrink-0 bg-black/40">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* PLN Yellow Box Emblem */}
          <div className="w-10 h-10 bg-[#FFE600] rounded-xs p-1 flex items-center justify-center shrink-0 shadow-md">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <polygon
                points="58,6 26,50 48,50 36,94 74,38 52,38"
                fill="#ED1C24"
                stroke="#FFE600"
                strokeWidth="1.5"
                strokeLinejoin="miter"
              />
            </svg>
          </div>

          {/* PLN Name (hidden when collapsed on desktop) */}
          {(!isCollapsed || isMobileOpen) && (
            <div className="leading-tight min-w-0 transition-opacity duration-200">
              <div className="text-xs font-black tracking-tight text-white uppercase truncate">
                PT PLN (PERSERO)
              </div>
              <div className="text-[11px] font-bold text-amber-400 tracking-wider uppercase truncate">
                UPT MADIUN
              </div>
              <div className="text-[9px] text-slate-400 truncate">
                Anggaran Operasi
              </div>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer shrink-0"
          title={isCollapsed ? 'Perluas Menu Sidebar' : 'Ciutkan Menu Sidebar'}
          aria-label={isCollapsed ? 'Perluas Menu' : 'Ciutkan Menu'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          title="Tutup Menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Vertical Navigation Menu Items */}
      <nav 
        id="vertical-navigation-menu"
        aria-label="Navigasi Menu Vertikal"
        className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
      >
        {navSections.map((section, sIdx) => {
          // Filter items based on user role permissions
          const visibleItems = section.items.filter(item => canAccessTab(item.id));
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className="space-y-1">
              {/* Section Header */}
              {(!isCollapsed || isMobileOpen) ? (
                <div className="px-2.5 pt-1 pb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase flex items-center justify-between">
                  <span>{section.title}</span>
                </div>
              ) : (
                <div className="h-px bg-slate-800/80 my-2 mx-2" aria-hidden="true" />
              )}

              {/* Items in section */}
              {visibleItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    onClick={() => handleSelectTab(item.id)}
                    title={isCollapsed && !isMobileOpen ? item.label : undefined}
                    className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer select-none text-left ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-600/30 border border-blue-400/40 ring-1 ring-blue-400/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/90 border border-transparent font-medium'
                    }`}
                  >
                    {/* Yellow PLN Active Indicator Bar */}
                    {isActive && (
                      <span className="absolute -left-1 top-2 bottom-2 w-1.5 bg-[#FFE600] rounded-r-md shadow-xs shadow-amber-400" />
                    )}

                    <Icon 
                      className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                      }`} 
                    />

                    {/* Label & Badge (hidden when collapsed) */}
                    {(!isCollapsed || isMobileOpen) && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate tracking-tight">{item.label}</span>
                        {item.badge && (
                          <span 
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ml-1.5 transition-colors ${
                              isActive 
                                ? 'bg-blue-900/90 text-blue-100 border border-blue-400/40 shadow-xs' 
                                : 'bg-slate-900 text-slate-400 group-hover:text-slate-200 border border-slate-800'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer: User Card & Status */}
      <div className="p-3 border-t border-slate-800/90 bg-slate-950/90 shrink-0">
        {(!isCollapsed || isMobileOpen) ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-[#E11D48] text-white shrink-0 shadow-xs">
                {currentUser.nama
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="min-w-0 leading-tight">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser.nama}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {roleConfig.label}
                </div>
              </div>
            </div>

            {/* Cloud Sync Status Indicator */}
            <div 
              className="flex items-center gap-1 shrink-0" 
              title={isSupabaseEnabled ? `Cloud Supabase: ${supabaseSyncStatus}` : 'Penyimpanan Lokal'}
            >
              <span className={`w-2 h-2 rounded-full ${
                isSupabaseEnabled 
                  ? supabaseSyncStatus === 'syncing' 
                    ? 'bg-amber-400 animate-pulse' 
                    : supabaseSyncStatus === 'error'
                    ? 'bg-rose-400'
                    : 'bg-emerald-400'
                  : 'bg-slate-500'
              }`} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-[#E11D48] text-white shadow-xs cursor-pointer"
              title={`${currentUser.nama} (${roleConfig.label})`}
            >
              {currentUser.nama
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map(n => n[0])
                .join('')
                .toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed/Sticky Left Sidebar */}
      <aside 
        className={`hidden lg:block shrink-0 sticky top-0 h-screen z-40 border-r border-slate-800 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Backdrop + Sliding Sidebar) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
