import { 
  BudgetItem, 
  IndicatorTarget, 
  AdditionalTransaction, 
  AlihDayaContract, 
  AlihDayaTermin, 
  ImportLog 
} from '../types';
import { 
  DEFAULT_BUDGET_ITEMS, 
  DEFAULT_INDICATORS, 
  DEFAULT_ADDITIONAL_TRANSACTIONS, 
  DEFAULT_ALIH_DAYA_CONTRACTS 
} from './defaultBudgetData';
import { recalculateBudgetSubtotals } from '../utils/budgetCalculations';

export interface YearDataset {
  budgetItems: BudgetItem[];
  indicators: IndicatorTarget[];
  additionalTransactions: AdditionalTransaction[];
  alihDayaContracts: AlihDayaContract[];
  importLogs: ImportLog[];
}

/**
 * Menghasilkan dataset bawaan (default) untuk tahun anggaran tertentu.
 * - 2026: Tahun Berjalan (Realisasi berjalan Jan - Agustus)
 * - 2025: Tahun Sebelumnya / Historis (Realisasi penuh 12 bulan Jan - Des ~96.7%)
 * - 2024: Tahun Historis (Realisasi penuh 12 bulan Jan - Des ~95.2%)
 * - 2027 / Lainnya: Tahun Perencanaan (Pagu terisi/disalin, realisasi 0)
 */
export function generateDefaultYearDataset(year: number): YearDataset {
  if (year === 2026) {
    return {
      budgetItems: recalculateBudgetSubtotals(JSON.parse(JSON.stringify(DEFAULT_BUDGET_ITEMS))),
      indicators: JSON.parse(JSON.stringify(DEFAULT_INDICATORS)),
      additionalTransactions: JSON.parse(JSON.stringify(DEFAULT_ADDITIONAL_TRANSACTIONS)),
      alihDayaContracts: JSON.parse(JSON.stringify(DEFAULT_ALIH_DAYA_CONTRACTS)),
      importLogs: []
    };
  }

  if (year === 2025) {
    // 2025: Pagu ~94% dari 2026, realisasi 12 bulan penuh sudah terealisasi ~96.5%
    const budgetItems2025: BudgetItem[] = DEFAULT_BUDGET_ITEMS.map(item => {
      if (item.isGroupHeader) {
        return {
          ...item,
          budgetAnnual: 0,
          budgetMonthly: Array(12).fill(0),
          realizationMonthly: Array(12).fill(0)
        };
      }

      const budgetAnnual = Math.round(item.budgetAnnual * 0.942);
      const budgetMonthly = item.budgetMonthly.map(mVal => Math.round(mVal * 0.942));

      // 2025 sudah tutup buku, seluruh bulan 0 s.d. 11 memiliki realisasi historis yang valid
      const realizationMonthly = budgetMonthly.map((bVal, mIdx) => {
        if (bVal <= 0) return 0;
        // Rasio serapan bervariasi realistis antara 92% s.d. 99%
        const absorptionRatio = 0.925 + ((mIdx * 13) % 7) * 0.01;
        return Math.round(bVal * absorptionRatio);
      });

      return {
        ...item,
        budgetAnnual,
        budgetMonthly,
        realizationMonthly
      };
    });

    const indicators2025: IndicatorTarget[] = DEFAULT_INDICATORS.map(ind => {
      const targetAnnual = Math.round(ind.targetAnnual * 0.942);
      const monthlyTarget = ind.monthlyTarget.map(t => Math.round(t * 0.942));
      const monthlyRealization = monthlyTarget.map((tVal, mIdx) => {
        if (tVal <= 0) return 0;
        const ratio = 0.94 + ((mIdx * 5) % 5) * 0.01;
        return Math.round(tVal * ratio);
      });
      const monthlyPercentage = monthlyTarget.map((t, idx) => 
        t > 0 ? Number(((monthlyRealization[idx] / t) * 100).toFixed(1)) : 100
      );

      return {
        ...ind,
        targetAnnual,
        monthlyTarget,
        monthlyRealization,
        monthlyPercentage
      };
    });

    const alihDayaContracts2025: AlihDayaContract[] = DEFAULT_ALIH_DAYA_CONTRACTS.map(contract => {
      const contractId = `${contract.id}_2025`;
      const nomorKontrak2025 = (contract.nomorKontrak || '').replace('/2026', '/2025');

      const termins2025: AlihDayaTermin[] = (contract.termins || []).map((t, idx) => {
        const nominal = Math.round((t.nominalTagihan || t.amount || 0) * 0.942);
        const docNum = `500017${String(idx + 1).padStart(4, '0')}`;
        const terminLabel = (t.terminTagihan || t.termin || '').replace('2026', '2025');
        const tgl = (t.tanggalJatuhTempo || t.tglTagihan || '').replace('2026', '2025');

        return {
          ...t,
          id: `${t.id}_2025`,
          terminTagihan: terminLabel,
          termin: terminLabel,
          nominalTagihan: nominal,
          amount: nominal,
          documentNumber: docNum,
          statusBeban: 'Tercatat', // 2025 sudah terbayar & tercatat semua
          tanggalJatuhTempo: tgl,
          tglTagihan: tgl
        };
      });

      return {
        ...contract,
        id: contractId,
        nomorKontrak: nomorKontrak2025,
        tahun: 2025,
        tahunAnggaran: 2025,
        periodeAwal: '2025-01-01',
        periodeAkhir: '2025-12-31',
        termins: termins2025
      };
    });

    const additionalTransactions2025: AdditionalTransaction[] = DEFAULT_ADDITIONAL_TRANSACTIONS.map(tx => ({
      ...tx,
      id: `${tx.id}_2025`,
      year: 2025
    }));

    return {
      budgetItems: recalculateBudgetSubtotals(budgetItems2025),
      indicators: indicators2025,
      additionalTransactions: additionalTransactions2025,
      alihDayaContracts: alihDayaContracts2025,
      importLogs: []
    };
  }

  if (year === 2024) {
    // 2024: Pagu ~88% dari 2026, realisasi 12 bulan penuh historis
    const budgetItems2024: BudgetItem[] = DEFAULT_BUDGET_ITEMS.map(item => {
      if (item.isGroupHeader) {
        return {
          ...item,
          budgetAnnual: 0,
          budgetMonthly: Array(12).fill(0),
          realizationMonthly: Array(12).fill(0)
        };
      }

      const budgetAnnual = Math.round(item.budgetAnnual * 0.885);
      const budgetMonthly = item.budgetMonthly.map(mVal => Math.round(mVal * 0.885));
      const realizationMonthly = budgetMonthly.map((bVal, mIdx) => {
        if (bVal <= 0) return 0;
        const absorptionRatio = 0.91 + ((mIdx * 9) % 6) * 0.01;
        return Math.round(bVal * absorptionRatio);
      });

      return {
        ...item,
        budgetAnnual,
        budgetMonthly,
        realizationMonthly
      };
    });

    const indicators2024: IndicatorTarget[] = DEFAULT_INDICATORS.map(ind => {
      const targetAnnual = Math.round(ind.targetAnnual * 0.885);
      const monthlyTarget = ind.monthlyTarget.map(t => Math.round(t * 0.885));
      const monthlyRealization = monthlyTarget.map((tVal, mIdx) => {
        if (tVal <= 0) return 0;
        const ratio = 0.93 + ((mIdx * 3) % 4) * 0.01;
        return Math.round(tVal * ratio);
      });
      const monthlyPercentage = monthlyTarget.map((t, idx) => 
        t > 0 ? Number(((monthlyRealization[idx] / t) * 100).toFixed(1)) : 100
      );

      return {
        ...ind,
        targetAnnual,
        monthlyTarget,
        monthlyRealization,
        monthlyPercentage
      };
    });

    const alihDayaContracts2024: AlihDayaContract[] = DEFAULT_ALIH_DAYA_CONTRACTS.map(contract => {
      const contractId = `${contract.id}_2024`;
      const nomorKontrak2024 = (contract.nomorKontrak || '').replace('/2026', '/2024');

      const termins2024: AlihDayaTermin[] = (contract.termins || []).map((t, idx) => {
        const nominal = Math.round((t.nominalTagihan || t.amount || 0) * 0.885);
        const docNum = `500016${String(idx + 1).padStart(4, '0')}`;
        const terminLabel = (t.terminTagihan || t.termin || '').replace('2026', '2024');
        const tgl = (t.tanggalJatuhTempo || t.tglTagihan || '').replace('2026', '2024');

        return {
          ...t,
          id: `${t.id}_2024`,
          terminTagihan: terminLabel,
          termin: terminLabel,
          nominalTagihan: nominal,
          amount: nominal,
          documentNumber: docNum,
          statusBeban: 'Tercatat',
          tanggalJatuhTempo: tgl,
          tglTagihan: tgl
        };
      });

      return {
        ...contract,
        id: contractId,
        nomorKontrak: nomorKontrak2024,
        tahun: 2024,
        tahunAnggaran: 2024,
        periodeAwal: '2024-01-01',
        periodeAkhir: '2024-12-31',
        termins: termins2024
      };
    });

    const additionalTransactions2024: AdditionalTransaction[] = DEFAULT_ADDITIONAL_TRANSACTIONS.map(tx => ({
      ...tx,
      id: `${tx.id}_2024`,
      year: 2024
    }));

    return {
      budgetItems: recalculateBudgetSubtotals(budgetItems2024),
      indicators: indicators2024,
      additionalTransactions: additionalTransactions2024,
      alihDayaContracts: alihDayaContracts2024,
      importLogs: []
    };
  }

  // Tahun perencanaan (misal 2027 atau masa depan)
  const budgetItemsFuture: BudgetItem[] = DEFAULT_BUDGET_ITEMS.map(item => {
    if (item.isGroupHeader) {
      return {
        ...item,
        budgetAnnual: 0,
        budgetMonthly: Array(12).fill(0),
        realizationMonthly: Array(12).fill(0)
      };
    }

    const growth = 1.05; // proyeksi kenaikan pagu 5%
    const budgetAnnual = Math.round(item.budgetAnnual * growth);
    const budgetMonthly = item.budgetMonthly.map(mVal => Math.round(mVal * growth));

    return {
      ...item,
      budgetAnnual,
      budgetMonthly,
      realizationMonthly: Array(12).fill(0) // Belum ada realisasi untuk tahun mendatang
    };
  });

  const indicatorsFuture: IndicatorTarget[] = DEFAULT_INDICATORS.map(ind => {
    const growth = 1.05;
    const targetAnnual = Math.round(ind.targetAnnual * growth);
    const monthlyTarget = ind.monthlyTarget.map(t => Math.round(t * growth));

    return {
      ...ind,
      targetAnnual,
      monthlyTarget,
      monthlyRealization: Array(12).fill(0),
      monthlyPercentage: Array(12).fill(0)
    };
  });

  const alihDayaContractsFuture: AlihDayaContract[] = DEFAULT_ALIH_DAYA_CONTRACTS.map(contract => {
    const contractId = `${contract.id}_${year}`;
    const nomorKontrak = (contract.nomorKontrak || '').replace('/2026', `/${year}`);

    const termins: AlihDayaTermin[] = (contract.termins || []).map((t, idx) => {
      const growth = 1.05;
      const nominal = Math.round((t.nominalTagihan || t.amount || 0) * growth);
      const terminLabel = (t.terminTagihan || t.termin || '').replace('2026', String(year));
      const tgl = (t.tanggalJatuhTempo || t.tglTagihan || '').replace('2026', String(year));

      return {
        ...t,
        id: `${t.id}_${year}`,
        terminTagihan: terminLabel,
        termin: terminLabel,
        nominalTagihan: nominal,
        amount: nominal,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tanggalJatuhTempo: tgl,
        tglTagihan: tgl
      };
    });

    return {
      ...contract,
      id: contractId,
      nomorKontrak,
      tahun: year,
      tahunAnggaran: year,
      periodeAwal: `${year}-01-01`,
      periodeAkhir: `${year}-12-31`,
      termins
    };
  });

  return {
    budgetItems: recalculateBudgetSubtotals(budgetItemsFuture),
    indicators: indicatorsFuture,
    additionalTransactions: [],
    alihDayaContracts: alihDayaContractsFuture,
    importLogs: []
  };
}
