import * as XLSX from 'xlsx';
import { BudgetItem, IndicatorTarget, AdditionalTransaction, AlihDayaContract, AlihDayaTermin } from '../types';
import { MONTH_NAMES, MONTH_SHORT_NAMES } from './formatters';

export function exportFullReportToExcel(
  budgetItems: BudgetItem[],
  indicators: IndicatorTarget[],
  additionalTransactions: AdditionalTransaction[],
  year: number = 2026,
  monthCutoff: number = 8, // 1-12
  alihDayaContracts?: AlihDayaContract[]
): void {
  const workbook = XLSX.utils.book_new();

  // 1. Sheet: MATRIKS REALISASI
  const matrixHeaders = [
    'URAIAN AKUN / KODE GL',
    'KELOMPOK POS',
    ...MONTH_SHORT_NAMES.map(m => `REALISASI ${m.toUpperCase()}`),
    ...MONTH_SHORT_NAMES.map(m => `AKUMULASI ${m.toUpperCase()}`),
    'TOTAL REALISASI TAHUNAN',
    'ANGGARAN TAHUNAN (PAGU)',
    'SISA PAGU',
    '% PENYERAPAN'
  ];

  const matrixData: any[][] = [matrixHeaders];

  budgetItems.forEach(item => {
    const label = item.code && !item.code.startsWith('CODE_') && !item.code.startsWith('POS')
      ? `${item.code} ${item.name}`
      : item.name;

    const totalReal = item.realizationMonthly.reduce((a, b) => a + (b || 0), 0);
    const sisa = item.budgetAnnual - totalReal;
    const percent = item.budgetAnnual > 0 ? (totalReal / item.budgetAnnual) * 100 : 0;

    // Cumulative monthly total
    let runningTotal = 0;
    const akumulasi = item.realizationMonthly.map((r) => {
      runningTotal += (r || 0);
      return runningTotal;
    });

    matrixData.push([
      label,
      item.posType,
      ...item.realizationMonthly,
      ...akumulasi,
      totalReal,
      item.budgetAnnual,
      sisa,
      `${percent.toFixed(2)}%`
    ]);
  });

  const matrixSheet = XLSX.utils.aoa_to_sheet(matrixData);
  XLSX.utils.book_append_sheet(workbook, matrixSheet, 'MATRIKS_REALISASI');

  // 2. Sheet: INDIKATOR KINERJA
  const indicatorHeaders = [
    'NO',
    'JENIS INDIKATOR KINERJA',
    'SATUAN',
    'POS ANGGARAN',
    ...MONTH_SHORT_NAMES,
    'TARGET TAHUNAN',
    'REALISASI YTD',
    '% CAPAIAN'
  ];

  const indicatorData: any[][] = [indicatorHeaders];

  indicators.forEach((ind, idx) => {
    const ytdReal = ind.monthlyRealization[monthCutoff - 1] || 0;
    const ytdPercent = ind.monthlyPercentage[monthCutoff - 1] || 0;

    indicatorData.push([
      idx + 1,
      ind.name,
      ind.unit,
      ind.pos,
      ...ind.monthlyPercentage.map(p => `${p.toFixed(2)}%`),
      ind.targetAnnual,
      ytdReal,
      `${ytdPercent.toFixed(2)}%`
    ]);
  });

  const indSheet = XLSX.utils.aoa_to_sheet(indicatorData);
  XLSX.utils.book_append_sheet(workbook, indSheet, 'INDIKATOR_KINERJA');

  // 3. Sheet: PROGNOSA & KONTRAK RUTIN
  const prognosaHeaders = [
    'KATEGORI',
    'URAIAN PEKERJAAN / TRANSAKSI',
    'POS ANGGARAN',
    'BULAN',
    'NILAI TAMBAHAN (RP)',
    'KETERANGAN',
    'STATUS'
  ];

  const prognosaData: any[][] = [prognosaHeaders];

  additionalTransactions.forEach(t => {
    const monthIdx = typeof t.month === 'number'
      ? (t.month >= 1 && t.month <= 12 ? t.month - 1 : t.month)
      : 7;
    prognosaData.push([
      t.category,
      t.name,
      t.posName || t.posType,
      MONTH_NAMES[monthIdx] || `Bulan ${t.month}`,
      t.amount,
      t.notes || t.note || '-',
      t.isActive ? 'Aktif' : 'Non-Aktif'
    ]);
  });

  const prognosaSheet = XLSX.utils.aoa_to_sheet(prognosaData);
  XLSX.utils.book_append_sheet(workbook, prognosaSheet, 'TAMBAHAN_TRANSAKSI');

  // 4. Sheet: KONTRAK RUTIN (if provided)
  if (alihDayaContracts && alihDayaContracts.length > 0) {
    const alihDayaHeaders = [
      'NAMA KONTRAK',
      'NOMER KONTRAK',
      'TERMIN TAGIHAN',
      'GL ACCOUNT',
      'NOMINAL TAGIHAN (RP)',
      'STATUS BEBAN',
      'NO DOKUMEN',
      'KETERANGAN'
    ];
    const alihDayaData: any[][] = [alihDayaHeaders];
    alihDayaContracts.forEach(c => {
      c.termins.forEach(t => {
        alihDayaData.push([
          c.namaKontrak,
          c.nomerKontrak,
          t.terminTagihan || t.termin || '',
          t.glAccount,
          t.nominalTagihan ?? t.amount ?? 0,
          t.statusBeban,
          t.documentNumber || '',
          t.notes || ''
        ]);
      });
    });
    const adSheet = XLSX.utils.aoa_to_sheet(alihDayaData);
    XLSX.utils.book_append_sheet(workbook, adSheet, 'MONITORING_KONTRAK_RUTIN');
  }

  const filename = `Laporan_Pemantauan_Realisasi_Anggaran_${year}_Cutoff_M${monthCutoff}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportAlihDayaToExcel(
  contracts: AlihDayaContract[],
  year: number = 2026,
  selectedMonth?: number | null
): void {
  const workbook = XLSX.utils.book_new();
  const matrixMonthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // Helper to resolve month index from termin
  const resolveTerminMonth = (t: AlihDayaTermin): number => {
    if (t.bulanIndex !== undefined && t.bulanIndex >= 0 && t.bulanIndex <= 11) {
      return t.bulanIndex;
    }
    const d = t.tanggalJatuhTempo || t.tglTagihan || '';
    if (d.includes('-')) {
      const p = parseInt(d.split('-')[1], 10);
      if (!isNaN(p) && p >= 1 && p <= 12) return p - 1;
    }
    const str = (t.terminTagihan || t.termin || '').toLowerCase();
    for (let i = 0; i < 12; i++) {
      if (str.includes(matrixMonthNames[i].toLowerCase())) {
        return i;
      }
    }
    return 0;
  };

  // 1. Sheet Rekapitulasi Per Kontrak
  const hasMonth = selectedMonth !== undefined && selectedMonth !== null && selectedMonth >= 0 && selectedMonth <= 11;
  const monthName = hasMonth ? matrixMonthNames[selectedMonth] : '';

  const rekapHeaders = [
    'NO',
    'NAMA KONTRAK',
    'NOMER KONTRAK',
    'VENDOR / PELAKSANA',
    'POS ANGGARAN',
    'GL ACCOUNT DEFAULT',
    'JUMLAH TERMIN',
    ...(hasMonth ? [
      `TAGIHAN BULAN ${monthName.toUpperCase()} (RP)`,
      `TOTAL NILAI S.D. ${monthName.toUpperCase()} (RP)`
    ] : []),
    'TOTAL NILAI KONTRAK TAHUNAN (RP)',
    'BEBAN TERCATAT (RP)',
    'BEBAN BELUM TERCATAT (RP)',
    '% TERCATAT',
    'STATUS KONTRAK'
  ];

  const rekapData: any[][] = [rekapHeaders];
  contracts.forEach((c, idx) => {
    const totalNilai = c.termins.reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
    const tercatat = c.termins.filter(t => t.statusBeban === 'Tercatat' || (t.documentNumber && t.documentNumber.trim() !== '')).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
    const belumTercatat = c.termins.filter(t => t.statusBeban !== 'Tercatat' && (!t.documentNumber || t.documentNumber.trim() === '')).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
    const percent = totalNilai !== 0 ? (tercatat / totalNilai) * 100 : 0;

    const monthNominal = hasMonth
      ? (c.termins || []).filter(t => resolveTerminMonth(t) === selectedMonth).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0)
      : 0;

    const ytdNominal = hasMonth
      ? (c.termins || []).filter(t => resolveTerminMonth(t) <= selectedMonth).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0)
      : 0;

    rekapData.push([
      idx + 1,
      c.namaKontrak,
      c.nomerKontrak,
      c.vendor || '-',
      c.posAnggaran || c.posType || '-',
      c.glAccountDefault || '-',
      c.termins.length,
      ...(hasMonth ? [
        monthNominal,
        ytdNominal
      ] : []),
      totalNilai,
      tercatat,
      belumTercatat,
      `${percent.toFixed(2)}%`,
      c.statusKontrak || 'Aktif'
    ]);
  });

  const rekapSheet = XLSX.utils.aoa_to_sheet(rekapData);
  XLSX.utils.book_append_sheet(workbook, rekapSheet, 'REKAP_PER_KONTRAK');

  // 2. Sheet Matriks 12 Bulan (Jan - Des)
  const matrixHeaders = [
    'NO',
    'NAMA KONTRAK',
    'NOMER KONTRAK',
    'VENDOR',
    'POS ANGGARAN',
    'GL ACCOUNT',
    ...matrixMonthNames.map(m => `TAGIHAN ${m.toUpperCase()} (RP)`),
    'TOTAL NILAI TAHUNAN (RP)',
    'TOTAL TERCATAT (RP)',
    'TOTAL BELUM TERCATAT (RP)',
    '% TERCATAT'
  ];

  const matrixData: any[][] = [matrixHeaders];
  contracts.forEach((c, idx) => {
    const monthlyNominals = Array(12).fill(0);
    const monthlyStatus = Array(12).fill('');

    (c.termins || []).forEach(t => {
      let mIdx = t.bulanIndex;
      if (mIdx === undefined || mIdx < 0 || mIdx > 11) {
        const d = t.tanggalJatuhTempo || t.tglTagihan || '';
        if (d.includes('-')) {
          const p = parseInt(d.split('-')[1], 10);
          if (!isNaN(p) && p >= 1 && p <= 12) mIdx = p - 1;
        }
      }
      if (mIdx === undefined || mIdx < 0 || mIdx > 11) {
        const str = (t.terminTagihan || t.termin || '').toLowerCase();
        for (let i = 0; i < 12; i++) {
          if (str.includes(matrixMonthNames[i].toLowerCase())) {
            mIdx = i;
            break;
          }
        }
      }
      const finalIdx = (mIdx !== undefined && mIdx >= 0 && mIdx <= 11) ? mIdx : 0;
      const nom = t.nominalTagihan ?? t.amount ?? 0;
      monthlyNominals[finalIdx] += nom;
    });

    const totalNilai = c.termins.reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
    const tercatat = c.termins.filter(t => t.statusBeban === 'Tercatat' || (t.documentNumber && t.documentNumber.trim() !== '')).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
    const belumTercatat = c.termins.filter(t => t.statusBeban !== 'Tercatat' && (!t.documentNumber || t.documentNumber.trim() === '')).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
    const percent = totalNilai !== 0 ? (tercatat / totalNilai) * 100 : 0;

    matrixData.push([
      idx + 1,
      c.namaKontrak,
      c.nomerKontrak,
      c.vendor || '-',
      c.posAnggaran || c.posType || '-',
      c.glAccountDefault || '-',
      ...monthlyNominals,
      totalNilai,
      tercatat,
      belumTercatat,
      `${percent.toFixed(2)}%`
    ]);
  });

  const matrixSheet = XLSX.utils.aoa_to_sheet(matrixData);
  XLSX.utils.book_append_sheet(workbook, matrixSheet, 'MATRIKS_12_BULAN');

  // 3. Sheet Rincian Seluruh Termin
  const terminHeaders = [
    'NAMA KONTRAK',
    'NOMER KONTRAK',
    'BULAN TAGIHAN',
    'TERMIN TAGIHAN',
    'GL ACCOUNT',
    'NAMA GL ACCOUNT',
    'NOMINAL TAGIHAN (RP)',
    'STATUS BEBAN',
    'NO DOKUMEN',
    'TANGGAL JATUH TEMPO',
    'KETERANGAN'
  ];

  const terminData: any[][] = [terminHeaders];
  contracts.forEach(c => {
    (c.termins || []).forEach(t => {
      let mIdx = t.bulanIndex;
      if (mIdx === undefined || mIdx < 0 || mIdx > 11) {
        const d = t.tanggalJatuhTempo || t.tglTagihan || '';
        if (d.includes('-')) {
          const p = parseInt(d.split('-')[1], 10);
          if (!isNaN(p) && p >= 1 && p <= 12) mIdx = p - 1;
        }
      }
      const monthLabel = (mIdx !== undefined && mIdx >= 0 && mIdx <= 11) ? matrixMonthNames[mIdx] : '-';

      terminData.push([
        c.namaKontrak,
        c.nomerKontrak,
        monthLabel,
        t.terminTagihan || t.termin || '',
        t.glAccount,
        t.glAccountName || '-',
        t.nominalTagihan ?? t.amount ?? 0,
        (t.statusBeban === 'Tercatat' || (t.documentNumber && t.documentNumber.trim() !== '')) ? 'Tercatat' : 'Belum Tercatat',
        t.documentNumber || '',
        t.tanggalJatuhTempo || t.tglTagihan || '',
        t.notes || ''
      ]);
    });
  });

  const terminSheet = XLSX.utils.aoa_to_sheet(terminData);
  XLSX.utils.book_append_sheet(workbook, terminSheet, 'RINCIAN_TERMIN');

  const filename = `Monitoring_Kontrak_Rutin_Madiun_${year}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
