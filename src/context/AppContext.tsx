import React, { createContext, useContext, useState, useEffect } from 'react';
import { BudgetItem, IndicatorTarget, AdditionalTransaction, ImportLog, PosType, AlihDayaContract, AlihDayaTermin, StatusBeban } from '../types';
import { DEFAULT_BUDGET_ITEMS, DEFAULT_INDICATORS, DEFAULT_ADDITIONAL_TRANSACTIONS, DEFAULT_ALIH_DAYA_CONTRACTS } from '../data/defaultBudgetData';
import { recalculateBudgetSubtotals, getChildAccountsForHeader } from '../utils/budgetCalculations';

interface AppContextType {
  budgetItems: BudgetItem[];
  indicators: IndicatorTarget[];
  additionalTransactions: AdditionalTransaction[];
  alihDayaContracts: AlihDayaContract[];
  importLogs: ImportLog[];
  selectedYear: number;
  selectedMonth: number; // 0 for Jan, 7 for Aug, 11 for Dec
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  
  // Budget operations
  addBudgetItem: (item: Omit<BudgetItem, 'id'>) => void;
  updateBudgetItem: (id: string, updated: Partial<BudgetItem>) => void;
  deleteBudgetItem: (id: string) => void;
  deleteSubAccount: (headerId: string, deleteChildren: boolean) => void;
  deleteMultipleBudgetItems: (ids: string[]) => void;
  resetAllValuesToZero: () => void;
  updateMonthlyBudget: (id: string, monthIndex: number, amount: number) => void;
  distributeAnnualBudget: (id: string, annualAmount: number) => void;
  
  // Realization operations
  updateRealization: (id: string, monthIndex: number, amount: number) => void;
  updateAccountRealizationMonthly: (id: string, monthlyValues: number[]) => void;
  batchUpdateMonthRealization: (monthIndex: number, updates: Record<string, number>) => void;
  copyBudgetMonthToRealization: (monthIndex: number, posFilter?: string) => void;
  addRealizationEntry: (id: string, monthIndex: number, amountToAdd: number) => void;
  clearMonthRealization: (monthIndex: number) => void;
  deleteImportLog: (logId: string) => void;
  importRealizationData: (importedItems: Partial<BudgetItem>[], fileName: string, targetMonth?: number) => { success: boolean; message: string; matched: number };
  
  // Indicator operations
  updateIndicator: (id: string, updated: Partial<IndicatorTarget>) => void;
  syncSkkoTargetsFromBudget: () => void;
  
  // Additional transactions
  addAdditionalTransaction: (tx: Omit<AdditionalTransaction, 'id'>) => void;
  updateAdditionalTransaction: (id: string, updated: Partial<AdditionalTransaction>) => void;
  deleteAdditionalTransaction: (id: string) => void;

  // Alih Daya Contracts operations
  addAlihDayaContract: (contract: Omit<AlihDayaContract, 'id' | 'termins'> & { termins?: AlihDayaTermin[] }) => { success: boolean; message?: string };
  updateAlihDayaContract: (id: string, updated: Partial<AlihDayaContract>) => { success: boolean; message?: string };
  deleteAlihDayaContract: (id: string) => void;
  addAlihDayaTermin: (contractId: string, termin: Omit<AlihDayaTermin, 'id' | 'statusBeban'>) => void;
  updateAlihDayaTermin: (contractId: string, terminId: string, updated: Partial<AlihDayaTermin>) => void;
  deleteAlihDayaTermin: (contractId: string, terminId: string) => void;
  quickUpdateTerminDocNumber: (contractId: string, terminId: string, documentNumber: string) => void;
  batchUpdateContractTermins: (contractId: string, termins: AlihDayaTermin[]) => void;
  
  // System operations
  resetToDefault: () => void;
  exportDataJSON: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_BUDGET = 'madiun_anggaran_items_v7';
const STORAGE_KEY_INDICATORS = 'madiun_anggaran_indicators_v7';
const STORAGE_KEY_TRANSACTIONS = 'madiun_anggaran_transactions_v7';
const STORAGE_KEY_ALIH_DAYA = 'madiun_anggaran_alih_daya_v1';
const STORAGE_KEY_LOGS = 'madiun_anggaran_logs_v7';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BUDGET) || 
                  localStorage.getItem('madiun_anggaran_items_v6') ||
                  localStorage.getItem('madiun_anggaran_items_v5');
    if (saved) {
      try {
        let parsed = JSON.parse(saved);
        // Migrate 'Sewa Non AHG' to 'Beban Sewa'
        parsed = parsed.map((item: any) => {
          let posType = item.posType;
          let pos = item.pos;
          if (posType === 'Sewa Non AHG') {
            posType = 'Beban Sewa';
            if (pos === 'Beban Sewa Non AHG' || pos === 'Beban Sewa AHG') {
              pos = 'Beban Sewa';
            }
          }
          const rawReal = item.realizationMonthly || Array(12).fill(0).map((_, m) => (item.realizationTunai?.[m] || 0) + (item.realizationNonTunai?.[m] || 0));
          return {
            ...item,
            posType,
            pos,
            realizationMonthly: rawReal
          };
        });

        // Ensure Beban Sewa sub accounts exist
        const hasSewaNonAhg = parsed.some((it: any) => it.code === '6101310001');
        const hasSewaAnakPrshn = parsed.some((it: any) => it.code === '6101310002');
        const hasSewaHeader = parsed.some((it: any) => it.posType === 'Beban Sewa' && it.isGroupHeader);

        if (!hasSewaNonAhg || !hasSewaAnakPrshn || !hasSewaHeader) {
          // Remove legacy CODE_74..CODE_77 if present
          parsed = parsed.filter((it: any) => !['CODE_75', 'CODE_76', 'CODE_77'].includes(it.code));
          
          let header = parsed.find((it: any) => it.code === 'CODE_74');
          if (header) {
            header.name = 'Beban Sewa';
            header.pos = 'Beban Sewa';
            header.posType = 'Beban Sewa';
            header.category = 'Beban Sewa';
            header.level = 0;
            header.isGroupHeader = true;
          } else {
            header = {
              id: "item_74",
              code: "CODE_74",
              name: "Beban Sewa",
              pos: "Beban Sewa",
              posType: "Beban Sewa",
              category: "Beban Sewa",
              isGroupHeader: true,
              level: 0,
              budgetAnnual: 0,
              budgetMonthly: Array(12).fill(0),
              realizationMonthly: Array(12).fill(0),
              notes: ""
            };
            const p72 = parsed.findIndex((it: any) => it.posType === 'Pos 72');
            if (p72 !== -1) parsed.splice(p72, 0, header);
            else parsed.push(header);
          }

          if (!hasSewaNonAhg) {
            const sewa1: BudgetItem = {
              id: "item_sewa_non_ahg",
              code: "6101310001",
              name: "Beban Sewa Non AHG",
              pos: "Beban Sewa",
              posType: "Beban Sewa",
              category: "Beban Sewa",
              isGroupHeader: false,
              level: 2,
              budgetAnnual: 0,
              budgetMonthly: Array(12).fill(0),
              realizationMonthly: Array(12).fill(0),
              notes: ""
            };
            const hIdx = parsed.findIndex((it: any) => it.code === 'CODE_74');
            if (hIdx !== -1) parsed.splice(hIdx + 1, 0, sewa1);
            else parsed.push(sewa1);
          }

          if (!hasSewaAnakPrshn) {
            const sewa2: BudgetItem = {
              id: "item_sewa_anak_prshn",
              code: "6101310002",
              name: "Beban Sewa Pembangkit & Non Pembangkit Anak Prshn",
              pos: "Beban Sewa",
              posType: "Beban Sewa",
              category: "Beban Sewa",
              isGroupHeader: false,
              level: 2,
              budgetAnnual: 0,
              budgetMonthly: Array(12).fill(0),
              realizationMonthly: Array(12).fill(0),
              notes: ""
            };
            const s1Idx = parsed.findIndex((it: any) => it.code === '6101310001');
            if (s1Idx !== -1) parsed.splice(s1Idx + 1, 0, sewa2);
            else parsed.push(sewa2);
          }
        }

        return recalculateBudgetSubtotals(parsed);
      } catch (e) {
        console.error('Failed to parse saved budget data', e);
      }
    }
    return recalculateBudgetSubtotals(DEFAULT_BUDGET_ITEMS);
  });

  const [indicators, setIndicators] = useState<IndicatorTarget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_INDICATORS) || localStorage.getItem('madiun_anggaran_indicators_v6');
    if (saved) {
      try {
        let parsed: IndicatorTarget[] = JSON.parse(saved);
        parsed = parsed.map(ind => {
          if (ind.posType === 'Sewa Non AHG' || ind.id === 'ind_sewa_non_ahg') {
            return {
              ...ind,
              id: 'ind_sewa',
              code: 'BEBAN_SEWA',
              name: 'Realisasi Beban Sewa',
              pos: 'Beban Sewa',
              posType: 'Beban Sewa',
              description: 'Realisasi sewa kendaraan, laptop, driver, AC, lahan, serta pembangkit & non pembangkit anak perusahaan'
            };
          }
          return ind;
        });
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved indicators', e);
      }
    }
    return DEFAULT_INDICATORS;
  });

  const [additionalTransactions, setAdditionalTransactions] = useState<AdditionalTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS) || localStorage.getItem('madiun_anggaran_transactions_v6');
    if (saved) {
      try {
        let parsed: AdditionalTransaction[] = JSON.parse(saved);
        parsed = parsed.map(tx => {
          let posType = tx.posType;
          let posName = tx.posName;
          if (posType === 'Sewa Non AHG') {
            posType = 'Beban Sewa';
            posName = 'Beban Sewa';
          }
          // If glAccount is missing, look up in DEFAULT_ADDITIONAL_TRANSACTIONS or fallback
          let glAccount = tx.glAccount;
          let glAccountName = tx.glAccountName;
          if (!glAccount) {
            const def = DEFAULT_ADDITIONAL_TRANSACTIONS.find(d => d.id === tx.id || d.name.toLowerCase() === tx.name.toLowerCase());
            if (def) {
              glAccount = def.glAccount;
              glAccountName = def.glAccountName;
            } else if (posType === 'Pos 53') {
              glAccount = '6106200700';
              glAccountName = 'Beban jasa borong Gardu Induk';
            } else if (posType === 'Pos 54') {
              glAccount = '6107201400';
              glAccountName = 'Alat dan Keperluan Kantor';
            } else if (posType === 'Beban Sewa') {
              glAccount = '6101310001';
              glAccountName = 'Beban Sewa Non AHG';
            } else if (posType === 'Pos 52') {
              glAccount = '6105100110';
              glAccountName = 'Pay For Person (P1)';
            } else if (posType === 'Pos 72') {
              glAccount = '6108100100';
              glAccountName = 'Beban Pensiun & THT';
            }
          }
          return {
            ...tx,
            posType,
            posName,
            glAccount,
            glAccountName
          };
        });
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved transactions', e);
      }
    }
    return DEFAULT_ADDITIONAL_TRANSACTIONS;
  });

  const [importLogs, setImportLogs] = useState<ImportLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LOGS) || localStorage.getItem('madiun_anggaran_logs_v6');
    if (saved) {
      try {
        const parsed: ImportLog[] = JSON.parse(saved);
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved logs', e);
      }
    }
    return [];
  });

  const normalizeContract = (c: AlihDayaContract): AlihDayaContract => {
    const pos = (c.posAnggaran || c.posType || 'Pos 53') as PosType;
    const tahun = c.tahunAnggaran || c.tahun || 2026;
    const glDef = c.glAccountDefault || '6106201700';
    const glNameDef = c.glAccountNameDefault || c.glAccountDefaultName || '';

    return {
      ...c,
      id: c.id || `kontrak_ad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      namaKontrak: c.namaKontrak || '',
      nomerKontrak: c.nomerKontrak || '',
      vendor: c.vendor || '',
      posAnggaran: pos,
      posType: pos,
      glAccountDefault: glDef,
      glAccountNameDefault: glNameDef,
      glAccountDefaultName: glNameDef,
      tahunAnggaran: tahun,
      tahun: tahun,
      keterangan: c.keterangan || '',
      statusKontrak: c.statusKontrak || 'Aktif',
      termins: (c.termins || []).map((t, idx) => {
        const terminLabel = t.terminTagihan || t.termin || `Termin ${idx + 1}`;
        const nominal = t.nominalTagihan ?? t.amount ?? 0;
        const docNum = t.documentNumber || '';
        const statusBeban: StatusBeban = (docNum.trim() !== '' || t.statusBeban === 'Tercatat') ? 'Tercatat' : 'Belum Tercatat';
        const tgl = t.tanggalJatuhTempo || t.tglTagihan || '';

        return {
          ...t,
          id: t.id || `t_ad_${idx}_${Date.now()}`,
          terminTagihan: terminLabel,
          termin: terminLabel,
          bulanIndex: t.bulanIndex !== undefined ? t.bulanIndex : undefined,
          nominalTagihan: nominal,
          amount: nominal,
          glAccount: t.glAccount || glDef,
          glAccountName: t.glAccountName || glNameDef,
          posType: t.posType || pos,
          documentNumber: docNum,
          statusBeban,
          tanggalJatuhTempo: tgl,
          tglTagihan: tgl,
          notes: t.notes || ''
        };
      })
    };
  };

  const [alihDayaContracts, setAlihDayaContracts] = useState<AlihDayaContract[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ALIH_DAYA);
    if (saved) {
      try {
        const parsed: AlihDayaContract[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeContract);
        }
      } catch (e) {
        console.error('Failed to parse saved Alih Daya contracts', e);
      }
    }
    return DEFAULT_ALIH_DAYA_CONTRACTS.map(normalizeContract);
  });

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(7); // Default to August (0-indexed = 7)

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(budgetItems));
  }, [budgetItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INDICATORS, JSON.stringify(indicators));
  }, [indicators]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(additionalTransactions));
  }, [additionalTransactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ALIH_DAYA, JSON.stringify(alihDayaContracts));
  }, [alihDayaContracts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(importLogs));
  }, [importLogs]);

  // Recalculate indicators dynamically when budget or realization changes
  // Target SKKO dihitung dari penjumlahan sub akun anggaran bulanan secara kumulatif
  useEffect(() => {
    const pos53Items = budgetItems.filter(i => i.posType === 'Pos 53' && !i.isGroupHeader);
    const pos54Items = budgetItems.filter(i => i.posType === 'Pos 54' && !i.isGroupHeader);
    const pos52Items = budgetItems.filter(i => i.posType === 'Pos 52' && !i.isGroupHeader);
    const sewaItems = budgetItems.filter(i => (i.posType === 'Beban Sewa' || i.posType === 'Sewa Non AHG') && !i.isGroupHeader);

    const calcCumulativeTarget = (items: BudgetItem[]) => {
      const monthlyTgt: number[] = Array(12).fill(0);
      for (let m = 0; m < 12; m++) {
        let sumMonth = 0;
        items.forEach(item => {
          sumMonth += (item.budgetMonthly?.[m] || 0);
        });
        if (m === 0) {
          monthlyTgt[m] = sumMonth;
        } else {
          monthlyTgt[m] = monthlyTgt[m - 1] + sumMonth;
        }
      }
      return monthlyTgt;
    };

    const calcCumulativeRealization = (items: BudgetItem[]) => {
      const monthlyReal: number[] = Array(12).fill(0);
      for (let m = 0; m < 12; m++) {
        let sumMonth = 0;
        items.forEach(item => {
          sumMonth += (item.realizationMonthly?.[m] || 0);
        });
        if (m === 0) {
          monthlyReal[m] = sumMonth;
        } else {
          monthlyReal[m] = monthlyReal[m - 1] + sumMonth;
        }
      }
      return monthlyReal;
    };

    const target53 = calcCumulativeTarget(pos53Items);
    const target54 = calcCumulativeTarget(pos54Items);
    const target52 = calcCumulativeTarget(pos52Items);
    const targetSewa = calcCumulativeTarget(sewaItems);

    const real53 = calcCumulativeRealization(pos53Items);
    const real54 = calcCumulativeRealization(pos54Items);
    const real52 = calcCumulativeRealization(pos52Items);
    const realSewa = calcCumulativeRealization(sewaItems);

    const annual53 = pos53Items.reduce((s, i) => s + (i.budgetAnnual || 0), 0);
    const annual54 = pos54Items.reduce((s, i) => s + (i.budgetAnnual || 0), 0);
    const annual52 = pos52Items.reduce((s, i) => s + (i.budgetAnnual || 0), 0);
    const annualSewa = sewaItems.reduce((s, i) => s + (i.budgetAnnual || 0), 0);

    setIndicators(prev => prev.map(ind => {
      let targetVals = ind.monthlyTarget;
      let realVals = ind.monthlyRealization;
      let targetAnn = ind.targetAnnual;

      if (ind.posType === 'Pos 53') {
        targetVals = target53;
        realVals = real53;
        targetAnn = annual53;
      } else if (ind.posType === 'Pos 54') {
        targetVals = target54;
        realVals = real54;
        targetAnn = annual54;
      } else if (ind.posType === 'Pos 52') {
        targetVals = target52;
        realVals = real52;
        targetAnn = annual52;
      } else if (ind.posType === 'Beban Sewa' || ind.posType === 'Sewa Non AHG' || ind.id === 'ind_sewa') {
        targetVals = targetSewa;
        realVals = realSewa;
        targetAnn = annualSewa;
      }

      const pcts = targetVals.map((target, idx) => {
        if (!target || target === 0) return (realVals[idx] || 0) > 0 ? 100 : 0;
        return ((realVals[idx] || 0) / target) * 100;
      });

      return {
        ...ind,
        targetAnnual: targetAnn,
        monthlyTarget: targetVals,
        monthlyRealization: realVals,
        monthlyPercentage: pcts
      };
    }));
  }, [budgetItems]);

  const syncSkkoTargetsFromBudget = () => {
    // Explicit sync function that forces recalculation of SKKO indicators from budget sub-accounts
    const pos53Items = budgetItems.filter(i => i.posType === 'Pos 53' && !i.isGroupHeader);
    const pos54Items = budgetItems.filter(i => i.posType === 'Pos 54' && !i.isGroupHeader);
    const pos52Items = budgetItems.filter(i => i.posType === 'Pos 52' && !i.isGroupHeader);
    const sewaItems = budgetItems.filter(i => (i.posType === 'Beban Sewa' || i.posType === 'Sewa Non AHG') && !i.isGroupHeader);

    const calcCumulativeTarget = (items: BudgetItem[]) => {
      const monthlyTgt: number[] = Array(12).fill(0);
      for (let m = 0; m < 12; m++) {
        let sumMonth = 0;
        items.forEach(item => {
          sumMonth += (item.budgetMonthly?.[m] || 0);
        });
        if (m === 0) {
          monthlyTgt[m] = sumMonth;
        } else {
          monthlyTgt[m] = monthlyTgt[m - 1] + sumMonth;
        }
      }
      return monthlyTgt;
    };

    const calcCumulativeRealization = (items: BudgetItem[]) => {
      const monthlyReal: number[] = Array(12).fill(0);
      for (let m = 0; m < 12; m++) {
        let sumMonth = 0;
        items.forEach(item => {
          sumMonth += (item.realizationMonthly?.[m] || 0);
        });
        if (m === 0) {
          monthlyReal[m] = sumMonth;
        } else {
          monthlyReal[m] = monthlyReal[m - 1] + sumMonth;
        }
      }
      return monthlyReal;
    };

    setIndicators(prev => prev.map(ind => {
      let matchingItems: BudgetItem[] = [];
      if (ind.posType === 'Pos 53') matchingItems = pos53Items;
      else if (ind.posType === 'Pos 54') matchingItems = pos54Items;
      else if (ind.posType === 'Pos 52') matchingItems = pos52Items;
      else if (ind.posType === 'Beban Sewa' || ind.posType === 'Sewa Non AHG') matchingItems = sewaItems;
      else matchingItems = budgetItems.filter(i => i.posType === ind.posType && !i.isGroupHeader);

      const targetVals = calcCumulativeTarget(matchingItems);
      const realVals = calcCumulativeRealization(matchingItems);
      const targetAnn = matchingItems.reduce((s, i) => s + (i.budgetAnnual || 0), 0);

      const pcts = targetVals.map((target, idx) => {
        if (!target || target === 0) return (realVals[idx] || 0) > 0 ? 100 : 0;
        return ((realVals[idx] || 0) / target) * 100;
      });

      return {
        ...ind,
        targetAnnual: targetAnn,
        monthlyTarget: targetVals,
        monthlyRealization: realVals,
        monthlyPercentage: pcts
      };
    }));
  };

  const addBudgetItem = (item: Omit<BudgetItem, 'id'>) => {
    const calculatedAnnual = !item.isGroupHeader && item.budgetMonthly
      ? item.budgetMonthly.reduce((a, b) => a + (b || 0), 0)
      : item.budgetAnnual;

    const newItem: BudgetItem = {
      ...item,
      budgetAnnual: calculatedAnnual,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      updatedAt: new Date().toISOString()
    };
    
    setBudgetItems(prev => {
      // Find optimal insertion index so child account is placed right under its subtotal/category
      let insertIndex = -1;

      // 1. Look for the last item with the same posType and category
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].posType === newItem.posType && prev[i].category === newItem.category) {
          insertIndex = i + 1;
          break;
        }
      }

      // 2. If no exact category match, find the last item with the same posType
      if (insertIndex === -1) {
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].posType === newItem.posType) {
            insertIndex = i + 1;
            break;
          }
        }
      }

      let updatedList: BudgetItem[];
      if (insertIndex !== -1 && insertIndex <= prev.length) {
        updatedList = [...prev.slice(0, insertIndex), newItem, ...prev.slice(insertIndex)];
      } else {
        updatedList = [...prev, newItem];
      }

      return recalculateBudgetSubtotals(updatedList);
    });
  };

  const updateBudgetItem = (id: string, updated: Partial<BudgetItem>) => {
    setBudgetItems(prev => {
      const next = prev.map(item => {
        if (item.id === id) {
          let annual = updated.budgetAnnual !== undefined ? updated.budgetAnnual : item.budgetAnnual;
          if (!item.isGroupHeader && updated.budgetMonthly) {
            annual = updated.budgetMonthly.reduce((a, b) => a + (b || 0), 0);
          }
          return {
            ...item,
            ...updated,
            budgetAnnual: annual,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      return recalculateBudgetSubtotals(next);
    });
  };

  const deleteBudgetItem = (id: string) => {
    setBudgetItems(prev => {
      const next = prev.filter(item => item.id !== id);
      return recalculateBudgetSubtotals(next);
    });
  };

  const deleteSubAccount = (headerId: string, deleteChildren: boolean) => {
    setBudgetItems(prev => {
      const targetHeader = prev.find(i => i.id === headerId);
      if (!targetHeader) return prev;

      if (deleteChildren) {
        const childAccounts = getChildAccountsForHeader(targetHeader, prev);
        const childIds = new Set(childAccounts.map(c => c.id));
        childIds.add(headerId);
        const next = prev.filter(item => !childIds.has(item.id));
        return recalculateBudgetSubtotals(next);
      } else {
        const next = prev.filter(item => item.id !== headerId);
        return recalculateBudgetSubtotals(next);
      }
    });
  };

  const deleteMultipleBudgetItems = (ids: string[]) => {
    const idSet = new Set(ids);
    setBudgetItems(prev => {
      const next = prev.filter(item => !idSet.has(item.id));
      return recalculateBudgetSubtotals(next);
    });
  };

  const resetAllValuesToZero = () => {
    setBudgetItems(prev => {
      const zeroed = prev.map(item => ({
        ...item,
        budgetAnnual: 0,
        budgetMonthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        realizationMonthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        updatedAt: new Date().toISOString()
      }));
      return recalculateBudgetSubtotals(zeroed);
    });

    setIndicators(prev => prev.map(ind => ({
      ...ind,
      targetAnnual: 0,
      monthlyTarget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      monthlyRealization: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      monthlyPercentage: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    })));

    setAdditionalTransactions(prev => prev.map(tx => ({
      ...tx,
      amount: 0
    })));
  };

  const updateMonthlyBudget = (id: string, monthIndex: number, amount: number) => {
    setBudgetItems(prev => {
      const next = prev.map(item => {
        if (item.id === id) {
          const newMonthly = [...item.budgetMonthly];
          newMonthly[monthIndex] = amount;
          const newAnnual = newMonthly.reduce((a, b) => a + b, 0);
          return {
            ...item,
            budgetMonthly: newMonthly,
            budgetAnnual: newAnnual,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      return recalculateBudgetSubtotals(next);
    });
  };

  const distributeAnnualBudget = (id: string, annualAmount: number) => {
    const amount = annualAmount;
    const slice = Math.floor(amount / 12);
    const monthly = Array(12).fill(slice);
    monthly[11] = amount - (slice * 11);

    setBudgetItems(prev => {
      const next = prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            budgetAnnual: amount,
            budgetMonthly: monthly,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      return recalculateBudgetSubtotals(next);
    });
  };

  const updateRealization = (id: string, monthIndex: number, amount: number) => {
    setBudgetItems(prev => {
      const next = prev.map(item => {
        if (item.id === id) {
          const newReal = [...item.realizationMonthly];
          newReal[monthIndex] = amount;
          return {
            ...item,
            realizationMonthly: newReal,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      return recalculateBudgetSubtotals(next);
    });
  };

  const updateAccountRealizationMonthly = (id: string, monthlyValues: number[]) => {
    setBudgetItems(prev => {
      const next = prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            realizationMonthly: monthlyValues.slice(0, 12),
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      return recalculateBudgetSubtotals(next);
    });
  };

  const batchUpdateMonthRealization = (monthIndex: number, updates: Record<string, number>) => {
    setBudgetItems(prev => {
      const next = prev.map(item => {
        if (!item.isGroupHeader && updates[item.id] !== undefined) {
          const newReal = [...item.realizationMonthly];
          newReal[monthIndex] = updates[item.id];
          return {
            ...item,
            realizationMonthly: newReal,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      return recalculateBudgetSubtotals(next);
    });
  };

  const copyBudgetMonthToRealization = (monthIndex: number, posFilter?: string) => {
    setBudgetItems(prev => {
      const next = prev.map(item => {
        if (item.isGroupHeader) return item;
        if (posFilter && posFilter !== 'ALL' && item.posType !== posFilter) return item;
        const targetBudget = item.budgetMonthly?.[monthIndex] || 0;
        const newReal = [...item.realizationMonthly];
        newReal[monthIndex] = targetBudget;
        return {
          ...item,
          realizationMonthly: newReal,
          updatedAt: new Date().toISOString()
        };
      });
      return recalculateBudgetSubtotals(next);
    });
  };

  const addRealizationEntry = (id: string, monthIndex: number, amountToAdd: number) => {
    setBudgetItems(prev => {
      const next = prev.map(item => {
        if (item.id === id) {
          const newReal = [...item.realizationMonthly];
          newReal[monthIndex] = (newReal[monthIndex] || 0) + amountToAdd;
          return {
            ...item,
            realizationMonthly: newReal,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      return recalculateBudgetSubtotals(next);
    });
  };

  const clearMonthRealization = (monthIndex: number) => {
    setBudgetItems(prev => {
      const next = prev.map(item => {
        if (item.isGroupHeader) return item;
        const newReal = [...item.realizationMonthly];
        newReal[monthIndex] = 0;
        return {
          ...item,
          realizationMonthly: newReal,
          updatedAt: new Date().toISOString()
        };
      });
      return recalculateBudgetSubtotals(next);
    });

    const monthNamesId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const targetMonthName = monthNamesId[monthIndex]?.toLowerCase() || '';
    setImportLogs(prev => prev.filter(log => {
      const logName = log.fileName.toLowerCase();
      return !logName.includes(targetMonthName);
    }));
  };

  const deleteImportLog = (logId: string) => {
    setImportLogs(prev => prev.filter(l => l.id !== logId));
  };

  const importRealizationData = (
    importedItems: Partial<BudgetItem>[],
    fileName: string,
    targetMonth?: number
  ) => {
    let matchedCount = 0;
    let totalImported = 0;

    const updated = budgetItems.map(existing => {
      // Try to match by exact code or name match
      const matched = importedItems.find(imp => {
        if (imp.code && existing.code && imp.code === existing.code) return true;
        if (imp.name && existing.name && imp.name.toLowerCase().trim() === existing.name.toLowerCase().trim()) return true;
        return false;
      });

      if (matched) {
        matchedCount++;
        const newReal = [...existing.realizationMonthly];

        if (targetMonth !== undefined && targetMonth >= 0 && targetMonth < 12) {
          if (matched.realizationMonthly && matched.realizationMonthly[targetMonth] !== undefined) {
            newReal[targetMonth] = matched.realizationMonthly[targetMonth];
            totalImported += matched.realizationMonthly[targetMonth];
          }
        } else {
          // Replace all months if provided
          if (matched.realizationMonthly) {
            matched.realizationMonthly.forEach((v, idx) => {
              if (v !== undefined) {
                newReal[idx] = v;
                totalImported += v;
              }
            });
          }
        }

        return {
          ...existing,
          realizationMonthly: newReal,
          updatedAt: new Date().toISOString()
        };
      }
      return existing;
    });

    setBudgetItems(recalculateBudgetSubtotals(updated));

    const log: ImportLog = {
      id: `log_${Date.now()}`,
      fileName,
      fileSize: 1024 * 50,
      importedAt: new Date().toISOString(),
      rowsProcessed: importedItems.length,
      rowsMatched: matchedCount,
      totalAmountImported: totalImported,
      status: matchedCount > 0 ? 'success' : 'warning',
      message: `Berhasil memproses ${importedItems.length} baris, mencocokkan ${matchedCount} akun anggaran.`
    };

    setImportLogs(prev => [log, ...prev]);

    return {
      success: matchedCount > 0,
      message: `Berhasil mengupdate ${matchedCount} akun anggaran dari total ${importedItems.length} baris import.`,
      matched: matchedCount
    };
  };

  const updateIndicator = (id: string, updated: Partial<IndicatorTarget>) => {
    setIndicators(prev => prev.map(ind => ind.id === id ? { ...ind, ...updated } : ind));
  };

  const addAdditionalTransaction = (tx: Omit<AdditionalTransaction, 'id'>) => {
    const newTx: AdditionalTransaction = {
      ...tx,
      id: `add_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    };
    setAdditionalTransactions(prev => [...prev, newTx]);
  };

  const updateAdditionalTransaction = (id: string, updated: Partial<AdditionalTransaction>) => {
    setAdditionalTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updated } : tx));
  };

  const deleteAdditionalTransaction = (id: string) => {
    setAdditionalTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  // Alih Daya Contract & Termin operations
  const addAlihDayaContract = (contractData: Omit<AlihDayaContract, 'id' | 'termins'> & { termins?: AlihDayaTermin[] }) => {
    const namaTrim = (contractData.namaKontrak || '').trim();
    const nomerTrim = (contractData.nomerKontrak || '').trim();

    if (!namaTrim || !nomerTrim) {
      return { success: false, message: 'Nama Kontrak dan Nomer Kontrak wajib diisi.' };
    }

    // Ketentuan Tambahan: Data No 1 dan 2 tidak boleh sama
    if (namaTrim.toLowerCase() === nomerTrim.toLowerCase()) {
      return { 
        success: false, 
        message: 'Nama Kontrak (No. 1) dan Nomer Kontrak (No. 2) tidak boleh sama persis!' 
      };
    }

    // Cek duplikasi dengan kontrak yang sudah ada
    const isDuplicate = alihDayaContracts.some(
      c => (c.nomerKontrak || '').toLowerCase().trim() === nomerTrim.toLowerCase() ||
           (c.namaKontrak || '').toLowerCase().trim() === namaTrim.toLowerCase()
    );
    if (isDuplicate) {
      return { 
        success: false, 
        message: 'Kontrak dengan Nama atau Nomer Kontrak ini sudah terdaftar. Gunakan identitas yang unik.' 
      };
    }

    const newContract: AlihDayaContract = normalizeContract({
      ...contractData,
      namaKontrak: namaTrim,
      nomerKontrak: nomerTrim,
      id: `kontrak_ad_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      termins: contractData.termins || []
    });

    setAlihDayaContracts(prev => [newContract, ...prev]);
    return { success: true };
  };

  const updateAlihDayaContract = (id: string, updated: Partial<AlihDayaContract>) => {
    const current = alihDayaContracts.find(c => c.id === id);
    if (!current) return { success: false, message: 'Kontrak tidak ditemukan.' };

    const newNama = (updated.namaKontrak !== undefined ? updated.namaKontrak : current.namaKontrak || '').trim();
    const newNomer = (updated.nomerKontrak !== undefined ? updated.nomerKontrak : current.nomerKontrak || '').trim();

    if (!newNama || !newNomer) {
      return { success: false, message: 'Nama Kontrak dan Nomer Kontrak wajib diisi.' };
    }

    // Ketentuan Tambahan: Data No 1 dan 2 tidak boleh sama
    if (newNama.toLowerCase() === newNomer.toLowerCase()) {
      return { 
        success: false, 
        message: 'Nama Kontrak (No. 1) dan Nomer Kontrak (No. 2) tidak boleh sama persis!' 
      };
    }

    const isDuplicate = alihDayaContracts.some(
      c => c.id !== id && (
        (c.nomerKontrak || '').toLowerCase().trim() === newNomer.toLowerCase() ||
        (c.namaKontrak || '').toLowerCase().trim() === newNama.toLowerCase()
      )
    );
    if (isDuplicate) {
      return { 
        success: false, 
        message: 'Nama atau Nomer Kontrak ini sudah digunakan oleh kontrak lain.' 
      };
    }

    setAlihDayaContracts(prev => prev.map(c => {
      if (c.id === id) {
        return normalizeContract({
          ...c,
          ...updated,
          namaKontrak: newNama,
          nomerKontrak: newNomer
        });
      }
      return c;
    }));
    return { success: true };
  };

  const deleteAlihDayaContract = (id: string) => {
    setAlihDayaContracts(prev => prev.filter(c => c.id !== id));
  };

  const addAlihDayaTermin = (contractId: string, terminData: Omit<AlihDayaTermin, 'id' | 'statusBeban'>) => {
    const docNum = terminData.documentNumber ? terminData.documentNumber.trim() : '';
    const statusBeban = docNum !== '' ? 'Tercatat' : 'Belum Tercatat';

    const newTermin: AlihDayaTermin = {
      ...terminData,
      documentNumber: docNum,
      statusBeban,
      id: `t_ad_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    };

    setAlihDayaContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        return {
          ...c,
          termins: [...c.termins, newTermin]
        };
      }
      return c;
    }));
  };

  const updateAlihDayaTermin = (contractId: string, terminId: string, updated: Partial<AlihDayaTermin>) => {
    setAlihDayaContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        return {
          ...c,
          termins: c.termins.map(t => {
            if (t.id === terminId) {
              const docNum = updated.documentNumber !== undefined 
                ? (updated.documentNumber ? updated.documentNumber.trim() : '')
                : t.documentNumber;
              const statusBeban = docNum !== '' ? 'Tercatat' : 'Belum Tercatat';

              return {
                ...t,
                ...updated,
                documentNumber: docNum,
                statusBeban
              };
            }
            return t;
          })
        };
      }
      return c;
    }));
  };

  const deleteAlihDayaTermin = (contractId: string, terminId: string) => {
    setAlihDayaContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        return {
          ...c,
          termins: c.termins.filter(t => t.id !== terminId)
        };
      }
      return c;
    }));
  };

  const quickUpdateTerminDocNumber = (contractId: string, terminId: string, documentNumber: string) => {
    const docNum = documentNumber ? documentNumber.trim() : '';
    const statusBeban = docNum !== '' ? 'Tercatat' : 'Belum Tercatat';

    setAlihDayaContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        return {
          ...c,
          termins: c.termins.map(t => {
            if (t.id === terminId) {
              return {
                ...t,
                documentNumber: docNum,
                statusBeban
              };
            }
            return t;
          })
        };
      }
      return c;
    }));
  };

  const batchUpdateContractTermins = (contractId: string, termins: AlihDayaTermin[]) => {
    setAlihDayaContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        return normalizeContract({
          ...c,
          termins
        });
      }
      return c;
    }));
  };

  const resetToDefault = () => {
    localStorage.removeItem(STORAGE_KEY_BUDGET);
    localStorage.removeItem(STORAGE_KEY_INDICATORS);
    localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEY_ALIH_DAYA);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    setBudgetItems(recalculateBudgetSubtotals(DEFAULT_BUDGET_ITEMS));
    setIndicators(DEFAULT_INDICATORS);
    setAdditionalTransactions(DEFAULT_ADDITIONAL_TRANSACTIONS);
    setAlihDayaContracts(DEFAULT_ALIH_DAYA_CONTRACTS);
    setSelectedMonth(7);
  };

  const exportDataJSON = () => {
    const data = {
      year: selectedYear,
      budgetItems,
      indicators,
      additionalTransactions,
      alihDayaContracts,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_Pemantauan_Anggaran_${selectedYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppContext.Provider
      value={{
        budgetItems,
        indicators,
        additionalTransactions,
        alihDayaContracts,
        importLogs,
        selectedYear,
        selectedMonth,
        setSelectedYear,
        setSelectedMonth,
        addBudgetItem,
        updateBudgetItem,
        deleteBudgetItem,
        deleteSubAccount,
        deleteMultipleBudgetItems,
        resetAllValuesToZero,
        updateMonthlyBudget,
        distributeAnnualBudget,
        updateRealization,
        updateAccountRealizationMonthly,
        batchUpdateMonthRealization,
        copyBudgetMonthToRealization,
        addRealizationEntry,
        clearMonthRealization,
        deleteImportLog,
        importRealizationData,
        updateIndicator,
        syncSkkoTargetsFromBudget,
        addAdditionalTransaction,
        updateAdditionalTransaction,
        deleteAdditionalTransaction,
        addAlihDayaContract,
        updateAlihDayaContract,
        deleteAlihDayaContract,
        addAlihDayaTermin,
        updateAlihDayaTermin,
        deleteAlihDayaTermin,
        quickUpdateTerminDocNumber,
        batchUpdateContractTermins,
        resetToDefault,
        exportDataJSON
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
