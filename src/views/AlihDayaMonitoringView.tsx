import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Layers, 
  Building2, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Info,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
  Hash,
  ArrowRight,
  ShieldCheck,
  Percent,
  ListFilter,
  Check,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Table as TableIcon,
  Eye,
  FileSpreadsheet,
  Copy
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AlihDayaContract, AlihDayaTermin, StatusBeban, PosType } from '../types';
import { 
  formatRupiah, 
  formatRupiahShort, 
  formatPercent, 
  MONTH_NAMES, 
  MONTH_SHORT_NAMES 
} from '../utils/formatters';
import { exportAlihDayaToExcel } from '../utils/excelExporter';
import { MonthBillsModal } from '../components/alih_daya/MonthBillsModal';
import { MultiTerminSchemeModal } from '../components/alih_daya/MultiTerminSchemeModal';

/**
 * Helper to safely resolve the 0-indexed month (0 = Januari, 11 = Desember)
 * from a termin object.
 */
export const resolveTerminMonth = (termin: AlihDayaTermin): number => {
  if (termin.bulanIndex !== undefined && termin.bulanIndex >= 0 && termin.bulanIndex <= 11) {
    return termin.bulanIndex;
  }
  const dateStr = termin.tanggalJatuhTempo || termin.tglTagihan || '';
  if (dateStr && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10);
      if (!isNaN(m) && m >= 1 && m <= 12) {
        return m - 1;
      }
    }
  }
  const label = (termin.terminTagihan || termin.termin || '').toLowerCase();
  for (let i = 0; i < 12; i++) {
    if (label.includes(MONTH_NAMES[i].toLowerCase()) || label.includes(MONTH_SHORT_NAMES[i].toLowerCase())) {
      return i;
    }
  }
  const matchNum = label.match(/termin\s*(\d+)/i);
  if (matchNum && matchNum[1]) {
    const n = parseInt(matchNum[1], 10);
    if (n >= 1 && n <= 12) return n - 1;
  }
  return 0;
};

export const AlihDayaMonitoringView: React.FC = () => {
  const { 
    alihDayaContracts, 
    addAlihDayaContract, 
    updateAlihDayaContract, 
    deleteAlihDayaContract, 
    addAlihDayaTermin, 
    updateAlihDayaTermin, 
    deleteAlihDayaTermin,
    quickUpdateTerminDocNumber,
    batchUpdateContractTermins,
    selectedYear,
    selectedMonth,
    setSelectedMonth,
    budgetItems
  } = useApp();

  // Active sub-tab inside Alih Daya view
  // 'monthly_matrix': Matriks 12 Bulan (Jan - Des)
  // 'hierarchy': Hierarki Kontrak & Termin
  // 'rekap': Rekapitulasi Per Kontrak & POS
  // 'all_termins': Rincian Seluruh Termin
  const [activeTab, setActiveTab] = useState<'monthly_matrix' | 'hierarchy' | 'rekap' | 'all_termins'>('monthly_matrix');

  // Month filter: 'all' or month index '0'..'11'
  const [filterMonth, setFilterMonth] = useState<string>(String(selectedMonth ?? 0));

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Tercatat' | 'Belum Tercatat'>('all');
  const [posFilter, setPosFilter] = useState<string>('all');

  // Accordion open states (Contract IDs)
  const [expandedContracts, setExpandedContracts] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    alihDayaContracts.forEach(c => { init[c.id] = true; });
    return init;
  });

  // Modal states
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<AlihDayaContract | null>(null);

  const [isTerminModalOpen, setIsTerminModalOpen] = useState(false);
  const [targetContractIdForTermin, setTargetContractIdForTermin] = useState<string>('');
  const [editingTermin, setEditingTermin] = useState<{ contractId: string; termin: AlihDayaTermin } | null>(null);

  // Quick edit doc number modal / popover
  const [quickDocModal, setQuickDocModal] = useState<{ contractId: string; termin: AlihDayaTermin; contractName: string } | null>(null);
  const [quickDocNumberVal, setQuickDocNumberVal] = useState('');

  // Month Bills Modal (for managing multiple bills in a month)
  const [monthBillsModal, setMonthBillsModal] = useState<{ isOpen: boolean; contract: AlihDayaContract; monthIndex: number } | null>(null);

  // Multi-termin Scheme Generator Modal
  const [multiSchemeModal, setMultiSchemeModal] = useState<{ isOpen: boolean; contract: AlihDayaContract } | null>(null);

  // Form states for Contract Modal
  const [formNamaKontrak, setFormNamaKontrak] = useState('');
  const [formNomerKontrak, setFormNomerKontrak] = useState('');
  const [formVendor, setFormVendor] = useState('');
  const [formPosAnggaran, setFormPosAnggaran] = useState<PosType>('Pos 53');
  const [formGLDefault, setFormGLDefault] = useState('');
  const [formGLNameDefault, setFormGLNameDefault] = useState('');
  const [formTahun, setFormTahun] = useState<number>(selectedYear || 2026);
  const [formKeterangan, setFormKeterangan] = useState('');
  const [contractError, setContractError] = useState<string | null>(null);

  // Form states for Termin Modal
  const [formTerminMonthIndex, setFormTerminMonthIndex] = useState<number>(selectedMonth ?? 0);
  const [formTerminName, setFormTerminName] = useState('');
  const [formTerminGL, setFormTerminGL] = useState('');
  const [formTerminGLName, setFormTerminGLName] = useState('');
  const [formTerminPosType, setFormTerminPosType] = useState<PosType>('Pos 53');
  const [formTerminNominal, setFormTerminNominal] = useState<number>(0);
  const [formTerminDocNum, setFormTerminDocNum] = useState('');
  const [formTerminTanggal, setFormTerminTanggal] = useState('');
  const [formTerminNotes, setFormTerminNotes] = useState('');
  const [terminError, setTerminError] = useState<string | null>(null);

  // Toggle contract accordion
  const toggleContractAccordion = (id: string) => {
    setExpandedContracts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    alihDayaContracts.forEach(c => { next[c.id] = true; });
    setExpandedContracts(next);
  };

  const collapseAll = () => {
    setExpandedContracts({});
  };

  // Distinct Pos Anggaran for filter
  const availablePosOptions = useMemo(() => {
    const set = new Set<string>();
    alihDayaContracts.forEach(c => {
      if (c.posAnggaran) set.add(c.posAnggaran);
      else if (c.posType) set.add(c.posType);
    });
    return Array.from(set);
  }, [alihDayaContracts]);

  // Active numeric month index if specific month is chosen, otherwise null
  const numericMonth = filterMonth === 'all' ? null : parseInt(filterMonth, 10);

  // Calculations for global KPIs (Filtered by month if selected)
  const globalSummary = useMemo(() => {
    let totalNominalYear = 0;
    let totalTercatatYear = 0;
    let totalBelumTercatatYear = 0;

    let totalNominalMonth = 0;
    let totalTercatatMonth = 0;
    let totalBelumTercatatMonth = 0;
    let countTercatatMonth = 0;
    let countBelumTercatatMonth = 0;
    let totalTerminsMonth = 0;

    let totalNominalYTD = 0;
    let totalTercatatYTD = 0;
    let totalBelumTercatatYTD = 0;

    let countTercatatYear = 0;
    let countBelumTercatatYear = 0;
    let totalTerminsYear = 0;

    // Monthly bucket totals (12 months)
    const monthlyTotals = Array.from({ length: 12 }, () => ({
      nominal: 0,
      tercatat: 0,
      belumTercatat: 0,
      countTermins: 0,
      countTercatat: 0
    }));

    alihDayaContracts.forEach(c => {
      (c.termins || []).forEach(t => {
        totalTerminsYear++;
        const nominal = t.nominalTagihan ?? t.amount ?? 0;
        const isTercatat = t.statusBeban === 'Tercatat' || Boolean(t.documentNumber && t.documentNumber.trim() !== '');
        
        totalNominalYear += nominal;
        if (isTercatat) {
          totalTercatatYear += nominal;
          countTercatatYear++;
        } else {
          totalBelumTercatatYear += nominal;
          countBelumTercatatYear++;
        }

        const tMonth = resolveTerminMonth(t);
        if (tMonth >= 0 && tMonth < 12) {
          monthlyTotals[tMonth].nominal += nominal;
          monthlyTotals[tMonth].countTermins++;
          if (isTercatat) {
            monthlyTotals[tMonth].tercatat += nominal;
            monthlyTotals[tMonth].countTercatat++;
          } else {
            monthlyTotals[tMonth].belumTercatat += nominal;
          }
        }

        // MTD (Month-To-Date / Specific month filter)
        if (numericMonth !== null && tMonth === numericMonth) {
          totalTerminsMonth++;
          totalNominalMonth += nominal;
          if (isTercatat) {
            totalTercatatMonth += nominal;
            countTercatatMonth++;
          } else {
            totalBelumTercatatMonth += nominal;
            countBelumTercatatMonth++;
          }
        }

        // YTD (Cumulative up to selected month)
        if (numericMonth !== null && tMonth <= numericMonth) {
          totalNominalYTD += nominal;
          if (isTercatat) {
            totalTercatatYTD += nominal;
          } else {
            totalBelumTercatatYTD += nominal;
          }
        }
      });
    });

    const percentTercatatYear = totalNominalYear !== 0 ? (totalTercatatYear / totalNominalYear) * 100 : 0;
    const percentTercatatMonth = totalNominalMonth !== 0 ? (totalTercatatMonth / totalNominalMonth) * 100 : 0;
    const percentTercatatYTD = totalNominalYTD !== 0 ? (totalTercatatYTD / totalNominalYTD) * 100 : 0;

    return {
      totalContracts: alihDayaContracts.length,
      totalTerminsYear,
      totalNominalYear,
      totalTercatatYear,
      totalBelumTercatatYear,
      countTercatatYear,
      countBelumTercatatYear,
      percentTercatatYear,
      // Month-specific
      totalTerminsMonth,
      totalNominalMonth,
      totalTercatatMonth,
      totalBelumTercatatMonth,
      countTercatatMonth,
      countBelumTercatatMonth,
      percentTercatatMonth,
      // YTD
      totalNominalYTD,
      totalTercatatYTD,
      totalBelumTercatatYTD,
      percentTercatatYTD,
      // Monthly matrix array
      monthlyTotals
    };
  }, [alihDayaContracts, numericMonth]);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    const query = (searchTerm || '').toLowerCase().trim();

    return alihDayaContracts.filter(c => {
      // Pos filter
      const contractPos = c.posAnggaran || c.posType || 'Pos 53';
      if (posFilter !== 'all' && contractPos !== posFilter) {
        return false;
      }

      // Query check on Contract level
      const matchContractName = (c.namaKontrak || '').toLowerCase().includes(query);
      const matchContractNum = (c.nomerKontrak || '').toLowerCase().includes(query);
      const matchVendor = (c.vendor || '').toLowerCase().includes(query);
      const matchGL = (c.glAccountDefault || '').toLowerCase().includes(query);

      // Query check on Termin level
      const matchAnyTermin = (c.termins || []).some(t => {
        const tName = t.terminTagihan || t.termin || '';
        const tGL = t.glAccount || '';
        const tGLName = t.glAccountName || '';
        const tDoc = t.documentNumber || '';
        const tStatus = t.statusBeban || '';

        const matchTName = tName.toLowerCase().includes(query);
        const matchTGL = tGL.toLowerCase().includes(query);
        const matchTGLName = tGLName.toLowerCase().includes(query);
        const matchTDoc = tDoc.toLowerCase().includes(query);
        const matchStatus = tStatus.toLowerCase().includes(query);
        return matchTName || matchTGL || matchTGLName || matchTDoc || matchStatus;
      });

      const matchesSearch = query === '' || matchContractName || matchContractNum || matchVendor || matchGL || matchAnyTermin;
      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== 'all') {
        const hasMatchingStatusTermin = (c.termins || []).some(t => {
          if (numericMonth !== null && resolveTerminMonth(t) !== numericMonth) return false;
          const isTercatat = t.statusBeban === 'Tercatat' || Boolean(t.documentNumber && t.documentNumber.trim() !== '');
          return statusFilter === 'Tercatat' ? isTercatat : !isTercatat;
        });
        return hasMatchingStatusTermin;
      }

      return true;
    });
  }, [alihDayaContracts, searchTerm, statusFilter, posFilter, numericMonth]);

  // Open Contract Modal for Add
  const handleOpenAddContract = () => {
    setEditingContract(null);
    setFormNamaKontrak('');
    setFormNomerKontrak('');
    setFormVendor('');
    setFormPosAnggaran('Pos 53');
    setFormGLDefault('6106201700');
    setFormGLNameDefault('Beban jasa borong perlengk Umum');
    setFormTahun(selectedYear || 2026);
    setFormKeterangan('');
    setContractError(null);
    setIsContractModalOpen(true);
  };

  // Open Contract Modal for Edit
  const handleOpenEditContract = (contract: AlihDayaContract) => {
    setEditingContract(contract);
    setFormNamaKontrak(contract.namaKontrak || '');
    setFormNomerKontrak(contract.nomerKontrak || '');
    setFormVendor(contract.vendor || '');
    setFormPosAnggaran((contract.posAnggaran || contract.posType || 'Pos 53') as PosType);
    setFormGLDefault(contract.glAccountDefault || '');
    setFormGLNameDefault(contract.glAccountNameDefault || contract.glAccountDefaultName || '');
    setFormTahun(contract.tahunAnggaran || contract.tahun || selectedYear || 2026);
    setFormKeterangan(contract.keterangan || '');
    setContractError(null);
    setIsContractModalOpen(true);
  };

  // Save Contract
  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    setContractError(null);

    const namaTrim = formNamaKontrak.trim();
    const nomerTrim = formNomerKontrak.trim();

    if (!namaTrim) {
      setContractError('Nama Kontrak (No. 1) wajib diisi.');
      return;
    }
    if (!nomerTrim) {
      setContractError('Nomer Kontrak (No. 2) wajib diisi.');
      return;
    }

    if (namaTrim.toLowerCase() === nomerTrim.toLowerCase()) {
      setContractError('Nama Kontrak (1) dan Nomer Kontrak (2) tidak boleh sama persis.');
      return;
    }

    if (editingContract) {
      const res = updateAlihDayaContract(editingContract.id, {
        namaKontrak: namaTrim,
        nomerKontrak: nomerTrim,
        vendor: formVendor.trim(),
        posAnggaran: formPosAnggaran,
        posType: formPosAnggaran,
        glAccountDefault: formGLDefault.trim(),
        glAccountNameDefault: formGLNameDefault.trim(),
        tahunAnggaran: formTahun,
        keterangan: formKeterangan.trim()
      });
      if (!res.success) {
        setContractError(res.message || 'Gagal memperbarui kontrak.');
        return;
      }
    } else {
      // Default termin bulanan adalah nihil (belum terisi / tidak ada termin otomatis)
      const res = addAlihDayaContract({
        namaKontrak: namaTrim,
        nomerKontrak: nomerTrim,
        vendor: formVendor.trim(),
        posAnggaran: formPosAnggaran,
        posType: formPosAnggaran,
        glAccountDefault: formGLDefault.trim(),
        glAccountNameDefault: formGLNameDefault.trim(),
        tahunAnggaran: formTahun,
        keterangan: formKeterangan.trim(),
        statusKontrak: 'Aktif',
        termins: [] // Nihil / belum terisi termin awal
      });
      if (!res.success) {
        setContractError(res.message || 'Gagal menambahkan kontrak baru.');
        return;
      }
    }

    setIsContractModalOpen(false);
  };

  // Open Termin Modal for Add (Menyalin seluruh data yang sudah ada pada kontrak ke isian termin)
  const handleOpenAddTermin = (contractId: string, prefilledMonthIndex?: number) => {
    const contract = alihDayaContracts.find(c => c.id === contractId);
    const targetMonth = prefilledMonthIndex !== undefined 
      ? prefilledMonthIndex 
      : (numericMonth !== null ? numericMonth : (selectedMonth ?? 0));
    
    const year = contract?.tahunAnggaran || contract?.tahun || selectedYear || 2026;
    const monthNum = String(targetMonth + 1).padStart(2, '0');
    const lastDay = new Date(year, targetMonth + 1, 0).getDate();

    setTargetContractIdForTermin(contractId);
    setEditingTermin(null);
    setFormTerminMonthIndex(targetMonth);

    // Salin seluruh data dari kontrak ke isian data termin:
    // 1. Uraian / Nama Termin Tagihan
    const terminCount = (contract?.termins?.length || 0) + 1;
    const contractPrefix = contract?.namaKontrak ? `${contract.namaKontrak} - ` : '';
    setFormTerminName(`${contractPrefix}Termin ${terminCount} (${MONTH_NAMES[targetMonth]} ${year})`);

    // 2. Salin GL Account & Nama GL dari data kontrak
    setFormTerminGL(contract?.glAccountDefault || '6106201700');
    setFormTerminGLName(contract?.glAccountNameDefault || contract?.glAccountDefaultName || 'Beban Jasa Tenaga Kerja Kontrak Rutin');

    // 3. Salin Kelompok Pos Anggaran dari kontrak
    setFormTerminPosType((contract?.posAnggaran || contract?.posType || 'Pos 53') as PosType);

    setFormTerminNominal(0);
    setFormTerminDocNum('');
    setFormTerminTanggal(`${year}-${monthNum}-${lastDay}`);

    // 4. Salin Keterangan / Vendor / No Kontrak ke Catatan Termin
    const notesParts: string[] = [];
    if (contract?.keterangan?.trim()) notesParts.push(contract.keterangan.trim());
    if (contract?.vendor?.trim()) notesParts.push(`Vendor: ${contract.vendor.trim()}`);
    if (contract?.nomerKontrak?.trim()) notesParts.push(`No. Kontrak: ${contract.nomerKontrak.trim()}`);
    setFormTerminNotes(notesParts.length > 0 ? notesParts.join(' | ') : `Tagihan bulan ${MONTH_NAMES[targetMonth]}`);

    setTerminError(null);
    setIsTerminModalOpen(true);
  };

  // Open Termin Modal for Edit
  const handleOpenEditTermin = (contractId: string, termin: AlihDayaTermin) => {
    const contract = alihDayaContracts.find(c => c.id === contractId);
    setTargetContractIdForTermin(contractId);
    setEditingTermin({ contractId, termin });
    setFormTerminMonthIndex(resolveTerminMonth(termin));
    setFormTerminName(termin.terminTagihan || termin.termin || '');
    setFormTerminGL(termin.glAccount || contract?.glAccountDefault || '');
    setFormTerminGLName(termin.glAccountName || contract?.glAccountNameDefault || contract?.glAccountDefaultName || '');
    setFormTerminPosType((termin.posType || contract?.posAnggaran || contract?.posType || 'Pos 53') as PosType);
    setFormTerminNominal(termin.nominalTagihan ?? termin.amount ?? 0);
    setFormTerminDocNum(termin.documentNumber || '');
    setFormTerminTanggal(termin.tanggalJatuhTempo || termin.tglTagihan || '');
    setFormTerminNotes(termin.notes || '');
    setTerminError(null);
    setIsTerminModalOpen(true);
  };

  // Helper: Salin ulang seluruh data kontrak induk ke isian termin modal
  const handleCopyContractDataToTerminForm = () => {
    const contract = alihDayaContracts.find(c => c.id === targetContractIdForTermin);
    if (!contract) return;
    const year = contract.tahunAnggaran || contract.tahun || selectedYear || 2026;
    const targetMonth = formTerminMonthIndex;
    const monthNum = String(targetMonth + 1).padStart(2, '0');
    const lastDay = new Date(year, targetMonth + 1, 0).getDate();
    const terminOrder = (contract.termins?.length || 0) + (editingTermin ? 0 : 1);

    setFormTerminName(`${contract.namaKontrak ? `${contract.namaKontrak} - ` : ''}Termin ${terminOrder || 1} (${MONTH_NAMES[targetMonth]} ${year})`);
    setFormTerminGL(contract.glAccountDefault || '6106201700');
    setFormTerminGLName(contract.glAccountNameDefault || contract.glAccountDefaultName || 'Beban Jasa Tenaga Kerja Kontrak Rutin');
    setFormTerminPosType((contract.posAnggaran || contract.posType || 'Pos 53') as PosType);

    const notesParts: string[] = [];
    if (contract.keterangan?.trim()) notesParts.push(contract.keterangan.trim());
    if (contract.vendor?.trim()) notesParts.push(`Vendor: ${contract.vendor.trim()}`);
    if (contract.nomerKontrak?.trim()) notesParts.push(`No. Kontrak: ${contract.nomerKontrak.trim()}`);
    setFormTerminNotes(notesParts.length > 0 ? notesParts.join(' | ') : `Tagihan bulan ${MONTH_NAMES[targetMonth]}`);
    setFormTerminTanggal(`${year}-${monthNum}-${lastDay}`);
  };

  // Handle Month Change inside Termin Modal
  const handleMonthChangeInTerminModal = (newMonthIndex: number) => {
    setFormTerminMonthIndex(newMonthIndex);
    const contract = alihDayaContracts.find(c => c.id === targetContractIdForTermin);
    const year = contract?.tahunAnggaran || contract?.tahun || selectedYear || 2026;
    const monthNum = String(newMonthIndex + 1).padStart(2, '0');
    const lastDay = new Date(year, newMonthIndex + 1, 0).getDate();
    setFormTerminTanggal(`${year}-${monthNum}-${lastDay}`);
    
    if (!formTerminName || formTerminName.includes('Termin ')) {
      const terminCount = editingTermin ? '' : `${(contract?.termins?.length || 0) + 1}`;
      const contractPrefix = contract?.namaKontrak ? `${contract.namaKontrak} - ` : '';
      setFormTerminName(`${contractPrefix}Termin ${terminCount ? terminCount : (newMonthIndex + 1)} (${MONTH_NAMES[newMonthIndex]} ${year})`);
    }
  };

  // Save Termin
  const handleSaveTermin = (e: React.FormEvent) => {
    e.preventDefault();
    setTerminError(null);

    const nameTrim = formTerminName.trim();
    const glTrim = formTerminGL.trim();

    if (!nameTrim) {
      setTerminError('Termin Tagihan (No. 4) wajib diisi.');
      return;
    }
    if (!glTrim) {
      setTerminError('GL Account (No. 3) wajib diisi.');
      return;
    }

    const docTrim = formTerminDocNum.trim();
    // Rule: bila diisi -> Tercatat, bila kosong -> Belum Tercatat
    const computedStatus: StatusBeban = docTrim !== '' ? 'Tercatat' : 'Belum Tercatat';

    if (editingTermin) {
      updateAlihDayaTermin(editingTermin.contractId, editingTermin.termin.id, {
        terminTagihan: nameTrim,
        bulanIndex: formTerminMonthIndex,
        glAccount: glTrim,
        glAccountName: formTerminGLName.trim(),
        posType: formTerminPosType,
        nominalTagihan: Number(formTerminNominal) || 0,
        amount: Number(formTerminNominal) || 0,
        documentNumber: docTrim,
        statusBeban: computedStatus,
        tanggalJatuhTempo: formTerminTanggal,
        notes: formTerminNotes.trim()
      });
    } else {
      addAlihDayaTermin(targetContractIdForTermin, {
        terminTagihan: nameTrim,
        bulanIndex: formTerminMonthIndex,
        glAccount: glTrim,
        glAccountName: formTerminGLName.trim(),
        posType: formTerminPosType,
        nominalTagihan: Number(formTerminNominal) || 0,
        amount: Number(formTerminNominal) || 0,
        documentNumber: docTrim,
        statusBeban: computedStatus,
        tanggalJatuhTempo: formTerminTanggal,
        notes: formTerminNotes.trim()
      });
    }

    setIsTerminModalOpen(false);
  };

  // Quick update doc number submit
  const handleQuickDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDocModal) return;
    quickUpdateTerminDocNumber(quickDocModal.contractId, quickDocModal.termin.id, quickDocNumberVal.trim());
    setQuickDocModal(null);
  };

  // Save Month Bills handler (for MonthBillsModal)
  const handleSaveMonthBills = (contractId: string, updatedMonthBills: AlihDayaTermin[]) => {
    const contract = alihDayaContracts.find(c => c.id === contractId);
    if (!contract || !monthBillsModal) return;
    const targetMonth = monthBillsModal.monthIndex;

    // Filter out old termins of this month and append updated ones
    const otherTermins = (contract.termins || []).filter(t => resolveTerminMonth(t) !== targetMonth);
    const newTermins = [...otherTermins, ...updatedMonthBills];
    batchUpdateContractTermins(contractId, newTermins);
  };

  // Apply Multi-termin Scheme handler (for MultiTerminSchemeModal)
  const handleApplyMultiTerminScheme = (contractId: string, generatedTermins: AlihDayaTermin[]) => {
    batchUpdateContractTermins(contractId, generatedTermins);
  };

  // Export to Excel
  const handleExportExcel = () => {
    exportAlihDayaToExcel(alihDayaContracts, selectedYear || 2026, numericMonth);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 lg:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
              <Briefcase className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Monitoring Kontrak Rutin
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  Tahun Anggaran {selectedYear || 2026}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Pencatatan Tagihan Bulanan (Jan - Des)
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Pemantauan kontrak rutin per bulan, rincian termin tagihan bulanan, pembebanan GL Account, serta status pencatatan No Dokumen SAP.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              id="btn-export-alih-daya"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors"
              title="Export data monitoring kontrak rutin ke format Excel (termasuk Matriks 12 Bulan &amp; Rincian Termin)"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export Excel</span>
            </button>

            <button
              id="btn-add-contract"
              onClick={handleOpenAddContract}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kontrak Baru</span>
            </button>
          </div>
        </div>

        {/* MONTH SELECTOR BAR (Consistent with RealizationInputView & PrognosaView) */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Pilih Periode Bulan:</span>
            </span>

            {/* "Semua Bulan" Pill Button */}
            <button
              onClick={() => setFilterMonth('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                filterMonth === 'all'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua Bulan (Tahunan)
            </button>

            {/* 12 Months Pill Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {MONTH_SHORT_NAMES.map((shortName, idx) => {
                const isSelected = filterMonth === String(idx);
                const monthStat = globalSummary.monthlyTotals[idx];
                const hasData = monthStat.nominal > 0;
                const hasPending = monthStat.belumTercatat > 0;

                return (
                  <button
                    key={shortName}
                    onClick={() => {
                      setFilterMonth(String(idx));
                      setSelectedMonth(idx);
                    }}
                    className={`relative px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : hasData
                          ? 'bg-white text-slate-800 border-slate-300 hover:bg-blue-50'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                    }`}
                    title={`${MONTH_NAMES[idx]}: Total Tagihan ${formatRupiah(monthStat.nominal)} (${monthStat.countTercatat}/${monthStat.countTermins} tercatat)`}
                  >
                    <span>{shortName}</span>
                    {hasData && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : hasPending ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Month Navigation */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <button
              onClick={() => {
                const cur = numericMonth !== null ? numericMonth : (selectedMonth ?? 0);
                const prev = cur > 0 ? cur - 1 : 11;
                setFilterMonth(String(prev));
                setSelectedMonth(prev);
              }}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const cur = selectedMonth ?? 0;
                setFilterMonth(String(cur));
              }}
              className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
            >
              Bulan Berjalan ({MONTH_NAMES[selectedMonth ?? 0]})
            </button>

            <button
              onClick={() => {
                const cur = numericMonth !== null ? numericMonth : (selectedMonth ?? 0);
                const next = cur < 11 ? cur + 1 : 0;
                setFilterMonth(String(next));
                setSelectedMonth(next);
              }}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Bulan Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (Dynamically adjusted for MTD vs Annual) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tagihan Periode Ini */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {numericMonth !== null ? `Tagihan Bulan ${MONTH_NAMES[numericMonth]}` : 'Total Nilai Kontrak (1 Thn)'}
            </span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Briefcase className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {formatRupiahShort(numericMonth !== null ? globalSummary.totalNominalMonth : globalSummary.totalNominalYear)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>{numericMonth !== null ? `${globalSummary.totalTerminsMonth} termin di bulan ini` : `${globalSummary.totalTerminsYear} total termin`}</span>
            <span className="font-mono font-medium text-slate-700">
              {formatRupiah(numericMonth !== null ? globalSummary.totalNominalMonth : globalSummary.totalNominalYear)}
            </span>
          </div>
        </div>

        {/* Card 2: Beban Tercatat (Ada No Dokumen) */}
        <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              {numericMonth !== null ? `Tercatat Bulan ${MONTH_NAMES[numericMonth]}` : 'Beban Tercatat (1 Tahun)'}
            </span>
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">
              {formatRupiahShort(numericMonth !== null ? globalSummary.totalTercatatMonth : globalSummary.totalTercatatYear)}
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              {formatPercent(numericMonth !== null ? globalSummary.percentTercatatMonth : globalSummary.percentTercatatYear, 1)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-emerald-700">
            <span>
              {numericMonth !== null 
                ? `${globalSummary.countTercatatMonth} dari ${globalSummary.totalTerminsMonth} termin` 
                : `${globalSummary.countTercatatYear} dari ${globalSummary.totalTerminsYear} termin`}
            </span>
            <span className="font-mono font-bold">
              {formatRupiah(numericMonth !== null ? globalSummary.totalTercatatMonth : globalSummary.totalTercatatYear)}
            </span>
          </div>
        </div>

        {/* Card 3: Belum Tercatat / Komitmen */}
        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/30 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              {numericMonth !== null ? `Belum Tercatat (${MONTH_NAMES[numericMonth]})` : 'Belum Tercatat (Komitmen)'}
            </span>
            <span className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">
              {formatRupiahShort(numericMonth !== null ? globalSummary.totalBelumTercatatMonth : globalSummary.totalBelumTercatatYear)}
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              {formatPercent(100 - (numericMonth !== null ? globalSummary.percentTercatatMonth : globalSummary.percentTercatatYear), 1)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-amber-700">
            <span>
              {numericMonth !== null ? `${globalSummary.countBelumTercatatMonth} termin menunggu` : `${globalSummary.countBelumTercatatYear} termin menunggu`}
            </span>
            <span className="font-mono font-bold">
              {formatRupiah(numericMonth !== null ? globalSummary.totalBelumTercatatMonth : globalSummary.totalBelumTercatatYear)}
            </span>
          </div>
        </div>

        {/* Card 4: Akumulasi YTD s/d Bulan Ini */}
        <div className="bg-white rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
              {numericMonth !== null ? `Akumulasi s/d ${MONTH_NAMES[numericMonth]} (YTD)` : 'Pagu Total Kontrak 1 Tahun'}
            </span>
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-900">
              {formatRupiahShort(numericMonth !== null ? globalSummary.totalNominalYTD : globalSummary.totalNominalYear)}
            </span>
            {numericMonth !== null && (
              <span className="text-xs font-semibold text-indigo-700">
                ({formatPercent(globalSummary.totalNominalYear ? (globalSummary.totalNominalYTD / globalSummary.totalNominalYear) * 100 : 0, 1)} dari tahun)
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-indigo-800 flex items-center justify-between">
            <span>Tercatat YTD: <strong>{formatRupiahShort(numericMonth !== null ? globalSummary.totalTercatatYTD : globalSummary.totalTercatatYear)}</strong></span>
            <span className="font-mono">{formatPercent(numericMonth !== null ? globalSummary.percentTercatatYTD : globalSummary.percentTercatatYear, 1)}</span>
          </div>
        </div>
      </div>

      {/* Controls Bar: View Mode, Search, Status Filter, Pos Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Sub-tab Navigation */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto">
          <button
            id="tab-sub-matrix"
            onClick={() => setActiveTab('monthly_matrix')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'monthly_matrix'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Matriks 12 Bulan (Jan - Des)</span>
          </button>

          <button
            id="tab-sub-hierarchy"
            onClick={() => setActiveTab('hierarchy')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'hierarchy'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Struktur Kontrak &amp; Termin</span>
          </button>

          <button
            id="tab-sub-rekap"
            onClick={() => setActiveTab('rekap')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'rekap'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Rekapitulasi Per Kontrak</span>
          </button>

          <button
            id="tab-sub-all-termins"
            onClick={() => setActiveTab('all_termins')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'all_termins'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rincian Tagihan</span>
          </button>
        </div>

        {/* Search & Filter tools */}
        <div className="flex items-center gap-2.5 flex-wrap flex-1 lg:justify-end">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-alih-daya"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kontrak, No. dok, GL..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Status Beban */}
          <select
            id="filter-status-beban"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
          >
            <option value="all">Semua Status Beban</option>
            <option value="Tercatat">Tercatat (Ada No Dok)</option>
            <option value="Belum Tercatat">Belum Tercatat (Tanpa No Dok)</option>
          </select>

          {/* Filter Pos Anggaran */}
          {availablePosOptions.length > 0 && (
            <select
              id="filter-pos-anggaran"
              value={posFilter}
              onChange={(e) => setPosFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
            >
              <option value="all">Semua Pos Anggaran</option>
              {availablePosOptions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          )}

          {activeTab === 'hierarchy' && (
            <div className="flex items-center gap-1">
              <button
                onClick={expandAll}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Buka semua accordion kontrak"
              >
                Buka Semua
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Tutup semua accordion kontrak"
              >
                Tutup Semua
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MATRIKS BULANAN 12 BULAN (JAN - DES)                               */}
      {/* ========================================================================= */}
      {activeTab === 'monthly_matrix' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-blue-600" />
                <span>Matriks Tagihan Bulanan 12 Bulan (Januari s.d. Desember {selectedYear || 2026})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tabel horizontal sebaran tagihan kontrak rutin per bulan. Klik pada sel bulan untuk melihat atau menginputkan Nomor Dokumen SAP secara langsung.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Tercatat (No Dok)</span>
              </span>
              <span className="text-xs text-slate-600 flex items-center gap-1.5 ml-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span>Belum Tercatat</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                  <th className="py-3 px-3 text-center w-10 sticky left-0 bg-slate-100 z-10">No</th>
                  <th className="py-3 px-3 min-w-[200px] sticky left-10 bg-slate-100 z-10">Nama Kontrak &amp; No. Kontrak</th>
                  <th className="py-3 px-3 min-w-[100px]">Pos</th>
                  {MONTH_SHORT_NAMES.map((mShort, idx) => (
                    <th 
                      key={mShort} 
                      className={`py-3 px-2 text-right min-w-[110px] ${
                        numericMonth === idx ? 'bg-blue-100/70 text-blue-900 font-bold' : ''
                      }`}
                    >
                      {mShort}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right min-w-[130px] bg-slate-100 font-bold">Total Nilai</th>
                  <th className="py-3 px-3 text-right min-w-[120px] bg-emerald-50 text-emerald-900 font-bold">Tercatat</th>
                  <th className="py-3 px-3 text-center min-w-[80px]">% Real</th>
                  <th className="py-3 px-2 text-center w-16">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="py-10 text-center text-slate-400 italic">
                      Tidak ada data kontrak yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((c, idx) => {
                    const cTotalNominal = (c.termins || []).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
                    const cTercatat = (c.termins || []).filter(t => t.statusBeban === 'Tercatat' || (t.documentNumber && t.documentNumber.trim() !== '')).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
                    const cPercent = cTotalNominal > 0 ? (cTercatat / cTotalNominal) * 100 : 0;

                    // Group termins by month (0..11)
                    const terminsByMonth: Record<number, AlihDayaTermin[]> = {};
                    (c.termins || []).forEach(t => {
                      const mIdx = resolveTerminMonth(t);
                      if (!terminsByMonth[mIdx]) terminsByMonth[mIdx] = [];
                      terminsByMonth[mIdx].push(t);
                    });

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-center font-mono text-slate-500 font-bold sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 sticky left-10 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                          <div className="font-bold text-slate-900 line-clamp-1">{c.namaKontrak}</div>
                          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="bg-slate-100 px-1.5 py-0.2 rounded">{c.nomerKontrak}</span>
                            {c.vendor && <span className="text-slate-400">· {c.vendor}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                            {c.posAnggaran || c.posType || 'Pos 53'}
                          </span>
                        </td>

                        {/* 12 Months Cells */}
                        {MONTH_SHORT_NAMES.map((_, mIdx) => {
                          const mTermins = terminsByMonth[mIdx] || [];
                          const monthNominal = mTermins.reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
                          const recordedCount = mTermins.filter(t => t.statusBeban === 'Tercatat' || Boolean(t.documentNumber && t.documentNumber.trim() !== '')).length;
                          const hasDoc = recordedCount > 0;
                          const allRecorded = recordedCount === mTermins.length && mTermins.length > 0;
                          const isHighlighted = numericMonth === mIdx;

                          return (
                            <td 
                              key={mIdx}
                              className={`py-2 px-2 text-right border-l border-slate-100 transition-colors ${
                                isHighlighted ? 'bg-blue-50/50' : ''
                              }`}
                            >
                              {mTermins.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMonthBillsModal({
                                      isOpen: true,
                                      contract: c,
                                      monthIndex: mIdx
                                    });
                                  }}
                                  className={`w-full text-right p-1 rounded transition-all group ${
                                    allRecorded
                                      ? 'hover:bg-emerald-100/60'
                                      : hasDoc
                                      ? 'hover:bg-amber-100/60'
                                      : 'hover:bg-slate-100'
                                  }`}
                                  title={`${MONTH_NAMES[mIdx]}: ${formatRupiah(monthNominal)} (${mTermins.length} Tagihan, ${recordedCount}/${mTermins.length} Tercatat). Klik untuk kelola seluruh tagihan bulan ini.`}
                                >
                                  <div className="font-mono font-bold text-[11px] text-slate-900">
                                    {formatRupiahShort(monthNominal)}
                                  </div>
                                  <div className="flex items-center justify-end gap-1 mt-0.5">
                                    {mTermins.length > 1 && (
                                      <span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                        {mTermins.length}x
                                      </span>
                                    )}
                                    {allRecorded ? (
                                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                                        <span>{mTermins.length > 1 ? `${recordedCount}/${mTermins.length}` : 'Dok'}</span>
                                      </span>
                                    ) : hasDoc ? (
                                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                        <Clock className="w-2.5 h-2.5 text-amber-600" />
                                        <span>{recordedCount}/{mTermins.length}</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                        <Clock className="w-2.5 h-2.5 text-slate-500" />
                                        <span>Open</span>
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMonthBillsModal({
                                      isOpen: true,
                                      contract: c,
                                      monthIndex: mIdx
                                    });
                                  }}
                                  className="w-full text-center text-slate-300 hover:text-blue-600 hover:bg-blue-50 py-1.5 rounded transition-colors text-[11px]"
                                  title={`Klik untuk menambahkan tagihan ${MONTH_NAMES[mIdx]}`}
                                >
                                  +
                                </button>
                              )}
                            </td>
                          );
                        })}

                        {/* Total Nilai Kontrak */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-950 bg-slate-50/50 border-l border-slate-200">
                          {formatRupiah(cTotalNominal)}
                        </td>

                        {/* Beban Tercatat */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                          {formatRupiah(cTercatat)}
                        </td>

                        {/* % Realisasi */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-[11px] font-mono text-slate-800">
                            {formatPercent(cPercent, 0)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setMultiSchemeModal({ isOpen: true, contract: c })}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                              title="Atur Skema 2 Tagihan Bulanan Otomatis"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                            <button
                              onClick={() => handleOpenEditContract(c)}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                              title="Edit data kontrak"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setExpandedContracts(prev => ({ ...prev, [c.id]: true }));
                                setActiveTab('hierarchy');
                              }}
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Buka rincian termin"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Monthly Totals Footer Row */}
              {filteredContracts.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-800">
                    <td colSpan={3} className="py-3 px-3 text-right sticky left-0 bg-slate-900 z-10 uppercase tracking-wide font-semibold">
                      Total Seluruh Tagihan Bulanan:
                    </td>

                    {/* 12 Months Subtotals */}
                    {MONTH_SHORT_NAMES.map((_, mIdx) => {
                      const mStat = globalSummary.monthlyTotals[mIdx];
                      const isHighlighted = numericMonth === mIdx;
                      return (
                        <td 
                          key={mIdx} 
                          className={`py-3 px-2 text-right font-mono text-[11px] border-l border-slate-800 ${
                            isHighlighted ? 'bg-blue-900 text-yellow-300' : 'text-slate-200'
                          }`}
                        >
                          <div>{formatRupiahShort(mStat.nominal)}</div>
                          <div className="text-[9px] text-emerald-400 mt-0.5">
                            {formatPercent(mStat.nominal ? (mStat.tercatat / mStat.nominal) * 100 : 0, 0)} dok
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-3 px-3 text-right font-mono text-yellow-300 border-l border-slate-800">
                      {formatRupiah(globalSummary.totalNominalYear)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-300">
                      {formatRupiah(globalSummary.totalTercatatYear)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-300">
                      {formatPercent(globalSummary.percentTercatatYear, 1)}
                    </td>
                    <td className="py-3 px-2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HIERARCHY CONTRACT & TERMIN CARDS                                  */}
      {/* ========================================================================= */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-4">
          {numericMonth !== null && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Menampilkan termin tagihan untuk periode <strong>Bulan {MONTH_NAMES[numericMonth]} {selectedYear || 2026}</strong>.</span>
              </span>
              <button
                onClick={() => setFilterMonth('all')}
                className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 rounded font-semibold transition-colors"
              >
                Tampilkan Semua Bulan
              </button>
            </div>
          )}

          {filteredContracts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">Tidak ada data kontrak yang cocok</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Coba sesuaikan kata kunci pencarian, periode bulan, atau filter status beban untuk menemukan kontrak rutin.
              </p>
              <button
                onClick={handleOpenAddContract}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Tambah Kontrak Baru
              </button>
            </div>
          ) : (
            filteredContracts.map((contract, cIdx) => {
              const isExpanded = !!expandedContracts[contract.id];

              // Filter termins for this contract based on month if month is selected
              const visibleTermins = (contract.termins || []).filter(t => {
                if (numericMonth !== null) {
                  return resolveTerminMonth(t) === numericMonth;
                }
                return true;
              });

              // Contract financial metrics
              const cTotalNominal = (contract.termins || []).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
              const cTercatat = (contract.termins || []).filter(t => t.statusBeban === 'Tercatat' || (t.documentNumber && t.documentNumber.trim() !== '')).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
              const cBelumTercatat = (contract.termins || []).filter(t => t.statusBeban === 'Belum Tercatat' && (!t.documentNumber || t.documentNumber.trim() === '')).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
              const cPercent = cTotalNominal !== 0 ? (cTercatat / cTotalNominal) * 100 : 0;
              const countRecorded = (contract.termins || []).filter(t => t.statusBeban === 'Tercatat' || (t.documentNumber && t.documentNumber.trim() !== '')).length;

              // Month specific subtotal
              const cMonthNominal = visibleTermins.reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
              const cMonthTercatat = visibleTermins.filter(t => t.statusBeban === 'Tercatat' || (t.documentNumber && t.documentNumber.trim() !== '')).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);

              return (
                <div 
                  key={contract.id}
                  id={`contract-card-${contract.id}`}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Contract Header Row */}
                  <div 
                    className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                    onClick={() => toggleContractAccordion(contract.id)}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg font-bold text-xs shrink-0 mt-0.5">
                        #{cIdx + 1}
                      </div>

                      <div className="space-y-1">
                        {/* 1. Nama Kontrak & 2. Nomer Kontrak */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-base font-bold text-slate-900 tracking-tight">
                            {contract.namaKontrak}
                          </h2>
                          <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded text-xs font-mono font-medium tracking-wide">
                            No: {contract.nomerKontrak}
                          </span>
                          {(contract.posAnggaran || contract.posType) && (
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {contract.posAnggaran || contract.posType}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            Vendor: {contract.vendor || '-'}
                          </span>
                        </div>

                        {/* Extra metadata */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          {contract.glAccountDefault && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3 text-slate-400" />
                              GL Default: <strong className="text-slate-700">{contract.glAccountDefault}</strong>
                              {(contract.glAccountNameDefault || contract.glAccountDefaultName) && ` (${contract.glAccountNameDefault || contract.glAccountDefaultName})`}
                            </span>
                          )}
                          {contract.keterangan && (
                            <span className="text-slate-500 italic">
                              "{contract.keterangan}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side summary & controls */}
                    <div className="flex items-center gap-4 shrink-0 flex-wrap justify-between md:justify-end" onClick={(e) => e.stopPropagation()}>
                      {/* Mini Financial Summary */}
                      <div className="text-right">
                        <div className="text-xs text-slate-500 font-medium">
                          {numericMonth !== null ? `Tagihan Bulan ${MONTH_NAMES[numericMonth]}` : 'Total Nilai Kontrak'}
                        </div>
                        <div className="text-sm font-bold text-slate-900 font-mono">
                          {formatRupiah(numericMonth !== null ? cMonthNominal : cTotalNominal)}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center justify-end gap-1">
                          <span>Tercatat: {formatRupiahShort(numericMonth !== null ? cMonthTercatat : cTercatat)}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-amber-700">Belum: {formatRupiahShort(numericMonth !== null ? (cMonthNominal - cMonthTercatat) : cBelumTercatat)}</span>
                        </div>
                      </div>

                      {/* Progress Badge */}
                      <div className="text-center px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 min-w-[75px]">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Tercatat</div>
                        <div className="text-xs font-bold text-slate-800">{countRecorded}/{(contract.termins || []).length}</div>
                        <div className="text-[10px] font-semibold text-emerald-600">{formatPercent(cPercent, 0)}</div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setMultiSchemeModal({ isOpen: true, contract })}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors inline-flex items-center gap-1"
                          title="Atur skema 2 tagihan per bulan otomatis"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Skema Tagihan</span>
                        </button>
                        <button
                          id={`btn-add-termin-${contract.id}`}
                          onClick={() => handleOpenAddTermin(contract.id, numericMonth !== null ? numericMonth : undefined)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Tambah termin tagihan baru untuk kontrak ini"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-edit-contract-${contract.id}`}
                          onClick={() => handleOpenEditContract(contract)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit informasi kontrak"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-contract-${contract.id}`}
                          onClick={() => {
                            if (window.confirm(`Hapus kontrak "${contract.namaKontrak}" dan seluruh termin di dalamnya?`)) {
                              deleteAlihDayaContract(contract.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                          title="Hapus kontrak"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleContractAccordion(contract.id)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors ml-1"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sub-table: Terms of Payment */}
                  {isExpanded && (
                    <div className="p-4 bg-white overflow-x-auto">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          <span>Rincian Tagihan Bulanan / Termin Kontrak:</span>
                          <span className="font-normal text-slate-500">
                            {numericMonth !== null 
                              ? `(Periode Bulan ${MONTH_NAMES[numericMonth]})` 
                              : '(Seluruh 12 Bulan / Termin)'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleOpenAddTermin(contract.id, numericMonth !== null ? numericMonth : undefined)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tambah Termin Tagihan</span>
                        </button>
                      </div>

                      <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                            <th className="py-2 px-3 w-10 text-center">No</th>
                            <th className="py-2 px-3 min-w-[90px]">Bulan Tagihan</th>
                            <th className="py-2 px-3 min-w-[150px]">4. Termin Tagihan</th>
                            <th className="py-2 px-3 min-w-[180px]">3. GL Account &amp; Uraian</th>
                            <th className="py-2 px-3 text-right min-w-[130px]">5. Nominal Tagihan</th>
                            <th className="py-2 px-3 min-w-[180px]">7. No Dokumen (SAP / MIRO)</th>
                            <th className="py-2 px-3 min-w-[120px] text-center">6. Status Beban</th>
                            <th className="py-2 px-3 min-w-[110px]">Keterangan</th>
                            <th className="py-2 px-3 w-20 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                          {visibleTermins.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-6 text-center text-slate-400 italic">
                                {numericMonth !== null 
                                  ? `Tidak ada termin tagihan untuk bulan ${MONTH_NAMES[numericMonth]}.` 
                                  : 'Belum ada termin tagihan yang diinput.'}
                                <button 
                                  onClick={() => handleOpenAddTermin(contract.id, numericMonth !== null ? numericMonth : undefined)}
                                  className="ml-2 text-blue-600 font-semibold underline"
                                >
                                  + Tambah sekarang
                                </button>
                              </td>
                            </tr>
                          ) : (
                            visibleTermins.map((termin, tIdx) => {
                              const isTercatat = termin.statusBeban === 'Tercatat' || Boolean(termin.documentNumber && termin.documentNumber.trim() !== '');
                              const tMonthIdx = resolveTerminMonth(termin);

                              return (
                                <tr 
                                  key={termin.id} 
                                  className={`hover:bg-slate-50 transition-colors ${
                                    isTercatat ? 'bg-emerald-50/15' : 'bg-amber-50/10'
                                  }`}
                                >
                                  {/* No */}
                                  <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                                    {tIdx + 1}
                                  </td>

                                  {/* Bulan Tagihan */}
                                  <td className="py-2.5 px-3 font-semibold text-blue-900">
                                    <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                                      {MONTH_NAMES[tMonthIdx] || `Bulan ${tMonthIdx + 1}`}
                                    </span>
                                  </td>

                                  {/* 4. Termin Tagihan */}
                                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                                    <div className="flex items-center gap-1.5">
                                      <span>{termin.terminTagihan || termin.termin || `Termin ${tIdx + 1}`}</span>
                                    </div>
                                    {(termin.tanggalJatuhTempo || termin.tglTagihan) && (
                                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                                        <Calendar className="w-2.5 h-2.5" />
                                        <span>Jatuh Tempo: {termin.tanggalJatuhTempo || termin.tglTagihan}</span>
                                      </div>
                                    )}
                                  </td>

                                  {/* 3. GL Account */}
                                  <td className="py-2.5 px-3">
                                    <div className="font-mono font-bold text-blue-900 bg-blue-50/80 px-2 py-0.5 rounded inline-block border border-blue-200/60">
                                      {termin.glAccount}
                                    </div>
                                    {termin.glAccountName && (
                                      <div className="text-[11px] text-slate-600 mt-0.5 truncate max-w-xs">
                                        {termin.glAccountName}
                                      </div>
                                    )}
                                  </td>

                                  {/* 5. Nominal Tagihan */}
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                    {formatRupiah(termin.nominalTagihan ?? termin.amount ?? 0)}
                                  </td>

                                  {/* 7. No Dokumen (Direct interactive edit) */}
                                  <td className="py-2.5 px-3">
                                    <input
                                      type="text"
                                      value={termin.documentNumber || ''}
                                      onChange={(e) => {
                                        quickUpdateTerminDocNumber(contract.id, termin.id, e.target.value);
                                      }}
                                      placeholder="Isi No Dokumen SAP..."
                                      className="w-full px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      title="Ketikkan Nomor Dokumen SAP/SES/MIRO. Jika terisi, status otomatis menjadi Tercatat."
                                    />
                                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                                      {termin.documentNumber ? '✓ No Dokumen tervalidasi' : 'Kosong = Belum Tercatat'}
                                    </span>
                                  </td>

                                  {/* 6. Status Beban */}
                                  <td className="py-2.5 px-3 text-center">
                                    {isTercatat ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                        <span>Tercatat</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                        <span>Belum Tercatat</span>
                                      </span>
                                    )}
                                  </td>

                                  {/* Keterangan */}
                                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate text-[11px]">
                                    {termin.notes || '-'}
                                  </td>

                                  {/* Aksi */}
                                  <td className="py-2.5 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleOpenEditTermin(contract.id, termin)}
                                        className="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                                        title="Edit termin ini"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (window.confirm(`Hapus ${termin.terminTagihan || termin.termin}?`)) {
                                            deleteAlihDayaTermin(contract.id, termin.id);
                                          }
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                        title="Hapus termin ini"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>

                        {/* Footer Subtotal Per Kontrak */}
                        {visibleTermins.length > 0 && (
                          <tfoot>
                            <tr className="bg-slate-100/90 font-semibold text-slate-900 border-t-2 border-slate-300">
                              <td colSpan={4} className="py-2 px-3 text-right">
                                Subtotal Kontrak ({contract.namaKontrak}):
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">
                                {formatRupiah(cMonthNominal)}
                              </td>
                              <td colSpan={4} className="py-2 px-3 text-xs text-slate-600">
                                <div className="flex items-center gap-3">
                                  <span className="text-emerald-700 font-bold">
                                    Tercatat: {formatRupiah(cMonthTercatat)}
                                  </span>
                                  <span>|</span>
                                  <span className="text-amber-700 font-bold">
                                    Belum Tercatat: {formatRupiah(cMonthNominal - cMonthTercatat)}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REKAPITULASI PER KONTRAK                                           */}
      {/* ========================================================================= */}
      {activeTab === 'rekap' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>
                  Rekapitulasi Per Kontrak Rutin{' '}
                  {numericMonth !== null ? `(Bulan ${MONTH_NAMES[numericMonth]} & Tahunan)` : '(Tahunan 2026)'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ringkasan akumulatif pembebanan per kontrak, total nilai kontrak tahunan, rincian per bulan, dan status pencatatan No Dokumen.
              </p>
            </div>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Rekap ke Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-4 min-w-[200px]">1. Nama Kontrak</th>
                  <th className="py-3 px-3 min-w-[160px]">2. Nomer Kontrak</th>
                  <th className="py-3 px-3 min-w-[120px]">Vendor</th>
                  <th className="py-3 px-3 min-w-[100px]">Pos</th>
                  {numericMonth !== null && (
                    <>
                      <th className="py-3 px-3 text-right min-w-[130px] bg-blue-50 text-blue-950 font-bold">
                        Tagihan Bulan {MONTH_SHORT_NAMES[numericMonth]}
                      </th>
                      <th className="py-3 px-3 text-right min-w-[150px] bg-indigo-50/80 text-indigo-950 font-bold">
                        Total Nilai s.d. {MONTH_SHORT_NAMES[numericMonth]}
                      </th>
                    </>
                  )}
                  <th className="py-3 px-4 text-right min-w-[140px]">Total Nilai Tahunan</th>
                  <th className="py-3 px-4 text-right min-w-[140px] text-emerald-800 bg-emerald-50/50">Beban Tercatat</th>
                  <th className="py-3 px-4 text-right min-w-[140px] text-amber-800 bg-amber-50/50">Belum Tercatat</th>
                  <th className="py-3 px-3 min-w-[120px] text-center">% Realisasi</th>
                  <th className="py-3 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={numericMonth !== null ? 12 : 10} className="py-8 text-center text-slate-400 italic">
                      Belum ada data kontrak rutin.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((c, idx) => {
                    const totalNominal = (c.termins || []).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
                    const tercatat = (c.termins || []).filter(t => t.statusBeban === 'Tercatat' || (t.documentNumber && t.documentNumber.trim() !== '')).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
                    const belumTercatat = (c.termins || []).filter(t => t.statusBeban === 'Belum Tercatat' && (!t.documentNumber || t.documentNumber.trim() === '')).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0);
                    const percent = totalNominal !== 0 ? (tercatat / totalNominal) * 100 : 0;
                    
                    // Month nominal (Bulan berjalan)
                    const monthNominal = numericMonth !== null 
                      ? (c.termins || []).filter(t => resolveTerminMonth(t) === numericMonth).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0)
                      : 0;

                    // YTD nominal (Total nilai s.d. bulan berjalan)
                    const ytdNominal = numericMonth !== null 
                      ? (c.termins || []).filter(t => resolveTerminMonth(t) <= numericMonth).reduce((s, t) => s + (t.nominalTagihan ?? t.amount ?? 0), 0)
                      : 0;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-center font-mono text-slate-500 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {c.namaKontrak}
                          {c.glAccountDefault && (
                            <div className="text-[11px] font-normal font-mono text-slate-500 mt-0.5">
                              GL: {c.glAccountDefault}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-800">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {c.nomerKontrak}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {c.vendor || '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {c.posAnggaran || c.posType || 'Pos 53'}
                          </span>
                        </td>
                        {numericMonth !== null && (
                          <>
                            <td className="py-3 px-3 text-right font-mono font-bold text-blue-900 bg-blue-50/40">
                              {formatRupiah(monthNominal)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-indigo-900 bg-indigo-50/30">
                              {formatRupiah(ytdNominal)}
                            </td>
                          </>
                        )}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-950">
                          {formatRupiah(totalNominal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                          {formatRupiah(tercatat)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-700 bg-amber-50/30">
                          {formatRupiah(belumTercatat)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-slate-800 font-mono text-[11px]">
                              {formatPercent(percent, 1)}
                            </span>
                            <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full rounded-full" 
                                style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setExpandedContracts(prev => ({ ...prev, [c.id]: true }));
                                setActiveTab('hierarchy');
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Buka rincian termin kontrak ini"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditContract(c)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                              title="Edit kontrak"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Total Rekapitulasi Footer */}
              {filteredContracts.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-800">
                    <td colSpan={5} className="py-3 px-4 text-right tracking-wide uppercase font-semibold">
                      Total Rekapitulasi Keseluruhan ({filteredContracts.length} Kontrak):
                    </td>
                    {numericMonth !== null && (
                      <>
                        <td className="py-3 px-3 text-right font-mono text-sm text-cyan-300">
                          {formatRupiah(globalSummary.totalNominalMonth)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-sm text-indigo-200">
                          {formatRupiah(globalSummary.totalNominalYTD)}
                        </td>
                      </>
                    )}
                    <td className="py-3 px-4 text-right font-mono text-sm text-yellow-300">
                      {formatRupiah(globalSummary.totalNominalYear)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-emerald-300">
                      {formatRupiah(globalSummary.totalTercatatYear)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-amber-300">
                      {formatRupiah(globalSummary.totalBelumTercatatYear)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-300">
                      {formatPercent(globalSummary.percentTercatatYear, 1)}
                    </td>
                    <td className="py-3 px-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DAFTAR SELURUH RINCIAN TERMIN                                      */}
      {/* ========================================================================= */}
      {activeTab === 'all_termins' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>
                  Daftar Seluruh Rincian Tagihan Kontrak Rutin{' '}
                  {numericMonth !== null ? `(Bulan ${MONTH_NAMES[numericMonth]})` : '(Semua Bulan)'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tampilan menyeluruh baris tagihan termin. Anda dapat langsung menginputkan No Dokumen SAP pada baris tagihan.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                  <th className="py-2.5 px-3 text-center w-10">No</th>
                  <th className="py-2.5 px-3 min-w-[90px]">Bulan</th>
                  <th className="py-2.5 px-4 min-w-[170px]">1. Nama Kontrak</th>
                  <th className="py-2.5 px-3 min-w-[130px]">2. Nomer Kontrak</th>
                  <th className="py-2.5 px-3 min-w-[140px]">4. Termin Tagihan</th>
                  <th className="py-2.5 px-3 min-w-[150px]">3. GL Account</th>
                  <th className="py-2.5 px-3 text-right min-w-[130px]">5. Nominal Tagihan</th>
                  <th className="py-2.5 px-3 min-w-[180px]">7. No Dokumen (SAP / MIRO)</th>
                  <th className="py-2.5 px-3 text-center min-w-[110px]">6. Status Beban</th>
                  <th className="py-2.5 px-3 min-w-[100px]">Jatuh Tempo</th>
                  <th className="py-2.5 px-3 text-center w-16">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {alihDayaContracts.flatMap(c => 
                  (c.termins || []).map(t => ({ ...t, contract: c }))
                ).filter(item => {
                  const itemMonth = resolveTerminMonth(item);
                  if (numericMonth !== null && itemMonth !== numericMonth) return false;

                  const query = (searchTerm || '').toLowerCase().trim();
                  const isTercatat = item.statusBeban === 'Tercatat' || Boolean(item.documentNumber && item.documentNumber.trim() !== '');
                  if (statusFilter !== 'all') {
                    if (statusFilter === 'Tercatat' && !isTercatat) return false;
                    if (statusFilter === 'Belum Tercatat' && isTercatat) return false;
                  }
                  const itemPos = item.contract.posAnggaran || item.contract.posType || 'Pos 53';
                  if (posFilter !== 'all' && itemPos !== posFilter) return false;

                  if (query) {
                    const matchCName = (item.contract.namaKontrak || '').toLowerCase().includes(query);
                    const matchCNum = (item.contract.nomerKontrak || '').toLowerCase().includes(query);
                    const matchTName = (item.terminTagihan || item.termin || '').toLowerCase().includes(query);
                    const matchGL = (item.glAccount || '').toLowerCase().includes(query);
                    const matchGLName = (item.glAccountName || '').toLowerCase().includes(query);
                    const matchDoc = (item.documentNumber || '').toLowerCase().includes(query);
                    const matchStatus = (item.statusBeban || '').toLowerCase().includes(query);
                    return matchCName || matchCNum || matchTName || matchGL || matchGLName || matchDoc || matchStatus;
                  }
                  return true;
                }).map((item, idx) => {
                  const isTercatat = item.statusBeban === 'Tercatat' || Boolean(item.documentNumber && item.documentNumber.trim() !== '');
                  const tMonth = resolveTerminMonth(item);

                  return (
                    <tr 
                      key={`${item.contract.id}_${item.id}`}
                      className={`hover:bg-slate-50 transition-colors ${
                        isTercatat ? 'bg-emerald-50/15' : 'bg-amber-50/10'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-blue-900">
                        <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                          {MONTH_NAMES[tMonth]}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {item.contract.namaKontrak}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                        {item.contract.nomerKontrak}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-blue-950">
                        {item.terminTagihan || item.termin || `Termin ${idx + 1}`}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {item.glAccount}
                        </span>
                        {item.glAccountName && (
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[150px]">
                            {item.glAccountName}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(item.nominalTagihan ?? item.amount ?? 0)}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.documentNumber || ''}
                          onChange={(e) => {
                            quickUpdateTerminDocNumber(item.contract.id, item.id, e.target.value);
                          }}
                          placeholder="Ketik No Dokumen..."
                          className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isTercatat ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Tercatat</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Belum Tercatat</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] font-mono">
                        {item.tanggalJatuhTempo || item.tglTagihan || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleOpenEditTermin(item.contract.id, item)}
                          className="p-1 text-slate-600 hover:text-blue-600 rounded"
                          title="Edit rincian termin"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK DOCUMENT NUMBER MODAL (Triggered from Matriks 12 Bulan)             */}
      {/* ========================================================================= */}
      {quickDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-300" />
                <h3 className="font-bold text-sm">
                  Input No Dokumen SAP - {quickDocModal.termin.terminTagihan || quickDocModal.termin.termin}
                </h3>
              </div>
              <button
                onClick={() => setQuickDocModal(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickDocSubmit} className="p-5 space-y-4">
              <div>
                <span className="text-xs text-slate-500">Kontrak:</span>
                <div className="font-bold text-slate-800 text-xs">{quickDocModal.contractName}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs border border-slate-200">
                <div>
                  <span className="text-slate-500">Bulan:</span>
                  <div className="font-bold text-blue-900">
                    {MONTH_NAMES[resolveTerminMonth(quickDocModal.termin)]}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Nominal Tagihan:</span>
                  <div className="font-mono font-bold text-slate-900">
                    {formatRupiah(quickDocModal.termin.nominalTagihan ?? quickDocModal.termin.amount ?? 0)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  7. Nomor Dokumen SAP / SES / MIRO
                </label>
                <input
                  type="text"
                  autoFocus
                  value={quickDocNumberVal}
                  onChange={(e) => setQuickDocNumberVal(e.target.value)}
                  placeholder="Contoh: 5100092811 / SES-2026-001"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {quickDocNumberVal.trim() !== '' 
                    ? '✓ Status otomatis menjadi "Tercatat"' 
                    : 'Kosongkan jika status masih "Belum Tercatat" (Akrual/Komitmen)'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditTermin(quickDocModal.contractId, quickDocModal.termin);
                    setQuickDocModal(null);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Rincian Lengkap</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickDocModal(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT KONTRAK                                              */}
      {/* ========================================================================= */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-5 h-5 text-blue-300" />
                <h3 className="font-bold text-base">
                  {editingContract ? 'Edit Kontrak Rutin' : 'Tambah Kontrak Rutin Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsContractModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="p-6 space-y-4">
              {contractError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{contractError}</span>
                </div>
              )}

              {/* 1. Nama Kontrak */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  1. Nama Kontrak <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNamaKontrak}
                  onChange={(e) => setFormNamaKontrak(e.target.value)}
                  placeholder="Contoh: Jasa Keamanan (Security) Madiun 2026"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 2. Nomer Kontrak (Must NOT be same as Nama Kontrak) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  2. Nomer Kontrak <span className="text-rose-500">*</span>{' '}
                  <span className="font-normal text-slate-500">(Wajib unik &amp; berbeda dari Nama Kontrak)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNomerKontrak}
                  onChange={(e) => setFormNomerKontrak(e.target.value)}
                  placeholder="Contoh: 002.PJ/DAN.02.01/B03000000/2026"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formNamaKontrak && formNomerKontrak && formNamaKontrak.trim().toLowerCase() === formNomerKontrak.trim().toLowerCase() && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                    ⚠️ Peringatan: Nama Kontrak dan Nomer Kontrak tidak boleh sama!
                  </p>
                )}
              </div>

              {/* Vendor & Pos Anggaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vendor / Pelaksana
                  </label>
                  <input
                    type="text"
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    placeholder="PT. Garda Utama Mandiri"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelompok Pos Anggaran
                  </label>
                  <select
                    value={formPosAnggaran}
                    onChange={(e) => setFormPosAnggaran(e.target.value as PosType)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pos 53">Pos 53 (Beban Pemeliharaan)</option>
                    <option value="Pos 54">Pos 54 (Beban Administrasi &amp; Umum)</option>
                    <option value="Pos 52">Pos 52 (Beban Operasi / Kepegawaian)</option>
                    <option value="Beban Sewa">Beban Sewa</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Default GL Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    3. GL Account Default
                  </label>
                  <input
                    type="text"
                    value={formGLDefault}
                    onChange={(e) => setFormGLDefault(e.target.value)}
                    placeholder="6106201700"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Uraian Nama Akun GL
                  </label>
                  <input
                    type="text"
                    value={formGLNameDefault}
                    onChange={(e) => setFormGLNameDefault(e.target.value)}
                    placeholder="Beban jasa borong perlengk Umum"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Catatan Kontrak
                </label>
                <textarea
                  rows={2}
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Catatan ruang lingkup pekerjaan atau nomor addendum..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!editingContract && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                  💡 Termin/tagihan bulanan kontrak baru dibuat secara default nihil (belum terisi). Saat menambahkan termin/tagihan, seluruh data kontrak (GL Account, Pos Anggaran, Vendor, dsb.) akan otomatis disalin ke isian termin.
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition-all"
                >
                  {editingContract ? 'Simpan Perubahan' : 'Buat Kontrak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT TERMIN TAGIHAN BULANAN                               */}
      {/* ========================================================================= */}
      {isTerminModalOpen && (() => {
        const currentContractForTermin = alihDayaContracts.find(c => c.id === targetContractIdForTermin);
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">
                  {editingTermin ? 'Edit Termin Tagihan Bulanan' : 'Tambah Termin Tagihan Bulanan'}
                </h3>
              </div>
              <button
                onClick={() => setIsTerminModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTermin} className="p-6 space-y-4 overflow-y-auto flex-1">
              {terminError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{terminError}</span>
                </div>
              )}

              {/* Data Kontrak Induk Terhubung Banner */}
              {currentContractForTermin && (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-blue-950">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Data Kontrak Induk Terhubung</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyContractDataToTerminForm}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-white hover:bg-blue-100 border border-blue-300 rounded-md shadow-2xs transition-colors cursor-pointer"
                      title="Salin ulang seluruh data kontrak ke isian termin ini"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Salin Data Kontrak</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-slate-700 pt-1.5 border-t border-blue-100">
                    <div>
                      <span className="text-slate-500">Kontrak: </span>
                      <span className="font-semibold text-slate-900 truncate block" title={currentContractForTermin.namaKontrak}>
                        {currentContractForTermin.namaKontrak}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Nomor: </span>
                      <span className="font-mono font-medium text-slate-900 truncate block" title={currentContractForTermin.nomerKontrak}>
                        {currentContractForTermin.nomerKontrak}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Vendor: </span>
                      <span className="font-medium text-slate-900">
                        {currentContractForTermin.vendor || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Pos Anggaran: </span>
                      <span className="font-semibold text-blue-800">
                        {currentContractForTermin.posAnggaran || currentContractForTermin.posType || 'Pos 53'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">GL Account: </span>
                      <span className="font-mono font-semibold text-blue-900">{currentContractForTermin.glAccountDefault || '-'}</span>
                      {(currentContractForTermin.glAccountNameDefault || currentContractForTermin.glAccountDefaultName) && (
                        <span className="text-slate-600"> - {currentContractForTermin.glAccountNameDefault || currentContractForTermin.glAccountDefaultName}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bulan Tagihan Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Bulan Tagihan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formTerminMonthIndex}
                  onChange={(e) => handleMonthChangeInTerminModal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MONTH_NAMES.map((mName, idx) => (
                    <option key={mName} value={idx}>
                      Bulan {idx + 1} - {mName} {selectedYear || 2026}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Termin Tagihan */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  4. Termin Tagihan / Uraian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTerminName}
                  onChange={(e) => setFormTerminName(e.target.value)}
                  placeholder="Contoh: Termin 1 (Januari 2026)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Pos Anggaran */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelompok Pos Anggaran (Disalin dari Kontrak)
                </label>
                <select
                  value={formTerminPosType}
                  onChange={(e) => setFormTerminPosType(e.target.value as PosType)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Pos 53">Pos 53 (Beban Pemeliharaan &amp; Jasa)</option>
                  <option value="Pos 54">Pos 54 (Beban Administrasi &amp; Umum)</option>
                  <option value="Pos 52">Pos 52 (Beban Operasi / Kepegawaian)</option>
                  <option value="Beban Sewa">Beban Sewa</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* 3. GL Account & Nama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    3. GL Account <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTerminGL}
                    onChange={(e) => setFormTerminGL(e.target.value)}
                    placeholder="6106201700"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Uraian Nama GL
                  </label>
                  <input
                    type="text"
                    value={formTerminGLName}
                    onChange={(e) => setFormTerminGLName(e.target.value)}
                    placeholder="Beban jasa borong..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 5. Nominal Tagihan */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  5. Nominal Tagihan (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">Rp</span>
                  <input
                    type="number"
                    required
                    value={formTerminNominal || ''}
                    onChange={(e) => setFormTerminNominal(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Terformat: <strong>{formatRupiah(formTerminNominal)}</strong>
                </div>
              </div>

              {/* 7. No Dokumen (Auto defines 6. Status Beban) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  7. No Dokumen (SAP / SPJ / MIRO / SES)
                </label>
                <input
                  type="text"
                  value={formTerminDocNum}
                  onChange={(e) => setFormTerminDocNum(e.target.value)}
                  placeholder="Contoh: 5100092811 / SES-2026-001 (Kosongkan bila belum ada)"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 6. Status Beban (Calculated Preview) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-700">6. Status Beban (Otomatis):</div>
                  <div className="text-[11px] text-slate-500">
                    {formTerminDocNum.trim() !== '' 
                      ? 'No Dokumen terisi \u2192 Beban Tercatat di SAP' 
                      : 'No Dokumen kosong \u2192 Belum Tercatat (Komitmen/Akrual)'}
                  </div>
                </div>
                <div>
                  {formTerminDocNum.trim() !== '' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Tercatat
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Belum Tercatat
                    </span>
                  )}
                </div>
              </div>

              {/* Tanggal & Keterangan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jatuh Tempo / Periode Tagihan
                  </label>
                  <input
                    type="date"
                    value={formTerminTanggal}
                    onChange={(e) => setFormTerminTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan / Keterangan
                  </label>
                  <input
                    type="text"
                    value={formTerminNotes}
                    onChange={(e) => setFormTerminNotes(e.target.value)}
                    placeholder="Catatan termin..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTerminModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition-all"
                >
                  {editingTermin ? 'Simpan Perubahan' : 'Tambah Termin'}
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}

      {/* Month Bills Modal (Managing multiple bills in a month) */}
      {monthBillsModal && monthBillsModal.isOpen && (
        <MonthBillsModal
          isOpen={monthBillsModal.isOpen}
          onClose={() => setMonthBillsModal(null)}
          contract={monthBillsModal.contract}
          monthIndex={monthBillsModal.monthIndex}
          year={selectedYear || 2026}
          onSaveMonthTermins={handleSaveMonthBills}
        />
      )}

      {/* Multi-Termin Scheme Modal (Setting up 2 bills per month automatically) */}
      {multiSchemeModal && multiSchemeModal.isOpen && (
        <MultiTerminSchemeModal
          isOpen={multiSchemeModal.isOpen}
          onClose={() => setMultiSchemeModal(null)}
          contract={multiSchemeModal.contract}
          year={selectedYear || 2026}
          onApplyScheme={handleApplyMultiTerminScheme}
        />
      )}
    </div>
  );
};
