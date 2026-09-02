import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
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
import { ActiveTab } from './types';

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const renderActiveView = () => {
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
