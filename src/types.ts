export type PosType = 
  | 'Pos 52' // Beban Kepegawaian
  | 'Pos 53' // Beban Pemeliharaan
  | 'Pos 54' // Biaya Administrasi dan Umum
  | 'Beban Sewa' // Beban Sewa
  | 'Sewa Non AHG' // Legacy alias
  | 'Pos 72' // Beban Pensiun
  | 'Lainnya';

export interface MonthlyValues {
  [monthIndex: number]: number; // 0 for Jan, 11 for Des
}

export interface BudgetItem {
  id: string;
  code: string; // e.g. "6105100110" or "POS52"
  name: string; // e.g. "Pay For Person (P1)"
  pos: string; // "Pos 52 Beban Kepegawaian", "Pos 53 Beban Pemeliharaan", etc.
  posType: PosType;
  category: string; // e.g. "Beban Kepegawaian dalam Bentuk Kompensasi"
  isGroupHeader: boolean;
  level: number; // 0 for Pos/Total, 1 for Subcategory, 2 for Akun GL
  budgetAnnual: number;
  budgetMonthly: number[]; // 12 elements (Jan to Des)
  realizationMonthly: number[]; // 12 elements (Jan to Des)
  notes?: string;
  updatedAt?: string;
}

export interface IndicatorTarget {
  id: string;
  code: string;
  name: string;
  pos: string;
  posType: PosType;
  unit: string;
  monthlyTarget: number[]; // 12 elements
  monthlyRealization: number[]; // 12 elements
  monthlyPercentage: number[]; // 12 elements
  targetAnnual: number;
  description?: string;
  targetRule?: string;
}

export interface AlihDayaMonthlyContractItem {
  contractId: string;
  contractName: string;
  contractNumber?: string;
  vendor?: string;
  terminId: string;
  terminLabel: string;
  nominal: number;
  documentNumber?: string;
  statusBeban: StatusBeban;
  isOpen: boolean;
  glAccount?: string;
  glAccountName?: string;
}

export interface AlihDayaMonthlyDetail {
  openAmount: number;
  documentedAmount: number;
  totalAmount: number;
  openCount: number;
  documentedCount: number;
  totalCount: number;
  contracts: AlihDayaMonthlyContractItem[];
}

export interface AdditionalTransaction {
  id: string;
  posType: PosType;
  posName?: string;
  glAccount?: string; // Kode Akun GL (contoh: "6106200700", "6107200800")
  glAccountName?: string; // Nama Akun GL (contoh: "Beban jasa borong Gardu Induk")
  category: string; // "PEKERJAAN KONTRAK RUTIN", "TAGIHAN NON RAB", "RINCIAN PEKERJAAN", "SEWA NON AHG"
  name: string; // e.g. "Security Tahap I", "Cleaning Service", "Fixcost Driver"
  month: number; // 0-11
  year?: number;
  amount: number;
  documentNumber?: string; // No. Dokumen / SPJ / Kontrak / SAP (jika terisi, dikecualikan dari perhitungan komitmen tambahan)
  note?: string;
  notes?: string;
  isActive: boolean;
  isFromAlihDaya?: boolean;
  alihDayaDetail?: AlihDayaMonthlyDetail;
}

export interface ImportLog {
  id: string;
  fileName: string;
  fileSize: number;
  importedAt: string;
  rowsProcessed: number;
  rowsMatched: number;
  totalAmountImported: number;
  status: 'success' | 'warning' | 'error';
  message: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'budget_input'
  | 'realization_input'
  | 'realization_import'
  | 'matrix'
  | 'performance'
  | 'prognosa'
  | 'alih_daya'
  | 'reports'
  | 'user_management';

export type UserRole = 'admin' | 'management' | 'user';

export interface AppUser {
  id: string;
  nama: string;      // Nama
  nip: string;       // NIP
  jabatan: string;   // Jabatan
  password: string;  // Password
  role: UserRole;    // Role user
  createdAt?: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, {
  label: string;
  description: string;
  badgeClass: string;
  allowedTabs: ActiveTab[];
}> = {
  admin: {
    label: 'Admin',
    description: 'Akses penuh ke seluruh menu dan modul aplikasi serta manajemen user',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    allowedTabs: [
      'dashboard',
      'performance',
      'reports',
      'prognosa',
      'alih_daya',
      'matrix',
      'budget_input',
      'realization_input',
      'realization_import',
      'user_management'
    ]
  },
  management: {
    label: 'Management',
    description: 'Akses monitoring eksekutif: Dashboard Utama, Indikator & Kinerja, Laporan & Ringkasan',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    allowedTabs: [
      'dashboard',
      'performance',
      'reports'
    ]
  },
  user: {
    label: 'User',
    description: 'Akses operasional: Dashboard Utama, Indikator & Kinerja, Laporan & Ringkasan, Prognosa Anggaran, Matriks Monitoring',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    allowedTabs: [
      'dashboard',
      'performance',
      'reports',
      'prognosa',
      'matrix'
    ]
  }
};

export type StatusBeban = 'Tercatat' | 'Belum Tercatat';

export interface AlihDayaTermin {
  id: string;
  terminTagihan?: string; // 4. Termin Tagihan (e.g. "Termin 1 (Januari 2026)")
  termin?: string; // alias
  bulanIndex?: number; // 0-11
  glAccount: string; // 3. GL Account (contoh: "6106201700")
  glAccountName?: string; // Nama Akun GL
  posType?: PosType;
  nominalTagihan?: number; // 5. Nominal Tagihan (Rp)
  amount?: number; // alias
  documentNumber: string; // 7. No Dokumen (SAP / SPJ / MIRO / SES). Bila diisi => 'Tercatat', bila kosong => 'Belum Tercatat'
  statusBeban: StatusBeban; // 6. Status Beban ('Tercatat' | 'Belum Tercatat')
  tanggalJatuhTempo?: string; // Jatuh tempo / rencana bayar
  tglTagihan?: string; // alias
  notes?: string; // Catatan / Keterangan
}

export interface AlihDayaContract {
  id: string;
  namaKontrak: string; // 1. Nama Kontrak (Wajib, Unik)
  nomorKontrak?: string; // 2. Nomor Kontrak (Wajib, Unik, tidak boleh sama dengan namaKontrak)
  nomerKontrak?: string; // alias for backward compatibility
  vendor?: string; // Nama Rekanan / Vendor Alih Daya (contoh: PT Haleyora Power)
  posAnggaran?: PosType; // Kelompok Pos Anggaran
  posType?: PosType; // alias
  glAccountDefault?: string; // GL Account utama
  glAccountNameDefault?: string;
  glAccountDefaultName?: string; // alias
  tahunAnggaran?: number; // Tahun anggaran, contoh 2026
  tahun?: number; // alias
  periodeAwal?: string;
  periodeAkhir?: string;
  keterangan?: string;
  statusKontrak?: string;
  termins: AlihDayaTermin[]; // Sub data No 2 s/d 7
}

