import React, { useState, useMemo, useEffect } from 'react';
import {
  FileEdit,
  Search,
  X,
  Check,
  RotateCcw,
  Save,
  Plus,
  Coins,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  TableProperties,
  Layers,
  ArrowRight,
  Info,
  Calendar,
  DollarSign,
  Copy,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BudgetItem, PosType } from '../types';
import { 
  formatRupiah, 
  formatRupiahShort, 
  formatPercent, 
  MONTH_NAMES, 
  MONTH_SHORT_NAMES,
  parseNumberString 
} from '../utils/formatters';
import { getChildAccountsForHeader } from '../utils/budgetCalculations';

type RealizationMode = 'monthly_focus' | 'grid_12m' | 'single_entry';

export const RealizationInputView: React.FC = () => {
  const {
    budgetItems,
    selectedYear,
    selectedMonth,
    setSelectedMonth,
    updateRealization,
    updateAccountRealizationMonthly,
    batchUpdateMonthRealization,
    copyBudgetMonthToRealization,
    addRealizationEntry,
    clearMonthRealization
  } = useApp();

  // Active sub-mode
  const [activeMode, setActiveMode] = useState<RealizationMode>('monthly_focus');
  
  // Target month for focus input (Bulan Aktif) is synchronized with Cut-off s.d. (selectedMonth)
  const focusMonth = selectedMonth;
  const setFocusMonth = (val: number | ((prev: number) => number)) => {
    const nextVal = typeof val === 'function' ? val(selectedMonth) : val;
    setSelectedMonth(nextVal);
  };
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosFilter, setSelectedPosFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | 'has_real' | 'zero_real' | 'over_budget'>('all');
  
  // In-progress local drafts for monthly focus mode: { [itemId]: string }
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>({});
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Clear uncommitted drafts when active/cut-off month changes
  useEffect(() => {
    setDraftInputs({});
  }, [selectedMonth]);

  // Single Entry Form state
  const [entryAccountId, setEntryAccountId] = useState<string>('');
  const [entryMonth, setEntryMonth] = useState<number>(selectedMonth);
  const [entryAmountStr, setEntryAmountStr] = useState<string>('');
  const [entryMode, setEntryMode] = useState<'add' | 'replace'>('replace');
  const [entryNote, setEntryNote] = useState<string>('');
  const [entrySuccessMsg, setEntrySuccessMsg] = useState<string | null>(null);

  // Keep single entry form month in sync with active/cut-off month
  useEffect(() => {
    setEntryMonth(selectedMonth);
  }, [selectedMonth]);

  // Modal 12-Month Edit for single account
  const [editingItem12M, setEditingItem12M] = useState<BudgetItem | null>(null);
  const [modal12MValues, setModal12MValues] = useState<number[]>(Array(12).fill(0));

  // Reset Confirmation Modal
  const [isResetMonthModalOpen, setIsResetMonthModalOpen] = useState(false);

  const POS_OPTIONS: { type: PosType; label: string }[] = [
    { type: 'Pos 52', label: 'Pos 52 - Beban Kepegawaian' },
    { type: 'Pos 53', label: 'Pos 53 - Beban Pemeliharaan' },
    { type: 'Pos 54', label: 'Pos 54 - Biaya Administrasi & Umum' },
    { type: 'Beban Sewa', label: 'Beban Sewa' },
    { type: 'Pos 72', label: 'Pos 72 - Beban Pensiun' },
    { type: 'Lainnya', label: 'Lainnya / Beban Usaha' }
  ];

  // Non-header accounts
  const nonHeaderAccounts = useMemo(() => {
    return budgetItems.filter(item => !item.isGroupHeader);
  }, [budgetItems]);

  // Filtered items based on POS, search term, and status
  const filteredItems = useMemo(() => {
    return budgetItems.filter(item => {
      // POS Filter
      if (selectedPosFilter !== 'ALL' && item.posType !== selectedPosFilter) {
        return false;
      }
      
      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchCode = item.code.toLowerCase().includes(query);
        const matchCat = item.category?.toLowerCase().includes(query) || false;
        if (!matchName && !matchCode && !matchCat) return false;
      }

      // Status filter (applies mainly to non-header items)
      if (!item.isGroupHeader) {
        const currentMonthReal = item.realizationMonthly?.[focusMonth] || 0;
        const annualReal = item.realizationMonthly?.reduce((a, b) => a + b, 0) || 0;
        const annualBudget = item.budgetAnnual || 0;

        if (statusFilter === 'has_real' && currentMonthReal <= 0) return false;
        if (statusFilter === 'zero_real' && currentMonthReal > 0) return false;
        if (statusFilter === 'over_budget' && annualReal <= annualBudget) return false;
      }

      return true;
    });
  }, [budgetItems, selectedPosFilter, searchTerm, statusFilter, focusMonth]);

  // Metrics for Top Summary Bar
  const totalAnnualBudget = useMemo(() => {
    return nonHeaderAccounts.reduce((sum, item) => sum + (item.budgetAnnual || 0), 0);
  }, [nonHeaderAccounts]);

  const totalFocusMonthBudget = useMemo(() => {
    return nonHeaderAccounts.reduce((sum, item) => {
      let ytdBudget = 0;
      for (let m = 0; m <= focusMonth; m++) {
        ytdBudget += (item.budgetMonthly?.[m] || 0);
      }
      return sum + ytdBudget;
    }, 0);
  }, [nonHeaderAccounts, focusMonth]);

  const totalFocusMonthRealization = useMemo(() => {
    return nonHeaderAccounts.reduce((sum, item) => sum + (item.realizationMonthly?.[focusMonth] || 0), 0);
  }, [nonHeaderAccounts, focusMonth]);

  const totalYTDRealization = useMemo(() => {
    return nonHeaderAccounts.reduce((sum, item) => {
      let ytd = 0;
      for (let m = 0; m <= focusMonth; m++) {
        ytd += (item.realizationMonthly?.[m] || 0);
      }
      return sum + ytd;
    }, 0);
  }, [nonHeaderAccounts, focusMonth]);

  const totalRemainingBudget = totalAnnualBudget - totalYTDRealization;
  const absorptionRateAnnual = totalAnnualBudget > 0 ? (totalYTDRealization / totalAnnualBudget) * 100 : 0;
  const absorptionRateYTDTarget = totalFocusMonthBudget > 0 ? (totalYTDRealization / totalFocusMonthBudget) * 100 : 0;
  const monthAbsorptionRate = totalFocusMonthBudget > 0 ? (totalFocusMonthRealization / totalFocusMonthBudget) * 100 : 0;

  // Handle inline change for focus month input
  const handleInputChange = (itemId: string, valueStr: string) => {
    setDraftInputs(prev => ({
      ...prev,
      [itemId]: valueStr
    }));
  };

  // Commit single value on Blur or Enter
  const handleCommitValue = (itemId: string) => {
    const rawVal = draftInputs[itemId];
    if (rawVal === undefined) return;

    const numVal = parseNumberString(rawVal);
    updateRealization(itemId, focusMonth, numVal);

    // Remove from draft
    setDraftInputs(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    setSaveFeedback(`Realisasi akun tersimpan`);
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  // Handle Save All Drafts
  const handleSaveAllDrafts = () => {
    const updates: Record<string, number> = {};
    Object.entries(draftInputs).forEach(([id, strVal]) => {
      updates[id] = parseNumberString(strVal);
    });

    if (Object.keys(updates).length > 0) {
      batchUpdateMonthRealization(focusMonth, updates);
      setDraftInputs({});
    }

    setSaveFeedback(`Seluruh perubahan realisasi bulan ${MONTH_NAMES[focusMonth]} berhasil disimpan`);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Handle Copy Budget to Realization for current month
  const handleCopyBudgetToRealization = () => {
    if (window.confirm(`Salin seluruh target anggaran bulan ${MONTH_NAMES[focusMonth]} (${formatRupiahShort(totalFocusMonthBudget)}) ke kolom realisasi?`)) {
      copyBudgetMonthToRealization(focusMonth, selectedPosFilter);
      setDraftInputs({});
      setSaveFeedback(`Target anggaran bulan ${MONTH_NAMES[focusMonth]} berhasil disalin ke realisasi`);
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  // Handle Reset Focus Month Realization
  const handleConfirmResetFocusMonth = () => {
    clearMonthRealization(focusMonth);
    setDraftInputs({});
    setIsResetMonthModalOpen(false);
    setSaveFeedback(`Data realisasi bulan ${MONTH_NAMES[focusMonth]} telah dikosongkan (Rp 0)`);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Open 12M Modal
  const handleOpen12MModal = (item: BudgetItem) => {
    setEditingItem12M(item);
    setModal12MValues([...item.realizationMonthly]);
  };

  // Save 12M Modal
  const handleSave12MModal = () => {
    if (editingItem12M) {
      updateAccountRealizationMonthly(editingItem12M.id, modal12MValues);
      setEditingItem12M(null);
      setSaveFeedback(`Realisasi 12 bulan untuk "${editingItem12M.name}" berhasil diperbarui`);
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  // Handle Submit Single Transaction Entry Form
  const handleSubmitSingleEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryAccountId) {
      alert('Silakan pilih akun anggaran terlebih dahulu.');
      return;
    }

    const amount = parseNumberString(entryAmountStr);
    if (isNaN(amount)) {
      alert('Nominal realisasi tidak valid.');
      return;
    }

    const targetAccount = budgetItems.find(i => i.id === entryAccountId);
    if (!targetAccount) return;

    if (entryMode === 'add') {
      addRealizationEntry(entryAccountId, entryMonth, amount);
      setEntrySuccessMsg(`Berhasil menambahkan ${formatRupiah(amount)} ke realisasi ${MONTH_NAMES[entryMonth]} pada akun "${targetAccount.name}"`);
    } else {
      updateRealization(entryAccountId, entryMonth, amount);
      setEntrySuccessMsg(`Berhasil memperbarui realisasi ${MONTH_NAMES[entryMonth]} menjadi ${formatRupiah(amount)} pada akun "${targetAccount.name}"`);
    }

    setEntryAmountStr('');
    setEntryNote('');
    setTimeout(() => setEntrySuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback Notification */}
      {saveFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 text-xs font-semibold border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* View Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-600/30 border border-blue-500/40 rounded-xl text-blue-400">
                <FileEdit className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Input Realisasi Anggaran Manual
                </h2>
                <p className="text-xs text-slate-300">
                  Entri dan perbarui data realisasi biaya bulanan secara fleksibel, instan, dan presisi
                </p>
              </div>
            </div>
          </div>

          {/* Quick Month Switcher Bar */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-xl p-1.5 self-start lg:self-center shadow-inner">
            <button
              type="button"
              onClick={() => setFocusMonth(prev => Math.max(0, prev - 1))}
              disabled={focusMonth === 0}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3 py-1 flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 font-medium">Bulan Aktif:</span>
              <select
                value={focusMonth}
                onChange={(e) => setFocusMonth(Number(e.target.value))}
                className="bg-slate-900 font-bold text-white border border-slate-600 rounded-md px-2.5 py-1 focus:outline-none focus:border-blue-500 cursor-pointer text-xs"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m} {selectedYear}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setFocusMonth(prev => Math.min(11, prev + 1))}
              disabled={focusMonth === 11}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-800">
          {/* Card 1: Pagu Tahunan */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium block">Pagu Anggaran Tahunan</span>
            <span className="text-base sm:text-lg font-bold font-mono text-white block mt-0.5">
              {formatRupiah(totalAnnualBudget)}
            </span>
            <span className="text-[10px] text-slate-400">Total {nonHeaderAccounts.length} Akun GL</span>
          </div>

          {/* Card 2: Target vs Realisasi Bulan Terpilih */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-blue-300 font-medium block">
                Realisasi {MONTH_NAMES[focusMonth]}
              </span>
              <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-800/60">
                {formatPercent(monthAbsorptionRate, 1)}
              </span>
            </div>
            <span className="text-base sm:text-lg font-bold font-mono text-blue-400 block mt-0.5">
              {formatRupiah(totalFocusMonthRealization)}
            </span>
            <span className="text-[10px] text-slate-400">
              Target s/d {MONTH_SHORT_NAMES[focusMonth]}: {formatRupiahShort(totalFocusMonthBudget)}
            </span>
          </div>

          {/* Card 3: Realisasi Kumulatif YTD */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] text-emerald-300 font-medium block truncate">
                Kumulatif (s/d {MONTH_SHORT_NAMES[focusMonth]})
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-950/90 text-blue-300 border border-blue-800/60" title={`Serapan terhadap akumulasi anggaran s.d. ${MONTH_NAMES[focusMonth]}`}>
                  s/d Bln: {formatPercent(absorptionRateYTDTarget, 1)}
                </span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                  absorptionRateAnnual > 95 ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                }`} title="Serapan terhadap anggaran satu tahun">
                  1 Thn: {formatPercent(absorptionRateAnnual, 1)}
                </span>
              </div>
            </div>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-400 block mt-0.5">
              {formatRupiah(totalYTDRealization)}
            </span>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${absorptionRateAnnual > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, absorptionRateAnnual))}%` }}
              />
            </div>
          </div>

          {/* Card 4: Sisa Anggaran */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
            <span className="text-[11px] text-amber-300 font-medium block">Sisa Pagu 1 Tahun</span>
            <span className={`text-base sm:text-lg font-bold font-mono block mt-0.5 ${
              totalRemainingBudget < 0 ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {formatRupiah(totalRemainingBudget)}
            </span>
            <span className="text-[10px] text-slate-400">
              {formatPercent(100 - absorptionRateAnnual, 1)} Belum Terserap
            </span>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveMode('monthly_focus')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'monthly_focus'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Input Cepat Realisasi Bulan ({MONTH_NAMES[focusMonth]})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('grid_12m')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'grid_12m'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <TableProperties className="w-4 h-4" />
            <span>Matriks Realisasi 12 Bulan (Jan - Des)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('single_entry')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'single_entry'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Form Entri Transaksi Satuan</span>
          </button>
        </div>

        {/* Quick Bulk Action in Header */}
        {activeMode === 'monthly_focus' && (
          <div className="flex items-center gap-2">
            {Object.keys(draftInputs).length > 0 && (
              <button
                type="button"
                onClick={handleSaveAllDrafts}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer animate-pulse"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan {Object.keys(draftInputs).length} Perubahan</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyBudgetToRealization}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title={`Salin target alokasi bulan ${MONTH_NAMES[focusMonth]} ke realisasi`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salin Target Anggaran</span>
            </button>

            <button
              type="button"
              onClick={() => setIsResetMonthModalOpen(true)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title={`Kosongkan realisasi bulan ${MONTH_NAMES[focusMonth]} ke Rp 0`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kosongkan Bulan Ini</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: INPUT CEPAT BULANAN (FOCUS MONTH) */}
      {/* ========================================================================= */}
      {activeMode === 'monthly_focus' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search box */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari kode akun GL, nama, atau sub-pos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
                <span className="text-slate-500 font-semibold shrink-0">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">Semua Akun ({budgetItems.length})</option>
                  <option value="has_real">Ada Realisasi (&gt; Rp 0)</option>
                  <option value="zero_real">Belum Ada Realisasi (Rp 0)</option>
                  <option value="over_budget">Realisasi &gt; Pagu Tahunan</option>
                </select>
              </div>
            </div>

            {/* POS Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPosFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedPosFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua POS ({budgetItems.length})
              </button>
              {POS_OPTIONS.map(pos => (
                <button
                  type="button"
                  key={pos.type}
                  onClick={() => setSelectedPosFilter(pos.type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedPosFilter === pos.type
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pos.type}
                </button>
              ))}
            </div>
          </div>

          {/* Table for Monthly Focus Input */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-900 text-white uppercase tracking-wider text-[11px] font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-3.5 px-3 w-10 text-center">No</th>
                    <th className="py-3.5 px-4 w-32">Kode GL</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Uraian Akun Anggaran</th>
                    <th className="py-3.5 px-4 text-right min-w-[140px]">Pagu Tahunan</th>
                    <th className="py-3.5 px-4 text-right min-w-[140px]">Target s/d {MONTH_SHORT_NAMES[focusMonth]}</th>
                    <th className="py-3.5 px-4 text-center min-w-[200px] bg-blue-900/90 text-blue-100 border-x border-blue-700">
                      Input Realisasi {MONTH_NAMES[focusMonth]} (Rp)
                    </th>
                    <th className="py-3.5 px-4 text-right min-w-[150px]">Realisasi Kumulatif YTD</th>
                    <th className="py-3.5 px-4 text-center min-w-[150px]">Serapan &amp; Sisa</th>
                    <th className="py-3.5 px-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Tidak ada akun yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => {
                      const isHeader = item.isGroupHeader;
                      const isPosLevel = item.level === 0;

                      if (isHeader) {
                        const childAccounts = getChildAccountsForHeader(item, budgetItems);
                        const headerMonthReal = item.realizationMonthly?.[focusMonth] || 0;
                        let headerMonthBudget = 0;
                        let headerYTD = 0;
                        for (let m = 0; m <= focusMonth; m++) {
                          headerMonthBudget += (item.budgetMonthly?.[m] || 0);
                          headerYTD += (item.realizationMonthly?.[m] || 0);
                        }
                        const headerAbsorptionAnnual = item.budgetAnnual > 0 ? (headerYTD / item.budgetAnnual) * 100 : 0;
                        const headerAbsorptionTarget = headerMonthBudget > 0 ? (headerYTD / headerMonthBudget) * 100 : 0;
                        const headerSisa = item.budgetAnnual - headerYTD;

                        return (
                          <tr
                            key={item.id}
                            className={`font-bold transition-colors ${
                              isPosLevel
                                ? 'bg-slate-200 text-slate-900 border-y-2 border-slate-300'
                                : 'bg-slate-100 text-slate-800 border-y border-slate-200'
                            }`}
                          >
                            <td className="py-3 px-3 text-center text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{item.code || '-'}</td>
                            <td className="py-3 px-4" colSpan={1}>
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                                  isPosLevel ? 'bg-slate-800 text-white' : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                  ∑ Sub-Total
                                </span>
                                <span>{item.name}</span>
                                <span className="text-[10px] font-normal text-slate-500">
                                  ({childAccounts.length} akun)
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              {formatRupiah(item.budgetAnnual)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-700">
                              {formatRupiah(headerMonthBudget)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-blue-900 bg-blue-50/70 border-x border-blue-200">
                              {formatRupiah(headerMonthReal)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                              {formatRupiah(headerYTD)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="flex items-center gap-1.5 justify-center">
                                  <span className="text-[9px] text-slate-500 font-medium whitespace-nowrap">s/d Bln:</span>
                                  <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    headerAbsorptionTarget > 100 ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {formatPercent(headerAbsorptionTarget, 1)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 justify-center">
                                  <span className="text-[9px] text-slate-500 font-medium whitespace-nowrap">1 Thn:</span>
                                  <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    headerAbsorptionAnnual > 100 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                                  }`}>
                                    {formatPercent(headerAbsorptionAnnual, 1)}
                                  </span>
                                </div>
                                <span className="block text-[10px] text-slate-600 font-mono mt-0.5">
                                  Sisa: {formatRupiahShort(headerSisa)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center text-slate-400 text-[10px]">
                              -
                            </td>
                          </tr>
                        );
                      }

                      // Non-header GL Account Row
                      const currentMonthReal = item.realizationMonthly?.[focusMonth] || 0;
                      let currentMonthBudget = 0;
                      let itemYTD = 0;
                      for (let m = 0; m <= focusMonth; m++) {
                        currentMonthBudget += (item.budgetMonthly?.[m] || 0);
                        itemYTD += (item.realizationMonthly?.[m] || 0);
                      }
                      const itemAbsorptionAnnual = item.budgetAnnual > 0 ? (itemYTD / item.budgetAnnual) * 100 : 0;
                      const itemAbsorptionTarget = currentMonthBudget > 0 ? (itemYTD / currentMonthBudget) * 100 : 0;
                      const itemRemaining = item.budgetAnnual - itemYTD;
                      const hasDraft = draftInputs[item.id] !== undefined;
                      const displayInputVal = hasDraft ? draftInputs[item.id] : (currentMonthReal === 0 ? '' : currentMonthReal.toString());

                      return (
                        <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-700">
                            {item.code}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-semibold text-slate-900 block">{item.name}</span>
                            <span className="text-[10px] text-slate-500">{item.category}</span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-800">
                            {formatRupiah(item.budgetAnnual)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                            {formatRupiah(currentMonthBudget)}
                          </td>

                          {/* Editable Cell */}
                          <td className="py-2 px-3 bg-blue-50/50 border-x border-blue-100">
                            <div className="relative flex items-center">
                              <span className="absolute left-2.5 text-slate-400 text-xs font-mono font-medium pointer-events-none">
                                Rp
                              </span>
                              <input
                                type="text"
                                placeholder="0"
                                value={displayInputVal}
                                onChange={(e) => handleInputChange(item.id, e.target.value)}
                                onBlur={() => handleCommitValue(item.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCommitValue(item.id);
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                className={`w-full pl-8 pr-3 py-1.5 text-right font-mono font-bold text-xs rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                                  hasDraft
                                    ? 'border-amber-400 bg-amber-50/50 text-amber-900 shadow-xs'
                                    : currentMonthReal > 0
                                    ? 'border-blue-300 text-blue-900'
                                    : 'border-slate-300 text-slate-700'
                                }`}
                              />
                            </div>
                          </td>

                          <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                            {formatRupiah(itemYTD)}
                          </td>

                          <td className="py-2.5 px-4 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center gap-1.5 justify-center">
                                <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">s/d Bln:</span>
                                <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  itemAbsorptionTarget > 100
                                    ? 'bg-rose-100 text-rose-700'
                                    : itemAbsorptionTarget >= 80
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {formatPercent(itemAbsorptionTarget, 1)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 justify-center">
                                <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">1 Thn:</span>
                                <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  itemAbsorptionAnnual > 100
                                    ? 'bg-rose-100 text-rose-700'
                                    : itemAbsorptionAnnual >= 80
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {formatPercent(itemAbsorptionAnnual, 1)}
                                </span>
                              </div>
                              <span className={`block text-[10px] font-mono mt-0.5 ${
                                itemRemaining < 0 ? 'text-rose-600 font-bold' : 'text-slate-500'
                              }`}>
                                Sisa: {formatRupiahShort(itemRemaining)}
                              </span>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpen12MModal(item)}
                              title="Edit rincian realisasi 12 bulan akun ini"
                              className="px-2 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors cursor-pointer"
                            >
                              12 Bulan
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: MATRIKS REALISASI 12 BULAN (GRID VIEW) */}
      {/* ========================================================================= */}
      {activeMode === 'grid_12m' && (
        <div className="space-y-4">
          {/* Top hint bar */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Matriks Realisasi Lengkap 12 Bulan:</strong> Klik tombol <em>"Edit Realisasi"</em> pada akun untuk mengubah nilai bulan Jan s/d Des sekaligus.
              </span>
            </div>
            <span className="font-mono text-[11px] text-blue-700">Tahun Anggaran: {selectedYear}</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[650px]">
              <table className="w-full text-left text-[11px] text-slate-700">
                <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold sticky top-0 z-20">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-900 z-30">No</th>
                    <th className="py-3 px-3 w-28 sticky left-10 bg-slate-900 z-30">Kode GL</th>
                    <th className="py-3 px-3 min-w-[200px] sticky left-38 bg-slate-900 z-30 shadow-md">Uraian Akun</th>
                    <th className="py-3 px-3 text-right min-w-[110px]">Pagu {selectedYear}</th>
                    {MONTH_SHORT_NAMES.map((m, idx) => (
                      <th key={idx} className={`py-3 px-2 text-right min-w-[85px] ${
                        idx === focusMonth ? 'bg-blue-800 text-yellow-300' : ''
                      }`}>
                        {m}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-right min-w-[120px] bg-slate-950 text-emerald-400">Total Realisasi</th>
                    <th className="py-3 px-3 text-center min-w-[70px]">% Serap</th>
                    <th className="py-3 px-2 text-center w-16 sticky right-0 bg-slate-900 z-30">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item, idx) => {
                    const isHeader = item.isGroupHeader;
                    const totalReal = item.realizationMonthly?.reduce((a, b) => a + b, 0) || 0;
                    const percent = item.budgetAnnual > 0 ? (totalReal / item.budgetAnnual) * 100 : 0;

                    if (isHeader) {
                      return (
                        <tr key={item.id} className="bg-slate-100 font-bold border-y border-slate-200">
                          <td className="py-2.5 px-3 text-center text-slate-500 sticky left-0 bg-slate-100">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono sticky left-10 bg-slate-100">{item.code || '-'}</td>
                          <td className="py-2.5 px-3 sticky left-38 bg-slate-100 shadow-md">
                            <span className="text-blue-900 uppercase">{item.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatRupiahShort(item.budgetAnnual)}
                          </td>
                          {Array(12).fill(0).map((_, m) => {
                            const val = item.realizationMonthly?.[m] || 0;
                            return (
                              <td key={m} className={`py-2.5 px-2 text-right font-mono ${
                                m === focusMonth ? 'bg-blue-100/70 font-black text-blue-900' : 'text-slate-800'
                              }`}>
                                {val === 0 ? '-' : formatRupiahShort(val)}
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/50">
                            {formatRupiahShort(totalReal)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              percent > 100 ? 'bg-rose-200 text-rose-900' : 'bg-slate-200 text-slate-800'
                            }`}>
                              {formatPercent(percent, 0)}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center sticky right-0 bg-slate-100 text-slate-400">-</td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400 sticky left-0 bg-white">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-700 sticky left-10 bg-white">{item.code}</td>
                        <td className="py-2 px-3 sticky left-38 bg-white shadow-md">
                          <span className="font-semibold text-slate-900 block truncate max-w-[220px]" title={item.name}>
                            {item.name}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-700">
                          {formatRupiahShort(item.budgetAnnual)}
                        </td>
                        {Array(12).fill(0).map((_, m) => {
                          const val = item.realizationMonthly?.[m] || 0;
                          return (
                            <td key={m} className={`py-2 px-2 text-right font-mono text-[10px] ${
                              m === focusMonth ? 'bg-blue-50 font-bold text-blue-900' : val > 0 ? 'text-slate-800 font-semibold' : 'text-slate-400'
                            }`}>
                              {val === 0 ? '-' : formatRupiahShort(val)}
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/40">
                          {formatRupiahShort(totalReal)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            percent > 100 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {formatPercent(percent, 0)}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center sticky right-0 bg-white">
                          <button
                            type="button"
                            onClick={() => handleOpen12MModal(item)}
                            title="Edit nilai 12 bulan akun ini"
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: FORM ENTRI TRANSAKSI SATUAN */}
      {/* ========================================================================= */}
      {activeMode === 'single_entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form Box */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Entri Transaksi / Pengeluaran Realisasi</h3>
                <p className="text-xs text-slate-500">Catat pengeluaran kas atau SPJ ke akun anggaran secara presisi</p>
              </div>
            </div>

            {entrySuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{entrySuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSingleEntry} className="space-y-4 text-xs">
              {/* Account Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Pilih Akun Anggaran (Kode GL / Uraian): <span className="text-rose-500">*</span>
                </label>
                <select
                  value={entryAccountId}
                  onChange={(e) => setEntryAccountId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
                >
                  <option value="">-- Pilih Akun GL Anggaran --</option>
                  {nonHeaderAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      [{acc.code}] {acc.name} — Pagu: {formatRupiahShort(acc.budgetAnnual)} ({acc.posType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Selector & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Bulan Realisasi: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={entryMonth}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setEntryMonth(m);
                      setSelectedMonth(m);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={idx} value={idx}>
                        {m} {selectedYear}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Nominal Realisasi (Rp): <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. 15.000.000"
                      value={entryAmountStr}
                      onChange={(e) => setEntryAmountStr(e.target.value)}
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Entry Mode: Add or Replace */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Metode Pembaruan Nilai:</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    entryMode === 'replace' ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="entryMode"
                      checked={entryMode === 'replace'}
                      onChange={() => setEntryMode('replace')}
                      className="text-blue-600"
                    />
                    <div>
                      <span className="block text-xs">Gantikan Nilai Bulan Ini</span>
                      <span className="block text-[10px] text-slate-500 font-normal">Menimpa total realisasi bulan terpilih</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    entryMode === 'add' ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="entryMode"
                      checked={entryMode === 'add'}
                      onChange={() => setEntryMode('add')}
                      className="text-blue-600"
                    />
                    <div>
                      <span className="block text-xs">Tambahkan ke Nilai Eksisting</span>
                      <span className="block text-[10px] text-slate-500 font-normal">Akumulasi pengeluaran tambahan</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Note / SPJ Number */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Keterangan / No. SPJ / Referensi Transaksi (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. SPJ No. 042/BBN/VIII/2026 - Pembelian Material Pemeliharaan"
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEntryAmountStr('');
                    setEntryNote('');
                  }}
                  className="px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Reset Form
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Transaksi Realisasi</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Info Box */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Pratinjau Akun Terpilih</span>
            </h4>

            {entryAccountId ? (() => {
              const acc = budgetItems.find(i => i.id === entryAccountId);
              if (!acc) return null;
              const currentMonthReal = acc.realizationMonthly?.[entryMonth] || 0;
              const parsedInput = parseNumberString(entryAmountStr);
              const projectedMonthReal = entryMode === 'add' ? currentMonthReal + parsedInput : parsedInput;
              let currentYTD = 0;
              for (let m = 0; m <= entryMonth; m++) currentYTD += (acc.realizationMonthly?.[m] || 0);
              const projectedYTD = entryMode === 'add' ? currentYTD + parsedInput : currentYTD - currentMonthReal + parsedInput;
              const projectedRemaining = acc.budgetAnnual - projectedYTD;
              const projectedAbsorption = acc.budgetAnnual > 0 ? (projectedYTD / acc.budgetAnnual) * 100 : 0;

              return (
                <div className="space-y-3 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-slate-400 text-[10px] font-mono">{acc.code}</span>
                    <span className="font-bold text-slate-900 block">{acc.name}</span>
                    <span className="text-[11px] text-slate-500 block">{acc.pos}</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pagu Tahunan:</span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(acc.budgetAnnual)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Realisasi Eksisting {MONTH_SHORT_NAMES[entryMonth]}:</span>
                      <span className="font-mono font-semibold text-slate-700">{formatRupiah(currentMonthReal)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100">
                      <span className="text-blue-700 font-semibold">Proyeksi Realisasi {MONTH_SHORT_NAMES[entryMonth]}:</span>
                      <span className="font-mono font-bold text-blue-700">{formatRupiah(projectedMonthReal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700 font-semibold">Proyeksi Serapan YTD:</span>
                      <span className="font-mono font-bold text-emerald-700">{formatPercent(projectedAbsorption, 1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Proyeksi Sisa Pagu:</span>
                      <span className={`font-mono font-bold ${projectedRemaining < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {formatRupiah(projectedRemaining)}
                      </span>
                    </div>
                  </div>

                  {projectedRemaining < 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>
                        Peringatan: Proyeksi realisasi melebihi pagu tahunan sebesar <strong>{formatRupiah(Math.abs(projectedRemaining))}</strong>.
                      </span>
                    </div>
                  )}
                </div>
              );
            })() : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Pilih akun di sebelah kiri untuk melihat rincian pagu dan proyeksi serapan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT REALISASI 12 BULAN AKUN TERTENTU */}
      {/* ========================================================================= */}
      {editingItem12M && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <TableProperties className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Realisasi 12 Bulan: {editingItem12M.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Kode GL: {editingItem12M.code} | Kelompok: {editingItem12M.posType}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem12M(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / 12-Month Inputs */}
            <div className="flex-1 overflow-y-auto py-5 space-y-5 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-slate-500 text-[11px] block">Pagu Anggaran Tahunan</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{formatRupiah(editingItem12M.budgetAnnual)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Total Realisasi 12 Bulan</span>
                  <span className="text-sm font-bold font-mono text-blue-700">
                    {formatRupiah(modal12MValues.reduce((a, b) => a + b, 0))}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Persentase Serapan</span>
                  <span className="text-sm font-bold text-emerald-700">
                    {formatPercent(editingItem12M.budgetAnnual > 0 ? (modal12MValues.reduce((a, b) => a + b, 0) / editingItem12M.budgetAnnual) * 100 : 0, 1)}
                  </span>
                </div>
              </div>

              {/* 12 Month Grid inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {MONTH_NAMES.map((mName, mIdx) => (
                  <div key={mIdx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-700">{mName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Target: {formatRupiahShort(editingItem12M.budgetMonthly?.[mIdx] || 0)}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={modal12MValues[mIdx] === 0 ? '' : modal12MValues[mIdx].toString()}
                        onChange={(e) => {
                          const val = parseNumberString(e.target.value);
                          setModal12MValues(prev => {
                            const next = [...prev];
                            next[mIdx] = val;
                            return next;
                          });
                        }}
                        placeholder="0"
                        className="w-full pl-7 pr-2.5 py-1.5 text-right font-mono font-bold text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setModal12MValues(Array(12).fill(0))}
                className="px-3.5 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
              >
                Reset Semua ke Rp 0
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem12M(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave12MModal}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI RESET REALISASI BULAN TERPILIH */}
      {/* ========================================================================= */}
      {isResetMonthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kosongkan Realisasi {MONTH_NAMES[focusMonth]}
                </h3>
                <p className="text-xs text-slate-500">Konfirmasi reset data realisasi bulanan</p>
              </div>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2 mb-5">
              <p className="font-semibold">
                Apakah Anda yakin ingin mengosongkan seluruh nilai realisasi untuk bulan <strong>{MONTH_NAMES[focusMonth]} {selectedYear}</strong>?
              </p>
              <p className="text-[11px] text-rose-700">
                Nilai realisasi pada seluruh {nonHeaderAccounts.length} akun anggaran untuk bulan ini akan diatur kembali menjadi <strong>Rp 0</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsResetMonthModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetFocusMonth}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ya, Kosongkan Nilai</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
