import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Briefcase, 
  Wrench, 
  Building, 
  Car,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  FileCheck,
  FileText,
  Clock,
  CheckCircle2,
  Info,
  Calendar,
  Layers,
  Search,
  FolderTree,
  Table as TableIcon,
  ChevronDown,
  ChevronRight,
  Hash,
  Tag,
  SlidersHorizontal
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdditionalTransaction, PosType } from '../types';
import { 
  formatRupiah, 
  formatRupiahShort, 
  formatPercent, 
  MONTH_NAMES, 
  MONTH_SHORT_NAMES 
} from '../utils/formatters';

export const PrognosaView: React.FC = () => {
  const { 
    budgetItems, 
    additionalTransactions, 
    addAdditionalTransaction, 
    updateAdditionalTransaction, 
    deleteAdditionalTransaction,
    selectedYear, 
    selectedMonth,
    setSelectedMonth 
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdditionalTransaction | null>(null);
  const [filterPos, setFilterPos] = useState<string>('ALL');
  const [filterDocStatus, setFilterDocStatus] = useState<'ALL' | 'OPEN' | 'DOCUMENTED'>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>('CURRENT'); // 'CURRENT' | 'ALL' | '0'..'11'
  const [filterGlAccount, setFilterGlAccount] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'GROUPED' | 'FLAT'>('GROUPED');
  const [collapsedPos, setCollapsedPos] = useState<Record<string, boolean>>({});

  // Helper: check if a transaction has a non-empty document number
  const hasDocNumber = (t: AdditionalTransaction) => {
    return Boolean(t.documentNumber && t.documentNumber.trim().length > 0);
  };

  // Map of GL Accounts extracted from budgetItems grouped by POS
  const glAccountsByPos = useMemo(() => {
    const map: Record<string, Array<{ code: string; name: string; posType: PosType }>> = {
      'Pos 53': [],
      'Pos 54': [],
      'Beban Sewa': [],
      'Pos 52': [],
      'Pos 72': []
    };

    budgetItems.forEach(item => {
      if (!item.isGroupHeader && item.code && !item.code.startsWith('CODE_')) {
        const posKey = item.posType === 'Sewa Non AHG' ? 'Beban Sewa' : item.posType;
        if (!map[posKey]) map[posKey] = [];
        if (!map[posKey].some(g => g.code === item.code)) {
          map[posKey].push({
            code: item.code,
            name: item.name,
            posType: posKey as PosType
          });
        }
      }
    });

    return map;
  }, [budgetItems]);

  // Master lookup for GL Code -> Name
  const glAccountLookup = useMemo(() => {
    const map: Record<string, string> = {};
    budgetItems.forEach(item => {
      if (item.code && item.name && !item.code.startsWith('CODE_')) {
        map[item.code] = item.name;
      }
    });
    return map;
  }, [budgetItems]);

  // All unique GL Accounts present in additionalTransactions
  const availableGlAccountsInTransactions = useMemo(() => {
    const list: Array<{ code: string; name: string }> = [];
    additionalTransactions.forEach(t => {
      if (t.glAccount && !list.some(l => l.code === t.glAccount)) {
        list.push({
          code: t.glAccount,
          name: t.glAccountName || glAccountLookup[t.glAccount] || t.glAccount
        });
      }
    });
    return list.sort((a, b) => a.code.localeCompare(b.code));
  }, [additionalTransactions, glAccountLookup]);

  const [formData, setFormData] = useState<{
    name: string;
    posType: PosType;
    glAccount: string;
    glAccountName: string;
    category: string;
    amount: number;
    month: number;
    documentNumber: string;
    notes: string;
    isCustomGl: boolean;
  }>({
    name: '',
    posType: 'Pos 53',
    glAccount: '6106200700',
    glAccountName: 'Beban jasa borong Gardu Induk',
    category: 'PEKERJAAN ALIH DAYA',
    amount: 50000000,
    month: selectedMonth,
    documentNumber: '',
    notes: '',
    isCustomGl: false
  });

  // Calculate Prognosa figures
  const prognosaSummary = useMemo(() => {
    const nonHeaders = budgetItems.filter(i => !i.isGroupHeader);

    let totalPaguAnnual = 0;
    let totalTargetMTD = 0;
    let totalRealMTD = 0;
    let remainingBudgetMonthly = 0;

    // Sum realization up to selected month, plus remaining budget for future months
    nonHeaders.forEach(item => {
      totalPaguAnnual += item.budgetAnnual || 0;
      for (let m = 0; m <= selectedMonth; m++) {
        totalTargetMTD += (item.budgetMonthly?.[m] || 0);
        totalRealMTD += (item.realizationMonthly?.[m] || 0);
      }
      for (let m = selectedMonth + 1; m < 12; m++) {
        remainingBudgetMonthly += (item.budgetMonthly?.[m] || 0);
      }
    });

    // Active transactions (all active)
    const activeTransactions = additionalTransactions.filter(t => t.isActive);

    // EXCLUDE commitments that already have a document number (SPJ / Dokumen Realisasi)
    // OPEN commitments = Active AND no document number (belum terbit SPJ / belum dibukukan)
    const openCommitments = activeTransactions.filter(t => !hasDocNumber(t));
    const documentedCommitments = activeTransactions.filter(t => hasDocNumber(t));

    // Open commitments specifically for the current running month / period
    const openCommitmentsCurrentMonth = openCommitments.filter(t => 
      t.month === undefined || t.month === selectedMonth
    );

    const totalOpenCommitmentsCurrentMonth = openCommitmentsCurrentMonth.reduce((s, t) => s + (t.amount || 0), 0);
    const totalOpenCommitmentsAll = openCommitments.reduce((s, t) => s + (t.amount || 0), 0);
    const totalDocumentedCommitments = documentedCommitments.reduce((s, t) => s + (t.amount || 0), 0);

    // 1. Prognosa Periode Berjalan (s.d. Bulan Berjalan) = Realisasi SAP s/d Bulan Berjalan + Komitmen Terbuka Periode Berjalan
    const prognosaCurrentMonth = totalRealMTD + totalOpenCommitmentsCurrentMonth;
    const deviasiCurrentMonthVsTarget = totalTargetMTD - prognosaCurrentMonth;
    const serapanCurrentMonthVsPagu = totalPaguAnnual > 0 ? (prognosaCurrentMonth / totalPaguAnnual) * 100 : 0;
    const serapanCurrentMonthVsTarget = totalTargetMTD > 0 ? (prognosaCurrentMonth / totalTargetMTD) * 100 : 0;

    // 2. Total Prognosa Akhir Tahun = Realisasi SAP s/d Bulan Berjalan + Seluruh Komitmen Terbuka + Estimasi Rencana Sisa Bulan
    const totalPrognosaAnnual = totalRealMTD + totalOpenCommitmentsAll + remainingBudgetMonthly;
    const deviasiVsPagu = totalPaguAnnual - totalPrognosaAnnual;
    const optimasiPct = totalPaguAnnual > 0 ? (totalPrognosaAnnual / totalPaguAnnual) * 100 : 0;

    // Per POS Breakdown
    const posList: PosType[] = ['Pos 53', 'Pos 54', 'Beban Sewa', 'Pos 52', 'Pos 72'];
    const byPos = posList.map(pos => {
      const pItems = nonHeaders.filter(i => i.posType === pos || (pos === 'Beban Sewa' && (i.posType as string) === 'Sewa Non AHG'));
      let pAnnual = 0;
      let pTargetMTD = 0;
      let pRealMTD = 0;
      let pEstFuture = 0;

      pItems.forEach(i => {
        pAnnual += i.budgetAnnual || 0;
        for (let m = 0; m <= selectedMonth; m++) {
          pTargetMTD += (i.budgetMonthly?.[m] || 0);
          pRealMTD += (i.realizationMonthly?.[m] || 0);
        }
        for (let m = selectedMonth + 1; m < 12; m++) {
          pEstFuture += (i.budgetMonthly?.[m] || 0);
        }
      });

      // Filter POS open commitments (active and no doc number)
      const pOpenCurrentMonth = openCommitmentsCurrentMonth
        .filter(t => t.posType === pos || (pos === 'Beban Sewa' && (t.posType as string) === 'Sewa Non AHG'))
        .reduce((s, t) => s + (t.amount || 0), 0);

      const pOpenAll = openCommitments
        .filter(t => t.posType === pos || (pos === 'Beban Sewa' && (t.posType as string) === 'Sewa Non AHG'))
        .reduce((s, t) => s + (t.amount || 0), 0);

      const pDocumented = documentedCommitments
        .filter(t => t.posType === pos || (pos === 'Beban Sewa' && (t.posType as string) === 'Sewa Non AHG'))
        .reduce((s, t) => s + (t.amount || 0), 0);

      const pProgCurrentMonth = pRealMTD + pOpenCurrentMonth;
      const pProgAnnual = pRealMTD + pOpenAll + pEstFuture;
      const pDevAnnual = pAnnual - pProgAnnual;

      return {
        pos,
        annual: pAnnual,
        targetMTD: pTargetMTD,
        realMTD: pRealMTD,
        openCommitmentCurrentMonth: pOpenCurrentMonth,
        openCommitmentAll: pOpenAll,
        documentedCommitment: pDocumented,
        future: pEstFuture,
        progCurrentMonth: pProgCurrentMonth,
        prognosaAnnual: pProgAnnual,
        deviasi: pDevAnnual,
        percentageAnnual: pAnnual > 0 ? (pProgAnnual / pAnnual) * 100 : 0,
        percentageCurrentMonth: pTargetMTD > 0 ? (pProgCurrentMonth / pTargetMTD) * 100 : 0
      };
    });

    return {
      totalPaguAnnual,
      totalTargetMTD,
      totalRealMTD,
      totalOpenCommitmentsCurrentMonth,
      totalOpenCommitmentsAll,
      totalDocumentedCommitments,
      remainingBudgetMonthly,
      prognosaCurrentMonth,
      deviasiCurrentMonthVsTarget,
      serapanCurrentMonthVsPagu,
      serapanCurrentMonthVsTarget,
      totalPrognosaAnnual,
      deviasiVsPagu,
      optimasiPct,
      openCommitmentsCount: openCommitments.length,
      openCommitmentsCurrentMonthCount: openCommitmentsCurrentMonth.length,
      documentedCommitmentsCount: documentedCommitments.length,
      byPos
    };
  }, [budgetItems, additionalTransactions, selectedMonth]);

  // Filtered transactions for the list
  const filteredTransactions = useMemo(() => {
    return additionalTransactions.filter(t => {
      // 1. POS Filter
      if (filterPos !== 'ALL' && t.posType !== filterPos) {
        if (!(filterPos === 'Beban Sewa' && (t.posType as string) === 'Sewa Non AHG')) {
          return false;
        }
      }

      // 2. Document Status Filter
      if (filterDocStatus === 'OPEN' && hasDocNumber(t)) return false;
      if (filterDocStatus === 'DOCUMENTED' && !hasDocNumber(t)) return false;

      // 3. Month Filter
      if (filterMonth === 'CURRENT') {
        const itemMonth = t.month !== undefined ? t.month : selectedMonth;
        if (itemMonth !== selectedMonth) return false;
      } else if (filterMonth !== 'ALL') {
        const targetM = Number(filterMonth);
        const itemMonth = t.month !== undefined ? t.month : selectedMonth;
        if (itemMonth !== targetM) return false;
      }

      // 4. GL Account Filter
      if (filterGlAccount !== 'ALL') {
        if (t.glAccount !== filterGlAccount) return false;
      }

      // 5. Search Query Filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchName = (t.name || '').toLowerCase().includes(q);
        const matchGlCode = (t.glAccount || '').toLowerCase().includes(q);
        const matchGlName = (t.glAccountName || '').toLowerCase().includes(q);
        const matchDoc = (t.documentNumber || '').toLowerCase().includes(q);
        const matchNote = (t.notes || t.note || '').toLowerCase().includes(q);
        const matchCat = (t.category || '').toLowerCase().includes(q);

        if (!matchName && !matchGlCode && !matchGlName && !matchDoc && !matchNote && !matchCat) {
          return false;
        }
      }

      return true;
    });
  }, [additionalTransactions, filterPos, filterDocStatus, filterMonth, filterGlAccount, searchQuery, selectedMonth]);

  // Group transactions by POS, and then by GL Account
  const groupedTransactionsByPosAndGl = useMemo(() => {
    const posList: PosType[] = ['Pos 53', 'Pos 54', 'Beban Sewa', 'Pos 52', 'Pos 72'];
    
    return posList.map(pos => {
      const posTx = filteredTransactions.filter(t => 
        t.posType === pos || (pos === 'Beban Sewa' && (t.posType as string) === 'Sewa Non AHG')
      );

      if (posTx.length === 0 && filterPos !== 'ALL' && filterPos !== pos) {
        return null;
      }

      // Group by GL Account
      const glMap: Record<string, {
        glAccount: string;
        glAccountName: string;
        items: AdditionalTransaction[];
        totalOpen: number;
        totalDocumented: number;
        totalAmount: number;
      }> = {};

      posTx.forEach(t => {
        const glKey = t.glAccount || 'TANPA_GL';
        if (!glMap[glKey]) {
          const glName = t.glAccountName || (t.glAccount ? glAccountLookup[t.glAccount] : 'Tanpa Akun GL') || 'Akun GL Khusus';
          glMap[glKey] = {
            glAccount: t.glAccount || '-',
            glAccountName: glName,
            items: [],
            totalOpen: 0,
            totalDocumented: 0,
            totalAmount: 0
          };
        }

        glMap[glKey].items.push(t);
        glMap[glKey].totalAmount += (t.amount || 0);
        if (t.isActive) {
          if (hasDocNumber(t)) {
            glMap[glKey].totalDocumented += (t.amount || 0);
          } else {
            glMap[glKey].totalOpen += (t.amount || 0);
          }
        }
      });

      const glGroups = Object.values(glMap).sort((a, b) => a.glAccount.localeCompare(b.glAccount));
      const posSummaryItem = prognosaSummary.byPos.find(p => p.pos === pos);

      const totalPosOpen = posTx
        .filter(t => t.isActive && !hasDocNumber(t))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalPosDocumented = posTx
        .filter(t => t.isActive && hasDocNumber(t))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalPosNominal = posTx.reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        pos,
        glGroups,
        itemCount: posTx.length,
        totalPosOpen,
        totalPosDocumented,
        totalPosNominal,
        posSummaryItem
      };
    }).filter(Boolean) as Array<{
      pos: PosType;
      glGroups: Array<{
        glAccount: string;
        glAccountName: string;
        items: AdditionalTransaction[];
        totalOpen: number;
        totalDocumented: number;
        totalAmount: number;
      }>;
      itemCount: number;
      totalPosOpen: number;
      totalPosDocumented: number;
      totalPosNominal: number;
      posSummaryItem?: any;
    }>;
  }, [filteredTransactions, filterPos, glAccountLookup, prognosaSummary.byPos]);

  const togglePosCollapse = (pos: string) => {
    setCollapsedPos(prev => ({ ...prev, [pos]: !prev[pos] }));
  };

  const handleOpenAddForGl = (pos: PosType, glCode: string, glName: string) => {
    setFormData({
      name: '',
      posType: pos,
      glAccount: glCode !== '-' ? glCode : '',
      glAccountName: glName !== 'Tanpa Akun GL' ? glName : '',
      category: pos === 'Pos 53' ? 'PEKERJAAN ALIH DAYA' : pos === 'Beban Sewa' ? 'SEWA NON AHG' : 'RINCIAN PEKERJAAN',
      amount: 25000000,
      month: selectedMonth,
      documentNumber: '',
      notes: '',
      isCustomGl: glCode === '-'
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addAdditionalTransaction({
      name: formData.name.trim(),
      posType: formData.posType,
      posName: formData.posType === 'Beban Sewa' ? 'Beban Sewa' : `${formData.posType}`,
      glAccount: formData.glAccount.trim(),
      glAccountName: formData.glAccountName.trim() || glAccountLookup[formData.glAccount.trim()] || formData.glAccount.trim(),
      category: formData.category,
      amount: formData.amount,
      month: formData.month,
      year: selectedYear,
      documentNumber: formData.documentNumber.trim(),
      notes: formData.notes,
      isActive: true
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const glAcc = (editingItem.glAccount || '').trim();
    const glAccName = (editingItem.glAccountName || '').trim() || glAccountLookup[glAcc] || glAcc;

    updateAdditionalTransaction(editingItem.id, {
      ...editingItem,
      glAccount: glAcc,
      glAccountName: glAccName,
      documentNumber: (editingItem.documentNumber || '').trim()
    });
    setEditingItem(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Prognosa Realisasi & Komitmen Transaksi</h1>
            <p className="text-xs text-slate-500">
              Perhitungan estimasi penyerapan anggaran periode berjalan dan akhir tahun dengan pengecualian transaksi yang sudah terbit nomor dokumen/SPJ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* Periode Berjalan Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-slate-600 font-semibold">Periode Berjalan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>{name}</option>
              ))}
            </select>
          </div>

          <button type="button"
            onClick={() => {
              setFormData({
                name: '',
                posType: 'Pos 53',
                category: 'Tenaga Alih Daya',
                amount: 50000000,
                month: selectedMonth,
                documentNumber: '',
                notes: ''
              });
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Komitmen</span>
          </button>
        </div>
      </div>

      {/* Info Banner: Penjelasan Aturan Pengecualian Dokumen */}
      <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900 shadow-xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-blue-950 block">Ketentuan Perhitungan Nilai Prognosa:</span>
          <p className="text-blue-800/90 leading-relaxed">
            • <strong>Komitmen Terbuka</strong> (belum terbit nomor dokumen) dijumlahkan dengan Realisasi SAP untuk membentuk <strong>Prognosa Periode Berjalan</strong> (s/d {MONTH_NAMES[selectedMonth]}).<br />
            • Komitmen yang <strong>sudah diisi Nomor Dokumen / SPJ</strong> otomatis <strong>dikecualikan dari perhitungan</strong> karena nilainya diasumsikan telah masuk ke dalam Realisasi SAP pembukuan (mencegah double-counting).
          </p>
        </div>
      </div>

      {/* Prognosa KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Realisasi SAP */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Realisasi SAP s/d {MONTH_SHORT_NAMES[selectedMonth]}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              SAP Real
            </span>
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-2 font-mono">
            {formatRupiahShort(prognosaSummary.totalRealMTD)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block font-mono">
            {formatRupiah(prognosaSummary.totalRealMTD)}
          </span>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Target s/d {MONTH_SHORT_NAMES[selectedMonth]}:</span>
            <span className="font-semibold font-mono text-slate-700">{formatRupiahShort(prognosaSummary.totalTargetMTD)}</span>
          </div>
        </div>

        {/* Card 2: Komitmen Terbuka Periode Berjalan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Komitmen Terbuka ({MONTH_SHORT_NAMES[selectedMonth]})</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
              prognosaSummary.totalOpenCommitmentsCurrentMonth < 0
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {prognosaSummary.openCommitmentsCurrentMonthCount} Item
            </span>
          </div>
          <div className={`text-2xl font-extrabold mt-2 font-mono ${
            prognosaSummary.totalOpenCommitmentsCurrentMonth < 0 ? 'text-rose-600' : 'text-amber-600'
          }`}>
            {prognosaSummary.totalOpenCommitmentsCurrentMonth > 0 ? '+' : ''}{formatRupiahShort(prognosaSummary.totalOpenCommitmentsCurrentMonth)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block font-mono">
            {formatRupiah(prognosaSummary.totalOpenCommitmentsCurrentMonth)}
          </span>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span title="Komitmen yang sudah memiliki nomor dokumen">Dikecualikan (Ada Dok):</span>
            <span className="font-semibold font-mono text-emerald-600">
              {formatRupiahShort(prognosaSummary.totalDocumentedCommitments)} ({prognosaSummary.documentedCommitmentsCount} item)
            </span>
          </div>
        </div>

        {/* Card 3: Prognosa Periode Berjalan */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-xl border border-indigo-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Prognosa Periode Berjalan</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-800/80 text-indigo-200 border border-indigo-700">
              s/d {MONTH_SHORT_NAMES[selectedMonth]}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-indigo-300 mt-2 font-mono">
            {formatRupiahShort(prognosaSummary.prognosaCurrentMonth)}
          </div>
          <span className="text-xs text-indigo-300/80 mt-1 block font-mono">
            {formatRupiah(prognosaSummary.prognosaCurrentMonth)}
          </span>
          <div className="text-[11px] text-indigo-200/80 mt-2 pt-2 border-t border-indigo-800/80 flex items-center justify-between">
            <span>% thd Target s/d Bln:</span>
            <span className="font-bold text-white font-mono">
              {formatPercent(prognosaSummary.serapanCurrentMonthVsTarget, 1)}
            </span>
          </div>
        </div>

        {/* Card 4: Estimasi Prognosa Akhir Tahun */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prognosa Akhir Tahun ({selectedYear})</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              prognosaSummary.optimasiPct <= 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {formatPercent(prognosaSummary.optimasiPct, 1)} Pagu
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {formatRupiahShort(prognosaSummary.totalPrognosaAnnual)}
          </div>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
            <span className="text-slate-500">Estimasi Sisa Pagu:</span>
            <span className={`font-bold font-mono ${prognosaSummary.deviasiVsPagu >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatRupiahShort(prognosaSummary.deviasiVsPagu)}
            </span>
          </div>
        </div>
      </div>

      {/* POS Prognosa Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Rincian Prognosa Realisasi per Kelompok POS</h3>
            <p className="text-xs text-slate-500">
              Kalkulasi: Realisasi SAP s/d {MONTH_NAMES[selectedMonth]} + Komitmen Terbuka Periode Berjalan (Tanpa No. Dokumen)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 font-mono">
            <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4 font-sans">Kelompok POS</th>
                <th className="py-3 px-4 text-right">Pagu 1 Tahun</th>
                <th className="py-3 px-4 text-right">Target s/d {MONTH_SHORT_NAMES[selectedMonth]}</th>
                <th className="py-3 px-4 text-right text-blue-300">Real SAP s/d {MONTH_SHORT_NAMES[selectedMonth]}</th>
                <th className="py-3 px-4 text-right text-amber-300">Komitmen Terbuka ({MONTH_SHORT_NAMES[selectedMonth]})</th>
                <th className="py-3 px-4 text-right bg-indigo-950 text-indigo-200 border-x border-indigo-800">
                  Prognosa Periode Berjalan
                </th>
                <th className="py-3 px-4 text-right text-slate-300">Est. Sisa Bln</th>
                <th className="py-3 px-4 text-right bg-slate-800 text-white">Prognosa Akhir Thn</th>
                <th className="py-3 px-4 text-right text-emerald-300">Sisa Pagu</th>
                <th className="py-3 px-4 text-center font-sans">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prognosaSummary.byPos.map((pos) => (
                <tr key={pos.pos} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900 font-sans">{pos.pos}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatRupiah(pos.annual)}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(pos.targetMTD)}</td>
                  <td className="py-3 px-4 text-right text-blue-600 font-semibold">{formatRupiah(pos.realMTD)}</td>
                  <td className={`py-3 px-4 text-right font-bold ${
                    pos.openCommitmentCurrentMonth < 0 
                      ? 'text-rose-600' 
                      : pos.openCommitmentCurrentMonth > 0 
                      ? 'text-amber-600' 
                      : 'text-slate-400'
                  }`}>
                    {pos.openCommitmentCurrentMonth > 0
                      ? `+${formatRupiah(pos.openCommitmentCurrentMonth)}`
                      : pos.openCommitmentCurrentMonth < 0
                      ? formatRupiah(pos.openCommitmentCurrentMonth)
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-indigo-900 bg-indigo-50/50 border-x border-indigo-100">
                    {formatRupiah(pos.progCurrentMonth)}
                    <span className="block text-[10px] text-indigo-600 font-normal font-sans">
                      {formatPercent(pos.percentageCurrentMonth, 1)} vs Target
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">{formatRupiah(pos.future)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 bg-slate-50">{formatRupiah(pos.prognosaAnnual)}</td>
                  <td className={`py-3 px-4 text-right font-bold ${pos.deviasi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatRupiah(pos.deviasi)}
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      pos.percentageAnnual <= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {formatPercent(pos.percentageAnnual, 1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 font-mono text-xs">
              <tr>
                <td className="py-3 px-4 font-sans uppercase">TOTAL KESELURUHAN</td>
                <td className="py-3 px-4 text-right">{formatRupiah(prognosaSummary.totalPaguAnnual)}</td>
                <td className="py-3 px-4 text-right text-slate-700">{formatRupiah(prognosaSummary.totalTargetMTD)}</td>
                <td className="py-3 px-4 text-right text-blue-700">{formatRupiah(prognosaSummary.totalRealMTD)}</td>
                <td className={`py-3 px-4 text-right font-bold ${
                  prognosaSummary.totalOpenCommitmentsCurrentMonth < 0 ? 'text-rose-700' : 'text-amber-700'
                }`}>
                  {prognosaSummary.totalOpenCommitmentsCurrentMonth > 0 ? '+' : ''}{formatRupiah(prognosaSummary.totalOpenCommitmentsCurrentMonth)}
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-indigo-900 bg-indigo-100/60 border-x border-indigo-200">
                  {formatRupiah(prognosaSummary.prognosaCurrentMonth)}
                </td>
                <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(prognosaSummary.remainingBudgetMonthly)}</td>
                <td className="py-3 px-4 text-right text-slate-900">{formatRupiah(prognosaSummary.totalPrognosaAnnual)}</td>
                <td className={`py-3 px-4 text-right ${prognosaSummary.deviasiVsPagu >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatRupiah(prognosaSummary.deviasiVsPagu)}
                </td>
                <td className="py-3 px-4 text-center font-sans text-xs">
                  {formatPercent(prognosaSummary.optimasiPct, 1)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* List of Additional Transactions / Commitments */}
      <div className="space-y-4">
        {/* Header & Main Control Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Daftar Komitmen Tambahan Transaksi & Alih Daya</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {filteredTransactions.length} Transaksi
                </span>
                {filterGlAccount !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 font-mono">
                    GL: {filterGlAccount}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar komitmen dikelompokkan berdasarkan <strong>Kelompok POS & Akun GL (GL Account)</strong>. Isikan <strong>Nomor Dokumen</strong> saat SPJ/SAP terbit untuk mengecualikan dari prognosa.
              </p>
            </div>

            {/* View Mode Switcher & Add Button */}
            <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
              <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('GROUPED')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                    viewMode === 'GROUPED'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tampilan Dikelompokkan per POS dan Akun GL"
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Grup POS & GL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('FLAT')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                    viewMode === 'FLAT'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tampilan Tabel Lengkap Semua Transaksi"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tabel Terpadu</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: '',
                    posType: 'Pos 53',
                    glAccount: '6106200700',
                    glAccountName: 'Beban jasa borong Gardu Induk',
                    category: 'PEKERJAAN ALIH DAYA',
                    amount: 50000000,
                    month: selectedMonth,
                    documentNumber: '',
                    notes: '',
                    isCustomGl: false
                  });
                  setIsAddModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Komitmen</span>
              </button>
            </div>
          </div>

          {/* Filter and Search Toolbar */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Cari transaksi, Akun GL, No. Dokumen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Bulan */}
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 shadow-2xs">
                <span className="text-slate-500 font-medium">Bulan:</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="CURRENT">Bln Berjalan ({MONTH_NAMES[selectedMonth]})</option>
                  <option value="ALL">Semua Bulan</option>
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx.toString()}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Filter Status Dokumen */}
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 shadow-2xs">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={filterDocStatus}
                  onChange={(e) => setFilterDocStatus(e.target.value as any)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="OPEN">Komitmen Terbuka (Dihitung)</option>
                  <option value="DOCUMENTED">Ada No. Dokumen (Dikecualikan)</option>
                </select>
              </div>

              {/* Filter Akun GL Dropdown */}
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 shadow-2xs max-w-[220px]">
                <span className="text-slate-500 font-medium">GL:</span>
                <select
                  value={filterGlAccount}
                  onChange={(e) => setFilterGlAccount(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer truncate"
                >
                  <option value="ALL">Semua Akun GL</option>
                  {availableGlAccountsInTransactions.map(gl => (
                    <option key={gl.code} value={gl.code}>
                      {gl.code} - {gl.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter POS Pill buttons */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {['ALL', 'Pos 53', 'Pos 54', 'Beban Sewa', 'Pos 52', 'Pos 72'].map(p => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setFilterPos(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      filterPos === p
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p === 'ALL' ? 'Semua POS' : p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* VIEW 1: GROUPED BY POS & GL ACCOUNT (Default) */}
        {viewMode === 'GROUPED' && (
          <div className="space-y-6">
            {groupedTransactionsByPosAndGl.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-sm text-slate-600">Tidak ada komitmen yang sesuai dengan filter.</p>
                <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter bulan, status dokumen, atau pencarian.</p>
              </div>
            ) : (
              groupedTransactionsByPosAndGl.map(posGroup => {
                const isCollapsed = collapsedPos[posGroup.pos];

                return (
                  <div key={posGroup.pos} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                    {/* POS Card Header */}
                    <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => togglePosCollapse(posGroup.pos)}
                          className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                          title={isCollapsed ? 'Buka kelompok POS' : 'Tutup kelompok POS'}
                        >
                          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-slate-900 text-white font-mono">
                              {posGroup.pos}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900">
                              {posGroup.pos === 'Pos 53' ? 'Beban Pemeliharaan' : posGroup.pos === 'Pos 54' ? 'Biaya Administrasi & Umum' : posGroup.pos === 'Beban Sewa' ? 'Beban Sewa Kendaraan & IT' : posGroup.pos === 'Pos 52' ? 'Beban Kepegawaian' : 'Beban Pensiun & THT'}
                            </h4>
                            <span className="text-xs text-slate-500 font-medium">
                              ({posGroup.glGroups.length} Akun GL • {posGroup.itemCount} Transaksi)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* POS Summary Badges */}
                      <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                        <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                          <span className="text-slate-400 font-sans mr-1 text-[10px] uppercase font-semibold">Masuk Prognosa:</span>
                          <span className={`font-bold ${posGroup.totalPosOpen < 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                            {posGroup.totalPosOpen > 0 ? '+' : ''}{formatRupiah(posGroup.totalPosOpen)}
                          </span>
                        </div>
                        {posGroup.totalPosDocumented > 0 && (
                          <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            <span className="text-slate-400 font-sans mr-1 text-[10px] uppercase font-semibold">Dikecualikan:</span>
                            <span className="font-semibold text-slate-500 line-through">{formatRupiah(posGroup.totalPosDocumented)}</span>
                          </div>
                        )}
                        <div className="bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                          <span className="text-indigo-600 font-sans mr-1 text-[10px] uppercase font-semibold">Prog Bln:</span>
                          <span className="font-extrabold text-indigo-900">{formatRupiah(posGroup.posSummaryItem?.progCurrentMonth || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Content: Breakdown by GL Account */}
                    {!isCollapsed && (
                      <div className="divide-y divide-slate-200">
                        {posGroup.glGroups.map(glGroup => (
                          <div key={glGroup.glAccount} className="p-4 bg-white space-y-3">
                            {/* GL Account Subheader Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                                  <Hash className="w-3 h-3 text-indigo-600" />
                                  {glGroup.glAccount}
                                </span>
                                <span className="font-bold text-xs text-slate-800">
                                  {glGroup.glAccountName}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                                  {glGroup.items.length} Item
                                </span>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                                <div className="flex items-center gap-2 text-xs font-mono">
                                  <span className={`font-bold px-2 py-0.5 rounded border ${
                                    glGroup.totalOpen < 0 
                                      ? 'text-rose-700 bg-rose-50 border-rose-200' 
                                      : 'text-amber-700 bg-amber-50 border-amber-200'
                                  }`}>
                                    Masuk: {glGroup.totalOpen > 0 ? '+' : ''}{formatRupiah(glGroup.totalOpen)}
                                  </span>
                                  {glGroup.totalDocumented > 0 && (
                                    <span className="text-slate-500 line-through bg-slate-100 px-2 py-0.5 rounded border border-slate-200" title="Dikecualikan karena sudah ada dokumen">
                                      Dok: {formatRupiah(glGroup.totalDocumented)}
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddForGl(posGroup.pos, glGroup.glAccount, glGroup.glAccountName)}
                                  className="px-2 py-0.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded flex items-center gap-1 transition-colors"
                                  title={`Tambah komitmen transaksi langsung ke akun GL ${glGroup.glAccount}`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Tambah ke GL Ini</span>
                                </button>
                              </div>
                            </div>

                            {/* Table of items under this GL Account */}
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                              <table className="w-full text-left text-xs text-slate-700">
                                <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                                  <tr>
                                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                                    <th className="py-2.5 px-4 min-w-[200px]">Uraian Transaksi / Pekerjaan</th>
                                    <th className="py-2.5 px-3 w-28 text-center">Bulan</th>
                                    <th className="py-2.5 px-4 min-w-[190px]">Nomor Dokumen / SPJ</th>
                                    <th className="py-2.5 px-4 text-right min-w-[150px]">Nominal (Rp)</th>
                                    <th className="py-2.5 px-4 text-center min-w-[150px]">Status Perhitungan</th>
                                    <th className="py-2.5 px-3 text-center w-16">Aktif</th>
                                    <th className="py-2.5 px-3 text-center w-20">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {glGroup.items.map((t, idx) => {
                                    const hasDoc = hasDocNumber(t);
                                    const isCurrent = (t.month !== undefined ? t.month : selectedMonth) === selectedMonth;

                                    return (
                                      <tr
                                        key={t.id}
                                        className={`hover:bg-slate-50 transition-colors ${
                                          hasDoc ? 'bg-slate-50/50 text-slate-500' : ''
                                        }`}
                                      >
                                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>

                                        {/* Uraian */}
                                        <td className="py-2.5 px-4">
                                          <div className={`font-semibold ${hasDoc ? 'text-slate-700' : 'text-slate-900'}`}>
                                            {t.name}
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            <span className="text-[10px] text-slate-400 font-mono">{t.category}</span>
                                            {(t.notes || t.note) && (
                                              <span className="text-[10px] text-slate-400 font-normal italic">
                                                • {t.notes || t.note}
                                              </span>
                                            )}
                                          </div>
                                        </td>

                                        {/* Bulan */}
                                        <td className="py-2.5 px-3 text-center">
                                          <select
                                            value={t.month !== undefined ? t.month : selectedMonth}
                                            onChange={(e) => updateAdditionalTransaction(t.id, { month: Number(e.target.value) })}
                                            className={`text-xs px-2 py-1 rounded-md border font-medium cursor-pointer ${
                                              isCurrent 
                                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' 
                                                : 'bg-white border-slate-200 text-slate-600'
                                            }`}
                                            title="Ubah alokasi bulan transaksi"
                                          >
                                            {MONTH_NAMES.map((name, mIdx) => (
                                              <option key={name} value={mIdx}>{name}</option>
                                            ))}
                                          </select>
                                        </td>

                                        {/* Nomor Dokumen / SPJ (Inline Edit) */}
                                        <td className="py-2 px-4">
                                          <div className="relative">
                                            <input
                                              type="text"
                                              value={t.documentNumber || ''}
                                              placeholder="Ketik No. Dokumen / SPJ..."
                                              onChange={(e) => {
                                                updateAdditionalTransaction(t.id, { documentNumber: e.target.value });
                                              }}
                                              className={`w-full px-2.5 py-1 text-xs rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                                                hasDoc 
                                                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-mono font-semibold focus:ring-emerald-200' 
                                                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-blue-100 focus:border-blue-500'
                                              }`}
                                              title="Jika terisi nomor dokumen, komitmen otomatis dikecualikan dari perhitungan prognosa tambahan"
                                            />
                                            {hasDoc && (
                                              <button
                                                type="button"
                                                onClick={() => updateAdditionalTransaction(t.id, { documentNumber: '' })}
                                                className="absolute right-1.5 top-1.5 text-slate-400 hover:text-rose-600"
                                                title="Hapus nomor dokumen (masukkan kembali ke komitmen terbuka)"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        </td>

                                        {/* Nominal (Inline Edit) - Support Negative/Minus */}
                                        <td className="py-2 px-4 text-right">
                                          <div className="flex flex-col items-end gap-0.5">
                                            <div className="flex items-center justify-end gap-1">
                                              <span className="text-[10px] text-slate-400 font-semibold">Rp</span>
                                              <input
                                                type="number"
                                                value={t.amount === 0 ? '' : t.amount}
                                                placeholder="0"
                                                onChange={(e) => {
                                                  const val = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                                                  updateAdditionalTransaction(t.id, { amount: val });
                                                }}
                                                className={`w-32 text-right px-2.5 py-1 text-xs font-mono font-bold border rounded-lg focus:outline-none transition-all ${
                                                  hasDoc 
                                                    ? 'bg-slate-100 border-slate-200 text-slate-500 line-through' 
                                                    : t.amount < 0
                                                    ? 'bg-rose-50 border-rose-300 text-rose-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                                                    : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                                }`}
                                                title="Ketik nominal langsung untuk mengubah (bisa nilai minus)"
                                              />
                                            </div>
                                            {t.amount !== 0 && (
                                              <span className={`text-[10px] font-mono ${
                                                hasDoc ? 'text-slate-400 line-through' : t.amount < 0 ? 'text-rose-600 font-semibold' : 'text-slate-500'
                                              }`}>
                                                {formatRupiahShort(t.amount)}
                                              </span>
                                            )}
                                          </div>
                                        </td>

                                        {/* Status Perhitungan */}
                                        <td className="py-2.5 px-4 text-center">
                                          {hasDoc ? (
                                            <div className="inline-flex flex-col items-center">
                                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                                <FileCheck className="w-3 h-3 text-blue-600" />
                                                Dikecualikan
                                              </span>
                                              <span className="text-[9px] text-slate-400 font-sans mt-0.5">
                                                Tercatat di SAP
                                              </span>
                                            </div>
                                          ) : !t.isActive ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                              Nonaktif
                                            </span>
                                          ) : (
                                            <div className="inline-flex flex-col items-center">
                                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                <Clock className="w-3 h-3 text-amber-600" />
                                                Masuk Prognosa
                                              </span>
                                              <span className="text-[9px] text-amber-700 font-sans mt-0.5 font-medium">
                                                {isCurrent ? `Bln ${MONTH_SHORT_NAMES[selectedMonth]}` : `Bln ${MONTH_SHORT_NAMES[t.month || 0]}`}
                                              </span>
                                            </div>
                                          )}
                                        </td>

                                        {/* Status Aktif */}
                                        <td className="py-2.5 px-3 text-center">
                                          <button
                                            type="button"
                                            onClick={() => updateAdditionalTransaction(t.id, { isActive: !t.isActive })}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                              t.isActive 
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                            }`}
                                            title="Klik untuk mengubah status aktif"
                                          >
                                            {t.isActive ? 'Aktif' : 'Off'}
                                          </button>
                                        </td>

                                        {/* Aksi */}
                                        <td className="py-2.5 px-3 text-center">
                                          <div className="flex items-center justify-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => setEditingItem(JSON.parse(JSON.stringify(t)))}
                                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                              title="Edit Detail Komitmen"
                                            >
                                              <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (confirm(`Hapus komitmen "${t.name}"?`)) {
                                                  deleteAdditionalTransaction(t.id);
                                                }
                                              }}
                                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                              title="Hapus Komitmen"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                {/* GL Subtotal */}
                                <tfoot className="bg-slate-50 border-t border-slate-200 text-xs font-mono">
                                  <tr>
                                    <td colSpan={4} className="py-2 px-4 text-right font-sans text-[11px] font-semibold text-slate-600">
                                      Subtotal Akun GL {glGroup.glAccount}:
                                    </td>
                                    <td className={`py-2 px-4 text-right font-bold ${glGroup.totalOpen < 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                                      {glGroup.totalOpen > 0 ? '+' : ''}{formatRupiah(glGroup.totalOpen)}
                                    </td>
                                    <td colSpan={3} className="py-2 px-4 text-slate-500 text-[10px] font-sans">
                                      {glGroup.items.filter(t => t.isActive && !hasDocNumber(t)).length} item terbuka dihitung
                                      {glGroup.totalDocumented > 0 && ` • ${glGroup.items.filter(t => t.isActive && hasDocNumber(t)).length} item dikecualikan`}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* POS Card Total Footer */}
                    <div className="p-3 bg-slate-100/90 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 font-sans uppercase text-[11px]">
                          Total {posGroup.pos}:
                        </span>
                        <span className="text-slate-500 font-sans text-[11px]">
                          ({posGroup.itemCount} total transaksi)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-600">
                          Total Terbuka: <strong className={`font-bold ${posGroup.totalPosOpen < 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                            {posGroup.totalPosOpen > 0 ? '+' : ''}{formatRupiah(posGroup.totalPosOpen)}
                          </strong>
                        </span>
                        {posGroup.totalPosDocumented > 0 && (
                          <span className="text-slate-400 line-through">
                            Dok: {formatRupiah(posGroup.totalPosDocumented)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* VIEW 2: FLAT TABLE VIEW */}
        {viewMode === 'FLAT' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-4 min-w-[200px]">Uraian Transaksi / Alih Daya</th>
                    <th className="py-3 px-3 w-28">Kelompok POS</th>
                    <th className="py-3 px-4 min-w-[180px]">Akun GL (GL Account)</th>
                    <th className="py-3 px-3 w-28 text-center">Bulan</th>
                    <th className="py-3 px-4 min-w-[180px]">Nomor Dokumen / SPJ</th>
                    <th className="py-3 px-4 text-right min-w-[140px]">Nominal (Rp)</th>
                    <th className="py-3 px-4 text-center min-w-[150px]">Status Perhitungan</th>
                    <th className="py-3 px-3 text-center w-16">Aktif</th>
                    <th className="py-3 px-3 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        Tidak ada komitmen transaksi yang sesuai dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t, idx) => {
                      const hasDoc = hasDocNumber(t);
                      const isCurrent = (t.month !== undefined ? t.month : selectedMonth) === selectedMonth;
                      const glName = t.glAccountName || (t.glAccount ? glAccountLookup[t.glAccount] : 'Tanpa Akun GL') || 'Akun GL Khusus';

                      return (
                        <tr 
                          key={t.id} 
                          className={`hover:bg-slate-50 transition-colors ${
                            hasDoc ? 'bg-slate-50/50 text-slate-500' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          
                          {/* Uraian */}
                          <td className="py-3 px-4">
                            <div className={`font-semibold ${hasDoc ? 'text-slate-700' : 'text-slate-900'}`}>
                              {t.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">{t.category}</span>
                              {(t.notes || t.note) && (
                                <span className="text-[10px] text-slate-400 font-normal italic">
                                  • {t.notes || t.note}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* POS */}
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {t.posType}
                            </span>
                          </td>

                          {/* Akun GL */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 self-start">
                                {t.glAccount || '-'}
                              </span>
                              <span className="text-[10px] text-slate-600 font-medium truncate max-w-[170px]" title={glName}>
                                {glName}
                              </span>
                            </div>
                          </td>

                          {/* Bulan */}
                          <td className="py-3 px-3 text-center">
                            <select
                              value={t.month !== undefined ? t.month : selectedMonth}
                              onChange={(e) => updateAdditionalTransaction(t.id, { month: Number(e.target.value) })}
                              className={`text-xs px-2 py-1 rounded-md border font-medium cursor-pointer ${
                                isCurrent 
                                  ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' 
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                              title="Ubah alokasi bulan transaksi"
                            >
                              {MONTH_NAMES.map((name, mIdx) => (
                                <option key={name} value={mIdx}>{name}</option>
                              ))}
                            </select>
                          </td>

                          {/* Nomor Dokumen / SPJ (Inline Edit) */}
                          <td className="py-2 px-4">
                            <div className="relative">
                              <input
                                type="text"
                                value={t.documentNumber || ''}
                                placeholder="Ketik No. Dokumen / SPJ..."
                                onChange={(e) => {
                                  updateAdditionalTransaction(t.id, { documentNumber: e.target.value });
                                }}
                                className={`w-full px-2.5 py-1 text-xs rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                                  hasDoc 
                                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-mono font-semibold focus:ring-emerald-200' 
                                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-blue-100 focus:border-blue-500'
                                }`}
                                title="Jika terisi nomor dokumen, komitmen otomatis dikecualikan dari perhitungan prognosa tambahan"
                              />
                              {hasDoc && (
                                <button
                                  type="button"
                                  onClick={() => updateAdditionalTransaction(t.id, { documentNumber: '' })}
                                  className="absolute right-1.5 top-1.5 text-slate-400 hover:text-rose-600"
                                  title="Hapus nomor dokumen (masukkan kembali ke komitmen terbuka)"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Nominal (Inline Edit) - Support Negative/Minus */}
                          <td className="py-2 px-4 text-right">
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-[10px] text-slate-400 font-semibold">Rp</span>
                                <input
                                  type="number"
                                  value={t.amount === 0 ? '' : t.amount}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                                    updateAdditionalTransaction(t.id, { amount: val });
                                  }}
                                  className={`w-32 text-right px-2.5 py-1 text-xs font-mono font-bold border rounded-lg focus:outline-none transition-all ${
                                    hasDoc 
                                      ? 'bg-slate-100 border-slate-200 text-slate-500 line-through' 
                                      : t.amount < 0
                                      ? 'bg-rose-50 border-rose-300 text-rose-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                  }`}
                                  title="Ketik nominal langsung untuk mengubah (bisa nilai minus)"
                                />
                              </div>
                              {t.amount !== 0 && (
                                <span className={`text-[10px] font-mono ${
                                  hasDoc ? 'text-slate-400 line-through' : t.amount < 0 ? 'text-rose-600 font-semibold' : 'text-slate-500'
                                }`}>
                                  {formatRupiahShort(t.amount)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status Perhitungan */}
                          <td className="py-3 px-4 text-center">
                            {hasDoc ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                  <FileCheck className="w-3 h-3 text-blue-600" />
                                  Dikecualikan
                                </span>
                                <span className="text-[9px] text-slate-400 font-sans mt-0.5">
                                  Tercatat di SAP
                                </span>
                              </div>
                            ) : !t.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                Nonaktif
                              </span>
                            ) : (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Masuk Prognosa
                                </span>
                                <span className="text-[9px] text-amber-700 font-sans mt-0.5 font-medium">
                                  {isCurrent ? `Bln ${MONTH_SHORT_NAMES[selectedMonth]}` : `Bln ${MONTH_SHORT_NAMES[t.month || 0]}`}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Status Aktif */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => updateAdditionalTransaction(t.id, { isActive: !t.isActive })}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                t.isActive 
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                              title="Klik untuk mengubah status aktif"
                            >
                              {t.isActive ? 'Aktif' : 'Off'}
                            </button>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingItem(JSON.parse(JSON.stringify(t)))}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Detail Komitmen"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus tambahan transaksi "${t.name}"?`)) {
                                    deleteAdditionalTransaction(t.id);
                                  }
                                }}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Komitmen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredTransactions.length > 0 && (
                  <tfoot className="bg-slate-100/95 font-bold border-t-2 border-slate-200 text-slate-900 font-mono text-xs">
                    <tr>
                      <td colSpan={6} className="py-3 px-4 text-right font-sans uppercase text-[11px] text-slate-700">
                        Total Komitmen Terbuka Masuk Prognosa:
                      </td>
                      <td className={`py-3 px-4 text-right font-extrabold text-sm ${
                        filteredTransactions.filter(t => t.isActive && !hasDocNumber(t)).reduce((sum, t) => sum + (t.amount || 0), 0) < 0
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}>
                        {formatRupiah(
                          filteredTransactions
                            .filter(t => t.isActive && !hasDocNumber(t))
                            .reduce((sum, t) => sum + (t.amount || 0), 0)
                        )}
                      </td>
                      <td colSpan={3} className="py-3 px-4 text-slate-500 text-[10px] font-sans">
                        {filteredTransactions.filter(t => t.isActive && !hasDocNumber(t)).length} item terbuka dihitung
                      </td>
                    </tr>
                    {filteredTransactions.some(t => hasDocNumber(t)) && (
                      <tr className="bg-slate-50 border-t border-slate-200 text-slate-500">
                        <td colSpan={6} className="py-2 px-4 text-right font-sans text-[11px]">
                          Total Komitmen Dikecualikan (Ada No. Dokumen / SPJ):
                        </td>
                        <td className="py-2 px-4 text-right text-slate-500 line-through">
                          {formatRupiah(
                            filteredTransactions
                              .filter(t => t.isActive && hasDocNumber(t))
                              .reduce((sum, t) => sum + (t.amount || 0), 0)
                          )}
                        </td>
                        <td colSpan={3} className="py-2 px-4 text-slate-400 text-[10px] font-sans">
                          {filteredTransactions.filter(t => t.isActive && hasDocNumber(t)).length} item dikecualikan
                        </td>
                      </tr>
                    )}
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Tambah Transaksi */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3>Tambah Komitmen Transaksi Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian Transaksi / Komitmen</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Security Outsourcing Tahap II"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelompok POS</label>
                  <select
                    value={formData.posType}
                    onChange={(e) => {
                      const newPos = e.target.value as PosType;
                      const availableGls = glAccountsByPos[newPos] || [];
                      const defaultGl = availableGls[0] || { code: '', name: '' };
                      setFormData({
                        ...formData,
                        posType: newPos,
                        glAccount: defaultGl.code,
                        glAccountName: defaultGl.name,
                        isCustomGl: false
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer bg-white"
                  >
                    <option value="Pos 53">Pos 53 - Beban Pemeliharaan</option>
                    <option value="Pos 54">Pos 54 - Administrasi & Umum</option>
                    <option value="Beban Sewa">Beban Sewa</option>
                    <option value="Pos 52">Pos 52 - Kepegawaian</option>
                    <option value="Pos 72">Pos 72 - Pensiun & THT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Periode / Bulan</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer bg-white"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Akun GL Selection */}
              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-indigo-950 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-indigo-600" />
                    Akun GL (GL Account)
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isCustomGl: !prev.isCustomGl }))}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    {formData.isCustomGl ? 'Pilih dari Daftar Master GL' : 'Ketik Manual Kode GL'}
                  </button>
                </div>

                {!formData.isCustomGl ? (
                  <div>
                    <select
                      value={formData.glAccount}
                      onChange={(e) => {
                        const code = e.target.value;
                        const matched = (glAccountsByPos[formData.posType] || []).find(g => g.code === code);
                        setFormData({
                          ...formData,
                          glAccount: code,
                          glAccountName: matched?.name || glAccountLookup[code] || code
                        });
                      }}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg font-mono text-xs font-semibold text-indigo-950 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none cursor-pointer"
                    >
                      {(glAccountsByPos[formData.posType] || []).map(g => (
                        <option key={g.code} value={g.code}>
                          [{g.code}] {g.name}
                        </option>
                      ))}
                      <option value="CUSTOM">+ Ketik Akun GL Lainnya...</option>
                    </select>
                    {formData.glAccountName && (
                      <p className="text-[11px] text-indigo-700 mt-1 font-sans">
                        Nama Akun: <strong>{formData.glAccountName}</strong>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-indigo-900 mb-0.5">Kode GL Account</label>
                      <input
                        type="text"
                        placeholder="Contoh: 6106200700"
                        value={formData.glAccount}
                        onChange={(e) => setFormData({ ...formData, glAccount: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-indigo-200 rounded-lg font-mono text-xs text-indigo-950 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-indigo-900 mb-0.5">Nama Akun GL</label>
                      <input
                        type="text"
                        placeholder="Nama Akun..."
                        value={formData.glAccountName}
                        onChange={(e) => setFormData({ ...formData, glAccountName: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-indigo-200 rounded-lg text-xs text-indigo-950 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori Pekerjaan</label>
                <input
                  type="text"
                  value={formData.category}
                  placeholder="Contoh: PEKERJAAN ALIH DAYA"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Nominal Komitmen (Rp)</label>
                  <span className="text-[11px] text-slate-500">Bisa bernilai minus (-)</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-semibold text-slate-400">Rp</span>
                  <input
                    type="number"
                    required
                    value={formData.amount === 0 ? '' : formData.amount}
                    placeholder="0"
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value === '' ? 0 : Number(e.target.value) || 0 })}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg font-mono font-bold focus:ring-2 focus:outline-none text-sm ${
                      formData.amount < 0 
                        ? 'bg-rose-50 border-rose-300 text-rose-700 focus:ring-rose-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-[11px] font-mono font-semibold ${formData.amount < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                    Terbaca: {formatRupiah(formData.amount)} {formData.amount < 0 ? '(Koreksi Pengurangan)' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, amount: -prev.amount }))}
                    className="text-[11px] px-2 py-0.5 rounded border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    title="Ubah tanda minus/positif"
                  >
                    {formData.amount < 0 ? 'Ubah ke Positif (+)' : 'Ubah ke Minus (-)'}
                  </button>
                </div>
              </div>

              {/* Nomor Dokumen Field */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block font-semibold text-slate-800 mb-1">
                  Nomor Dokumen / SPJ / Kontrak SAP <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SPJ/2026/08/012 atau 500012345"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 <em>Jika diisi, komitmen ini otomatis dikecualikan dari perhitungan prognosa tambahan karena dianggap telah terbit dokumen realisasi.</em>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Dasar Pelaksanaan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Simpan Komitmen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Transaksi */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3>Edit Komitmen Transaksi / Alih Daya</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian Transaksi / Komitmen</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelompok POS</label>
                  <select
                    value={editingItem.posType}
                    onChange={(e) => {
                      const newPos = e.target.value as PosType;
                      const availableGls = glAccountsByPos[newPos] || [];
                      const defaultGl = availableGls[0] || { code: '', name: '' };
                      setEditingItem({
                        ...editingItem,
                        posType: newPos,
                        glAccount: defaultGl.code,
                        glAccountName: defaultGl.name
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer bg-white"
                  >
                    <option value="Pos 53">Pos 53 - Beban Pemeliharaan</option>
                    <option value="Pos 54">Pos 54 - Administrasi & Umum</option>
                    <option value="Beban Sewa">Beban Sewa</option>
                    <option value="Pos 52">Pos 52 - Kepegawaian</option>
                    <option value="Pos 72">Pos 72 - Pensiun & THT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Periode / Bulan</label>
                  <select
                    value={editingItem.month !== undefined ? editingItem.month : selectedMonth}
                    onChange={(e) => setEditingItem({ ...editingItem, month: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer bg-white"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Akun GL Selection in Edit Modal */}
              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-2">
                <label className="block font-bold text-indigo-950 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-600" />
                  Akun GL (GL Account)
                </label>
                <select
                  value={editingItem.glAccount || ''}
                  onChange={(e) => {
                    const code = e.target.value;
                    const matched = (glAccountsByPos[editingItem.posType] || []).find(g => g.code === code);
                    setEditingItem({
                      ...editingItem,
                      glAccount: code,
                      glAccountName: matched?.name || glAccountLookup[code] || code
                    });
                  }}
                  className="w-full px-3 py-2 border border-indigo-200 rounded-lg font-mono text-xs font-semibold text-indigo-950 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none cursor-pointer"
                >
                  {(glAccountsByPos[editingItem.posType] || []).map(g => (
                    <option key={g.code} value={g.code}>
                      [{g.code}] {g.name}
                    </option>
                  ))}
                  <option value={editingItem.glAccount || ''}>
                    [{editingItem.glAccount || '-'}] {editingItem.glAccountName || 'Akun GL Kustom'}
                  </option>
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Kode GL Custom</label>
                    <input
                      type="text"
                      placeholder="Kode GL..."
                      value={editingItem.glAccount || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, glAccount: e.target.value })}
                      className="w-full px-2.5 py-1 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Nama Akun GL</label>
                    <input
                      type="text"
                      placeholder="Nama Akun GL..."
                      value={editingItem.glAccountName || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, glAccountName: e.target.value })}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                <input
                  type="text"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Nominal (Rp)</label>
                  <span className="text-[11px] text-slate-500">Bisa bernilai minus (-)</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-semibold text-slate-400">Rp</span>
                  <input
                    type="number"
                    required
                    value={editingItem.amount === 0 ? '' : editingItem.amount}
                    placeholder="0"
                    onChange={(e) => setEditingItem({ ...editingItem, amount: e.target.value === '' ? 0 : Number(e.target.value) || 0 })}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg font-mono font-bold focus:ring-2 focus:outline-none text-sm ${
                      editingItem.amount < 0 
                        ? 'bg-rose-50 border-rose-300 text-rose-700 focus:ring-rose-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-[11px] font-mono font-semibold ${editingItem.amount < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                    Terbaca: {formatRupiah(editingItem.amount)} {editingItem.amount < 0 ? '(Koreksi Pengurangan)' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingItem(prev => prev ? ({ ...prev, amount: -prev.amount }) : null)}
                    className="text-[11px] px-2 py-0.5 rounded border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    title="Ubah tanda minus/positif"
                  >
                    {editingItem.amount < 0 ? 'Ubah ke Positif (+)' : 'Ubah ke Minus (-)'}
                  </button>
                </div>
              </div>

              {/* Nomor Dokumen Field */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block font-semibold text-slate-800 mb-1">
                  Nomor Dokumen / SPJ / Kontrak SAP
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SPJ/2026/08/012 atau 500012345"
                  value={editingItem.documentNumber || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, documentNumber: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 <em>Jika diisi, komitmen ini otomatis dikecualikan dari perhitungan prognosa tambahan.</em>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Dasar Kontrak</label>
                <textarea
                  rows={2}
                  value={editingItem.notes || editingItem.note || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value, note: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editingItem.isActive}
                  onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="editIsActive" className="text-slate-700 font-medium cursor-pointer">
                  Aktifkan komitmen ini dalam daftar
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

