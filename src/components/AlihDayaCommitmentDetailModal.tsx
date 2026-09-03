import React, { useState } from 'react';
import { 
  X, 
  Check, 
  FileCheck, 
  Clock, 
  ExternalLink, 
  Layers, 
  FileText,
  Building2,
  AlertCircle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { AdditionalTransaction, AlihDayaMonthlyContractItem } from '../types';
import { formatRupiah, MONTH_NAMES } from '../utils/formatters';

interface AlihDayaCommitmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: AdditionalTransaction | null;
  onUpdateTerminDocNumber: (contractId: string, terminId: string, docNumber: string) => void;
  onNavigateToAlihDaya?: () => void;
}

export const AlihDayaCommitmentDetailModal: React.FC<AlihDayaCommitmentDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onUpdateTerminDocNumber,
  onNavigateToAlihDaya
}) => {
  if (!isOpen || !transaction) return null;

  const detail = transaction.alihDayaDetail;
  const contracts = detail?.contracts || [];
  const monthName = MONTH_NAMES[transaction.month] || `Bulan ${transaction.month + 1}`;

  // Local state for editing document numbers per termin
  const [editingDoc, setEditingDoc] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    contracts.forEach(c => {
      initial[c.terminId] = c.documentNumber || '';
    });
    return initial;
  });

  const [savedSuccessKey, setSavedSuccessKey] = useState<string | null>(null);

  const handleDocChange = (terminId: string, val: string) => {
    setEditingDoc(prev => ({
      ...prev,
      [terminId]: val
    }));
  };

  const handleSaveDoc = (item: AlihDayaMonthlyContractItem) => {
    const newDoc = (editingDoc[item.terminId] || '').trim();
    onUpdateTerminDocNumber(item.contractId, item.terminId, newDoc);
    setSavedSuccessKey(item.terminId);
    setTimeout(() => {
      setSavedSuccessKey(null);
    }, 2000);
  };

  const handleQuickMarkTercatat = (item: AlihDayaMonthlyContractItem) => {
    const autoDoc = `SAP-${transaction.posType.replace(/\s+/g, '')}-${Date.now().toString().slice(-6)}`;
    setEditingDoc(prev => ({
      ...prev,
      [item.terminId]: autoDoc
    }));
    onUpdateTerminDocNumber(item.contractId, item.terminId, autoDoc);
    setSavedSuccessKey(item.terminId);
    setTimeout(() => {
      setSavedSuccessKey(null);
    }, 2000);
  };

  const handleReopen = (item: AlihDayaMonthlyContractItem) => {
    setEditingDoc(prev => ({
      ...prev,
      [item.terminId]: ''
    }));
    onUpdateTerminDocNumber(item.contractId, item.terminId, '');
    setSavedSuccessKey(item.terminId);
    setTimeout(() => {
      setSavedSuccessKey(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/40 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Komitmen Kontrak Rutin Bulanan
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {transaction.posType}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                {monthName} {transaction.year || 2026}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {transaction.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian seluruh kontrak dan termin kontrak rutin yang membentuk komitmen anggaran pada pos ini.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-6 pb-4 bg-slate-50/70 border-b border-slate-200">
          {/* Total Tagihan */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Tagihan Bulan Ini
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-1">
              {formatRupiah(detail?.totalAmount || 0)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {detail?.totalCount || 0} tagihan pekerjaan kontrak rutin
            </div>
          </div>

          {/* Open / Belum Tercatat */}
          <div className={`p-4 rounded-xl border shadow-sm ${
            (detail?.openAmount || 0) > 0 
              ? 'bg-amber-50/80 border-amber-300' 
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                Tagihan Open (Masuk Prognosa)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                KOMITMEN
              </span>
            </div>
            <div className="text-lg font-bold text-amber-900 font-mono mt-1">
              {formatRupiah(detail?.openAmount || 0)}
            </div>
            <div className="text-xs text-amber-700 mt-1 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              {detail?.openCount || 0} tagihan belum tercatat di SAP
            </div>
          </div>

          {/* Tercatat di SAP */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-300 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Tercatat di SAP (Dikecualikan)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                SUDAH REALISASI
              </span>
            </div>
            <div className="text-lg font-bold text-emerald-900 font-mono mt-1">
              {formatRupiah(detail?.documentedAmount || 0)}
            </div>
            <div className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-medium">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              {detail?.documentedCount || 0} tagihan sudah ber-SPJ / Dokumen
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Daftar Kontrak & Termin Tagihan ({contracts.length})
              </h3>
              <span className="text-xs text-slate-400">
                • Nomor dokumen yang diisi otomatis menandai tagihan tercatat dan mengecualikannya dari prognosa
              </span>
            </div>
            {onNavigateToAlihDaya && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToAlihDaya();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka Menu Monitoring Kontrak Rutin
              </button>
            )}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">No</th>
                  <th className="py-2.5 px-4 min-w-[200px]">Kontrak & Vendor</th>
                  <th className="py-2.5 px-3 w-32">Termin</th>
                  <th className="py-2.5 px-3 w-32">Akun GL</th>
                  <th className="py-2.5 px-4 text-right min-w-[130px]">Nominal (Rp)</th>
                  <th className="py-2.5 px-3 text-center w-28">Status</th>
                  <th className="py-2.5 px-4 min-w-[220px]">Nomor Dokumen / SPJ (SAP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada tagihan kontrak rutin untuk pos dan bulan ini.
                    </td>
                  </tr>
                ) : (
                  contracts.map((item, idx) => {
                    const currentDoc = editingDoc[item.terminId] ?? (item.documentNumber || '');
                    const hasDocNow = currentDoc.trim().length > 0;
                    const isSaved = savedSuccessKey === item.terminId;

                    return (
                      <tr 
                        key={item.terminId} 
                        className={`hover:bg-slate-50 transition-colors ${
                          hasDocNow ? 'bg-slate-50/60 text-slate-600' : 'bg-white'
                        }`}
                      >
                        <td className="py-3 px-3 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>

                        {/* Kontrak & Vendor */}
                        <td className="py-3 px-4">
                          <div className={`font-semibold ${hasDocNow ? 'text-slate-700' : 'text-slate-900'}`}>
                            {item.contractName}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            {item.vendor && (
                              <span className="flex items-center gap-1 font-medium">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {item.vendor}
                              </span>
                            )}
                            {item.contractNumber && (
                              <span className="font-mono text-[10px] text-slate-400">
                                ({item.contractNumber})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Termin */}
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                            {item.terminLabel}
                          </span>
                        </td>

                        {/* Akun GL */}
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-[11px] text-indigo-700">
                              {item.glAccount || '-'}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={item.glAccountName}>
                              {item.glAccountName || '-'}
                            </span>
                          </div>
                        </td>

                        {/* Nominal */}
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={hasDocNow ? 'text-slate-500 line-through' : 'text-slate-900'}>
                            {formatRupiah(item.nominal)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          {hasDocNow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Tercatat
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Open
                            </span>
                          )}
                        </td>

                        {/* Nomor Dokumen / SPJ & Quick Actions */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={currentDoc}
                                placeholder="Ketik No. Dokumen / SPJ..."
                                onChange={(e) => handleDocChange(item.terminId, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveDoc(item);
                                  }
                                }}
                                className={`w-full px-2.5 py-1 text-xs rounded-lg border font-mono transition-all focus:outline-none focus:ring-2 ${
                                  hasDocNow 
                                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold focus:ring-emerald-200' 
                                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-blue-100 focus:border-blue-500'
                                }`}
                              />
                            </div>

                            {/* Tombol Simpan */}
                            <button
                              type="button"
                              onClick={() => handleSaveDoc(item)}
                              className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
                                isSaved 
                                  ? 'bg-emerald-600 text-white border-emerald-600' 
                                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              }`}
                              title="Simpan No. Dokumen"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Reset/Buka Kembali jika sudah ada dokumen */}
                            {hasDocNow && (
                              <button
                                type="button"
                                onClick={() => handleReopen(item)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                                title="Hapus Dokumen (Kembalikan ke Open)"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Quick Action: Tandai Tercatat otomatis jika masih open */}
                            {!hasDocNow && (
                              <button
                                type="button"
                                onClick={() => handleQuickMarkTercatat(item)}
                                className="px-2 py-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
                                title="Tandai langsung sebagai Tercatat SAP"
                              >
                                Tandai SAP
                              </button>
                            )}
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

        {/* Footer Note */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              Perubahan nomor dokumen akan otomatis memperbarui data kontrak Kontrak Rutin dan menyesuaikan total komitmen di Prognosa secara real-time.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors shadow-sm"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
