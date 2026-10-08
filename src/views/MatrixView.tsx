import React, { useState, useMemo } from 'react';
import { 
  TableProperties, 
  Download, 
  Search, 
  Filter, 
  Layers, 
  TrendingUp, 
  Eye, 
  EyeOff,
  SlidersHorizontal,
  FileSpreadsheet,
  Calculator,
  Info,
  ShieldCheck,
  CheckCircle2
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
  // Mode penyembunyian akun bernilai nol (default true agar data lebih ringkas)
  const [hideZeroAccounts, setHideZeroAccounts] = useState<boolean>(true);

  // Helper check if transaction is already booked/documented
  const hasDocNumber = (t: AdditionalTransaction): boolean => {
    return !!(t.documentNumber && t.documentNumber.trim().length > 0);
  };

  // Open commitments (belum tercatat / belum terbit SPJ) for current running month
  // Nilai komitmen terbuka bulan berjalan merupakan nilai komitmen dari bulan berjalan 
  // ditambahkan komitmen bulan-bulan sebelumnya yang statusnya masih terbuka
  const openCommitmentsCurrentMonth = useMemo(() => {
    return (additionalTransactions || []).filter(t => 
      t.isActive && 
      !hasDocNumber(t) &&
      (t.month === undefined || t.month <= selectedMonth)
    );
  }, [additionalTransactions, selectedMonth]);

  // All open commitments in 1 year (active and no document number / belum terbit SPJ)
  const openCommitmentsAnnual = useMemo(() => {
    return (additionalTransactions || []).filter(t => 
      t.isActive && 
      !hasDocNumber(t)
    );
  }, [additionalTransactions]);

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

  // Compute open commitment / prognosa amount for 1 full year for an item or group header
  const getItemPrognosaAnnual = (item: BudgetItem): number => {
    if (!item.isGroupHeader) {
      return openCommitmentsAnnual
        .filter(t => t.glAccount === item.code || t.glAccount === item.id)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    } else {
      const children = getChildAccountsForHeader(item, budgetItems);
      const childCodes = new Set(children.map(c => c.code));
      const childIds = new Set(children.map(c => c.id));

      let total = openCommitmentsAnnual
        .filter(t => t.glAccount && (childCodes.has(t.glAccount) || childIds.has(t.glAccount)))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      if (item.level === 0) {
        const unassigned = openCommitmentsAnnual
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

  // Helper to generate tooltip showing breakdown of transactions contributing to prognosa
  const getPrognosaTooltip = (item: BudgetItem, isAnnual: boolean): string | undefined => {
    const list = isAnnual ? openCommitmentsAnnual : openCommitmentsCurrentMonth;
    let matched: AdditionalTransaction[] = [];
    if (!item.isGroupHeader) {
      matched = list.filter(t => t.glAccount === item.code || t.glAccount === item.id);
    } else {
      const children = getChildAccountsForHeader(item, budgetItems);
      const childCodes = new Set(children.map(c => c.code));
      const childIds = new Set(children.map(c => c.id));
      matched = list.filter(t => {
        const isAssigned = t.glAccount && (childCodes.has(t.glAccount) || childIds.has(t.glAccount));
        if (item.level === 0) {
          const matchesPos = (item.code === 'CODE_1' || (item.name || '').toLowerCase().includes('beban usaha'))
            ? true
            : (t.posType === item.posType || (item.posType === 'Beban Sewa' && (t.posType as string) === 'Sewa Non AHG'));
          return isAssigned || matchesPos;
        }
        return isAssigned;
      });
    }

    if (matched.length === 0) return undefined;
    const headerTitle = `Rincian Komitmen Terbuka ${isAnnual ? '1 Tahun' : `s.d. ${MONTH_SHORT_NAMES[selectedMonth]}`} [${item.code || '-'}] ${item.name}:`;
    const details = matched.map((t, i) => `${i + 1}. ${t.name} (GL: ${t.glAccount || '-'}) = ${formatRupiah(t.amount || 0)}`);
    return `${headerTitle}\n${details.join('\n')}`;
  };

  // Mengecek apakah suatu akun memiliki nilai (bukan nol).
  // Akun dikatakan ada isinya jika memiliki pagu tahunan, target bulanan, realisasi bulanan, atau prognosa komitmen.
  // Jika di kemudian hari akun tersebut diisi data, fungsi ini otomatis mengembalikan true sehingga akun ditampilkan kembali.
  const isAccountNonZero = (item: BudgetItem): boolean => {
    if (item.isGroupHeader) {
      // Baris header grup ditampilkan hanya jika memiliki setidaknya satu sub-akun yang ada isinya (non-nol)
      const children = getChildAccountsForHeader(item, budgetItems);
      return children.some(child => isAccountNonZero(child));
    }

    const hasAnnualBudget = Math.abs(item.budgetAnnual || 0) > 0;
    const hasMonthlyBudget = (item.budgetMonthly || []).some(v => Math.abs(v || 0) > 0);
    const hasMonthlyRealization = (item.realizationMonthly || []).some(v => Math.abs(v || 0) > 0);
    const hasPrognosa = Math.abs(getItemPrognosaAnnual(item)) > 0;

    return hasAnnualBudget || hasMonthlyBudget || hasMonthlyRealization || hasPrognosa;
  };

  // Hitung jumlah akun non-header bernilai nol yang disembunyikan
  const { totalNonHeaderCount, nonZeroCount, hiddenCount } = useMemo(() => {
    const nonHeaders = budgetItems.filter(i => !i.isGroupHeader);
    const nonZero = nonHeaders.filter(i => isAccountNonZero(i)).length;
    return {
      totalNonHeaderCount: nonHeaders.length,
      nonZeroCount: nonZero,
      hiddenCount: nonHeaders.length - nonZero
    };
  }, [budgetItems, openCommitmentsAnnual]);

  const filteredItems = useMemo(() => {
    return budgetItems.filter(item => {
      // Bila mode sembunyikan akun nol aktif, sembunyikan akun yang tidak memiliki nilai sama sekali
      if (hideZeroAccounts && !isAccountNonZero(item)) {
        return false;
      }

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
  }, [budgetItems, selectedPos, searchTerm, hideZeroAccounts, openCommitmentsAnnual]);

  // Total open commitments for current month
  const totalOpenCommitmentsCurrentMonth = useMemo(() => {
    if (selectedPos === 'ALL') {
      return openCommitmentsCurrentMonth.reduce((sum, t) => sum + (t.amount || 0), 0);
    }
    return openCommitmentsCurrentMonth
      .filter(t => t.posType === selectedPos || (selectedPos === 'Beban Sewa' && (t.posType as string) === 'Sewa Non AHG'))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [openCommitmentsCurrentMonth, selectedPos]);

  // Total open commitments for the entire year
  const totalOpenCommitmentsAnnual = useMemo(() => {
    if (selectedPos === 'ALL') {
      return openCommitmentsAnnual.reduce((sum, t) => sum + (t.amount || 0), 0);
    }
    return openCommitmentsAnnual
      .filter(t => t.posType === selectedPos || (selectedPos === 'Beban Sewa' && (t.posType as string) === 'Sewa Non AHG'))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [openCommitmentsAnnual, selectedPos]);

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

    // Pada bulan Desember (penutup tahun / selectedMonth === 11):
    // 1. Prognosa Bulan Berjalan = Prognosa 1 Tahun (mencakup seluruh komitmen terbuka tahun berjalan)
    // 2. Target s.d. Bulan Berjalan = Pagu Tahunan SKKO (totalAnnual)
    // Menjamin Sisa Pagu Bulan Berjalan dan Sisa Pagu 1 Tahun bernilai seimbang dan identik (100% konsisten)
    const isDecember = selectedMonth === 11;
    const prognosaMTD = isDecember ? totalOpenCommitmentsAnnual : totalOpenCommitmentsCurrentMonth;
    const prognosaAnnual = totalOpenCommitmentsAnnual;

    const effectiveTargetMTD = isDecember ? totalAnnual : targetMTD;

    // Sisa pagu bulan berjalan = target bulan berjalan dikurangi realisasi bulan berjalan dikurangi prognosa bulan berjalan
    const sisaPaguBulanBerjalan = effectiveTargetMTD - realMTD - prognosaMTD;

    // Sisa pagu satu tahun = target satu tahun dikurangi realisasi bulan berjalan dikurangi prognosa satu tahun
    const sisaPaguAnnual = totalAnnual - realMTD - prognosaAnnual;

    // Persentase bulan berjalan dan satu tahun didapat dari realisasi ditambah prognosa dibagi pagu
    const penyerapanTahunanPct = totalAnnual > 0 ? ((realMTD + prognosaAnnual) / totalAnnual) * 100 : 0;
    const penyerapanSdMonthPct = effectiveTargetMTD > 0 ? ((realMTD + prognosaMTD) / effectiveTargetMTD) * 100 : 0;

    return {
      totalAnnual,
      targetMTD: effectiveTargetMTD,
      realMTD,
      prognosaMTD,
      prognosaAnnual,
      sisaPaguBulanBerjalan,
      sisaPaguAnnual,
      penyerapanTahunanPct,
      penyerapanSdMonthPct,
      monthlyRealizationTotals,
      monthlyBudgetTotals
    };
  }, [filteredItems, selectedMonth, totalOpenCommitmentsCurrentMonth, totalOpenCommitmentsAnnual]);

  // Export Matrix to Excel
  const handleExportExcel = () => {
    let wsData: any[][] = [];

    if (matrixMode === 'summary_mtd') {
      wsData.push([
        `MATRIKS REALISASI ANGGARAN & PROGNOSA S/D ${MONTH_NAMES[selectedMonth].toUpperCase()} ${selectedYear}`,
        '', '', '', '', '', '', '', '', '', '', ''
      ]);
      wsData.push([
        hideZeroAccounts 
          ? `Status Filter: Hanya Menampilkan Akun Aktif / Non-Nol (${filteredItems.length} baris akun)`
          : `Status Filter: Menampilkan Semua Akun (${filteredItems.length} baris akun)`
      ]);
      wsData.push([
        'Rumus 1: Sisa Pagu Bulan Berjalan = Target s.d. Bulan Berjalan - Realisasi s.d. Bulan Berjalan - Prognosa Bulan Berjalan'
      ]);
      wsData.push([
        'Catatan Rumus 1: Prognosa Bulan Berjalan = Komitmen Terbuka Bulan Berjalan + Komitmen Terbuka Bulan-Bulan Sebelumnya'
      ]);
      wsData.push([
        'Rumus 2: Sisa Pagu 1 Tahun = Target 1 Tahun - Realisasi Bulan Berjalan - Prognosa 1 Tahun'
      ]);
      wsData.push([
        'Rumus 3: % Bulan Berjalan = (Realisasi Bulan Berjalan + Prognosa Bulan Berjalan) / Target Bulan Berjalan'
      ]);
      wsData.push([
        'Rumus 4: % 1 Tahun = (Realisasi Bulan Berjalan + Prognosa 1 Tahun) / Pagu 1 Tahun'
      ]);
      wsData.push([
        'NO', 'KODE GL', 'URAIAN AKUN', 'KELOMPOK POS', 
        `PAGU ANGGARAN ${selectedYear}`, 
        `TARGET S/D ${MONTH_SHORT_NAMES[selectedMonth]}`, 
        `REALISASI S/D ${MONTH_SHORT_NAMES[selectedMonth]}`, 
        `PROGNOSA BLN BERJALAN`,
        `SISA PAGU BULAN BERJALAN`, 
        `PROGNOSA 1 TAHUN`,
        `SISA PAGU 1 TAHUN`, 
        `% (REAL + PROG) BLN BERJALAN`,
        `% (REAL + PROG) 1 TAHUN`
      ]);

      filteredItems.forEach((item, idx) => {
        let rMTD = 0;
        let bMTD = 0;
        for (let m = 0; m <= selectedMonth; m++) {
          rMTD += item.realizationMonthly?.[m] || 0;
          bMTD += item.budgetMonthly?.[m] || 0;
        }

        const isDecember = selectedMonth === 11;
        const progItem = isDecember ? getItemPrognosaAnnual(item) : getItemPrognosaCurrentMonth(item);
        const progAnnualItem = getItemPrognosaAnnual(item);
        const effectiveBMTD = isDecember && (item.budgetAnnual > 0 || bMTD === 0) ? item.budgetAnnual : bMTD;

        // Sisa pagu bulan berjalan = target s.d. bulan berjalan dikurangi realisasi s.d. bulan berjalan dikurangi prognosa bulan berjalan
        const sisaBlnBerjalan = effectiveBMTD - rMTD - progItem;

        // Sisa pagu satu tahun = target satu tahun dikurangi realisasi bulan berjalan dikurangi prognosa satu tahun
        const sisaTahunan = item.budgetAnnual - rMTD - progAnnualItem;

        // Persentase bulan berjalan dan satu tahun didapat dari realisasi ditambah prognosa dibagi pagu
        const pctTahunan = item.budgetAnnual > 0 ? ((rMTD + progAnnualItem) / item.budgetAnnual) * 100 : 0;
        const pctMTD = effectiveBMTD > 0 ? ((rMTD + progItem) / effectiveBMTD) * 100 : 0;

        wsData.push([
          idx + 1,
          item.code,
          item.name,
          item.posType,
          item.budgetAnnual,
          effectiveBMTD,
          rMTD,
          progItem,
          sisaBlnBerjalan,
          progAnnualItem,
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
              Tabel matriks komprehensif rencana anggaran, realisasi s/d cut-off, komitmen prognosa, serta sisa pagu bulan berjalan dan 1 tahun
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

        {/* Filter bar: Search, POS Chips, & Toggle Sembunyikan Akun Nol */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kode GL atau uraian akun..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Toggle Sembunyikan Akun Bernilai Nol */}
            <button
              type="button"
              id="btn-toggle-hide-zero-accounts"
              onClick={() => setHideZeroAccounts(!hideZeroAccounts)}
              className={`w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
                hideZeroAccounts
                  ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 ring-1 ring-blue-400/20'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title={
                hideZeroAccounts
                  ? `Mode ringkas aktif: Menyembunyikan ${hiddenCount} akun bernilai Rp 0. Klik untuk menampilkan seluruh akun.`
                  : 'Semua akun ditampilkan. Klik untuk menyembunyikan akun yang bernilai Rp 0.'
              }
            >
              {hideZeroAccounts ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Sembunyikan Akun Nol</span>
                  {hiddenCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-200/80 text-blue-800 font-bold ml-0.5">
                      {hiddenCount} tersembunyi
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Tampilkan Semua Akun</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-semibold ml-0.5">
                    {totalNonHeaderCount} akun
                  </span>
                </>
              )}
            </button>
          </div>

          {/* POS Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
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

        {/* Year-End December Reconciliation Banner */}
        {selectedMonth === 11 && (
          <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-emerald-950 text-sm">
                    Status Tutup Buku (Desember): Rekonsiliasi Sisa Pagu Berjalan & Sisa Pagu 1 Tahun Selesai
                  </h4>
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Balance 100%
                  </span>
                </div>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  Pada periode penutup tahun (Desember), target s.d. bulan berjalan dikonsolidasikan dengan Pagu Tahunan SKKO dan seluruh komitmen terbuka tahun berjalan diakui penuh. Nilai <strong>Sisa Pagu Bulan Berjalan</strong> dan <strong>Sisa Pagu 1 Tahun</strong> terkonsolidasi seimbang dan identik.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-900 bg-white/90 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Selisih Rekonsiliasi: <strong>Rp 0</strong> (Identik)</span>
            </div>
          </div>
        )}

        {/* Formula Information Note */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg px-3.5 py-2.5 flex items-center justify-between flex-wrap gap-2 text-[11px] text-amber-900">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 self-start mt-0.5" />
            <div className="space-y-0.5">
              <div>
                <strong>Prognosa Bulan Berjalan</strong> = 
                <span className="font-mono font-semibold ml-1">Komitmen Bulan Berjalan</span> + 
                <span className="font-mono font-semibold ml-1">Komitmen Terbuka Bulan-Bulan Sebelumnya</span>.
                {selectedMonth === 11 && (
                  <span className="ml-1 text-emerald-700 font-semibold italic">(Di bulan Desember mencakup seluruh komitmen terbuka 1 tahun).</span>
                )}
              </div>
              <div>
                <strong>Sisa Pagu Bulan Berjalan</strong> = 
                <span className="font-mono font-semibold ml-1">Target Bulan Berjalan</span> − 
                <span className="font-mono font-semibold ml-1">Realisasi Bulan Berjalan</span> − 
                <span className="font-mono font-semibold ml-1">Prognosa Bulan Berjalan</span>.
              </div>
              <div>
                <strong>Sisa Pagu 1 Tahun</strong> = 
                <span className="font-mono font-semibold ml-1">Target 1 Tahun (Pagu SKKO)</span> − 
                <span className="font-mono font-semibold ml-1">Realisasi Bulan Berjalan</span> − 
                <span className="font-mono font-semibold ml-1">Prognosa 1 Tahun</span>.
                {selectedMonth === 11 && (
                  <span className="ml-1 text-emerald-700 font-semibold italic">(Pada tutup buku Desember, nilainya identik dengan Sisa Pagu Bulan Berjalan).</span>
                )}
              </div>
              <div>
                <strong>% Bulan Berjalan</strong> = (
                <span className="font-mono font-semibold ml-1">Realisasi Bulan Berjalan</span> + 
                <span className="font-mono font-semibold ml-1">Prognosa Bulan Berjalan</span>) ÷ 
                <span className="font-mono font-semibold ml-1">Target Bulan Berjalan</span>.
                <strong className="ml-2.5">% 1 Tahun</strong> = (
                <span className="font-mono font-semibold ml-1">Realisasi Bulan Berjalan</span> + 
                <span className="font-mono font-semibold ml-1">Prognosa 1 Tahun</span>) ÷ 
                <span className="font-mono font-semibold ml-1">Pagu 1 Tahun</span>.
              </div>
            </div>
          </div>
          <span className="text-amber-800 text-[10px] italic">
            *Akun bernilai nol disembunyikan otomatis agar tampilan lebih ringkas. Begitu akun memiliki nilai data, akun akan langsung muncul kembali.
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
          <span className="text-purple-600 block text-[11px] font-semibold" title="Total komitmen terbuka bulan berjalan ditambah komitmen terbuka bulan-bulan sebelumnya">Prog Bln Berjalan</span>
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
        <div className={`p-3 rounded-xl border shadow-sm text-xs ${
          totals.sisaPaguAnnual >= 0
            ? 'bg-slate-50 border-slate-300/80 text-slate-900'
            : 'bg-rose-50/50 border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-center justify-between">
            <span className="block text-[11px] font-bold text-slate-700" title="Target 1 Tahun dikurangi Realisasi Bulan Berjalan dikurangi Prognosa 1 Tahun">
              Sisa Pagu 1 Tahun
            </span>
            <Calculator className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </div>
          <span className={`font-black text-sm font-mono block mt-0.5 ${
            totals.sisaPaguAnnual >= 0 ? 'text-slate-900' : 'text-rose-600'
          }`}>
            {formatRupiahShort(totals.sisaPaguAnnual)}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-indigo-100 bg-indigo-50/30 shadow-sm text-xs">
          <span className="text-indigo-700 block text-[11px] font-semibold" title="(Realisasi Bulan Berjalan + Prognosa Bulan Berjalan) / Target Bulan Berjalan">% (Real+Prog) Bln</span>
          <span className="font-bold text-indigo-700 text-sm">{formatPercent(totals.penyerapanSdMonthPct)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 shadow-sm text-xs">
          <span className="text-emerald-700 block text-[11px] font-semibold" title="(Realisasi Bulan Berjalan + Prognosa 1 Tahun) / Pagu 1 Tahun">% (Real+Prog) 1 Thn</span>
          <span className="font-bold text-emerald-700 text-sm">{formatPercent(totals.penyerapanTahunanPct)}</span>
        </div>
      </div>

      {/* Main Table Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <EyeOff className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-800">Tidak Ada Akun yang Memenuhi Filter</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {hideZeroAccounts 
                ? `Seluruh akun saat ini bernilai Rp 0 (${hiddenCount} akun disembunyikan). Bila di kemudian hari data akun terisi nilai anggaran/realisasi/komitmen, akun otomatis ditampilkan kembali.`
                : 'Tidak ditemukan akun yang cocok dengan kata kunci pencarian atau filter POS yang dipilih.'
              }
            </p>
            {hideZeroAccounts && (
              <button
                type="button"
                onClick={() => setHideZeroAccounts(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Tampilkan Seluruh Akun Anggaran ({totalNonHeaderCount} Akun)</span>
              </button>
            )}
          </div>
        ) : (
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
                    <th className="py-3 px-3 text-right bg-purple-950/80 text-purple-200" title="Komitmen terbuka bulan berjalan ditambah komitmen bulan-bulan sebelumnya yang statusnya masih terbuka">
                      Prog Bln Berjalan
                    </th>
                    <th className="py-3 px-3 text-right bg-amber-950/90 text-amber-300 border-x border-slate-800" title="Target s.d. Bulan Berjalan dikurangi Realisasi s.d. Bulan Berjalan dikurangi Prognosa Bulan Berjalan">
                      <span className="block">Sisa Pagu</span>
                      <span className="text-[9px] text-amber-200 font-normal">
                        Bln Berjalan {selectedMonth === 11 && <span className="text-[8px] bg-amber-500/40 text-amber-100 px-1 py-0.2 rounded ml-1 font-bold">DES: IDENTIK</span>}
                      </span>
                    </th>
                    <th className="py-3 px-3 text-right bg-purple-950/60 text-purple-200" title="Semua nilai kontrak/komitmen terbuka 1 tahun yang belum tercatat dokumen SPJ">
                      Prog 1 Thn
                    </th>
                    <th className="py-3 px-3 text-right bg-amber-950/70 text-amber-200 border-x border-slate-800" title="Target 1 Tahun dikurangi Realisasi Bulan Berjalan dikurangi Prognosa 1 Tahun">
                      <span className="block">Sisa Pagu</span>
                      <span className="text-[9px] text-amber-300 font-normal">
                        1 Tahun {selectedMonth === 11 && <span className="text-[8px] bg-emerald-500/40 text-emerald-100 px-1 py-0.2 rounded ml-1 font-bold">BALANCE</span>}
                      </span>
                    </th>
                    <th className="py-3 px-3 text-center bg-indigo-950 text-indigo-200 border-x border-slate-800" title="(Realisasi Bulan Berjalan + Prognosa Bulan Berjalan) / Target Bulan Berjalan">
                      <span className="block">% (Real + Prog)</span>
                      <span className="text-[9px] text-indigo-300">Bln Berjalan</span>
                    </th>
                    <th className="py-3 px-3 text-center bg-emerald-950 text-emerald-200" title="(Realisasi Bulan Berjalan + Prognosa 1 Tahun) / Pagu 1 Tahun">
                      <span className="block">% (Real + Prog)</span>
                      <span className="text-[9px] text-emerald-300">1 Tahun</span>
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

                  // Prognosa Bulan Berjalan & Prognosa 1 Tahun
                  // Pada bulan Desember (penutup tahun), komitmen terbuka tahun berjalan diakui penuh
                  const isDecember = selectedMonth === 11;
                  const prognosaItem = isDecember ? getItemPrognosaAnnual(item) : getItemPrognosaCurrentMonth(item);
                  const prognosaAnnualItem = getItemPrognosaAnnual(item);

                  // Pada bulan Desember: target s.d. bulan berjalan diselaraskan dengan pagu tahunan akun
                  const effectiveBMTD = isDecember && (item.budgetAnnual > 0 || bMTD === 0) 
                    ? item.budgetAnnual 
                    : bMTD;

                  // Sisa pagu bulan berjalan = target bulan berjalan dikurangi realisasi bulan berjalan dikurangi prognosa bulan berjalan
                  const sisaPaguBulanBerjalanItem = effectiveBMTD - rMTD - prognosaItem;

                  // Sisa pagu satu tahun = target satu tahun dikurangi realisasi bulan berjalan dikurangi prognosa satu tahun
                  const sisaPaguAnnualItem = item.budgetAnnual - rMTD - prognosaAnnualItem;

                  // Persentase bulan berjalan dan satu tahun didapat dari realisasi ditambah prognosa dibagi pagu
                  const serapTahunanPct = item.budgetAnnual > 0 ? ((rMTD + prognosaAnnualItem) / item.budgetAnnual) * 100 : 0;
                  const serapSdMonthPct = effectiveBMTD > 0 ? ((rMTD + prognosaItem) / effectiveBMTD) * 100 : 0;

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
                            <td className="py-2.5 px-3 text-right">{formatRupiah(effectiveBMTD)}</td>
                            <td className="py-2.5 px-3 text-right bg-slate-200 text-blue-800">{formatRupiah(rMTD)}</td>
                            <td 
                              className="py-2.5 px-3 text-right text-purple-700 bg-purple-50/50 cursor-help"
                              title={getPrognosaTooltip(item, false)}
                            >
                              {formatRupiah(prognosaItem)}
                            </td>
                            <td className={`py-2.5 px-3 text-right bg-amber-50/70 border-x border-amber-200 ${
                              sisaPaguBulanBerjalanItem < 0 ? 'text-rose-700 font-extrabold' : 'text-amber-800'
                            }`}>
                              {formatRupiah(sisaPaguBulanBerjalanItem)}
                            </td>
                            <td 
                              className="py-2.5 px-3 text-right text-purple-700 bg-purple-50/40 cursor-help"
                              title={getPrognosaTooltip(item, true)}
                            >
                              {formatRupiah(prognosaAnnualItem)}
                            </td>
                            <td className={`py-2.5 px-3 text-right bg-amber-50/50 border-r border-amber-200 ${
                              sisaPaguAnnualItem < 0 ? 'text-rose-700 font-extrabold' : 'text-slate-800'
                            }`}>
                              {formatRupiah(sisaPaguAnnualItem)}
                            </td>
                            <td 
                              className="py-2.5 px-3 text-center text-indigo-800 bg-indigo-50/50"
                              title={`(Realisasi ${formatRupiah(rMTD)} + Prognosa ${formatRupiah(prognosaItem)}) ÷ Target ${formatRupiah(bMTD)} = ${formatPercent(serapSdMonthPct)}`}
                            >
                              {formatPercent(serapSdMonthPct)}
                            </td>
                            <td 
                              className="py-2.5 px-3 text-center text-emerald-800 bg-emerald-50/50"
                              title={`(Realisasi ${formatRupiah(rMTD)} + Prognosa 1 Thn ${formatRupiah(prognosaAnnualItem)}) ÷ Pagu ${formatRupiah(item.budgetAnnual)} = ${formatPercent(serapTahunanPct)}`}
                            >
                              {formatPercent(serapTahunanPct)}
                            </td>
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
                          <td className="py-2.5 px-3 text-right text-slate-600" title={isDecember ? `Target s.d. Desember diselaraskan dengan Pagu Tahunan SKKO (${formatRupiah(effectiveBMTD)})` : undefined}>
                            {formatRupiah(effectiveBMTD)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-blue-700 bg-blue-50/50">{formatRupiah(rMTD)}</td>
                          
                          {/* Prognosa Bulan Berjalan */}
                          <td 
                            className={`py-2.5 px-3 text-right cursor-help ${prognosaItem > 0 ? 'font-semibold text-purple-700 bg-purple-50/30' : 'text-slate-400'}`}
                            title={getPrognosaTooltip(item, false)}
                          >
                            {formatRupiah(prognosaItem)}
                          </td>

                          {/* Sisa Pagu Bulan Berjalan = Target - Realisasi - Prognosa */}
                          <td className={`py-2.5 px-3 text-right font-bold border-x border-amber-100 ${
                            sisaPaguBulanBerjalanItem < 0 
                              ? 'text-rose-600 bg-rose-50/40' 
                              : 'text-amber-800 bg-amber-50/30'
                          }`}
                          title={`Target (${formatRupiah(effectiveBMTD)}) - Realisasi (${formatRupiah(rMTD)}) - Prognosa (${formatRupiah(prognosaItem)}) = ${formatRupiah(sisaPaguBulanBerjalanItem)}`}
                          >
                            {formatRupiah(sisaPaguBulanBerjalanItem)}
                          </td>

                          {/* Prognosa 1 Tahun */}
                          <td 
                            className={`py-2.5 px-3 text-right cursor-help ${prognosaAnnualItem > 0 ? 'font-semibold text-purple-700 bg-purple-50/20' : 'text-slate-400'}`}
                            title={getPrognosaTooltip(item, true)}
                          >
                            {formatRupiah(prognosaAnnualItem)}
                          </td>

                          {/* Sisa Pagu 1 Tahun = Target 1 Thn - Realisasi Bln Berjalan - Prognosa 1 Thn */}
                          <td className={`py-2.5 px-3 text-right font-bold border-r border-slate-100 ${
                            sisaPaguAnnualItem < 0 
                              ? 'text-rose-600 bg-rose-50/20' 
                              : 'text-slate-800'
                          }`}
                          title={`Target 1 Thn (${formatRupiah(item.budgetAnnual)}) - Realisasi (${formatRupiah(rMTD)}) - Prognosa 1 Thn (${formatRupiah(prognosaAnnualItem)}) = ${formatRupiah(sisaPaguAnnualItem)}`}
                          >
                            {formatRupiah(sisaPaguAnnualItem)}
                          </td>

                          <td 
                            className="py-2.5 px-3 text-center font-sans font-bold text-indigo-700 bg-indigo-50/30 border-x border-slate-100"
                            title={`(Realisasi ${formatRupiah(rMTD)} + Prognosa ${formatRupiah(prognosaItem)}) ÷ Target ${formatRupiah(effectiveBMTD)} = ${formatPercent(serapSdMonthPct)}`}
                          >
                            {formatPercent(serapSdMonthPct)}
                          </td>
                          <td 
                            className="py-2.5 px-3 text-center font-sans font-bold text-emerald-700 bg-emerald-50/30"
                            title={`(Realisasi ${formatRupiah(rMTD)} + Prognosa 1 Thn ${formatRupiah(prognosaAnnualItem)}) ÷ Pagu 1 Thn ${formatRupiah(item.budgetAnnual)} = ${formatPercent(serapTahunanPct)}`}
                          >
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
                      <td className="py-3 px-3 text-right font-mono bg-purple-950/60 text-purple-200">{formatRupiah(totals.prognosaAnnual)}</td>
                      <td className={`py-3 px-3 text-right font-mono bg-amber-950/80 text-amber-200 border-r border-slate-800 ${
                        totals.sisaPaguAnnual < 0 ? 'text-rose-300' : ''
                      }`}>
                        {formatRupiah(totals.sisaPaguAnnual)}
                      </td>
                      <td 
                        className="py-3 px-3 text-center font-sans text-indigo-300 bg-slate-950 border-x border-slate-800"
                        title={`(Total Realisasi ${formatRupiah(totals.realMTD)} + Total Prognosa Bln ${formatRupiah(totals.prognosaMTD)}) ÷ Total Target ${formatRupiah(totals.targetMTD)} = ${formatPercent(totals.penyerapanSdMonthPct)}`}
                      >
                        {formatPercent(totals.penyerapanSdMonthPct)}
                      </td>
                      <td 
                        className="py-3 px-3 text-center font-sans text-emerald-300 bg-slate-950"
                        title={`(Total Realisasi ${formatRupiah(totals.realMTD)} + Total Prognosa 1 Thn ${formatRupiah(totals.prognosaAnnual)}) ÷ Total Pagu 1 Thn ${formatRupiah(totals.totalAnnual)} = ${formatPercent(totals.penyerapanTahunanPct)}`}
                      >
                        {formatPercent(totals.penyerapanTahunanPct)}
                      </td>
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
        )}
      </div>
    </div>
  );
};
