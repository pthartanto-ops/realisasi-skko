import { BudgetItem } from '../types';

/**
 * Mendapatkan semua akun anggaran (non-header) yang berada di bawah suatu sub-total / header
 */
export function getChildAccountsForHeader(
  header: BudgetItem, 
  items: BudgetItem[], 
  headerIndex?: number
): BudgetItem[] {
  if (!header.isGroupHeader) return [];

  const idx = headerIndex !== undefined && headerIndex >= 0 
    ? headerIndex 
    : items.findIndex(it => it.id === header.id);

  const isGrandTotal = 
    header.code === 'CODE_1' || 
    (header.name || '').toLowerCase().includes('beban usaha') || 
    (header.level === 0 && !header.category && (header.name || '').toLowerCase().includes('total'));

  if (isGrandTotal) {
    return items.filter(it => !it.isGroupHeader);
  }

  if (header.level === 0) {
    return items.filter(it => !it.isGroupHeader && it.posType === header.posType);
  }

  // Untuk sub-total level 1 (atau level lain)
  if (idx !== -1) {
    const sequentialChildren: BudgetItem[] = [];
    for (let j = idx + 1; j < items.length; j++) {
      const nextItem = items[j];
      // Berhenti jika bertemu header lain pada level yang sama atau lebih tinggi
      if (nextItem.isGroupHeader && nextItem.level <= header.level) {
        break;
      }
      if (!nextItem.isGroupHeader) {
        sequentialChildren.push(nextItem);
      }
    }

    if (sequentialChildren.length > 0) {
      return sequentialChildren;
    }
  }

  // Fallback jika tidak ditemukan secara sekuensial: cocokkan berdasarkan category dan posType
  if (header.category) {
    const targetCat = (header.category || '').trim().toLowerCase();
    return items.filter(it => 
      !it.isGroupHeader && 
      it.posType === header.posType && 
      (it.category || '').trim().toLowerCase() === targetCat
    );
  }

  return [];
}

/**
 * Menghitung ulang seluruh nilai sub-total dan header pada daftar anggaran
 * sehingga nilainya berasal dari penjumlahan akun-akun anggaran di bawahnya.
 */
export function recalculateBudgetSubtotals(items: BudgetItem[]): BudgetItem[] {
  return items.map((item, idx) => {
    if (!item.isGroupHeader) {
      return item;
    }

    const childAccounts = getChildAccountsForHeader(item, items, idx);

    // Penjumlahan pagu anggaran tahunan
    const budgetAnnual = childAccounts.reduce((sum, child) => sum + (child.budgetAnnual || 0), 0);

    // Penjumlahan alokasi bulanan (12 bulan)
    const budgetMonthly = Array(12).fill(0).map((_, m) => 
      childAccounts.reduce((sum, child) => sum + (child.budgetMonthly?.[m] || 0), 0)
    );

    // Penjumlahan realisasi bulanan (12 bulan)
    const realizationMonthly = Array(12).fill(0).map((_, m) => 
      childAccounts.reduce((sum, child) => sum + (child.realizationMonthly?.[m] || 0), 0)
    );

    return {
      ...item,
      budgetAnnual,
      budgetMonthly,
      realizationMonthly
    };
  });
}

/**
 * Menyelaraskan rincian alokasi bulanan (Jan-Des) dengan Pagu Tahunan (SKKO).
 * Menjamin bahwa akumulasi 12 bulan tepat sama dengan Pagu Tahunan (selisih pembulatan dialokasikan ke bulan Desember).
 */
export function reconcileBudgetAllocations(items: BudgetItem[]): BudgetItem[] {
  const balancedItems = items.map(item => {
    if (item.isGroupHeader) return item;

    const monthlyValues = [...(item.budgetMonthly || Array(12).fill(0))];
    while (monthlyValues.length < 12) monthlyValues.push(0);

    const monthlySum = monthlyValues.reduce((a, b) => a + (b || 0), 0);
    const annual = item.budgetAnnual || 0;

    // Jika pagu tahunan ada namun berbeda dengan jumlah 12 bulan:
    // Selaraskan sisa selisih ke bulan Desember (bulan ke-12)
    if (annual > 0 && Math.abs(annual - monthlySum) > 0.001) {
      const sumJanNov = monthlyValues.slice(0, 11).reduce((a, b) => a + (b || 0), 0);
      monthlyValues[11] = Math.max(0, annual - sumJanNov);
      return {
        ...item,
        budgetAnnual: annual,
        budgetMonthly: monthlyValues
      };
    } else if (annual === 0 && monthlySum > 0) {
      return {
        ...item,
        budgetAnnual: monthlySum,
        budgetMonthly: monthlyValues
      };
    }

    return item;
  });

  return recalculateBudgetSubtotals(balancedItems);
}
