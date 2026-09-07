import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  DollarSign,
  AlertCircle,
  Copy,
  FileText
} from 'lucide-react';
import { AlihDayaContract, AlihDayaTermin, StatusBeban } from '../../types';
import { formatRupiah, MONTH_NAMES } from '../../utils/formatters';
import { resolveTerminMonth } from '../../views/AlihDayaMonitoringView';

interface MonthBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: AlihDayaContract;
  monthIndex: number;
  year: number;
  onSaveMonthTermins: (contractId: string, updatedMonthTermins: AlihDayaTermin[]) => void;
}

export const MonthBillsModal: React.FC<MonthBillsModalProps> = ({
  isOpen,
  onClose,
  contract,
  monthIndex,
  year,
  onSaveMonthTermins
}) => {
  const [bills, setBills] = useState<AlihDayaTermin[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize bills for this month from the contract
  useEffect(() => {
    if (contract && isOpen) {
      const monthTermins = (contract.termins || []).filter(
        t => resolveTerminMonth(t) === monthIndex
      );

      if (monthTermins.length > 0) {
        setBills(JSON.parse(JSON.stringify(monthTermins)));
      } else {
        // Create initial default bill for this month with copied contract data
        const monthNum = String(monthIndex + 1).padStart(2, '0');
        const lastDay = new Date(year, monthIndex + 1, 0).getDate();
        const contractPrefix = contract.namaKontrak ? `${contract.namaKontrak} - ` : '';
        const notesParts: string[] = [];
        if (contract.keterangan?.trim()) notesParts.push(contract.keterangan.trim());
        if (contract.vendor?.trim()) notesParts.push(`Vendor: ${contract.vendor.trim()}`);
        if ((contract.nomorKontrak || contract.nomerKontrak)?.trim()) notesParts.push(`No. Kontrak: ${(contract.nomorKontrak || contract.nomerKontrak)!.trim()}`);

        const initialBill: AlihDayaTermin = {
          id: `t_ad_new_${Date.now()}_1`,
          terminTagihan: `${contractPrefix}Termin 1 (${MONTH_NAMES[monthIndex]} ${year})`,
          bulanIndex: monthIndex,
          glAccount: contract.glAccountDefault || '6106201700',
          glAccountName: contract.glAccountNameDefault || contract.glAccountDefaultName || 'Beban Jasa Tenaga Kerja Kontrak Rutin',
          posType: contract.posAnggaran || contract.posType || 'Pos 53',
          nominalTagihan: 0,
          documentNumber: '',
          statusBeban: 'Belum Tercatat',
          tanggalJatuhTempo: `${year}-${monthNum}-${lastDay}`,
          notes: notesParts.length > 0 ? notesParts.join(' | ') : `Tagihan bulan ${MONTH_NAMES[monthIndex]}`
        };
        setBills([initialBill]);
      }
      setError(null);
    }
  }, [contract, monthIndex, year, isOpen]);

  if (!isOpen) return null;

  const totalNominal = bills.reduce((s, b) => s + (b.nominalTagihan ?? b.amount ?? 0), 0);
  const recordedCount = bills.filter(b => b.statusBeban === 'Tercatat' || Boolean(b.documentNumber?.trim())).length;

  const handleBillChange = (index: number, field: keyof AlihDayaTermin, value: any) => {
    setBills(prev => {
      const next = [...prev];
      const current = { ...next[index], [field]: value };
      
      // Auto update statusBeban when documentNumber changes
      if (field === 'documentNumber') {
        const docTrim = typeof value === 'string' ? value.trim() : '';
        current.statusBeban = docTrim !== '' ? 'Tercatat' : 'Belum Tercatat';
      }
      
      // Sync nominalTagihan and amount
      if (field === 'nominalTagihan') {
        current.amount = value;
      }
      
      next[index] = current;
      return next;
    });
  };

  const handleAddBill = () => {
    const nextNumber = bills.length + 1;
    const monthNum = String(monthIndex + 1).padStart(2, '0');
    const day = nextNumber === 1 ? 15 : new Date(year, monthIndex + 1, 0).getDate();
    const contractPrefix = contract.namaKontrak ? `${contract.namaKontrak} - ` : '';
    const notesParts: string[] = [];
    if (contract.keterangan?.trim()) notesParts.push(contract.keterangan.trim());
    if (contract.vendor?.trim()) notesParts.push(`Vendor: ${contract.vendor.trim()}`);
    if ((contract.nomorKontrak || contract.nomerKontrak)?.trim()) notesParts.push(`No. Kontrak: ${(contract.nomorKontrak || contract.nomerKontrak)!.trim()}`);
    
    const newBill: AlihDayaTermin = {
      id: `t_ad_new_${Date.now()}_${nextNumber}`,
      terminTagihan: `${contractPrefix}Termin ${nextNumber} (${MONTH_NAMES[monthIndex]} ${year})`,
      bulanIndex: monthIndex,
      glAccount: contract.glAccountDefault || '6106201700',
      glAccountName: contract.glAccountNameDefault || contract.glAccountDefaultName || 'Beban Jasa Tenaga Kerja Kontrak Rutin',
      posType: contract.posAnggaran || contract.posType || 'Pos 53',
      nominalTagihan: 0,
      documentNumber: '',
      statusBeban: 'Belum Tercatat',
      tanggalJatuhTempo: `${year}-${monthNum}-${String(day).padStart(2, '0')}`,
      notes: notesParts.length > 0 ? notesParts.join(' | ') : `Tagihan ke-${nextNumber} bulan ${MONTH_NAMES[monthIndex]}`
    };

    setBills(prev => [...prev, newBill]);
  };

  // Helper: Salin data kontrak induk ke satu tagihan tertentu
  const handleCopyContractDataToBill = (index: number) => {
    const contractPrefix = contract.namaKontrak ? `${contract.namaKontrak} - ` : '';
    const monthNum = String(monthIndex + 1).padStart(2, '0');
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const notesParts: string[] = [];
    if (contract.keterangan?.trim()) notesParts.push(contract.keterangan.trim());
    if (contract.vendor?.trim()) notesParts.push(`Vendor: ${contract.vendor.trim()}`);
    if ((contract.nomorKontrak || contract.nomerKontrak)?.trim()) notesParts.push(`No. Kontrak: ${(contract.nomorKontrak || contract.nomerKontrak)!.trim()}`);

    setBills(prev => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = {
        ...next[index],
        terminTagihan: `${contractPrefix}Termin ${index + 1} (${MONTH_NAMES[monthIndex]} ${year})`,
        glAccount: contract.glAccountDefault || '6106201700',
        glAccountName: contract.glAccountNameDefault || contract.glAccountDefaultName || 'Beban Jasa Tenaga Kerja Kontrak Rutin',
        posType: contract.posAnggaran || contract.posType || 'Pos 53',
        tanggalJatuhTempo: next[index].tanggalJatuhTempo || `${year}-${monthNum}-${lastDay}`,
        notes: notesParts.length > 0 ? notesParts.join(' | ') : next[index].notes
      };
      return next;
    });
  };

  // Helper: Salin data kontrak induk ke seluruh tagihan yang ada di bulan ini
  const handleCopyContractDataToAllBills = () => {
    const contractPrefix = contract.namaKontrak ? `${contract.namaKontrak} - ` : '';
    const monthNum = String(monthIndex + 1).padStart(2, '0');
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const notesParts: string[] = [];
    if (contract.keterangan?.trim()) notesParts.push(contract.keterangan.trim());
    if (contract.vendor?.trim()) notesParts.push(`Vendor: ${contract.vendor.trim()}`);
    if ((contract.nomorKontrak || contract.nomerKontrak)?.trim()) notesParts.push(`No. Kontrak: ${(contract.nomorKontrak || contract.nomerKontrak)!.trim()}`);

    setBills(prev => prev.map((bill, idx) => ({
      ...bill,
      terminTagihan: bill.terminTagihan || `${contractPrefix}Termin ${idx + 1} (${MONTH_NAMES[monthIndex]} ${year})`,
      glAccount: contract.glAccountDefault || '6106201700',
      glAccountName: contract.glAccountNameDefault || contract.glAccountDefaultName || 'Beban Jasa Tenaga Kerja Kontrak Rutin',
      posType: contract.posAnggaran || contract.posType || 'Pos 53',
      tanggalJatuhTempo: bill.tanggalJatuhTempo || `${year}-${monthNum}-${lastDay}`,
      notes: notesParts.length > 0 ? notesParts.join(' | ') : bill.notes
    })));
  };

  const handleDeleteBill = (index: number) => {
    if (bills.length === 1 && window.confirm('Hapus tagihan satu-satunya ini dari bulan ini? Bulan ini akan menjadi kosong tanpa tagihan.')) {
      setBills([]);
      return;
    }
    setBills(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickMarkAllRecorded = () => {
    const timestamp = Date.now().toString().slice(-6);
    setBills(prev => prev.map((b, i) => {
      const doc = b.documentNumber && b.documentNumber.trim() !== '' ? b.documentNumber : `5000${timestamp}${i+1}`;
      return {
        ...b,
        documentNumber: doc,
        statusBeban: 'Tercatat'
      };
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    for (let i = 0; i < bills.length; i++) {
      const b = bills[i];
      if (!b.terminTagihan && !b.termin) {
        setError(`Nama / uraian tagihan ke-${i + 1} tidak boleh kosong.`);
        return;
      }
      if (!b.glAccount) {
        setError(`GL Account tagihan ke-${i + 1} wajib diisi.`);
        return;
      }
    }

    onSaveMonthTermins(contract.id, bills);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-300" />
              <h3 className="font-bold text-base">
                Kelola Tagihan Bulan {MONTH_NAMES[monthIndex]} {year}
              </h3>
            </div>
            <div className="text-xs text-blue-200 mt-0.5 flex items-center gap-2">
              <span className="font-semibold text-white truncate max-w-sm">{contract.namaKontrak}</span>
              <span className="bg-blue-800/80 px-1.5 py-0.5 rounded font-mono text-[11px]">{contract.nomorKontrak || contract.nomerKontrak}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500">Jumlah Tagihan:</span>
              <span className="ml-1.5 font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {bills.length} Tagihan
              </span>
            </div>
            <div>
              <span className="text-slate-500">Total Bulan Ini:</span>
              <span className="ml-1.5 font-mono font-bold text-blue-900 text-sm">
                {formatRupiah(totalNominal)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Status SAP:</span>
            {recordedCount === bills.length && bills.length > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Check className="w-3 h-3 text-emerald-600" />
                Semua Tercatat ({recordedCount}/{bills.length})
              </span>
            ) : recordedCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Clock className="w-3 h-3 text-amber-600" />
                Sebagian ({recordedCount}/{bills.length} Tercatat)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                <Clock className="w-3 h-3 text-slate-500" />
                Belum Tercatat (0/{bills.length})
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Kontrak Induk Banner */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 font-bold text-blue-950">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Data Kontrak Induk Terhubung</span>
              </div>
              {bills.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyContractDataToAllBills}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-white hover:bg-blue-100 border border-blue-300 rounded-md shadow-2xs transition-colors cursor-pointer"
                  title="Salin ulang data kontrak ke semua isian tagihan bulan ini"
                >
                  <Copy className="w-3 h-3" />
                  <span>Salin Data Kontrak ke Semua Tagihan</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-700 pt-1 border-t border-blue-100">
              <div>
                <span className="text-slate-500">Kontrak:</span>
                <div className="font-semibold text-slate-900 truncate" title={contract.namaKontrak}>{contract.namaKontrak}</div>
              </div>
              <div>
                <span className="text-slate-500">Nomor:</span>
                <div className="font-mono font-medium text-slate-900 truncate" title={contract.nomorKontrak || contract.nomerKontrak}>{contract.nomorKontrak || contract.nomerKontrak}</div>
              </div>
              <div>
                <span className="text-slate-500">Vendor:</span>
                <div className="font-medium text-slate-900 truncate">{contract.vendor || '-'}</div>
              </div>
              <div>
                <span className="text-slate-500">Pos Anggaran:</span>
                <div className="font-semibold text-blue-800">{contract.posAnggaran || contract.posType || 'Pos 53'}</div>
              </div>
              <div className="col-span-2 sm:col-span-4">
                <span className="text-slate-500">GL Account: </span>
                <span className="font-mono font-semibold text-blue-900">{contract.glAccountDefault || '-'}</span>
                {(contract.glAccountNameDefault || contract.glAccountDefaultName) && (
                  <span className="text-slate-600"> - {contract.glAccountNameDefault || contract.glAccountDefaultName}</span>
                )}
              </div>
            </div>
          </div>

          {bills.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 mb-3">Belum ada tagihan untuk bulan {MONTH_NAMES[monthIndex]}.</p>
              <button
                type="button"
                onClick={handleAddBill}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Tagihan Pertama (Salin Data Kontrak)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bills.map((bill, bIdx) => {
                const isTercatat = bill.statusBeban === 'Tercatat' || Boolean(bill.documentNumber && bill.documentNumber.trim() !== '');

                return (
                  <div 
                    key={bill.id || bIdx}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all space-y-3"
                  >
                    {/* Bill Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-xs">
                          Tagihan #{bIdx + 1}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({MONTH_NAMES[monthIndex]} {year})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isTercatat ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Tercatat di SAP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Belum Ada No Dokumen
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopyContractDataToBill(bIdx)}
                          className="px-2 py-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Salin data kontrak induk ke tagihan ini"
                        >
                          <Copy className="w-3 h-3" />
                          <span className="hidden sm:inline">Salin Kontrak</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBill(bIdx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Hapus tagihan ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Termin Name */}
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-700">
                            Nama / Uraian Termin Tagihan <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                const contractPrefix = contract.namaKontrak ? `${contract.namaKontrak} - ` : '';
                                handleBillChange(bIdx, 'terminTagihan', `${contractPrefix}Tagihan Tahunan (Sekali dalam 1 Tahun ${year})`);
                                handleBillChange(bIdx, 'notes', `Tagihan ditagihkan sekali dalam 1 tahun (${year})`);
                              }}
                              className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded hover:bg-emerald-100 font-semibold cursor-pointer"
                              title="Set uraian tagihan menjadi skema tahunan / sekali dalam 1 tahun"
                            >
                              + Skema Sekali 1 Thn
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const contractPrefix = contract.namaKontrak ? `${contract.namaKontrak} - ` : '';
                                handleBillChange(bIdx, 'terminTagihan', `${contractPrefix}Termin ${bIdx + 1} (${MONTH_NAMES[monthIndex]} ${year})`);
                                handleBillChange(bIdx, 'notes', `Tagihan bulan ${MONTH_NAMES[monthIndex]} ${year}`);
                              }}
                              className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded hover:bg-blue-100 font-semibold cursor-pointer"
                              title="Set uraian tagihan menjadi termin bulanan"
                            >
                              + Termin Bulanan
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          required
                          value={bill.terminTagihan || bill.termin || ''}
                          onChange={(e) => handleBillChange(bIdx, 'terminTagihan', e.target.value)}
                          placeholder="Contoh: Termin 1 (Upah/Gaji Pokok) / Tagihan Tahunan"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Nominal */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nominal Tagihan (Rp) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          value={bill.nominalTagihan ?? bill.amount ?? 0}
                          onChange={(e) => handleBillChange(bIdx, 'nominalTagihan', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                        />
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          = {formatRupiah(bill.nominalTagihan ?? bill.amount ?? 0)}
                        </div>
                      </div>

                      {/* Document Number */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          No Dokumen SAP / SPJ / MIRO
                        </label>
                        <input
                          type="text"
                          value={bill.documentNumber || ''}
                          onChange={(e) => handleBillChange(bIdx, 'documentNumber', e.target.value)}
                          placeholder="Contoh: 5000189021 (Kosongkan bila belum tercatat)"
                          className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {bill.documentNumber?.trim() ? '✓ Status otomatis Tercatat' : 'Open / Akrual'}
                        </div>
                      </div>

                      {/* GL Account */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          GL Account <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={bill.glAccount || ''}
                          onChange={(e) => handleBillChange(bIdx, 'glAccount', e.target.value)}
                          placeholder="6106201700"
                          className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* GL Name */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Uraian GL Account
                        </label>
                        <input
                          type="text"
                          value={bill.glAccountName || ''}
                          onChange={(e) => handleBillChange(bIdx, 'glAccountName', e.target.value)}
                          placeholder="Beban jasa borong..."
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Tanggal Tagihan & Notes */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Tanggal / Jatuh Tempo
                        </label>
                        <input
                          type="date"
                          value={bill.tanggalJatuhTempo || bill.tglTagihan || ''}
                          onChange={(e) => handleBillChange(bIdx, 'tanggalJatuhTempo', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Keterangan / Catatan
                        </label>
                        <input
                          type="text"
                          value={bill.notes || ''}
                          onChange={(e) => handleBillChange(bIdx, 'notes', e.target.value)}
                          placeholder="Catatan tagihan..."
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add New Bill in this month button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleAddBill}
                  className="px-3 py-2 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Tagihan ke-{bills.length + 1} di Bulan {MONTH_NAMES[monthIndex]}</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickMarkAllRecorded}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                  title="Otomatis mengisi nomor dokumen untuk semua tagihan yang kosong"
                >
                  Tandai Semua Tercatat
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 shrink-0">
            <div className="text-xs font-medium text-slate-600">
              Total Bulan: <strong className="font-mono text-slate-900">{formatRupiah(totalNominal)}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Tagihan Bulan Ini</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
