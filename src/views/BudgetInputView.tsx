import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  SlidersHorizontal, 
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Layers,
  FolderX
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BudgetItem, PosType } from '../types';
import { formatRupiah, formatRupiahShort, MONTH_SHORT_NAMES } from '../utils/formatters';
import { getChildAccountsForHeader } from '../utils/budgetCalculations';

export const BudgetInputView: React.FC = () => {
  const { 
    budgetItems, 
    addBudgetItem, 
    updateBudgetItem, 
    deleteBudgetItem, 
    deleteSubAccount,
    deleteMultipleBudgetItems,
    resetAllValuesToZero,
    selectedYear 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosFilter, setSelectedPosFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  // Deletion and Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [itemToDelete, setItemToDelete] = useState<BudgetItem | null>(null);
  const [subAccountToDelete, setSubAccountToDelete] = useState<BudgetItem | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isResetZeroModalOpen, setIsResetZeroModalOpen] = useState(false);

  // Bulk adjustment state
  const [isBulkAdjustOpen, setIsBulkAdjustOpen] = useState(false);
  const [bulkPercent, setBulkPercent] = useState<number>(5);
  const [bulkTargetPos, setBulkTargetPos] = useState<string>('ALL');

  // New item form state
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    posType: PosType;
    category: string;
    budgetAnnual: number;
    monthlyValues: number[];
    notes: string;
  }>({
    code: '',
    name: '',
    posType: 'Pos 53',
    category: 'Beban Pemeliharaan',
    budgetAnnual: 0,
    monthlyValues: Array(12).fill(0),
    notes: ''
  });

  const POS_OPTIONS: { type: PosType; label: string; defaultCategory: string }[] = [
    { type: 'Pos 52', label: 'Pos 52 - Beban Kepegawaian', defaultCategory: 'Beban Kepegawaian dalam Bentuk Kompensasi' },
    { type: 'Pos 53', label: 'Pos 53 - Beban Pemeliharaan', defaultCategory: 'Pemakaian material' },
    { type: 'Pos 54', label: 'Pos 54 - Biaya Administrasi dan Umum', defaultCategory: 'Biaya Administrasi dan Umum' },
    { type: 'Beban Sewa', label: 'Beban Sewa', defaultCategory: 'Beban Sewa' },
    { type: 'Pos 72', label: 'Pos 72 - Beban Pensiun', defaultCategory: 'Beban Pensiun' },
    { type: 'Lainnya', label: 'Lainnya / Beban Usaha', defaultCategory: 'Beban Usaha Lainnya' }
  ];

  // Filtered items
  const filteredItems = useMemo(() => {
    return budgetItems.filter(item => {
      // Exclude grand headers if filtered, or show all
      if (selectedPosFilter !== 'ALL' && item.posType !== selectedPosFilter) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchName = (item.name || '').toLowerCase().includes(query);
        const matchCode = (item.code || '').toLowerCase().includes(query);
        const matchCat = (item.category || '').toLowerCase().includes(query);
        return matchName || matchCode || matchCat;
      }
      return true;
    });
  }, [budgetItems, selectedPosFilter, searchTerm]);

  // Non-header items in current filter
  const nonHeaderFilteredItems = useMemo(() => {
    return filteredItems.filter(i => !i.isGroupHeader);
  }, [filteredItems]);

  const isAllFilteredSelected = nonHeaderFilteredItems.length > 0 && 
    nonHeaderFilteredItems.every(i => selectedIds.has(i.id));

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(nonHeaderFilteredItems.map(i => i.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchDelete = () => {
    deleteMultipleBudgetItems(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsBatchDeleteModalOpen(false);
  };

  const handleConfirmSingleDelete = () => {
    if (itemToDelete) {
      deleteBudgetItem(itemToDelete.id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(itemToDelete.id);
        return next;
      });
      setItemToDelete(null);
    }
  };

  const handleConfirmDeleteSubAccount = (deleteChildren: boolean) => {
    if (subAccountToDelete) {
      deleteSubAccount(subAccountToDelete.id, deleteChildren);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(subAccountToDelete.id);
        return next;
      });
      setSubAccountToDelete(null);
    }
  };

  const handleConfirmResetZero = () => {
    resetAllValuesToZero();
    setIsResetZeroModalOpen(false);
  };

  // Aggregate totals
  const totalFilteredBudget = useMemo(() => {
    return filteredItems
      .filter(i => !i.isGroupHeader)
      .reduce((sum, item) => sum + (item.budgetAnnual || 0), 0);
  }, [filteredItems]);

  const handleOpenAdd = () => {
    setFormData({
      code: '',
      name: '',
      posType: 'Pos 53',
      category: 'Beban Pemeliharaan',
      budgetAnnual: 0,
      monthlyValues: Array(12).fill(0),
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Mohon isi nama / uraian anggaran');
      return;
    }

    const totalMonthly = formData.monthlyValues.reduce((a, b) => a + (b || 0), 0);

    addBudgetItem({
      code: formData.code.trim() || `ACC_${Date.now().toString().slice(-6)}`,
      name: formData.name.trim(),
      pos: POS_OPTIONS.find(p => p.type === formData.posType)?.label || formData.posType,
      posType: formData.posType,
      category: formData.category.trim() || 'Umum',
      isGroupHeader: false,
      level: 2,
      budgetAnnual: totalMonthly,
      budgetMonthly: [...formData.monthlyValues],
      realizationMonthly: Array(12).fill(0),
      notes: formData.notes
    });

    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (item: BudgetItem) => {
    setEditingItem(JSON.parse(JSON.stringify(item)));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // Recalculate annual from monthly
    const totalMonth = editingItem.isGroupHeader
      ? editingItem.budgetAnnual
      : editingItem.budgetMonthly.reduce((a, b) => a + (b || 0), 0);

    updateBudgetItem(editingItem.id, {
      code: editingItem.code,
      name: editingItem.name,
      posType: editingItem.posType,
      category: editingItem.category,
      budgetAnnual: totalMonth,
      budgetMonthly: editingItem.budgetMonthly,
      notes: editingItem.notes
    });

    setEditingItem(null);
  };

  const handleBulkAdjust = (increase: boolean) => {
    const factor = 1 + (increase ? bulkPercent : -bulkPercent) / 100;
    
    budgetItems.forEach(item => {
      if (item.isGroupHeader) return;
      if (bulkTargetPos !== 'ALL' && item.posType !== bulkTargetPos) return;

      const newMonthly = item.budgetMonthly.map(m => Math.round(m * factor));
      const newAnnual = newMonthly.reduce((a, b) => a + b, 0);
      updateBudgetItem(item.id, {
        budgetAnnual: newAnnual,
        budgetMonthly: newMonthly
      });
    });

    setIsBulkAdjustOpen(false);
    alert(`Berhasil menyesuaikan anggaran untuk ${bulkTargetPos} sebesar ${increase ? '+' : '-'}${bulkPercent}%`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Manajemen & Input Data Anggaran (SKKO)</h1>
              <p className="text-xs text-slate-500">Input manual pagu anggaran, alokasi bulanan, serta edit data per akun</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button"
            onClick={() => setIsResetZeroModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 flex items-center gap-1.5 transition-colors"
            title="Nol-kan semua nilai pagu anggaran dan realisasi"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Nol-kan Nilai</span>
          </button>

          {selectedIds.size > 0 && (
            <button type="button"
              onClick={() => setIsBatchDeleteModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all animate-pulse"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus ({selectedIds.size}) Akun</span>
            </button>
          )}

          <button type="button"
            onClick={() => setIsBulkAdjustOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Penyesuaian Masal (%)</span>
          </button>

          <button type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Anggaran</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode akun, nama, atau sub-pos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            {searchTerm && (
              <button type="button" 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* POS Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button type="button"
              onClick={() => setSelectedPosFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedPosFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua POS ({budgetItems.length})
            </button>
            {POS_OPTIONS.map(pos => (
              <button type="button"
                key={pos.type}
                onClick={() => setSelectedPosFilter(pos.type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedPosFilter === pos.type
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pos.type}
              </button>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan <strong className="text-slate-800">{filteredItems.length}</strong> akun anggaran</span>
          <span>Total Pagu Filter: <strong className="text-blue-600 font-mono text-sm">{formatRupiah(totalFilteredBudget)}</strong></span>
        </div>
      </div>

      {/* Main Budget Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-white uppercase tracking-wider text-[11px] font-semibold sticky top-0">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={toggleSelectAll}
                    title="Pilih semua akun dalam filter"
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3 w-10 text-center">No</th>
                <th className="py-3.5 px-4 w-32">Kode GL</th>
                <th className="py-3.5 px-4 min-w-[220px]">Uraian Akun Anggaran</th>
                <th className="py-3.5 px-4 w-28">Kelompok Pos</th>
                <th className="py-3.5 px-4 text-right min-w-[160px]">Pagu Tahunan ({selectedYear})</th>
                <th className="py-3.5 px-4 text-center min-w-[200px]">Alokasi Bulanan (Jan - Des)</th>
                <th className="py-3.5 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    Tidak ada akun anggaran yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isHeader = item.isGroupHeader;

                  if (isHeader) {
                    const childAccounts = getChildAccountsForHeader(item, budgetItems);
                    const isPosLevel = item.level === 0;

                    return (
                      <tr 
                        key={item.id} 
                        className={`font-bold transition-colors ${
                          isPosLevel 
                            ? 'bg-slate-200/90 text-slate-900 border-y-2 border-slate-300' 
                            : 'bg-slate-100/90 text-slate-800 border-y border-slate-200'
                        }`}
                      >
                        <td className="py-3 px-3 text-center text-slate-400">
                          -
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                          {item.code || '-'}
                        </td>
                        <td className="py-3 px-4" colSpan={2}>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                              isPosLevel 
                                ? 'bg-slate-800 text-white' 
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              ∑ Sub-Total
                            </span>
                            <span className="uppercase tracking-wide font-bold">{item.name}</span>
                            <span className="text-[10px] font-normal text-slate-500">
                              ({childAccounts.length} akun dibawahnya)
                            </span>
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-black ${item.budgetAnnual < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                          <span title="Nilai sub-total berasal dari penjumlahan akun anggaran di bawahnya">
                            {formatRupiah(item.budgetAnnual)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span 
                            className="inline-block text-[10px] font-mono font-semibold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300/50" 
                            title="Akumulasi alokasi bulanan seluruh akun di bawah sub-total ini"
                          >
                            ∑ Alokasi: {formatRupiahShort(item.budgetAnnual)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button type="button"
                              onClick={() => handleOpenEdit(item)}
                              title="Lihat / Edit Uraian Header Sub-Total"
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200/80 rounded transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button type="button"
                              onClick={() => setSubAccountToDelete(item)}
                              title="Hapus Sub-Akun / Kelompok Anggaran"
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const isSelected = selectedIds.has(item.id);

                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-colors group ${
                        isSelected ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-blue-50/40'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(item.id)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600 text-xs">
                        {item.code}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="truncate max-w-sm" title={item.name}>{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{item.category}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.posType}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${item.budgetAnnual < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        <div 
                          onClick={() => handleOpenEdit(item)}
                          className="cursor-pointer hover:text-blue-600 hover:underline inline-flex items-center gap-1 group/val"
                          title="Klik untuk edit rincian bulanan"
                        >
                          <span>{formatRupiah(item.budgetAnnual)}</span>
                          <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover/val:opacity-100" />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center justify-center text-[10px] text-slate-600 font-mono">
                          <span>∑ Bulan: {formatRupiahShort(item.budgetMonthly.reduce((a, b) => a + (b || 0), 0))}</span>
                          <span className="text-[9px] text-slate-400">12 Bulan Terisi</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Rincian Lengkap"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button type="button"
                            onClick={() => setItemToDelete(item)}
                            title="Hapus Akun Anggaran"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Batch Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold">
              <strong className="text-blue-400">{selectedIds.size}</strong> akun anggaran dipilih
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <button type="button"
            onClick={() => setIsBatchDeleteModalOpen(true)}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Akun Terpilih</span>
          </button>
          <button type="button"
            onClick={() => setSelectedIds(new Set())}
            className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
        </div>
      )}

      {/* MODAL: Tambah Akun Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-slate-900 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Tambah Akun Anggaran Baru</h3>
              </div>
              <button type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Akun GL (10 Digit)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 6106200700"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelompok POS</label>
                  <select
                    value={formData.posType}
                    onChange={(e) => {
                      const pos = e.target.value as PosType;
                      const opt = POS_OPTIONS.find(p => p.type === pos);
                      setFormData({ 
                        ...formData, 
                        posType: pos,
                        category: opt?.defaultCategory || formData.category
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {POS_OPTIONS.map(p => (
                      <option key={p.type} value={p.type}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian / Nama Akun Anggaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beban Pemeliharaan Gardu Induk & Trafo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sub-Kategori</label>
                  <input
                    type="text"
                    placeholder="Contoh: Jasa Borong"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Pagu Anggaran Tahunan (Rp)</label>
                    <span className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium">
                      Terkunci (Total Bulanan)
                    </span>
                  </div>
                  <input
                    type="number"
                    disabled
                    readOnly
                    value={formData.budgetAnnual}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-slate-700 cursor-not-allowed focus:outline-none"
                  />
                  <span className={`text-[11px] font-mono mt-0.5 block ${formData.budgetAnnual < 0 ? 'text-rose-600 font-bold' : 'text-blue-600 font-semibold'}`}>
                    {formatRupiah(formData.budgetAnnual)}
                  </span>
                </div>
              </div>

              {/* Monthly breakdown */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800">Alokasi Anggaran Bulanan (Januari - Desember)</label>
                  <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                    Input Manual per Bulan
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {MONTH_SHORT_NAMES.map((m, idx) => (
                    <div key={idx}>
                      <span className="text-[10px] text-slate-500 block mb-0.5">{m}</span>
                      <input
                        type="number"
                        value={formData.monthlyValues[idx] || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          const newM = [...formData.monthlyValues];
                          newM[idx] = val;
                          const newAnnual = newM.reduce((a, b) => a + b, 0);
                          setFormData({ 
                            ...formData, 
                            monthlyValues: newM,
                            budgetAnnual: newAnnual
                          });
                        }}
                        className={`w-full px-2 py-1 border rounded font-mono text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          (formData.monthlyValues[idx] || 0) < 0 ? 'border-rose-300 text-rose-600 font-bold' : 'border-slate-300'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan justifikasi atau penyesuaian..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">
                  Simpan Akun Anggaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Akun Anggaran */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-slate-900 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Edit Data Anggaran Akun</h3>
              </div>
              <button type="button" 
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              {editingItem.isGroupHeader && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-xs block mb-0.5 text-blue-950">
                      Baris Sub-Total / Kelompok Anggaran
                    </strong>
                    <p className="text-[11px] leading-relaxed text-blue-800">
                      Nilai pagu tahunan dan alokasi bulanan pada baris sub-total ini dihitung secara otomatis dari akumulasi akun-akun rincian di bawahnya. Anda dapat mengedit kode akun dan nama uraian.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Akun GL</label>
                  <input
                    type="text"
                    value={editingItem.code}
                    onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelompok POS</label>
                  <select
                    value={editingItem.posType}
                    onChange={(e) => setEditingItem({ ...editingItem, posType: e.target.value as PosType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {POS_OPTIONS.map(p => (
                      <option key={p.type} value={p.type}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian / Nama Akun Anggaran</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sub-Kategori</label>
                  <input
                    type="text"
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      Pagu Anggaran Tahunan (Rp)
                    </label>
                    <span className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium">
                      {editingItem.isGroupHeader ? 'Otomatis dari Akun Rincian' : 'Terkunci (Total Bulanan)'}
                    </span>
                  </div>
                  <input
                    type="number"
                    disabled
                    readOnly
                    value={editingItem.budgetAnnual}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-slate-700 cursor-not-allowed focus:outline-none"
                  />
                  <span className={`text-[11px] font-mono mt-0.5 block ${editingItem.budgetAnnual < 0 ? 'text-rose-600 font-bold' : 'text-blue-600 font-semibold'}`}>
                    {formatRupiah(editingItem.budgetAnnual)}
                  </span>
                </div>
              </div>

              {/* Monthly breakdown */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800">
                    Alokasi Anggaran Bulanan (Januari - Desember) {editingItem.isGroupHeader && <span className="text-blue-600 font-normal text-xs">(Otomatis dari Akun Rincian)</span>}
                  </label>
                  {!editingItem.isGroupHeader && (
                    <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                      Input Manual per Bulan
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {MONTH_SHORT_NAMES.map((m, idx) => (
                    <div key={idx}>
                      <span className="text-[10px] text-slate-500 block mb-0.5">{m}</span>
                      <input
                        type="number"
                        disabled={editingItem.isGroupHeader}
                        value={editingItem.budgetMonthly[idx] || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          const newM = [...editingItem.budgetMonthly];
                          newM[idx] = val;
                          const newAnnual = newM.reduce((a, b) => a + b, 0);
                          setEditingItem({ 
                            ...editingItem, 
                            budgetMonthly: newM,
                            budgetAnnual: newAnnual
                          });
                        }}
                        className={`w-full px-2 py-1 border rounded font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          editingItem.isGroupHeader
                            ? 'bg-slate-100/80 border-slate-200 text-slate-600 cursor-not-allowed'
                            : (editingItem.budgetMonthly[idx] || 0) < 0 
                              ? 'border-rose-300 text-rose-600 font-bold bg-white' 
                              : 'border-slate-300 bg-white'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const itemToDel = editingItem;
                    setEditingItem(null);
                    if (itemToDel.isGroupHeader) {
                      setSubAccountToDelete(itemToDel);
                    } else {
                      setItemToDelete(itemToDel);
                    }
                  }}
                  className="px-3.5 py-2 font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{editingItem.isGroupHeader ? 'Hapus Sub-Akun' : 'Hapus Akun'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button type="button" 
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button type="submit"
                    className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer">
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Penyesuaian Masal (%) */}
      {isBulkAdjustOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                <h3>Penyesuaian Anggaran Masal (%)</h3>
              </div>
              <button type="button" 
                onClick={() => setIsBulkAdjustOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Sesuaikan seluruh pagu anggaran secara serentak berdasarkan persentase kenaikan atau efisiensi penghematan.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Kelompok POS</label>
                <select
                  value={bulkTargetPos}
                  onChange={(e) => setBulkTargetPos(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">Semua POS Anggaran</option>
                  {POS_OPTIONS.map(p => (
                    <option key={p.type} value={p.type}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Besaran Persentase (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={bulkPercent}
                    onChange={(e) => setBulkPercent(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="font-bold text-slate-600">%</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-2">
                <button type="button" 
                  onClick={() => handleBulkAdjust(false)}
                  className="px-3 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg border border-rose-200"
                >
                  Efisiensi (-{bulkPercent}%)
                </button>
                <button type="button" 
                  onClick={() => handleBulkAdjust(true)}
                  className="px-3 py-2.5 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-lg shadow-sm"
                >
                  Kenaikan (+{bulkPercent}%)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Satu Akun */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Akun Anggaran</h3>
                <p className="text-xs text-slate-500">Konfirmasi penghapusan data akun</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 mb-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Kode GL:</span>
                <span className="font-mono font-bold text-slate-800">{itemToDelete.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Nama Akun:</span>
                <span className="font-semibold text-slate-900 text-right max-w-[200px] truncate">{itemToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Kelompok POS:</span>
                <span className="font-semibold text-slate-800">{itemToDelete.posType}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Pagu Anggaran:</span>
                <span className="font-mono font-bold text-blue-600">{formatRupiah(itemToDelete.budgetAnnual)}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-rose-50 p-3 rounded-lg border border-rose-200 text-rose-700 text-xs mb-5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Akun anggaran ini beserta seluruh data alokasi bulanan dan realisasinya akan dihapus dari sistem.</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Sub-Akun / Header Kelompok */}
      {subAccountToDelete && (() => {
        const childAccounts = getChildAccountsForHeader(subAccountToDelete, budgetItems);
        const childCount = childAccounts.length;
        const totalChildBudget = childAccounts.reduce((sum, c) => sum + (c.budgetAnnual || 0), 0);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                  <FolderX className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hapus Sub-Akun / Kelompok Anggaran</h3>
                  <p className="text-xs text-slate-500">Konfirmasi penghapusan header sub-total anggaran</p>
                </div>
              </div>

              {/* Sub-account info card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 mb-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Nama Sub-Akun:</span>
                  <span className="font-bold text-slate-900 text-right max-w-[260px]">{subAccountToDelete.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Kelompok POS:</span>
                  <span className="font-semibold text-slate-800">{subAccountToDelete.posType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Jumlah Akun Terkait:</span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {childCount} Akun Rincian di Bawahnya
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Total Pagu Sub-Total:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatRupiah(subAccountToDelete.budgetAnnual || totalChildBudget)}
                  </span>
                </div>
              </div>

              {/* Child accounts preview */}
              {childCount > 0 && (
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-slate-600 mb-1.5 block">
                    Daftar Akun Rincian di Bawah Sub-Akun Ini ({childCount} Akun):
                  </span>
                  <div className="max-h-32 overflow-y-auto bg-slate-100/80 rounded-xl p-2.5 border border-slate-200 space-y-1 text-xs">
                    {childAccounts.slice(0, 10).map((child) => (
                      <div key={child.id} className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded border border-slate-200">
                        <div className="truncate max-w-[220px]">
                          <span className="font-mono text-slate-500 text-[10px] mr-1.5">{child.code}</span>
                          <span className="font-medium text-slate-800">{child.name}</span>
                        </div>
                        <span className="font-mono font-semibold text-slate-700 text-[10px]">
                          {formatRupiahShort(child.budgetAnnual)}
                        </span>
                      </div>
                    ))}
                    {childCount > 10 && (
                      <div className="text-[10px] text-center text-slate-400 font-medium pt-1">
                        + {childCount - 10} akun rincian lainnya
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {childCount > 0 ? (
                <div className="space-y-2">
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>Pilih metode penghapusan di bawah ini:</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirmDeleteSubAccount(true)}
                      className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus Sub-Akun & Seluruh {childCount} Akun Rincian di Dalamnya</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConfirmDeleteSubAccount(false)}
                      className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Layers className="w-4 h-4 text-amber-700" />
                      <span>Hapus Baris Header Sub-Akun Saja (Pertahankan {childCount} Akun)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubAccountToDelete(null)}
                      className="w-full py-2 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 mt-1 cursor-pointer"
                    >
                      Batalkan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px]">
                    Sub-akun ini tidak memiliki akun rincian di bawahnya. Menghapus sub-akun ini aman dilakukan.
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSubAccountToDelete(null)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmDeleteSubAccount(false)}
                      className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Ya, Hapus Sub-Akun</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* MODAL: Konfirmasi Hapus Massal */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus {selectedIds.size} Akun Terpilih</h3>
                <p className="text-xs text-slate-500">Konfirmasi penghapusan massal</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Apakah Anda yakin ingin menghapus <strong className="text-slate-900">{selectedIds.size} akun anggaran</strong> berikut?
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-40 overflow-y-auto space-y-1.5 mb-4 text-xs">
              {budgetItems.filter(i => selectedIds.has(i.id)).map(item => (
                <div key={item.id} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200 last:border-0">
                  <div className="truncate max-w-[240px]">
                    <span className="font-mono text-slate-500 mr-1.5">{item.code}</span>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-600">{formatRupiahShort(item.budgetAnnual)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 bg-rose-50 p-3 rounded-lg border border-rose-200 text-rose-700 text-xs mb-5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Semua akun yang dipilih akan dihapus secara permanen dari daftar anggaran.</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBatchDelete}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus {selectedIds.size} Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Nol-kan Semua Nilai */}
      {isResetZeroModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Nol-kan Semua Nilai</h3>
                <p className="text-xs text-slate-500">Reset pagu anggaran & realisasi ke Rp 0</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Tindakan ini akan mengubah seluruh nilai <strong className="text-slate-900">Pagu Tahunan</strong>, <strong className="text-slate-900">Alokasi Bulanan (Januari - Desember)</strong>, serta nilai <strong className="text-slate-900">Realisasi Bulanan</strong> pada seluruh akun anggaran menjadi <strong className="text-blue-600">Rp 0</strong>.
            </p>

            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-800 text-xs mb-5 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Struktur Akun Tetap Dipertahankan</span>
              </div>
              <p className="text-[11px] text-amber-700">
                Nama akun, kode GL, sub-pos, dan pengelompokan akun tidak akan dihapus, siap untuk diisi data anggaran baru.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsResetZeroModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetZero}
                className="px-4 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ya, Nol-kan Semua Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
