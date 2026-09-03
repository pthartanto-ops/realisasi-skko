import React, { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  AlertOctagon,
  ArrowUpRight, 
  Activity, 
  Briefcase, 
  Wrench, 
  Building, 
  Car, 
  ShieldCheck,
  Calendar,
  Receipt,
  FileSpreadsheet,
  FileEdit,
  TableProperties,
  Target,
  Calculator,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { 
  formatRupiah, 
  formatRupiahShort, 
  formatPercent, 
  MONTH_SHORT_NAMES, 
  MONTH_NAMES,
  getPerformanceStatus 
} from '../utils/formatters';
import { PosType } from '../types';

interface DashboardViewProps {
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { 
    budgetItems, 
    indicators, 
    additionalTransactions, 
    alihDayaContracts,
    selectedYear, 
    selectedMonth,
    setSelectedMonth,
    canAccessTab 
  } = useApp();

  // Alih Daya summary computation
  const alihDayaSummary = useMemo(() => {
    let totalNominal = 0;
    let totalTercatat = 0;
    let totalBelumTercatat = 0;
    let countTercatat = 0;
    let totalTermins = 0;

    alihDayaContracts.forEach(c => {
      c.termins.forEach(t => {
        totalTermins++;
        const nom = t.nominalTagihan || 0;
        totalNominal += nom;
        if (t.statusBeban === 'Tercatat' || (t.documentNumber && t.documentNumber.trim() !== '')) {
          totalTercatat += nom;
          countTercatat++;
        } else {
          totalBelumTercatat += nom;
        }
      });
    });

    const percentTercatat = totalNominal > 0 ? (totalTercatat / totalNominal) * 100 : 0;

    return {
      countContracts: alihDayaContracts.length,
      totalTermins,
      totalNominal,
      totalTercatat,
      totalBelumTercatat,
      countTercatat,
      percentTercatat
    };
  }, [alihDayaContracts]);

  // Summary computations
  const summary = useMemo(() => {
    // Only non-header or account level items to avoid double counting
    const accountItems = budgetItems.filter(i => !i.isGroupHeader);

    let totalAnnualBudget = 0;
    let totalTargetMonthToDate = 0;
    let totalRealMonthToDate = 0;
    let totalRealAnnual = 0;

    // Monthly aggregation array (0..11)
    const monthlyBudgetTrend = Array(12).fill(0);
    const monthlyTotalRealTrend = Array(12).fill(0);

    accountItems.forEach(item => {
      totalAnnualBudget += (item.budgetAnnual || 0);

      for (let m = 0; m < 12; m++) {
        const bMonth = item.budgetMonthly[m] || 0;
        const totMonth = item.realizationMonthly?.[m] || 0;

        monthlyBudgetTrend[m] += bMonth;
        monthlyTotalRealTrend[m] += totMonth;

        totalRealAnnual += totMonth;

        if (m <= selectedMonth) {
          totalTargetMonthToDate += bMonth;
          totalRealMonthToDate += totMonth;
        }
      }
    });

    const sisaAnggaran = totalAnnualBudget - totalRealMonthToDate;
    const penyerapanPct = totalAnnualBudget > 0 ? (totalRealMonthToDate / totalAnnualBudget) * 100 : 0;
    const penyerapanVsTargetMonth = totalTargetMonthToDate > 0 ? (totalRealMonthToDate / totalTargetMonthToDate) * 100 : 0;

    // By POS breakdown
    const posList: PosType[] = ['Pos 52', 'Pos 53', 'Pos 54', 'Beban Sewa', 'Pos 72'];
    
    const posBreakdown = posList.map(pos => {
      const pItems = accountItems.filter(i => i.posType === pos || (pos === 'Beban Sewa' && (i.posType as string) === 'Sewa Non AHG'));
      let pAnnual = 0;
      let pTargetMTD = 0;
      let pRealMTD = 0;

      pItems.forEach(item => {
        pAnnual += (item.budgetAnnual || 0);
        for (let m = 0; m <= selectedMonth; m++) {
          pTargetMTD += (item.budgetMonthly[m] || 0);
          pRealMTD += (item.realizationMonthly?.[m] || 0);
        }
      });

      const pSisa = pAnnual - pRealMTD;
      const pPctAnnual = pAnnual > 0 ? (pRealMTD / pAnnual) * 100 : 0;
      const pPctMTD = pTargetMTD > 0 ? (pRealMTD / pTargetMTD) * 100 : 0;

      return {
        pos,
        name: pos === 'Pos 52' ? 'Beban Kepegawaian (Pos 52)' :
              pos === 'Pos 53' ? 'Beban Pemeliharaan (Pos 53)' :
              pos === 'Pos 54' ? 'Biaya Administrasi & Umum (Pos 54)' :
              pos === 'Beban Sewa' ? 'Beban Sewa' :
              'Beban Pensiun (Pos 72)',
        annual: pAnnual,
        targetMTD: pTargetMTD,
        realMTD: pRealMTD,
        sisa: pSisa,
        percentageAnnual: pPctAnnual,
        percentageMTD: pPctMTD,
        percentage: pPctAnnual,
        count: pItems.length
      };
    });

    // Chart data for monthly trend
    let cumTarget = 0;
    let cumReal = 0;
    const trendChartData = MONTH_SHORT_NAMES.map((name, idx) => {
      cumTarget += monthlyBudgetTrend[idx];
      cumReal += monthlyTotalRealTrend[idx];
      return {
        month: name,
        anggaran: monthlyBudgetTrend[idx],
        realisasi: monthlyTotalRealTrend[idx],
        cumTarget,
        cumReal,
        isCurrentMonth: idx === selectedMonth
      };
    });

    return {
      totalAnnualBudget,
      totalTargetMonthToDate,
      totalRealMonthToDate,
      sisaAnggaran,
      penyerapanPct,
      penyerapanVsTargetMonth,
      posBreakdown,
      trendChartData
    };
  }, [budgetItems, selectedMonth]);

  // Tambahan Transaksi summary
  const additionalSum = useMemo(() => {
    const active = additionalTransactions.filter(t => t.isActive);
    const total = active.reduce((sum, t) => sum + (t.amount || 0), 0);
    const byPos = {
      pos53: active.filter(t => t.posType === 'Pos 53').reduce((s, t) => s + t.amount, 0),
      pos54: active.filter(t => t.posType === 'Pos 54').reduce((s, t) => s + t.amount, 0),
      sewa: active.filter(t => t.posType === 'Beban Sewa' || (t.posType as string) === 'Sewa Non AHG').reduce((s, t) => s + t.amount, 0)
    };
    return { total, byPos, count: active.length };
  }, [additionalTransactions]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  const pieData = summary.posBreakdown
    .filter(p => p.realMTD > 0)
    .map(p => ({
      name: p.pos,
      value: p.realMTD
    }));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Period Control */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>Monitoring Realisasi Anggaran Operasional</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard Kinerja Realisasi Anggaran {selectedYear}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Pemantauan terintegrasi antara pagu SKKO, realisasi penyerapan anggaran (SAP), 
              serta komitmen kontrak rutin hingga periode <span className="font-semibold text-blue-300">{MONTH_NAMES[selectedMonth]} {selectedYear}</span>.
            </p>
          </div>

          {/* Month selector chips */}
          <div className="bg-slate-800/90 backdrop-blur p-3 rounded-xl border border-slate-700/80 shadow-lg">
            <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
              <span>Cut-off Pemantauan:</span>
              <span className="text-blue-400 font-bold">s/d {MONTH_NAMES[selectedMonth]}</span>
            </div>
            <div className="grid grid-cols-6 gap-1 sm:grid-cols-12">
              {MONTH_SHORT_NAMES.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedMonth(idx)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                    selectedMonth === idx
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-300'
                      : idx <= selectedMonth
                      ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pagu Anggaran Tahunan */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pagu Anggaran (SKKO)</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatRupiahShort(summary.totalAnnualBudget)}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              {formatRupiah(summary.totalAnnualBudget)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Target s/d {MONTH_NAMES[selectedMonth]}:</span>
            <span className="font-semibold text-slate-800">{formatRupiahShort(summary.totalTargetMonthToDate)}</span>
          </div>
        </div>

        {/* Card 2: Realisasi SAP s/d Bulan Ini */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Realisasi SAP (s/d {MONTH_NAMES[selectedMonth]})</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-600">
              {formatRupiahShort(summary.totalRealMonthToDate)}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              {formatRupiah(summary.totalRealMonthToDate)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Deviasi Target:</span>
            <span className={`font-semibold ${summary.totalRealMonthToDate <= summary.totalTargetMonthToDate ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatRupiahShort(summary.totalRealMonthToDate - summary.totalTargetMonthToDate)}
            </span>
          </div>
        </div>

        {/* Card 3: Persentase Penyerapan */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">% Realisasi Anggaran</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold text-indigo-700">s.d. Bln thd Angg s.d. Bln:</span>
              <span className="text-xl font-black text-indigo-700 font-mono">
                {formatPercent(summary.penyerapanVsTargetMonth)}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, summary.penyerapanVsTargetMonth)}%` }}
              />
            </div>

            <div className="flex items-baseline justify-between mt-2.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-emerald-700">s.d. Bln thd Angg 1 Thn:</span>
              <span className="text-sm font-extrabold text-emerald-700 font-mono">
                {formatPercent(summary.penyerapanPct)}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, summary.penyerapanPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Sisa Pagu Anggaran */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sisa Pagu Anggaran</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600">
              {formatRupiahShort(summary.sisaAnggaran)}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              {formatRupiah(summary.sisaAnggaran)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Komitmen Tambahan:</span>
            <span className="font-semibold text-rose-600">+{formatRupiahShort(additionalSum.total)}</span>
          </div>
        </div>
      </div>

      {/* Indikator Kinerja Utama (Optimalisasi Biaya) Section */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Indikator Kinerja Utama (Optimalisasi Biaya)
              </h3>
              <p className="text-xs text-slate-500">
                Pencapaian target indikator efisiensi dan optimalisasi per pos s/d {MONTH_NAMES[selectedMonth]} {selectedYear}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('performance')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>Lihat Analisis Indikator</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {indicators.map((ind) => {
            const currentPct = ind.monthlyPercentage[selectedMonth] || 0;
            const currentReal = ind.monthlyRealization[selectedMonth] || 0;
            const currentTarget = ind.monthlyTarget[selectedMonth] || 0;
            const deviasi = currentReal - currentTarget;
            const statusInfo = getPerformanceStatus(currentPct);

            const getIndIcon = (code: string) => {
              if (code.includes('53')) return Wrench;
              if (code.includes('54')) return Building;
              if (code.includes('52')) return Briefcase;
              return Car;
            };
            const IndIcon = getIndIcon(ind.code || ind.id);

            return (
              <div 
                key={ind.id} 
                className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category & Status Badge Row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                        <IndIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide truncate">
                        {ind.posType || ind.pos}
                      </span>
                    </div>

                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${statusInfo.badgeClass}`}>
                      {statusInfo.status === 'optimal' && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                      {statusInfo.status === 'overbudget' && <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />}
                      {statusInfo.status === 'kurang_optimal' && <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />}
                      {statusInfo.status === 'bermasalah' && <AlertOctagon className="w-3 h-3 text-red-600 shrink-0" />}
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>

                  {/* Indicator Title: clean 2-line wrapped text, never cut off */}
                  <h4 className="text-xs font-bold text-slate-900 leading-snug min-h-[2.5rem] flex items-center" title={ind.name}>
                    {ind.name}
                  </h4>

                  {/* Percentage Metric & Target Chip */}
                  <div className="flex items-baseline justify-between mt-3 mb-2">
                    <div className={`text-2xl font-black font-mono tracking-tight ${statusInfo.textClass}`}>
                      {formatPercent(currentPct)}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                      Opt: 95-100%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mb-3">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        statusInfo.status === 'optimal' ? 'bg-emerald-500' :
                        statusInfo.status === 'overbudget' ? 'bg-rose-500' :
                        statusInfo.status === 'kurang_optimal' ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, currentPct))}%` }}
                    />
                  </div>
                </div>

                {/* Realisasi vs Target SKKO Breakdown */}
                <div className="pt-2.5 border-t border-slate-200/70 text-[11px] space-y-1.5 text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Realisasi:</span>
                    <span className="font-bold text-slate-800">{formatRupiahShort(currentReal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Target SKKO:</span>
                    <span className="font-semibold text-slate-700">{formatRupiahShort(currentTarget)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[10px]">
                    <span className="text-slate-400">Deviasi:</span>
                    <span className={`font-semibold font-mono ${deviasi <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {deviasi > 0 ? '+' : ''}{formatRupiahShort(deviasi)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Receipt className="w-4 h-4 text-blue-600" />
          Aksi Cepat Menu:
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {canAccessTab('realization_input') && (
            <button
              type="button"
              onClick={() => onNavigateTab('realization_input')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Input Realisasi Manual</span>
            </button>
          )}

          {canAccessTab('realization_import') && (
            <button
              type="button"
              onClick={() => onNavigateTab('realization_import')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import Excel</span>
            </button>
          )}

          {canAccessTab('budget_input') && (
            <button
              type="button"
              onClick={() => onNavigateTab('budget_input')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileEdit className="w-3.5 h-3.5 text-slate-500" />
              <span>Input &amp; Edit Anggaran</span>
            </button>
          )}

          {canAccessTab('matrix') && (
            <button
              type="button"
              onClick={() => onNavigateTab('matrix')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <TableProperties className="w-3.5 h-3.5 text-slate-500" />
              <span>Matriks Monitoring</span>
            </button>
          )}

          {canAccessTab('prognosa') && (
            <button
              type="button"
              onClick={() => onNavigateTab('prognosa')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-slate-500" />
              <span>Prognosa Anggaran</span>
            </button>
          )}

          {canAccessTab('performance') && (
            <button
              type="button"
              onClick={() => onNavigateTab('performance')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 text-slate-500" />
              <span>Indikator &amp; Kinerja</span>
            </button>
          )}

          {canAccessTab('reports') && (
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Laporan &amp; Ringkasan</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Tren Realisasi Bulanan vs Anggaran</h3>
              <p className="text-xs text-slate-500">Perbandingan realisasi bulanan terhadap rencana anggaran {selectedYear}</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-600">
              Jan - Des {selectedYear}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.trendChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis 
                  tickFormatter={(v) => `${(v / 1_000_000_000).toFixed(0)}M`} 
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value: any) => [formatRupiah(value), '']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="anggaran" name="Target Anggaran" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realisasi" name="Realisasi Anggaran" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Komposisi Beban */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-base text-slate-900">Komposisi Realisasi POS</h3>
              <PieChartIcon className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-4">Porsi penyerapan dana per kelompok beban s/d {MONTH_NAMES[selectedMonth]}</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [formatRupiah(val), 'Porsi']}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mini Legend List */}
          <div className="space-y-2 mt-2 pt-3 border-t border-slate-100 text-xs">
            {summary.posBreakdown.map((pos, idx) => (
              <div key={pos.pos} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-medium text-slate-700 truncate max-w-[140px]">{pos.pos}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{formatRupiahShort(pos.realMTD)}</span>
                  <span className="text-slate-400 ml-1.5">({formatPercent(summary.totalRealMonthToDate > 0 ? (pos.realMTD / summary.totalRealMonthToDate) * 100 : 0, 1)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POS Details Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Rincian Realisasi per Kelompok POS</h3>
            <p className="text-xs text-slate-500">Status penyerapan anggaran pada Pos 52, Pos 53, Pos 54, Beban Sewa &amp; Pos 72</p>
          </div>
          <button
            onClick={() => onNavigateTab('matrix')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Lihat Matriks Lengkap <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.posBreakdown.map((pos, idx) => {
            const getIcon = (posCode: PosType) => {
              switch (posCode) {
                case 'Pos 52': return Briefcase;
                case 'Pos 53': return Wrench;
                case 'Pos 54': return Building;
                case 'Beban Sewa':
                case 'Sewa Non AHG': return Car;
                default: return ShieldCheck;
              }
            };
            const Icon = getIcon(pos.pos);

            return (
              <div 
                key={pos.pos}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{pos.name}</h4>
                      <span className="text-[11px] text-slate-400">{pos.count} Akun Anggaran</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full block">
                      {formatPercent(pos.percentageMTD, 1)} <span className="font-normal text-[9px]">thd Target</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">
                      {formatPercent(pos.percentageAnnual, 1)} <span className="text-[9px]">thd Pagu</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block">Pagu 1 Tahun</span>
                    <span className="font-bold text-slate-800">{formatRupiahShort(pos.annual)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Target s/d {MONTH_SHORT_NAMES[selectedMonth]}</span>
                    <span className="font-semibold text-slate-700">{formatRupiahShort(pos.targetMTD)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Realisasi s/d {MONTH_SHORT_NAMES[selectedMonth]}</span>
                    <span className="font-bold text-emerald-600">{formatRupiahShort(pos.realMTD)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Sisa Pagu</span>
                    <span className="font-bold text-amber-600">{formatRupiahShort(pos.sisa)}</span>
                  </div>
                </div>

                {/* Progress bar comparison */}
                <div className="mt-3 space-y-1 text-[10px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Realisasi vs Target MTD</span>
                    <span className="font-bold text-indigo-600">{formatPercent(pos.percentageMTD, 1)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full" 
                      style={{ width: `${Math.min(100, pos.percentageMTD)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monitoring Kontrak Rutin Quick Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-xl p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-400/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Monitoring Kontrak Rutin</span>
                <span className="text-[11px] bg-blue-500/30 text-blue-200 border border-blue-400/40 px-2 py-0.5 rounded-full font-semibold">
                  {alihDayaSummary.countContracts} Kontrak
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Pemantauan komitmen kontrak, GL Account, dan verifikasi No Dokumen pencatatan beban SAP.
              </p>
            </div>
          </div>
          {canAccessTab('alih_daya') && (
            <button
              onClick={() => onNavigateTab('alih_daya')}
              className="text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs cursor-pointer"
            >
              <span>Buka Monitoring Kontrak Rutin</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3.5 border border-white/10">
            <span className="text-xs text-slate-300 block">Total Nilai Kontrak</span>
            <span className="text-lg font-bold text-white mt-1 block font-mono">
              {formatRupiahShort(alihDayaSummary.totalNominal)}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {alihDayaSummary.totalTermins} termin tagihan
            </span>
          </div>

          <div className="bg-emerald-950/40 rounded-lg p-3.5 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-300">Beban Tercatat (Ada No Dok)</span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/30 px-1.5 py-0.5 rounded">
                {formatPercent(alihDayaSummary.percentTercatat, 0)}
              </span>
            </div>
            <span className="text-lg font-bold text-emerald-300 mt-1 block font-mono">
              {formatRupiahShort(alihDayaSummary.totalTercatat)}
            </span>
            <span className="text-[11px] text-emerald-400/80 mt-1 block">
              {alihDayaSummary.countTercatat} termin sudah tercatat SAP
            </span>
          </div>

          <div className="bg-amber-950/40 rounded-lg p-3.5 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-300">Belum Tercatat (Komitmen)</span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/30 px-1.5 py-0.5 rounded">
                {formatPercent(100 - alihDayaSummary.percentTercatat, 0)}
              </span>
            </div>
            <span className="text-lg font-bold text-amber-300 mt-1 block font-mono">
              {formatRupiahShort(alihDayaSummary.totalBelumTercatat)}
            </span>
            <span className="text-[11px] text-amber-400/80 mt-1 block">
              {alihDayaSummary.totalTermins - alihDayaSummary.countTercatat} termin belum ada No Dok
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3.5 border border-white/10 flex flex-col justify-between">
            <span className="text-xs text-slate-300">Status Pencatatan SAP</span>
            <div className="my-1">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Realisasi Pencatatan</span>
                <span className="font-bold text-emerald-300">{formatPercent(alihDayaSummary.percentTercatat, 1)}</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-400 h-full rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, alihDayaSummary.percentTercatat))}%` }}
                />
              </div>
            </div>
            <span className="text-[11px] text-slate-400">
              Otomatis tersinkronisasi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
