import React, { useState, useEffect } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import { BudgetItem, PosType } from '../types';
import { MONTH_SHORT_NAMES, formatRupiah, formatRupiahShort } from '../utils/formatters';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: BudgetItem) => void;
  initialItem?: BudgetItem | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [posType, setPosType] = useState<PosType>('Pos 53');
  const [category, setCategory] = useState('');
  const [budgetAnnual, setBudgetAnnual] = useState<number>(0);
  const [budgetMonthly, setBudgetMonthly] = useState<number[]>(Array(12).fill(0));

  useEffect(() => {
    if (initialItem) {
      setCode(initialItem.code || '');
      setName(initialItem.name || '');
      setPosType(initialItem.posType || 'Pos 53');
      setCategory(initialItem.category || '');
      setBudgetAnnual(initialItem.budgetAnnual || 0);
      setBudgetMonthly(initialItem.budgetMonthly || Array(12).fill(0));
    } else {
      setCode('');
      setName('');
      setPosType('Pos 53');
      setCategory('Beban Pemeliharaan Peralatan');
      setBudgetAnnual(0);
      setBudgetMonthly(Array(12).fill(0));
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const monthlySum = budgetMonthly.reduce((a, b) => a + b, 0);
    const finalAnnual = budgetAnnual !== 0 ? budgetAnnual : monthlySum;

    const posMap: Record<PosType, string> = {
      'Pos 52': 'Pos 52 Beban Kepegawaian',
      'Pos 53': 'Pos 53 Beban Pemeliharaan',
      'Pos 54': 'Pos 54 Biaya Administrasi dan Umum',
      'Beban Sewa': 'Beban Sewa (Kendaraan & Gedung)',
      'Sewa Non AHG': 'Beban Sewa Non AHG',
      'Pos 72': 'Pos 72 Beban Imbalan Pasca Kerja',
      'Lainnya': 'Pos Lainnya'
    };

    const item: BudgetItem = {
      id: initialItem?.id || `acc_${Date.now()}`,
      code: code.trim() || `53${Math.floor(10000000 + Math.random() * 90000000)}`,
      name: name.trim(),
      pos: posMap[posType] || 'Pos 53 Beban Pemeliharaan',
      posType,
      category: category.trim() || posType,
      budgetAnnual: finalAnnual,
      budgetMonthly: budgetMonthly.length === 12 ? budgetMonthly : Array(12).fill(0),
      realizationMonthly: initialItem?.realizationMonthly || Array(12).fill(0),
      isGroupHeader: initialItem?.isGroupHeader || false,
      level: initialItem?.level !== undefined ? initialItem.level : 2,
      updatedAt: new Date().toISOString()
    };

    onSave(item);
    onClose();
  };

  const monthlySum = budgetMonthly.reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {initialItem ? 'Edit Akun Anggaran' : 'Tambah Akun Anggaran Baru'}
              </h3>
              <p className="text-xs text-slate-300">Input parameter akun dan rencana anggaran bulanan</p>
            </div>
          </div>
          <button type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kode Akun (GL Code):</label>
              <input
                type="text"
                placeholder="e.g. 5311010001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pos Anggaran:</label>
              <select
                value={posType}
                onChange={(e) => setPosType(e.target.value as PosType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="Pos 52">Pos 52 (Beban Kepegawaian)</option>
                <option value="Pos 53">Pos 53 (Beban Pemeliharaan)</option>
                <option value="Pos 54">Pos 54 (Biaya Administrasi & Umum)</option>
                <option value="Sewa Non AHG">Sewa Non AHG</option>
                <option value="Pos 72">Pos 72 (Beban Pensiun/Imbalan)</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama / Uraian Akun Anggaran:</label>
            <input
              type="text"
              required
              placeholder="e.g. Pemeliharaan Instalasi Gardu Hubung, ATK, Listrik..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sub Kategori / Pengelompokan:</label>
            <input
              type="text"
              placeholder="e.g. Pemeliharaan Distribusi, Pelayanan Pelanggan..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-800">Plafon Anggaran Tahunan (Rp):</label>
              <span className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium">
                Terkunci (Otomatis dari Total Bulanan)
              </span>
            </div>
            <input
              type="number"
              disabled
              readOnly
              value={budgetAnnual}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-sm text-right text-slate-700 cursor-not-allowed focus:outline-none"
            />
            <span className={`text-[11px] font-mono mt-0.5 block ${budgetAnnual < 0 ? 'text-rose-600 font-bold' : 'text-blue-600 font-semibold'}`}>
              {formatRupiah(budgetAnnual)}
            </span>
          </div>

          {/* Monthly grid */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Rencana Alokasi Bulanan (Jan - Des):</span>
              <span className="text-slate-500">
                Total Bulan: <strong className={`font-mono ${monthlySum < 0 ? 'text-rose-600 font-bold' : ''}`}>{formatRupiahShort(monthlySum)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {MONTH_SHORT_NAMES.map((m, idx) => (
                <div key={idx} className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{m}</span>
                  <input
                    type="number"
                    value={budgetMonthly[idx] !== undefined && budgetMonthly[idx] !== null ? budgetMonthly[idx] : ''}
                    onChange={(e) => {
                      const updated = [...budgetMonthly];
                      updated[idx] = Number(e.target.value);
                      setBudgetMonthly(updated);
                      const newAnnual = updated.reduce((a, b) => a + (b || 0), 0);
                      setBudgetAnnual(newAnnual);
                    }}
                    className={`w-full px-1 py-0.5 bg-white border rounded text-right font-mono text-[11px] focus:outline-none focus:border-blue-500 ${
                      (budgetMonthly[idx] || 0) < 0 ? 'border-rose-300 text-rose-600 font-bold' : 'border-slate-300'
                    }`}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Akun Anggaran</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
