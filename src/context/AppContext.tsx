import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  BudgetItem, 
  IndicatorTarget, 
  AdditionalTransaction, 
  ImportLog, 
  PosType, 
  AlihDayaContract, 
  AlihDayaTermin, 
  StatusBeban,
  ActiveTab,
  AppUser,
  UserRole,
  ROLE_PERMISSIONS
} from '../types';
import { DEFAULT_BUDGET_ITEMS, DEFAULT_INDICATORS, DEFAULT_ADDITIONAL_TRANSACTIONS, DEFAULT_ALIH_DAYA_CONTRACTS } from '../data/defaultBudgetData';
import { generateDefaultYearDataset, YearDataset } from '../data/yearlyBudgetData';
import { DEFAULT_USERS } from '../data/defaultUsers';
import { recalculateBudgetSubtotals, getChildAccountsForHeader } from '../utils/budgetCalculations';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { fetchRemoteState, saveRemoteState, AppDataPayload } from '../services/supabaseStorage';
import { generateAlihDayaMonthlyCommitments } from '../utils/alihDayaCommitmentUtils';

interface AppContextType {
  budgetItems: BudgetItem[];
  indicators: IndicatorTarget[];
  additionalTransactions: AdditionalTransaction[];
  alihDayaContracts: AlihDayaContract[];
  importLogs: ImportLog[];
  selectedYear: number;
  selectedMonth: number; // 0 for Jan, 7 for Aug, 11 for Dec
  availableYears: number[];
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  copyDataFromYear: (fromYear: number, targetYear?: number, options?: { copyBudget?: boolean; copyContracts?: boolean }) => { success: boolean; message: string };

  // User & Role Management
  users: AppUser[];
  currentUser: AppUser | null;
  addUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  updateUser: (id: string, updated: Partial<AppUser>) => { success: boolean; message?: string };
  deleteUser: (id: string) => { success: boolean; message?: string };
  loginUser: (nip: string, password: string) => { success: boolean; message?: string };
  logoutUser: () => void;
  canAccessTab: (tab: ActiveTab) => boolean;
  
  // Supabase sync states & actions
  isSupabaseEnabled: boolean;
  supabaseSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime: Date | null;
  syncToSupabase: () => Promise<{ success: boolean; error?: string }>;
  loadFromSupabase: () => Promise<{ success: boolean; error?: string }>;
  
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
const STORAGE_KEY_USERS = 'madiun_anggaran_users_v1';
const STORAGE_KEY_CURRENT_USER = 'madiun_anggaran_current_user_v1';
const STORAGE_KEY_SELECTED_YEAR = 'madiun_anggaran_selected_year_v1';

export const AVAILABLE_YEARS = [2024, 2025, 2026, 2027];

const getYearStorageKey = (baseKey: string, year: number) => `${baseKey}_${year}`;

// Normalizer untuk Item Anggaran
const normalizeBudgetItem = (item: any): BudgetItem => {
  let posType = item.posType;
  let pos = item.pos;
  if (posType === 'Sewa Non AHG') {
    posType = 'Beban Sewa';
    if (pos === 'Beban Sewa Non AHG' || pos === 'Beban Sewa AHG') {
      pos = 'Beban Sewa';
    }
  }
  const rawReal = Array.isArray(item.realizationMonthly)
    ? item.realizationMonthly
    : Array(12).fill(0).map((_, m) => (item.realizationTunai?.[m] || 0) + (item.realizationNonTunai?.[m] || 0));

  const rawBudget = Array.isArray(item.budgetMonthly)
    ? item.budgetMonthly
    : Array(12).fill(0);

  return {
    ...item,
    posType,
    pos,
    budgetAnnual: item.budgetAnnual || 0,
    budgetMonthly: rawBudget,
    realizationMonthly: rawReal
  };
};

// Normalizer untuk Indikator SKKO
const normalizeIndicator = (ind: any): IndicatorTarget => {
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
};

// Normalizer untuk Transaksi Komitmen Tambahan
const normalizeTransaction = (tx: any): AdditionalTransaction => {
  let posType = tx.posType;
  let posName = tx.posName;
  if (posType === 'Sewa Non AHG') {
    posType = 'Beban Sewa';
    posName = 'Beban Sewa';
  }
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
    glAccount: glAccount || '6106200700',
    glAccountName: glAccountName || 'Beban Operasional'
  };
};

// Normalizer untuk Kontrak Alih Daya
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

// Helper untuk membaca dataset tahun tertentu dari storage atau default generator
const loadYearDataset = (year: number): YearDataset => {
  const budgetKey = getYearStorageKey(STORAGE_KEY_BUDGET, year);
  const indKey = getYearStorageKey(STORAGE_KEY_INDICATORS, year);
  const txKey = getYearStorageKey(STORAGE_KEY_TRANSACTIONS, year);
  const adKey = getYearStorageKey(STORAGE_KEY_ALIH_DAYA, year);
  const logsKey = getYearStorageKey(STORAGE_KEY_LOGS, year);

  const defaultDataset = generateDefaultYearDataset(year);

  // Backward compatibility: untuk tahun 2026, fallback ke legacy keys jika tahunan belum dibuat
  const savedBudget = localStorage.getItem(budgetKey) || 
    (year === 2026 ? (localStorage.getItem(STORAGE_KEY_BUDGET) || localStorage.getItem('madiun_anggaran_items_v6') || localStorage.getItem('madiun_anggaran_items_v5')) : null);
  const savedInd = localStorage.getItem(indKey) || 
    (year === 2026 ? (localStorage.getItem(STORAGE_KEY_INDICATORS) || localStorage.getItem('madiun_anggaran_indicators_v6')) : null);
  const savedTx = localStorage.getItem(txKey) || 
    (year === 2026 ? (localStorage.getItem(STORAGE_KEY_TRANSACTIONS) || localStorage.getItem('madiun_anggaran_transactions_v6')) : null);
  const savedAD = localStorage.getItem(adKey) || 
    (year === 2026 ? localStorage.getItem(STORAGE_KEY_ALIH_DAYA) : null);
  const savedLogs = localStorage.getItem(logsKey) || 
    (year === 2026 ? (localStorage.getItem(STORAGE_KEY_LOGS) || localStorage.getItem('madiun_anggaran_logs_v6')) : null);

  let budgetItems: BudgetItem[] = defaultDataset.budgetItems;
  let indicators: IndicatorTarget[] = defaultDataset.indicators;
  let additionalTransactions: AdditionalTransaction[] = defaultDataset.additionalTransactions;
  let alihDayaContracts: AlihDayaContract[] = defaultDataset.alihDayaContracts;
  let importLogs: ImportLog[] = defaultDataset.importLogs;

  if (savedBudget) {
    try {
      let parsed = JSON.parse(savedBudget);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed = parsed.map(normalizeBudgetItem);
        // Ensure Beban Sewa sub accounts exist
        const hasSewaNonAhg = parsed.some((it: any) => it.code === '6101310001');
        const hasSewaAnakPrshn = parsed.some((it: any) => it.code === '6101310002');
        const hasSewaHeader = parsed.some((it: any) => it.posType === 'Beban Sewa' && it.isGroupHeader);

        if (!hasSewaNonAhg || !hasSewaAnakPrshn || !hasSewaHeader) {
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
              id: `item_74_${year}`,
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
              id: `item_sewa_non_ahg_${year}`,
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
              id: `item_sewa_anak_prshn_${year}`,
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
        budgetItems = recalculateBudgetSubtotals(parsed);
      }
    } catch (e) {
      console.error(`Gagal memuat anggaran tahun ${year}`, e);
    }
  }

  if (savedInd) {
    try {
      const parsed = JSON.parse(savedInd);
      if (Array.isArray(parsed) && parsed.length > 0) {
        indicators = parsed.map(normalizeIndicator);
      }
    } catch (e) {
      console.error(`Gagal memuat indikator tahun ${year}`, e);
    }
  }

  if (savedTx) {
    try {
      const parsed = JSON.parse(savedTx);
      if (Array.isArray(parsed)) {
        const dummyIds = new Set(['add_1', 'add_2', 'add_3', 'add_4', 'add_5', 'add_6', 'add_7', 'add_8']);
        additionalTransactions = parsed
          .filter((t: any) => !t.isFromAlihDaya && !t.id?.startsWith('komitmen_ad_') && !dummyIds.has(t.id))
          .map(normalizeTransaction);
      }
    } catch (e) {
      console.error(`Gagal memuat transaksi tahun ${year}`, e);
    }
  } else {
    const dummyIds = new Set(['add_1', 'add_2', 'add_3', 'add_4', 'add_5', 'add_6', 'add_7', 'add_8']);
    additionalTransactions = (defaultDataset.additionalTransactions || [])
      .filter((t: any) => !t.isFromAlihDaya && !t.id?.startsWith('komitmen_ad_') && !dummyIds.has(t.id));
  }

  if (savedAD) {
    try {
      const parsed = JSON.parse(savedAD);
      if (Array.isArray(parsed) && parsed.length > 0) {
        alihDayaContracts = parsed.map(normalizeContract);
      }
    } catch (e) {
      console.error(`Gagal memuat alih daya tahun ${year}`, e);
    }
  }

  if (savedLogs) {
    try {
      const parsed = JSON.parse(savedLogs);
      if (Array.isArray(parsed)) {
        importLogs = parsed;
      }
    } catch (e) {
      console.error(`Gagal memuat log impor tahun ${year}`, e);
    }
  }

  return {
    budgetItems,
    indicators,
    additionalTransactions,
    alihDayaContracts,
    importLogs
  };
};

// Helper untuk menyimpan dataset tahun tertentu ke storage
const saveYearDataset = (year: number, data: YearDataset) => {
  try {
    const budgetKey = getYearStorageKey(STORAGE_KEY_BUDGET, year);
    const indKey = getYearStorageKey(STORAGE_KEY_INDICATORS, year);
    const txKey = getYearStorageKey(STORAGE_KEY_TRANSACTIONS, year);
    const adKey = getYearStorageKey(STORAGE_KEY_ALIH_DAYA, year);
    const logsKey = getYearStorageKey(STORAGE_KEY_LOGS, year);

    localStorage.setItem(budgetKey, JSON.stringify(data.budgetItems));
    localStorage.setItem(indKey, JSON.stringify(data.indicators));
    localStorage.setItem(txKey, JSON.stringify(data.additionalTransactions));
    localStorage.setItem(adKey, JSON.stringify(data.alihDayaContracts));
    localStorage.setItem(logsKey, JSON.stringify(data.importLogs));

    // Sinkronisasi juga ke legacy key tanpa akhiran tahun untuk tahun 2026
    if (year === 2026) {
      localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(data.budgetItems));
      localStorage.setItem(STORAGE_KEY_INDICATORS, JSON.stringify(data.indicators));
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(data.additionalTransactions));
      localStorage.setItem(STORAGE_KEY_ALIH_DAYA, JSON.stringify(data.alihDayaContracts));
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(data.importLogs));
    }
  } catch (e) {
    console.error(`Gagal menyimpan dataset tahun ${year}`, e);
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ambil tahun yang disimpan sebelumnya atau default ke 2026
  const initialYear = (() => {
    const saved = localStorage.getItem(STORAGE_KEY_SELECTED_YEAR);
    if (saved && !isNaN(Number(saved))) {
      const n = Number(saved);
      if (AVAILABLE_YEARS.includes(n)) return n;
    }
    return 2026;
  })();

  const [selectedYear, setSelectedYearState] = useState<number>(initialYear);
  const activeYearRef = useRef<number>(initialYear);

  // Inisialisasi dataset tahun awal
  const [initialData] = useState<YearDataset>(() => loadYearDataset(initialYear));

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(initialData.budgetItems);
  const [indicators, setIndicators] = useState<IndicatorTarget[]>(initialData.indicators);
  const [additionalTransactions, setAdditionalTransactions] = useState<AdditionalTransaction[]>(() => {
    const dummyIds = new Set(['add_1', 'add_2', 'add_3', 'add_4', 'add_5', 'add_6', 'add_7', 'add_8']);
    return (initialData.additionalTransactions || [])
      .filter(t => !t.isFromAlihDaya && !t.id?.startsWith('komitmen_ad_') && !dummyIds.has(t.id));
  });
  const [alihDayaContracts, setAlihDayaContracts] = useState<AlihDayaContract[]>(initialData.alihDayaContracts);
  const [importLogs, setImportLogs] = useState<ImportLog[]>(initialData.importLogs);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialYear < 2026 ? 11 : 7);

  // Menghasilkan komitmen bulanan otomatis dari Kontrak & Termin Alih Daya
  // Mengikuti data alih daya: yang open masuk komitmen bulanan per pos,
  // bila sudah tidak open (lengkap dokumen / tercatat) tidak diperhitungkan di prognosa.
  const alihDayaMonthlyCommitments = useMemo(() => {
    return generateAlihDayaMonthlyCommitments(alihDayaContracts, selectedYear);
  }, [alihDayaContracts, selectedYear]);

  // Gabungkan transaksi komitmen manual dengan komitmen bulanan Alih Daya
  const mergedAdditionalTransactions = useMemo(() => {
    const dummyIds = new Set(['add_1', 'add_2', 'add_3', 'add_4', 'add_5', 'add_6', 'add_7', 'add_8']);
    const cleanManual = additionalTransactions.filter(t => 
      !t.isFromAlihDaya && 
      !t.id.startsWith('komitmen_ad_') && 
      !dummyIds.has(t.id)
    );
    return [...cleanManual, ...alihDayaMonthlyCommitments];
  }, [additionalTransactions, alihDayaMonthlyCommitments]);

  // Handler pergantian tahun anggaran dengan persistensi otomatis per tahun
  const setSelectedYear = useCallback((targetYear: number) => {
    if (targetYear === activeYearRef.current) return;

    const currentYear = activeYearRef.current;

    // 1. Simpan segera data tahun yang sedang aktif ke storage tahunnya
    saveYearDataset(currentYear, {
      budgetItems,
      indicators,
      additionalTransactions,
      alihDayaContracts,
      importLogs
    });

    // 2. Muat dataset untuk tahun yang baru dipilih
    const targetDataset = loadYearDataset(targetYear);

    // 3. Update ref, state & local storage key
    activeYearRef.current = targetYear;
    setSelectedYearState(targetYear);
    localStorage.setItem(STORAGE_KEY_SELECTED_YEAR, String(targetYear));

    // 4. Update data state di aplikasi
    setBudgetItems(targetDataset.budgetItems);
    setIndicators(targetDataset.indicators);
    setAdditionalTransactions(targetDataset.additionalTransactions);
    setAlihDayaContracts(targetDataset.alihDayaContracts);
    setImportLogs(targetDataset.importLogs);

    // 5. Sesuaikan cut-off bulan: tahun lalu default ke bulan 11 (Desember / Tutup Buku), tahun 2026 ke 7 (Agustus)
    if (targetYear < 2026) {
      setSelectedMonth(11);
    } else if (targetYear === 2026) {
      setSelectedMonth(7);
    }
  }, [budgetItems, indicators, additionalTransactions, alihDayaContracts, importLogs]);

  // Users & Current Active User
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved users', e);
      }
    }
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.nip && parsed.role) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse current user', e);
      }
    }
    return null;
  });

  // Supabase sync states
  const [isSupabaseEnabled] = useState<boolean>(() => isSupabaseConfigured());
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const isInitialRemoteLoadDone = useRef(false);
  const isSyncingRef = useRef(false);

  // Manual / programmatic sync to Supabase
  const syncToSupabase = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase belum dikonfigurasi. Harap atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di environment variables.' };
    }
    setSupabaseSyncStatus('syncing');
    isSyncingRef.current = true;
    const payload: AppDataPayload = {
      budgetItems,
      indicators,
      additionalTransactions,
      alihDayaContracts,
      importLogs,
      selectedYear,
      selectedMonth,
      users
    };
    const res = await saveRemoteState(payload);
    isSyncingRef.current = false;
    if (res.success) {
      setSupabaseSyncStatus('synced');
      setLastSyncTime(new Date());
      return { success: true };
    } else {
      setSupabaseSyncStatus('error');
      return { success: false, error: res.error };
    }
  }, [budgetItems, indicators, additionalTransactions, alihDayaContracts, importLogs, selectedYear, selectedMonth, users]);

  // Load latest state from Supabase
  const loadFromSupabase = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase belum dikonfigurasi.' };
    }
    setSupabaseSyncStatus('syncing');
    const remote = await fetchRemoteState();
    if (remote) {
      if (Array.isArray(remote.budgetItems) && remote.budgetItems.length > 0) {
        setBudgetItems(recalculateBudgetSubtotals(remote.budgetItems));
      }
      if (Array.isArray(remote.indicators) && remote.indicators.length > 0) {
        setIndicators(remote.indicators);
      }
      if (Array.isArray(remote.additionalTransactions)) {
        setAdditionalTransactions(remote.additionalTransactions);
      }
      if (Array.isArray(remote.alihDayaContracts)) {
        setAlihDayaContracts(remote.alihDayaContracts.map(normalizeContract));
      }
      if (Array.isArray(remote.importLogs)) {
        setImportLogs(remote.importLogs);
      }
      if (Array.isArray(remote.users) && remote.users.length > 0) {
        setUsers(remote.users);
      }
      if (remote.selectedYear) setSelectedYear(remote.selectedYear);
      if (remote.selectedMonth !== undefined) setSelectedMonth(remote.selectedMonth);

      setSupabaseSyncStatus('synced');
      setLastSyncTime(new Date());
      return { success: true };
    } else {
      setSupabaseSyncStatus('idle');
      return { success: false, error: 'Tidak ditemukan data di database Supabase atau tabel belum dibuat.' };
    }
  }, []);

  // Initial load from Supabase on startup if configured
  useEffect(() => {
    if (isSupabaseConfigured() && !isInitialRemoteLoadDone.current) {
      isInitialRemoteLoadDone.current = true;
      loadFromSupabase();
    }
  }, [loadFromSupabase]);

  // Auto-save perubahan ke localStorage untuk tahun anggaran yang sedang aktif
  useEffect(() => {
    if (activeYearRef.current === selectedYear) {
      saveYearDataset(selectedYear, {
        budgetItems,
        indicators,
        additionalTransactions,
        alihDayaContracts,
        importLogs
      });
    }
  }, [budgetItems, indicators, additionalTransactions, alihDayaContracts, importLogs, selectedYear]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  }, [currentUser]);

  // Debounced auto-save to Supabase when data changes
  useEffect(() => {
    if (!isSupabaseConfigured() || !isInitialRemoteLoadDone.current) return;
    const timer = setTimeout(() => {
      syncToSupabase();
    }, 2000);
    return () => clearTimeout(timer);
  }, [budgetItems, indicators, additionalTransactions, alihDayaContracts, importLogs, selectedYear, selectedMonth, syncToSupabase]);

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
    // Jika komitmen berasal dari akumulasi bulanan Alih Daya
    if (id.startsWith('komitmen_ad_')) {
      if (updated.documentNumber !== undefined) {
        const docNum = (updated.documentNumber || '').trim();
        const statusBeban: StatusBeban = docNum !== '' ? 'Tercatat' : 'Belum Tercatat';
        const match = id.match(/^komitmen_ad_(.+)_m(\d+)$/);
        if (match) {
          const rawPos = match[1].replace(/_/g, ' ');
          const month = parseInt(match[2], 10);

          setAlihDayaContracts(prev => prev.map(c => {
            const cPos = (c.posAnggaran || c.posType || 'Pos 53') as string;
            const posMatches = cPos === rawPos || (rawPos === 'Beban Sewa' && cPos === 'Sewa Non AHG');
            if (!posMatches) return c;

            return {
              ...c,
              termins: c.termins.map(t => {
                const tPos = (t.posType || cPos) as string;
                const tMonth = t.bulanIndex !== undefined ? t.bulanIndex : 0;
                const matches = (tPos === rawPos || (rawPos === 'Beban Sewa' && tPos === 'Sewa Non AHG')) && tMonth === month;
                if (matches) {
                  return {
                    ...t,
                    documentNumber: docNum,
                    statusBeban
                  };
                }
                return t;
              })
            };
          }));
        }
      }
      return;
    }

    setAdditionalTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updated } : tx));
  };

  const deleteAdditionalTransaction = (id: string) => {
    if (id.startsWith('komitmen_ad_')) {
      return;
    }
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
    const defaultData = generateDefaultYearDataset(selectedYear);
    setBudgetItems(defaultData.budgetItems);
    setIndicators(defaultData.indicators);
    setAdditionalTransactions(defaultData.additionalTransactions);
    setAlihDayaContracts(defaultData.alihDayaContracts);
    setImportLogs(defaultData.importLogs);
    saveYearDataset(selectedYear, defaultData);
    if (selectedYear < 2026) {
      setSelectedMonth(11);
    } else {
      setSelectedMonth(7);
    }
  };

  const copyDataFromYear = useCallback((fromYear: number, targetYear: number = selectedYear, options?: { copyBudget?: boolean; copyContracts?: boolean }) => {
    const fromData = loadYearDataset(fromYear);
    const copyBudget = options?.copyBudget ?? true;
    const copyContracts = options?.copyContracts ?? false;

    let newBudgetItems = budgetItems;
    let newContracts = alihDayaContracts;

    if (copyBudget) {
      newBudgetItems = recalculateBudgetSubtotals(fromData.budgetItems.map(item => ({
        ...item,
        realizationMonthly: targetYear > fromYear ? Array(12).fill(0) : item.realizationMonthly
      })));
      setBudgetItems(newBudgetItems);
    }

    if (copyContracts) {
      newContracts = fromData.alihDayaContracts.map(contract => ({
        ...contract,
        id: `kontrak_ad_${contract.id}_${targetYear}`,
        tahun: targetYear,
        tahunAnggaran: targetYear,
        termins: contract.termins.map(t => ({
          ...t,
          id: `t_${t.id}_${targetYear}`,
          documentNumber: targetYear > fromYear ? '' : t.documentNumber,
          statusBeban: (targetYear > fromYear ? 'Belum Tercatat' : t.statusBeban) as StatusBeban
        }))
      }));
      setAlihDayaContracts(newContracts);
    }

    saveYearDataset(targetYear, {
      budgetItems: newBudgetItems,
      indicators,
      additionalTransactions,
      alihDayaContracts: newContracts,
      importLogs
    });

    return { 
      success: true, 
      message: `Berhasil menyalin data dari tahun ${fromYear} ke tahun ${targetYear}.` 
    };
  }, [budgetItems, indicators, additionalTransactions, alihDayaContracts, importLogs, selectedYear]);

  const canAccessTab = useCallback((tab: ActiveTab): boolean => {
    if (!currentUser) return false;
    const roleConfig = ROLE_PERMISSIONS[currentUser.role];
    if (!roleConfig) return false;
    return roleConfig.allowedTabs.includes(tab);
  }, [currentUser]);

  const addUser = useCallback((userData: Omit<AppUser, 'id' | 'createdAt'>): { success: boolean; message?: string } => {
    const trimmedNip = userData.nip.trim();
    if (!trimmedNip) {
      return { success: false, message: 'NIP wajib diisi.' };
    }
    if (!userData.nama.trim()) {
      return { success: false, message: 'Nama wajib diisi.' };
    }
    if (!userData.password) {
      return { success: false, message: 'Password wajib diisi.' };
    }
    if (users.some(u => u.nip.trim() === trimmedNip)) {
      return { success: false, message: `NIP "${trimmedNip}" sudah terdaftar dalam sistem.` };
    }

    const newUser: AppUser = {
      ...userData,
      nama: userData.nama.trim(),
      nip: trimmedNip,
      jabatan: userData.jabatan.trim() || 'Staff',
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers(prev => [...prev, newUser]);
    return { success: true };
  }, [users]);

  const updateUser = useCallback((id: string, updated: Partial<AppUser>): { success: boolean; message?: string } => {
    if (updated.nip) {
      const trimmedNip = updated.nip.trim();
      if (users.some(u => u.id !== id && u.nip.trim() === trimmedNip)) {
        return { success: false, message: `NIP "${trimmedNip}" sudah digunakan oleh user lain.` };
      }
    }

    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updatedUser = { 
          ...u, 
          ...updated,
          nama: updated.nama ? updated.nama.trim() : u.nama,
          nip: updated.nip ? updated.nip.trim() : u.nip,
          jabatan: updated.jabatan !== undefined ? updated.jabatan.trim() : u.jabatan,
        };
        if (currentUser && id === currentUser.id) {
          setCurrentUser(updatedUser);
        }
        return updatedUser;
      }
      return u;
    }));

    return { success: true };
  }, [users, currentUser]);

  const deleteUser = useCallback((id: string): { success: boolean; message?: string } => {
    if (currentUser && id === currentUser.id) {
      return { success: false, message: 'Tidak dapat menghapus akun yang sedang aktif digunakan.' };
    }

    const target = users.find(u => u.id === id);
    if (!target) {
      return { success: false, message: 'User tidak ditemukan.' };
    }

    if (target.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        return { success: false, message: 'Tidak dapat menghapus admin terakhir dalam sistem.' };
      }
    }

    setUsers(prev => prev.filter(u => u.id !== id));
    return { success: true };
  }, [users, currentUser]);

  const loginUser = useCallback((nip: string, password: string): { success: boolean; message?: string } => {
    const trimmedNip = nip.trim();
    if (!trimmedNip) {
      return { success: false, message: 'Nomor Induk Pegawai (NIP) wajib diisi.' };
    }
    if (!password) {
      return { success: false, message: 'Password wajib diisi.' };
    }

    const matched = users.find(u => 
      u.nip.trim() === trimmedNip && u.password === password
    );

    if (matched) {
      setCurrentUser(matched);
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(matched));
      return { success: true };
    }

    return { success: false, message: 'NIP atau Password yang Anda masukkan tidak sesuai.' };
  }, [users]);

  const logoutUser = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  }, []);

  const exportDataJSON = () => {
    const data = {
      year: selectedYear,
      budgetItems,
      indicators,
      additionalTransactions: mergedAdditionalTransactions,
      alihDayaContracts,
      users,
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
        additionalTransactions: mergedAdditionalTransactions,
        alihDayaContracts,
        importLogs,
        selectedYear,
        selectedMonth,
        availableYears: AVAILABLE_YEARS,
        setSelectedYear,
        setSelectedMonth,
        copyDataFromYear,
        users,
        currentUser,
        addUser,
        updateUser,
        deleteUser,
        loginUser,
        logoutUser,
        canAccessTab,
        isSupabaseEnabled,
        supabaseSyncStatus,
        lastSyncTime,
        syncToSupabase,
        loadFromSupabase,
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
