import React, { useState, useMemo } from 'react';
import { 
  TableProperties, 
  Download, 
  Search, 
  Filter, 
  Layers, 
  TrendingUp, 
  Eye, 
  SlidersHorizontal,
  FileSpreadsheet,
  Calculator,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { BudgetItem, PosType, AdditionalTransaction } from '../types';
import { getChildAccountsForHeader } from '../utils/budgetCalculations';
import { 
  formatRupiah, 
  formatRupiahShort, 
  formatPercent, 
  MONTH_NAMES, 
  MONTH_SHORT_NAMES 
} from '../utils/formatters';

type MatrixMode = 'summary_mtd' | 'monthly_realization' | 'monthly_target_vs_real';

export const MatrixView: React.FC = () => {
  const { 
    budgetItems, 
    additionalTransactions,
    selectedYear, 
    selectedMonth, 
    setSelectedMonth 
  } = useApp();

  const [matrixMode, setMatrixMode] = useState<MatrixMode>('summary_mtd');
  const [selectedPos, setSelectedPos] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Helper check if transaction is already booked/documented
  const hasDocNumber = (t: AdditionalTransaction): boolean => {
    return !!(t.documentNumber && t.documentNumber.trim().length > 0);
  };

  // Open commitments (belum tercatat / belum terbit SPJ) for current running month
  const openCommitmentsCurrentMonth = useMemo(() => {
    return (additionalTransactions || []).filter(t => 
      t.isActive && 
      !hasDocNumber(t) &&
      (t.month === undefined || t.month === selectedMonth)
    );
  }, [additionalTransactions, selectedMonth]);

  // Compute open commitment / prognosa amount for an individual item or group header for selectedMonth
  const getItemPrognosaCurrentMonth = (item: BudgetItem): number => {
    if (!item.isGroupHeader) {
      // Individual GL item: match by glAccount matching item.code or item.id
      return openCommitmentsCurrentMonth
        .filter(t => t.glAccount === item.code || t.glAccount === item.id)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    } else {
      // Group header: sum of all child accounts under this header
      const children = getChildAccountsForHeader(item, budgetItems);
      const childCodes = new Set(children.map(c => c.code));
      const childIds = new Set(children.map(c => c.id));

      let total = openCommitmentsCurrentMonth
        .filter(t => t.glAccount && (childCodes.has(t.glAccount) || childIds.has(t.glAccount)))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // For level 0 POS headers (or grand total), also include unassigned commitments for this posType
      if (item.level === 0) {
        const unassigned = openCommitmentsCurrentMonth
          .filter(t => {
            const matchesPos = (item.code === 'CODE_1' || (item.name || '').toLowerCase().includes('beban usaha'))
              ? true
              : (t.posType === item.posType || (item.posType === 'Beban Sewa' && (t.posType as string) === 'Sewa Non AHG'));
            const isAssigned = t.glAccount && (childCodes.has(t.glAccount) || childIds.has(t.glAccount));
            return matchesPos && !isAssigned;
          })
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        total += unassigned;
      }
      return total;
    }
  };

  const filteredItems = useMemo(() => {
    return budgetItems.filter(item => {
      if (selectedPos !== 'ALL') {
        if (selectedPos === 'Beban Sewa') {
          if (item.posType !== 'Beban Sewa' && (item.posType as string) !== 'Sewa Non AHG') return false;
        } else if (item.posType !== selectedPos) {
          return false;
        }
      }
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        return (item.name || '').toLowerCase().includes(q) || 
               (item.code || '').toLowerCase().includes(q) ||
               (item.category || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [budgetItems, selectedPos, searchTerm]);

  // Total open commitments for the currently filtered view
  const totalOpenCommitmentsCurrentMonth = useMemo(() => {
    if (selectedPos === 'ALL') {
      return openCommitmentsCurrentMonth.reduce((sum, t) => sum + (t.amount || 0), 0);
    }
    return openCommitmentsCurrentMonth
      .filter(t => t.posType === selectedPos || (selectedPos === 'Beban Sewa' && (t.posType as string) === 'Sewa Non AHG'))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [openCommitmentsCurrentMonth, selectedPos]);

  // Aggregate totals
  const totals = useMemo(() => {
    const activeItems = filteredItems.filter(i => !i.isGroupHeader);
    
    let totalAnnual = 0;
    let targetMTD = 0;
    let realMTD = 0;

    const monthlyRealizationTotals = Array(12).fill(0);
    const monthlyBudgetTotals = Array(12).fill(0);

    activeItems.forEach(item => {
      totalAnnual += (item.budgetAnnual || 0);

      for (let m = 0; m < 12; m++) {
        const r = item.realizationMonthly?.[m] || 0;
        const b = item.budgetMonthly?.[m] || 0;

        monthlyRealizationTotals[m] += r;
        monthlyBudgetTotals[m] += b;

        if (m <= selectedMonth) {
          targetMTD += b;
          realMTD += r;
        }
      }
    });

    const prognosaMTD = totalOpenCommitmentsCurrentMonth;
    // Sisa pagu bulan berjalan = target bulan berjalan dikurangi realisasi bulan berjalan dikurangi prognosa bulan berjalan
    const sisaPaguBulanBerjalan = targetMTD - realMTD - prognosaMTD;
    const sisaPaguAnnual = totalAnnual - realMTD;

    const penyerapanTahunanPct = totalAnnual > 0 ? (realMTD / totalAnnual) * 100 : 0;
    const penyerapanSdMonthPct = targetMTD > 0 ? (realMTD / targetMTD) * 100 : 0;

    return {
      totalAnnual,
      targetMTD,
      realMTD,
      prognosaMTD,
      sisaPaguBulanBerjalan,
      sisaPaguAnnual,
      penyerapanTahunanPct,
      penyerapanSdMonthPct,
      monthlyRealizationTotals,
      monthlyBudgetTotals
    };
  }, [filteredItems, selectedMonth, totalOpenCommitmentsCurrentMonth]);

  // Export Matrix to Excel
  const handleExportExcel = () => {
    let wsData: any[][] = [];

    if (matrixMode === 'summary_mtd') {
      wsData.push([
        `MATRIKS REALISASI ANGGARAN & PROGNOSA S/D ${MONTH_NAMES[selectedMonth].toUpperCase()} ${selectedYear}`,
        '', '', '', '', '', '', '', '', '', ''
      ]);
      wsData.push([
        'Rumus: Sisa Pagu Bulan Berjalan = Target s.d. Bulan Berjalan - Realisasi s.d. Bulan Berjalan - Prognosa Bulan Berjalan'
      ]);
      wsData.push([
        'NO', 'KODE GL', 'URAIAN AKUN', 'KELOMPOK POS', 
        `PAGU ANGGARAN ${selectedYear}`, 
        `TARGET S/D ${MONTH_SHORT_NAMES[selectedMonth]}`, 
        `REALISASI S/D ${MONTH_SHORT_NAMES[selectedMonth]}`, 
        `PROGNOSA BLN BERJALAN`,
        `SISA PAGU BULAN BERJALAN`, 
        `SISA PAGU 1 TAHUN`, 
        `% REAL THD TARGET S/D BLN`,
        `% REAL THD PAGU 1 THN`
      ]);

      filteredItems.forEach((item, idx) => {
        let rMTD = 0;
        let bMTD = 0;
        for (let m = 0; m <= selectedMonth; m++) {
          rMTD += item.realizationMonthly?.[m] || 0;
          bMTD += item.budgetMonthly?.[m] || 0;
        }

        const progItem = getItemPrognosaCurrentMonth(item);
        // Sisa pagu bulan berjalan = target s.d. bulan berjalan dikurangi realisasi s.d. bulan berjalan dikurangi prognosa bulan berjalan
        const sisaBlnBerjalan = bMTD - rMTD - progItem;
        const sisaTahunan = item.budgetAnnual - rMTD;

        const pctTahunan = item.budgetAnnual > 0 ? (rMTD / item.budgetAnnual) * 100 : 0;
        const pctMTD = bMTD > 0 ? (rMTD / bMTD) * 100 : 0;

        wsData.push([
          idx + 1,
          item.code,
          item.name,
          item.posType,
          item.budgetAnnual,
          bMTD,
          rMTD,
          progItem,
          sisaBlnBerjalan,
          sisaTahunan,
          `${pctMTD.toFixed(2)}%`,
          `${pctTahunan.toFixed(2)}%`
        ]);
      });
    } else if (matrixMode === 'monthly_realization') {
      wsData.push([`RINCIAN REALISASI BULANAN ${selectedYear}`]);
      wsData.push([
        'NO', 'KODE GL', 'URAIAN AKUN', 'POS',
        ...MONTH_SHORT_NAMES.map(m => `REALISASI ${m}`),
        'TOTAL REALISASI'
      ]);

      filteredItems.forEach((item, idx) => {
        const tot = item.realizationMonthly.reduce((a, b) => a + (b || 0), 0);
        wsData.push([
          idx + 1,
          item.code,
          item.name,
          item.posType,
          ...item.realizationMonthly,
          tot
        ]);
      });
    } else if (matrixMode === 'monthly_target_vs_real') {
      wsData.push([`KOMPARASI TARGET VS REALISASI BULANAN ${selectedYear}`]);
      const headerRow = ['NO', 'KODE GL', 'URAIAN AKUN', 'POS'];
      MONTH_SHORT_NAMES.forEach(m => {
        headerRow.push(`TGT ${m}`, `REAL ${m}`);
      });
      headerRow.push('TOTAL TGT', 'TOTAL REAL');
      wsData.push(headerRow);

      filteredItems.forEach((item, idx) => {
        const row: any[] = [idx + 1, item.code, item.name, item.posType];
        let totTgt = 0;
        let totReal = 0;
        for (let m = 0; m < 12; m++) {
          const tgt = item.budgetMonthly?.[m] || 0;
          const real = item.realizationMonthly?.[m] || 0;
          totTgt += tgt;
          totReal += real;
          row.push(tgt, real);
        }
        row.push(totTgt, totReal);
        wsData.push(row);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matriks_Realisasi');
    XLSX.writeFile(wb, `Matriks_Realisasi_Anggaran_${MONTH_NAMES[selectedMonth]}_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TableProperties className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Matriks Pemantauan Realisasi Anggaran</h1>
            <p className="text-xs text-slate-500">
              Tabel matriks komprehensif rencana anggaran, realisasi s/d cut-off, komitmen prognosa, dan sisa pagu bulan berjalan
            </p>
          </div>
        </div>

        <button
          onClick={handleExportExcel}
          className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors self-start md:self-auto shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Matriks ke Excel (.xlsx)</span>
        </button>
      </div>

      {/* Control & View Mode Selectors */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setMatrixMode('summary_mtd')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                matrixMode === 'summary_mtd'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matriks Akumulasi (s/d {MONTH_NAMES[selectedMonth]})
            </button>
            <button
              onClick={() => setMatrixMode('monthly_realization')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                matrixMode === 'monthly_realization'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rincian Realisasi (12 Bulan)
            </button>
            <button
              onClick={() => setMatrixMode('monthly_target_vs_real')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                matrixMode === 'monthly_target_vs_real'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Komparasi Target vs Realisasi Bulanan
            </button>
          </div>

          {/* Cut-off Month selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Cut-off Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter bar & Rule Hint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari akun anggaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* POS Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['ALL', 'Pos 52', 'Pos 53', 'Pos 54', 'Beban Sewa', 'Pos 72'].map(p => (
              <button
                key={p}
                onClick={() => setSelectedPos(p)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedPos === p
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p === 'ALL' ? 'Semua Pos' : p}
              </button>
            ))}
          </div>
        </div>

        {/* Formula Information Note */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg px-3.5 py-2 flex items-center gap-2 text-[11px] text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Formula Sisa Pagu Bulan Berjalan</strong> = 
            <span className="font-mono font-semibold ml-1">Target Bulan Berjalan</span> − 
            <span className="font-mono font-semibold ml-1">Realisasi Bulan Berjalan</span> − 
            <span className="font-mono font-semibold ml-1">Prognosa Bulan Berjalan</span>
            <span className="text-amber-700 ml-1.5">(komitmen/kontrak terbuka yang belum terbit SPJ/dokumen)</span>.
          </span>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs">
          <span className="text-slate-400 block text-[11px]">Total Pagu (1 Thn)</span>
          <span className="font-bold text-slate-900 text-sm font-mono">{formatRupiahShort(totals.totalAnnual)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs">
          <span className="text-slate-400 block text-[11px]">Target s/d {MONTH_SHORT_NAMES[selectedMonth]}</span>
          <span className="font-bold text-slate-800 text-sm font-mono">{formatRupiahShort(totals.targetMTD)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs">
          <span className="text-slate-400 block text-[11px]">Realisasi s/d {MONTH_SHORT_NAMES[selectedMonth]}</span>
          <span className="font-bold text-blue-600 text-sm font-mono">{formatRupiahShort(totals.realMTD)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-purple-100 bg-purple-50/20 shadow-sm text-xs">
          <span className="text-purple-600 block text-[11px] font-semibold" title="Total komitmen/kontrak terbuka bulan berjalan">Prognosa Bln Berjalan</span>
          <span className="font-bold text-purple-700 text-sm font-mono">{formatRupiahShort(totals.prognosaMTD)}</span>
        </div>
        <div className={`p-3 rounded-xl border shadow-sm text-xs ${
          totals.sisaPaguBulanBerjalan >= 0 
            ? 'bg-amber-50/50 border-amber-300/80 text-amber-950 ring-1 ring-amber-400/20' 
            : 'bg-rose-50/50 border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-center justify-between">
            <span className="block text-[11px] font-bold text-amber-900" title="Target s.d. Bulan Berjalan dikurangi Realisasi s.d. Bulan Berjalan dikurangi Prognosa Bulan Berjalan">
              Sisa Pagu Bln Berjalan
            </span>
            <Calculator className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          </div>
          <span className={`font-black text-sm font-mono block mt-0.5 ${
            totals.sisaPaguBulanBerjalan >= 0 ? 'text-amber-800' : 'text-rose-600'
          }`}>
            {formatRupiahShort(totals.sisaPaguBulanBerjalan)}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs">
          <span className="text-slate-400 block text-[11px]">Sisa Pagu 1 Tahun</span>
          <span className="font-bold text-slate-700 text-sm font-mono">{formatRupiahShort(totals.sisaPaguAnnual)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-indigo-100 bg-indigo-50/30 shadow-sm text-xs">
          <span className="text-indigo-700 block text-[11px] font-semibold">% Real thd Target Bln</span>
          <span className="font-bold text-indigo-700 text-sm">{formatPercent(totals.penyerapanSdMonthPct)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 shadow-sm text-xs">
          <span className="text-emerald-700 block text-[11px] font-semibold">% Real thd Pagu 1 Thn</span>
          <span className="font-bold text-emerald-700 text-sm">{formatPercent(totals.penyerapanTahunanPct)}</span>
        </div>
      </div>

      {/* Main Table Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[650px]">
          <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
            <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold sticky top-0 z-20 shadow-md">
              {matrixMode === 'summary_mtd' && (
                <tr>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3 w-28">Kode GL</th>
                  <th className="py-3 px-3 min-w-[240px]">Uraian Akun Anggaran</th>
                  <th className="py-3 px-3 w-24">POS</th>
                  <th className="py-3 px-3 text-right">Pagu SKKO ({selectedYear})</th>
                  <th className="py-3 px-3 text-right">Target s/d {MONTH_SHORT_NAMES[selectedMonth]}</th>
                  <th className="py-3 px-3 text-right bg-slate-800 text-blue-300">Realisasi s/d {MONTH_SHORT_NAMES[selectedMonth]}</th>
                  <th className="py-3 px-3 text-right bg-purple-950/80 text-purple-200" title="Komitmen terbuka bulan berjalan yang belum tercatat dokumen SPJ">
                    Prog Bln Berjalan
                  </th>
                  <th className="py-3 px-3 text-right bg-amber-950/90 text-amber-300 border-x border-slate-800" title="Target s.d. Bulan Berjalan dikurangi Realisasi s.d. Bulan Berjalan dikurangi Prognosa Bulan Berjalan">
                    <span className="block">Sisa Pagu</span>
                    <span className="text-[9px] text-amber-200 font-normal">Bln Berjalan</span>
                  </th>
                  <th className="py-3 px-3 text-right text-slate-300">Sisa Pagu 1 Thn</th>
                  <th className="py-3 px-3 text-center bg-indigo-950 text-indigo-200 border-x border-slate-800">
                    <span className="block">% Real thd</span>
                    <span className="text-[9px] text-indigo-300">Angg s/d Bln</span>
                  </th>
                  <th className="py-3 px-3 text-center bg-emerald-950 text-emerald-200">
                    <span className="block">% Real thd</span>
                    <span className="text-[9px] text-emerald-300">Angg 1 Thn</span>
                  </th>
                </tr>
              )}

              {matrixMode === 'monthly_realization' && (
                <tr>
                  <th className="py-3 px-3 w-10 text-center border-r border-slate-800">No</th>
                  <th className="py-3 px-3 w-28 border-r border-slate-800">Kode GL</th>
                  <th className="py-3 px-3 min-w-[240px] border-r border-slate-800">Uraian Akun Anggaran</th>
                  <th className="py-3 px-3 w-24 border-r border-slate-800">POS</th>
                  {MONTH_SHORT_NAMES.map((m, idx) => (
                    <th 
                      key={`m-${m}`} 
                      className={`py-3 px-2 text-right text-[10px] font-mono border-r border-slate-800 ${
                        idx === selectedMonth ? 'bg-blue-900 text-blue-200' : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {m}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right bg-slate-950 text-white">Total 1 Tahun</th>
                </tr>
              )}

              {matrixMode === 'monthly_target_vs_real' && (
                <>
                  <tr>
                    <th rowSpan={2} className="py-3 px-3 w-10 text-center border-r border-slate-800">No</th>
                    <th rowSpan={2} className="py-3 px-3 w-28 border-r border-slate-800">Kode GL</th>
                    <th rowSpan={2} className="py-3 px-3 min-w-[240px] border-r border-slate-800">Uraian Akun</th>
                    {MONTH_SHORT_NAMES.map((m, idx) => (
                      <th 
                        key={m} 
                        colSpan={2} 
                        className={`py-2 px-3 text-center border-r border-slate-800 ${
                          idx === selectedMonth ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {m} {idx === selectedMonth ? '(Cut-off)' : ''}
                      </th>
                    ))}
                    <th rowSpan={2} className="py-3 px-3 text-right bg-slate-800">Total Real</th>
                  </tr>
                  <tr>
                    {MONTH_SHORT_NAMES.map(m => (
                      <React.Fragment key={`sub-${m}`}>
                        <th className="py-1.5 px-2 text-right text-[9px] bg-slate-900 text-slate-400 font-mono">Tgt</th>
                        <th className="py-1.5 px-2 text-right text-[9px] bg-slate-950 text-emerald-300 font-mono border-r border-slate-800">Real</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </>
              )}
            </thead>

            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredItems.map((item, idx) => {
                const isHeader = item.isGroupHeader;

                // Computations
                let rMTD = 0;
                let bMTD = 0;
                let rTotalAnnual = 0;

                for (let m = 0; m < 12; m++) {
                  const r = item.realizationMonthly?.[m] || 0;
                  const b = item.budgetMonthly?.[m] || 0;
                  rTotalAnnual += r;

                  if (m <= selectedMonth) {
                    rMTD += r;
                    bMTD += b;
                  }
                }

                // Prognosa & Sisa Pagu Bulan Berjalan
                const prognosaItem = getItemPrognosaCurrentMonth(item);
                // Sisa pagu bulan berjalan = target bulan berjalan dikurangi realisasi bulan berjalan dikurangi prognosa bulan berjalan
                const sisaPaguBulanBerjalanItem = bMTD - rMTD - prognosaItem;
                const sisaPaguAnnualItem = item.budgetAnnual - rMTD;

                const serapTahunanPct = item.budgetAnnual > 0 ? (rMTD / item.budgetAnnual) * 100 : 0;
                const serapSdMonthPct = bMTD > 0 ? (rMTD / bMTD) * 100 : 0;

                if (isHeader) {
                  return (
                    <tr key={item.id} className="bg-slate-100 font-bold text-slate-900">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3">{item.code || '-'}</td>
                      <td className="py-2.5 px-3 uppercase tracking-wider font-sans" colSpan={matrixMode === 'summary_mtd' ? 2 : 1}>
                        {item.name}
                      </td>
                      {matrixMode === 'summary_mtd' && (
                        <>
                          <td className="py-2.5 px-3 text-right">{formatRupiah(item.budgetAnnual)}</td>
                          <td className="py-2.5 px-3 text-right">{formatRupiah(bMTD)}</td>
                          <td className="py-2.5 px-3 text-right bg-slate-200 text-blue-800">{formatRupiah(rMTD)}</td>
                          <td className="py-2.5 px-3 text-right text-purple-700 bg-purple-50/50">{formatRupiah(prognosaItem)}</td>
                          <td className={`py-2.5 px-3 text-right bg-amber-50/70 border-x border-amber-200 ${
                            sisaPaguBulanBerjalanItem < 0 ? 'text-rose-700 font-extrabold' : 'text-amber-800'
                          }`}>
                            {formatRupiah(sisaPaguBulanBerjalanItem)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700">{formatRupiah(sisaPaguAnnualItem)}</td>
                          <td className="py-2.5 px-3 text-center text-indigo-800 bg-indigo-50/50">{formatPercent(serapSdMonthPct)}</td>
                          <td className="py-2.5 px-3 text-center text-emerald-800 bg-emerald-50/50">{formatPercent(serapTahunanPct)}</td>
                        </>
                      )}
                      {matrixMode === 'monthly_realization' && (
                        <td colSpan={14} className="py-2.5 px-3 text-center text-slate-500">
                          [Sub-Total Header Group]
                        </td>
                      )}
                      {matrixMode === 'monthly_target_vs_real' && (
                        <td colSpan={25} className="py-2.5 px-3 text-center text-slate-500">
                          [Sub-Total Header Group]
                        </td>
                      )}
                    </tr>
                  );
                }

                return (
                  <tr key={item.id} className="hover:bg-blue-50/40 transition-colors text-xs">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-sans">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{item.code}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 font-sans">
                      <span className="truncate max-w-xs block" title={item.name}>{item.name}</span>
                    </td>

                    {matrixMode === 'summary_mtd' && (
                      <>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.posType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-800 font-semibold">{formatRupiah(item.budgetAnnual)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{formatRupiah(bMTD)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-700 bg-blue-50/50">{formatRupiah(rMTD)}</td>
                        
                        {/* Prognosa Bulan Berjalan */}
                        <td className={`py-2.5 px-3 text-right ${prognosaItem > 0 ? 'font-semibold text-purple-700 bg-purple-50/30' : 'text-slate-400'}`}>
                          {formatRupiah(prognosaItem)}
                        </td>

                        {/* Sisa Pagu Bulan Berjalan = Target - Realisasi - Prognosa */}
                        <td className={`py-2.5 px-3 text-right font-bold border-x border-amber-100 ${
                          sisaPaguBulanBerjalanItem < 0 
                            ? 'text-rose-600 bg-rose-50/40' 
                            : 'text-amber-800 bg-amber-50/30'
                        }`}
                        title={`Target (${formatRupiah(bMTD)}) - Realisasi (${formatRupiah(rMTD)}) - Prognosa (${formatRupiah(prognosaItem)}) = ${formatRupiah(sisaPaguBulanBerjalanItem)}`}
                        >
                          {formatRupiah(sisaPaguBulanBerjalanItem)}
                        </td>

                        {/* Sisa Pagu 1 Tahun */}
                        <td className={`py-2.5 px-3 text-right font-medium ${sisaPaguAnnualItem < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {formatRupiah(sisaPaguAnnualItem)}
                        </td>

                        <td className="py-2.5 px-3 text-center font-sans font-bold text-indigo-700 bg-indigo-50/30 border-x border-slate-100">
                          {formatPercent(serapSdMonthPct)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans font-bold text-emerald-700 bg-emerald-50/30">
                          {formatPercent(serapTahunanPct)}
                        </td>
                      </>
                    )}

                    {matrixMode === 'monthly_realization' && (
                      <>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.posType}
                          </span>
                        </td>
                        {item.realizationMonthly.map((val, mIdx) => (
                          <td 
                            key={`r-${mIdx}`} 
                            className={`py-2 px-2 text-right text-[11px] ${
                              val > 0 ? 'text-blue-700 font-medium' : 'text-slate-300'
                            } ${mIdx === selectedMonth ? 'bg-blue-50 font-semibold' : ''}`}
                          >
                            {val > 0 ? formatRupiahShort(val) : '-'}
                          </td>
                        ))}
                        <td className="py-2 px-3 text-right font-bold text-slate-900 bg-slate-50">
                          {formatRupiah(rTotalAnnual)}
                        </td>
                      </>
                    )}

                    {matrixMode === 'monthly_target_vs_real' && (
                      <>
                        {MONTH_SHORT_NAMES.map((_, mIdx) => {
                          const tgt = item.budgetMonthly?.[mIdx] || 0;
                          const r = item.realizationMonthly?.[mIdx] || 0;
                          return (
                            <React.Fragment key={`m-${mIdx}`}>
                              <td className="py-2 px-2 text-right text-[10px] text-slate-400">
                                {tgt > 0 ? formatRupiahShort(tgt) : '-'}
                              </td>
                              <td className={`py-2 px-2 text-right text-[10px] font-semibold border-r border-slate-100 ${
                                r > 0 ? 'text-emerald-700' : 'text-slate-300'
                              } ${mIdx === selectedMonth ? 'bg-indigo-50/60' : ''}`}>
                                {r > 0 ? formatRupiahShort(r) : '-'}
                              </td>
                            </React.Fragment>
                          );
                        })}
                        <td className="py-2 px-3 text-right font-bold text-slate-900 bg-slate-50">
                          {formatRupiah(rTotalAnnual)}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>

            {/* Total Footer Row */}
            <tfoot className="bg-slate-900 text-white font-bold text-xs sticky bottom-0 z-20">
              <tr>
                <td className="py-3 px-3 text-center" colSpan={4}>
                  GRAND TOTAL
                </td>
                {matrixMode === 'summary_mtd' && (
                  <>
                    <td className="py-3 px-3 text-right font-mono">{formatRupiah(totals.totalAnnual)}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatRupiah(totals.targetMTD)}</td>
                    <td className="py-3 px-3 text-right font-mono bg-slate-800 text-blue-300">{formatRupiah(totals.realMTD)}</td>
                    <td className="py-3 px-3 text-right font-mono bg-purple-950/80 text-purple-200">{formatRupiah(totals.prognosaMTD)}</td>
                    <td className={`py-3 px-3 text-right font-mono bg-amber-950 text-amber-300 border-x border-slate-800 ${
                      totals.sisaPaguBulanBerjalan < 0 ? 'text-rose-300' : ''
                    }`}>
                      {formatRupiah(totals.sisaPaguBulanBerjalan)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">{formatRupiah(totals.sisaPaguAnnual)}</td>
                    <td className="py-3 px-3 text-center font-sans text-indigo-300 bg-slate-950 border-x border-slate-800">{formatPercent(totals.penyerapanSdMonthPct)}</td>
                    <td className="py-3 px-3 text-center font-sans text-emerald-300 bg-slate-950">{formatPercent(totals.penyerapanTahunanPct)}</td>
                  </>
                )}

                {matrixMode === 'monthly_realization' && (
                  <>
                    {totals.monthlyRealizationTotals.map((val, idx) => (
                      <td key={`tot-r-${idx}`} className="py-3 px-2 text-right text-[10px] font-mono text-blue-200">
                        {formatRupiahShort(val)}
                      </td>
                    ))}
                    <td className="py-3 px-3 text-right font-mono bg-slate-800 text-white">
                      {formatRupiah(totals.monthlyRealizationTotals.reduce((a, b) => a + b, 0))}
                    </td>
                  </>
                )}

                {matrixMode === 'monthly_target_vs_real' && (
                  <>
                    {MONTH_SHORT_NAMES.map((_, idx) => (
                      <React.Fragment key={`tot-m-${idx}`}>
                        <td className="py-3 px-2 text-right text-[9px] font-mono text-slate-300">
                          {formatRupiahShort(totals.monthlyBudgetTotals[idx])}
                        </td>
                        <td className="py-3 px-2 text-right text-[9px] font-mono text-emerald-300 border-r border-slate-800">
                          {formatRupiahShort(totals.monthlyRealizationTotals[idx])}
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="py-3 px-3 text-right font-mono bg-slate-800 text-white">
                      {formatRupiah(totals.monthlyRealizationTotals.reduce((a, b) => a + b, 0))}
                    </td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
