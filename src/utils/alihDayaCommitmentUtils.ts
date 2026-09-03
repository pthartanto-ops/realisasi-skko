import { AlihDayaContract, AdditionalTransaction, PosType, AlihDayaMonthlyContractItem } from '../types';
import { MONTH_NAMES, formatRupiah } from './formatters';

// Map default GL Account & Name per Pos
export const DEFAULT_ALIH_DAYA_GL: Record<string, { code: string; name: string }> = {
  'Pos 53': {
    code: '6106201700',
    name: 'Beban jasa borong perlengk Umum'
  },
  'Pos 54': {
    code: '6107201400',
    name: 'Alat dan Keperluan Kantor'
  },
  'Beban Sewa': {
    code: '6101310001',
    name: 'Beban Sewa Non AHG'
  },
  'Pos 52': {
    code: '6105100110',
    name: 'Pay For Person (P1)'
  },
  'Pos 72': {
    code: '6108100100',
    name: 'Beban Pensiun & THT'
  }
};

export const normalizePosType = (pos?: string): PosType => {
  if (!pos || pos === 'Sewa Non AHG') return 'Beban Sewa';
  if (['Pos 52', 'Pos 53', 'Pos 54', 'Beban Sewa', 'Pos 72'].includes(pos)) {
    return pos as PosType;
  }
  return 'Pos 53';
};

export const getPosDisplayName = (pos: PosType): string => {
  switch (pos) {
    case 'Pos 53':
      return 'Pos 53 Beban Pemeliharaan';
    case 'Pos 54':
      return 'Pos 54 Biaya Administrasi dan Umum';
    case 'Beban Sewa':
      return 'Beban Sewa';
    case 'Pos 52':
      return 'Pos 52 Beban Kepegawaian';
    case 'Pos 72':
      return 'Pos 72 Beban Pajak & Lainnya';
    default:
      return `${pos}`;
  }
};

/**
 * Menghitung dan menghasilkan daftar komitmen bulanan per POS dari data Kontrak & Termin Kontrak Rutin.
 * - Sesuai ketentuan: Tagihan kontrak rutin yang masih OPEN (belum tercatat / belum ada no dokumen)
 *   masuk pada daftar komitmen secara total bulanan pada pos masing-masing.
 * - Bila seluruh tagihan pada bulan & pos tersebut sudah TIDAK OPEN (sudah ada nomor dokumen atau berstatus Tercatat),
 *   maka nominal komitmen terbuka adalah 0 dan ditandai Tercatat di SAP sehingga TIDAK DIPERHITUNGKAN DI PROGNOSA.
 */
export function generateAlihDayaMonthlyCommitments(
  contracts: AlihDayaContract[],
  year: number
): AdditionalTransaction[] {
  if (!Array.isArray(contracts) || contracts.length === 0) {
    return [];
  }

  // Filter kontrak yang relevan dengan tahun anggaran (jika ada properti tahun/tahunAnggaran)
  const relevantContracts = contracts.filter(c => {
    const cYear = c.tahunAnggaran || c.tahun;
    return !cYear || cYear === year;
  });

  interface GroupData {
    pos: PosType;
    month: number;
    openAmount: number;
    documentedAmount: number;
    totalAmount: number;
    openCount: number;
    documentedCount: number;
    totalCount: number;
    glCounts: Record<string, { count: number; name: string }>;
    contracts: AlihDayaMonthlyContractItem[];
  }

  const groups: Record<string, GroupData> = {};

  relevantContracts.forEach(contract => {
    const defaultContractPos = normalizePosType(contract.posAnggaran || contract.posType);
    const contractGl = contract.glAccountDefault || DEFAULT_ALIH_DAYA_GL[defaultContractPos]?.code || '6106201700';
    const contractGlName = contract.glAccountNameDefault || contract.glAccountDefaultName || DEFAULT_ALIH_DAYA_GL[defaultContractPos]?.name || 'Beban Jasa Borong Kontrak Rutin';

    (contract.termins || []).forEach(termin => {
      // 1. Tentukan POS
      const pos = normalizePosType(termin.posType || defaultContractPos);

      // 2. Tentukan Bulan Index (0 - 11)
      let monthIndex = termin.bulanIndex;
      if (monthIndex === undefined || monthIndex === null || monthIndex < 0 || monthIndex > 11) {
        // Coba deteksi dari tglTagihan / tanggalJatuhTempo (YYYY-MM-DD)
        const dateStr = termin.tanggalJatuhTempo || termin.tglTagihan || '';
        const match = dateStr.match(/\d{4}-(\d{2})/);
        if (match) {
          monthIndex = parseInt(match[1], 10) - 1;
        } else {
          // Coba deteksi dari label termin (misal: "Termin 1 (Januari 2026)")
          const label = (termin.terminTagihan || termin.termin || '').toLowerCase();
          const foundIdx = MONTH_NAMES.findIndex(m => label.includes(m.toLowerCase()));
          monthIndex = foundIdx !== -1 ? foundIdx : 0;
        }
      }

      // 3. Tentukan status OPEN vs TERCATAT
      const docNum = (termin.documentNumber || '').trim();
      const hasDoc = docNum.length > 0;
      const isTercatat = hasDoc || termin.statusBeban === 'Tercatat';
      const isOpen = !isTercatat;

      const nominal = Math.max(0, termin.nominalTagihan ?? termin.amount ?? 0);
      const terminGl = termin.glAccount || contractGl;
      const terminGlName = termin.glAccountName || contractGlName;

      const groupKey = `${pos}_m${monthIndex}`;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          pos,
          month: monthIndex,
          openAmount: 0,
          documentedAmount: 0,
          totalAmount: 0,
          openCount: 0,
          documentedCount: 0,
          totalCount: 0,
          glCounts: {},
          contracts: []
        };
      }

      const g = groups[groupKey];
      g.totalAmount += nominal;
      g.totalCount += 1;

      if (isOpen) {
        g.openAmount += nominal;
        g.openCount += 1;
      } else {
        g.documentedAmount += nominal;
        g.documentedCount += 1;
      }

      if (!g.glCounts[terminGl]) {
        g.glCounts[terminGl] = { count: 0, name: terminGlName };
      }
      g.glCounts[terminGl].count += 1;

      g.contracts.push({
        contractId: contract.id,
        contractName: contract.namaKontrak || 'Kontrak Rutin',
        contractNumber: contract.nomerKontrak || '',
        vendor: contract.vendor || '',
        terminId: termin.id,
        terminLabel: termin.terminTagihan || termin.termin || `Termin`,
        nominal,
        documentNumber: docNum,
        statusBeban: isTercatat ? 'Tercatat' : 'Belum Tercatat',
        isOpen,
        glAccount: terminGl,
        glAccountName: terminGlName
      });
    });
  });

  const results: AdditionalTransaction[] = [];

  // Urutkan berdasarkan Bulan lalu POS
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const ga = groups[a];
    const gb = groups[b];
    if (ga.month !== gb.month) return ga.month - gb.month;
    return ga.pos.localeCompare(gb.pos);
  });

  sortedKeys.forEach(key => {
    const g = groups[key];
    if (g.totalCount === 0) return;

    const monthName = MONTH_NAMES[g.month] || `Bulan ${g.month + 1}`;
    const posName = getPosDisplayName(g.pos);

    // Cari GL Account yang paling sering digunakan dalam grup ini
    let primaryGl = DEFAULT_ALIH_DAYA_GL[g.pos]?.code || '6106201700';
    let primaryGlName = DEFAULT_ALIH_DAYA_GL[g.pos]?.name || 'Beban Jasa Borong Kontrak Rutin';
    let maxGlCount = 0;
    Object.entries(g.glCounts).forEach(([code, data]) => {
      if (data.count > maxGlCount) {
        maxGlCount = data.count;
        primaryGl = code;
        primaryGlName = data.name;
      }
    });

    const isFullyClosed = g.openCount === 0;

    let noteText = '';
    if (isFullyClosed) {
      noteText = `Seluruh ${g.totalCount} tagihan Kontrak Rutin telah tercatat di SAP (${formatRupiah(g.documentedAmount)})`;
    } else if (g.documentedCount > 0) {
      noteText = `${g.openCount} tagihan open (${formatRupiah(g.openAmount)}), ${g.documentedCount} tagihan tercatat SAP (${formatRupiah(g.documentedAmount)}) dari total ${g.totalCount} tagihan Kontrak Rutin ${g.pos}`;
    } else {
      noteText = `Total ${g.openCount} tagihan Kontrak Rutin ${g.pos} masih open/belum tercatat (${formatRupiah(g.openAmount)})`;
    }

    // Nomor Dokumen:
    // Bila masih open: kosongkan agar masuk hitungan komitmen terbuka Prognosa.
    // Bila sudah tidak open (seluruh tagihan tercatat / memiliki nomor dokumen):
    // Isi nomor dokumen dengan ringkasan status tercatat agar DIKECUALIKAN DARI PROGNOSA.
    const docNumber = isFullyClosed 
      ? `TERCATAT SAP (${g.documentedCount} DOKUMEN)`
      : '';

    // Nominal komitmen:
    // Mengikuti sisa tagihan yang masih OPEN.
    // Bila sudah tidak open, nominal adalah 0 (atau totalAmount dengan flag dokumen tercatat).
    const amount = isFullyClosed ? 0 : g.openAmount;

    results.push({
      id: `komitmen_ad_${g.pos.replace(/\s+/g, '_')}_m${g.month}`,
      posType: g.pos,
      posName,
      glAccount: primaryGl,
      glAccountName: primaryGlName,
      category: 'PEKERJAAN KONTRAK RUTIN',
      name: `Tagihan Kontrak Rutin ${g.pos} - ${monthName} ${year}`,
      month: g.month,
      year,
      amount,
      documentNumber: docNumber,
      note: noteText,
      notes: noteText,
      isActive: true,
      isFromAlihDaya: true,
      alihDayaDetail: {
        openAmount: g.openAmount,
        documentedAmount: g.documentedAmount,
        totalAmount: g.totalAmount,
        openCount: g.openCount,
        documentedCount: g.documentedCount,
        totalCount: g.totalCount,
        contracts: g.contracts
      }
    });
  });

  return results;
}
