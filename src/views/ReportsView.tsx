import React, { useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  AlertOctagon,
  Building2, 
  Calendar, 
  Layers,
  TrendingUp,
  DollarSign,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  formatRupiah, 
  formatRupiahShort, 
  formatPercent, 
  MONTH_NAMES, 
  MONTH_SHORT_NAMES,
  getPerformanceStatus,
  PERFORMANCE_INDICATOR_RULES
} from '../utils/formatters';
import { PosType } from '../types';

export const ReportsView: React.FC = () => {
  const { 
    budgetItems, 
    indicators, 
    additionalTransactions, 
    selectedYear, 
    selectedMonth 
  } = useApp();

  const reportData = useMemo(() => {
    const nonHeaders = budgetItems.filter(i => !i.isGroupHeader);

    let totalPagu = 0;
    let targetMTD = 0;
    let totalRealMTD = 0;

    nonHeaders.forEach(item => {
      totalPagu += item.budgetAnnual || 0;
      for (let m = 0; m <= selectedMonth; m++) {
        const r = item.realizationMonthly?.[m] || 0;
        const b = item.budgetMonthly?.[m] || 0;

        targetMTD += b;
        totalRealMTD += r;
      }
    });

    const sisaPagu = totalPagu - totalRealMTD;
    const pctRealVsAnggaranTahunan = totalPagu > 0 ? (totalRealMTD / totalPagu) * 100 : 0;
    const pctRealVsAnggaranSdMonth = targetMTD > 0 ? (totalRealMTD / targetMTD) * 100 : 0;

    const posList: PosType[] = ['Pos 52', 'Pos 53', 'Pos 54', 'Beban Sewa', 'Pos 72'];
    const posRows = posList.map(pos => {
      const pItems = nonHeaders.filter(i => i.posType === pos || (pos === 'Beban Sewa' && (i.posType as string) === 'Sewa Non AHG'));
      let pPagu = 0;
      let pTargetMTD = 0;
      let pRealMTD = 0;

      pItems.forEach(i => {
        pPagu += i.budgetAnnual || 0;
        for (let m = 0; m <= selectedMonth; m++) {
          pTargetMTD += (i.budgetMonthly?.[m] || 0);
          pRealMTD += (i.realizationMonthly?.[m] || 0);
        }
      });

      const pSisa = pPagu - pRealMTD;
      const pPctAnnual = pPagu > 0 ? (pRealMTD / pPagu) * 100 : 0;
      const pPctMTD = pTargetMTD > 0 ? (pRealMTD / pTargetMTD) * 100 : 0;

      return {
        pos,
        name: pos === 'Pos 52' ? 'Beban Kepegawaian' :
              pos === 'Pos 53' ? 'Beban Pemeliharaan' :
              pos === 'Pos 54' ? 'Biaya Administrasi & Umum' :
              pos === 'Beban Sewa' ? 'Beban Sewa' :
              'Beban Pensiun',
        pagu: pPagu,
        targetMTD: pTargetMTD,
        realMTD: pRealMTD,
        sisa: pSisa,
        percentageAnnual: pPctAnnual,
        percentageMTD: pPctMTD
      };
    });

    return {
      totalPagu,
      targetMTD,
      totalRealMTD,
      sisaPagu,
      pctRealVsAnggaranTahunan,
      pctRealVsAnggaranSdMonth,
      posRows
    };
  }, [budgetItems, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Laporan Eksekutif Realisasi Anggaran</h1>
            <p className="text-xs text-slate-500">
              Format cetak resmi untuk laporan manajerial dan rapat koordinasi realisasi anggaran
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Simpan PDF</span>
        </button>
      </div>

      {/* Printable Document Container */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-lg p-8 sm:p-12 max-w-4xl mx-auto text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Memo Header */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl">
                PLN
              </div>
              <div>
                <h2 className="font-extrabold text-lg uppercase tracking-tight">LAPORAN PEMANTAUAN REALISASI ANGGARAN</h2>
                <p className="text-xs text-slate-600 font-medium">Model Monitoring Anggaran & Realisasi SAP/SKKO</p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-600">
              <div className="font-bold text-slate-900">Periode Pelaporan:</div>
              <div>s/d {MONTH_NAMES[selectedMonth]} {selectedYear}</div>
              <div className="text-[11px] text-slate-400 mt-1">Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Pagu SKKO ({selectedYear})</span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono mt-1 block">
              {formatRupiah(reportData.totalPagu)}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Anggaran 1 Tahun Penuh</span>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-700 block uppercase">Realisasi s/d {MONTH_SHORT_NAMES[selectedMonth]}</span>
            <span className="text-base sm:text-lg font-extrabold text-blue-900 font-mono mt-1 block">
              {formatRupiah(reportData.totalRealMTD)}
            </span>
            <span className="text-[10px] text-blue-600 mt-1 block">Angg: {formatRupiahShort(reportData.targetMTD)}</span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
            <span className="text-[10px] font-bold text-indigo-700 block uppercase leading-tight">% Real s/d Bln thd Angg s/d Bln</span>
            <span className="text-base sm:text-lg font-extrabold text-indigo-900 mt-1 block font-mono">
              {formatPercent(reportData.pctRealVsAnggaranSdMonth)}
            </span>
            <span className="text-[10px] text-indigo-600 mt-1 block">Realisasi vs Target MTD</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 block uppercase leading-tight">% Real s/d Bln thd Angg 1 Tahun</span>
            <span className="text-base sm:text-lg font-extrabold text-emerald-900 mt-1 block font-mono">
              {formatPercent(reportData.pctRealVsAnggaranTahunan)}
            </span>
            <span className="text-[10px] text-emerald-600 mt-1 block">Realisasi vs Pagu Tahunan</span>
          </div>
        </div>

        {/* Section 1: Ringkasan Realisasi per Kelompok POS */}
        <div className="mb-8">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 mb-3 border-l-4 border-blue-600 pl-2">
            1. Ringkasan Realisasi per Kelompok Beban (POS)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 font-bold uppercase text-[10px] text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Kelompok POS</th>
                  <th className="py-2.5 px-3 text-right">Anggaran 1 Tahun</th>
                  <th className="py-2.5 px-3 text-right">Anggaran s.d. Bln</th>
                  <th className="py-2.5 px-3 text-right">Realisasi s.d. Bln</th>
                  <th className="py-2.5 px-3 text-right">Sisa Pagu</th>
                  <th className="py-2.5 px-3 text-center bg-indigo-50/70 border-x border-slate-200">
                    <span className="block">% Realisasi thd</span>
                    <span className="text-[9px] text-indigo-700">Anggaran s.d. Bln</span>
                  </th>
                  <th className="py-2.5 px-3 text-center bg-emerald-50/70">
                    <span className="block">% Realisasi thd</span>
                    <span className="text-[9px] text-emerald-700">Anggaran 1 Thn</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {reportData.posRows.map((pos) => (
                  <tr key={pos.pos} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{pos.name} ({pos.pos})</td>
                    <td className="py-2.5 px-3 text-right">{formatRupiah(pos.pagu)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatRupiah(pos.targetMTD)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatRupiah(pos.realMTD)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">{formatRupiah(pos.sisa)}</td>
                    <td className="py-2.5 px-3 text-center font-sans font-bold text-indigo-900 bg-indigo-50/40 border-x border-slate-200">
                      {formatPercent(pos.percentageMTD)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans font-bold text-emerald-900 bg-emerald-50/40">
                      {formatPercent(pos.percentageAnnual)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold text-xs font-mono">
                <tr>
                  <td className="py-2.5 px-3 font-sans">TOTAL KESELURUHAN</td>
                  <td className="py-2.5 px-3 text-right">{formatRupiah(reportData.totalPagu)}</td>
                  <td className="py-2.5 px-3 text-right">{formatRupiah(reportData.targetMTD)}</td>
                  <td className="py-2.5 px-3 text-right">{formatRupiah(reportData.totalRealMTD)}</td>
                  <td className="py-2.5 px-3 text-right">{formatRupiah(reportData.sisaPagu)}</td>
                  <td className="py-2.5 px-3 text-center font-sans text-indigo-200 bg-slate-800 border-x border-slate-700">
                    {formatPercent(reportData.pctRealVsAnggaranSdMonth)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-sans text-emerald-300">
                    {formatPercent(reportData.pctRealVsAnggaranTahunan)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Section 2: Indikator Kinerja & Optimalisasi Biaya */}
        <div className="mb-8">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 mb-3 border-l-4 border-emerald-600 pl-2">
            2. Capaian Indikator Kinerja & Optimalisasi Biaya
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
            {indicators.map((ind) => {
              const pct = ind.monthlyPercentage[selectedMonth] || 0;
              const statusInfo = getPerformanceStatus(pct);

              return (
                <div key={ind.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{ind.name}</span>
                    <span className="text-[11px] text-slate-500">Target Optimal: 95% - 100%</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-extrabold font-mono block ${statusInfo.textClass}`}>
                      {formatPercent(pct)}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${statusInfo.badgeClass}`}>
                      {statusInfo.label.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benchmark Legend in Report */}
          <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200 text-[10px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-slate-800">Standar Evaluasi Kinerja:</span>
            <span className="text-emerald-700 font-semibold">● Optimal (95% - 100%)</span>
            <span className="text-rose-700 font-semibold">● Overbudget (&gt; 100%)</span>
            <span className="text-amber-700 font-semibold">● Kurang Optimal (50% - &lt;95%)</span>
            <span className="text-red-700 font-semibold">● Bermasalah (&lt; 50%)</span>
          </div>
        </div>

        {/* Section 3: Signature Block */}
        <div className="pt-8 border-t border-slate-300 mt-12">
          <div className="grid grid-cols-2 text-center text-xs text-slate-700">
            <div>
              <p className="font-medium text-slate-500 mb-16">Disiapkan Oleh,<br />Asisten Manajer Keuangan & Anggaran</p>
              <p className="font-bold text-slate-900 underline">( _________________________ )</p>
            </div>
            <div>
              <p className="font-medium text-slate-500 mb-16">Disetujui Oleh,<br />Manager Unit Pelaksana</p>
              <p className="font-bold text-slate-900 underline">( _________________________ )</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
