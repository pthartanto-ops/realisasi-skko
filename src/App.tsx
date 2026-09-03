import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { BudgetInputView } from './views/BudgetInputView';
import { RealizationInputView } from './views/RealizationInputView';
import { RealizationImportView } from './views/RealizationImportView';
import { MatrixView } from './views/MatrixView';
import { PerformanceView } from './views/PerformanceView';
import { PrognosaView } from './views/PrognosaView';
import { AlihDayaMonitoringView } from './views/AlihDayaMonitoringView';
import { ReportsView } from './views/ReportsView';
import { UserManagementView } from './views/UserManagementView';
import { LoginView } from './views/LoginView';
import { ActiveTab, ROLE_PERMISSIONS } from './types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const { currentUser, canAccessTab } = useApp();

  // If role changes or tab is not permitted, auto redirect to dashboard
  useEffect(() => {
    if (currentUser && !canAccessTab(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, currentUser, canAccessTab]);

  // If not logged in, render the Login Screen
  if (!currentUser) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    // Role guard check
    if (!canAccessTab(activeTab)) {
      return (
        <div className="bg-white rounded-2xl p-8 border border-rose-200 shadow-sm text-center max-w-lg mx-auto my-12">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Akses Menu Dibatasi</h2>
          <p className="text-xs text-slate-500 mb-4">
            Peran akun Anda saat ini (<strong>{ROLE_PERMISSIONS[currentUser.role]?.label}</strong>) tidak memiliki izin untuk mengakses modul ini.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard Utama</span>
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigateTab={setActiveTab} />;
      case 'alih_daya':
        return <AlihDayaMonitoringView />;
      case 'budget_input':
        return <BudgetInputView />;
      case 'realization_input':
        return <RealizationInputView />;
      case 'realization_import':
        return <RealizationImportView />;
      case 'matrix':
        return <MatrixView />;
      case 'performance':
        return <PerformanceView />;
      case 'prognosa':
        return <PrognosaView />;
      case 'reports':
        return <ReportsView />;
      case 'user_management':
        return <UserManagementView />;
      default:
        return <DashboardView onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Header with Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderActiveView()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">PT PLN (Persero) UPT Madiun</span>
            <span>— Realisasi Anggaran Operasi</span>
          </div>
          <p className="text-slate-400">
            Penyimpanan lokal aktif & sinkronisasi berkas Excel
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
