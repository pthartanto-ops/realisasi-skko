import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Check, 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Info,
  Sliders
} from 'lucide-react';
import { AlihDayaContract, AlihDayaTermin } from '../../types';
import { formatRupiah, MONTH_NAMES } from '../../utils/formatters';

interface MultiTerminSchemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: AlihDayaContract;
  year: number;
  onApplyScheme: (contractId: string, generatedTermins: AlihDayaTermin[]) => void;
}

export const MultiTerminSchemeModal: React.FC<MultiTerminSchemeModalProps> = ({
  isOpen,
  onClose,
  contract,
  year,
  onApplyScheme
}) => {
  const [schemeType, setSchemeType] = useState<'2_per_month' | '1_per_month'>('2_per_month');
  
  // Tagihan 1 config
  const [tagihan1Name, setTagihan1Name] = useState('Termin 1 (Upah / Gaji Pokok)');
  const [tagihan1Amount, setTagihan1Amount] = useState<number>(60000000);
  const [tagihan1GL, setTagihan1GL] = useState(contract.glAccountDefault || '6106201700');
  const [tagihan1GLName, setTagihan1GLName] = useState(contract.glAccountNameDefault || 'Beban Jasa Tenaga Kerja Alih Daya');

  // Tagihan 2 config
  const [tagihan2Name, setTagihan2Name] = useState('Termin 2 (Management Fee, BPJS & Ops)');
  const [tagihan2Amount, setTagihan2Amount] = useState<number>(25500000);
  const [tagihan2GL, setTagihan2GL] = useState(contract.glAccountDefault || '6106201700');
  const [tagihan2GLName, setTagihan2GLName] = useState(contract.glAccountNameDefault || 'Beban Jasa Tenaga Kerja Alih Daya');

  // Single Tagihan config (if 1 per month selected)
  const [singleTagihanName, setSingleTagihanName] = useState('Termin Bulanan');
  const [singleTagihanAmount, setSingleTagihanAmount] = useState<number>(85500000);

  if (!isOpen) return null;

  const totalPerMonth = schemeType === '2_per_month' 
    ? (tagihan1Amount + tagihan2Amount) 
    : singleTagihanAmount;

  const totalPerYear = totalPerMonth * 12;
  const totalTerminCount = schemeType === '2_per_month' ? 24 : 12;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    const generated: AlihDayaTermin[] = [];

    MONTH_NAMES.forEach((mName, mIdx) => {
      const monthNum = String(mIdx + 1).padStart(2, '0');
      const lastDay = new Date(year, mIdx + 1, 0).getDate();

      if (schemeType === '2_per_month') {
        // Tagihan 1 (Jatuh tempo tgl 15)
        generated.push({
          id: `t_ad_gen_${Date.now()}_${mIdx}_1`,
          terminTagihan: `${tagihan1Name} - ${mName} ${year}`,
          bulanIndex: mIdx,
          glAccount: tagihan1GL.trim() || contract.glAccountDefault || '6106201700',
          glAccountName: tagihan1GLName.trim() || 'Beban Jasa Tenaga Kerja Alih Daya',
          posType: contract.posAnggaran || contract.posType || 'Pos 53',
          nominalTagihan: tagihan1Amount,
          amount: tagihan1Amount,
          documentNumber: '',
          statusBeban: 'Belum Tercatat',
          tanggalJatuhTempo: `${year}-${monthNum}-15`,
          notes: `Tagihan 1 (${mName} ${year})`
        });

        // Tagihan 2 (Jatuh tempo akhir bulan)
        generated.push({
          id: `t_ad_gen_${Date.now()}_${mIdx}_2`,
          terminTagihan: `${tagihan2Name} - ${mName} ${year}`,
          bulanIndex: mIdx,
          glAccount: tagihan2GL.trim() || contract.glAccountDefault || '6106201700',
          glAccountName: tagihan2GLName.trim() || 'Beban Jasa Tenaga Kerja Alih Daya',
          posType: contract.posAnggaran || contract.posType || 'Pos 53',
          nominalTagihan: tagihan2Amount,
          amount: tagihan2Amount,
          documentNumber: '',
          statusBeban: 'Belum Tercatat',
          tanggalJatuhTempo: `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`,
          notes: `Tagihan 2 (${mName} ${year})`
        });
      } else {
        // 1 Tagihan per bulan
        generated.push({
          id: `t_ad_gen_${Date.now()}_${mIdx}_1`,
          terminTagihan: `${singleTagihanName} ${mIdx + 1} (${mName} ${year})`,
          bulanIndex: mIdx,
          glAccount: tagihan1GL.trim() || contract.glAccountDefault || '6106201700',
          glAccountName: tagihan1GLName.trim() || 'Beban Jasa Tenaga Kerja Alih Daya',
          posType: contract.posAnggaran || contract.posType || 'Pos 53',
          nominalTagihan: singleTagihanAmount,
          amount: singleTagihanAmount,
          documentNumber: '',
          statusBeban: 'Belum Tercatat',
          tanggalJatuhTempo: `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`,
          notes: `Tagihan ${mName} ${year}`
        });
      }
    });

    onApplyScheme(contract.id, generated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Atur Skema Termin Tagihan Bulanan</h3>
              <p className="text-xs text-blue-200">{contract.namaKontrak} ({contract.nomerKontrak})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleGenerate} className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Scheme Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Pilih Skema Tagihan Bulanan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSchemeType('2_per_month')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  schemeType === '2_per_month'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">2 Tagihan / Bulan</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-200 text-blue-900">24 Termin</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tiap bulan muncul 2 tagihan (misal: Upah Pokok &amp; Management Fee/BPJS).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSchemeType('1_per_month')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  schemeType === '1_per_month'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">1 Tagihan / Bulan</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">12 Termin</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tiap bulan memiliki 1 tagihan tunggal akumulatif (Januari s.d. Desember).
                </p>
              </button>
            </div>
          </div>

          {/* Form details for 2 Tagihan / Bulan */}
          {schemeType === '2_per_month' ? (
            <div className="space-y-4">
              {/* Tagihan 1 Box */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px]">1</span>
                    Tagihan Pertama (Setiap Bulan)
                  </span>
                  <span className="text-[11px] text-blue-700 font-mono">Tgl 15 tiap bulan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Uraian Tagihan 1
                    </label>
                    <input
                      type="text"
                      required
                      value={tagihan1Name}
                      onChange={(e) => setTagihan1Name(e.target.value)}
                      placeholder="Termin 1 (Upah Pokok)"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nominal per Bulan (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      value={tagihan1Amount || ''}
                      onChange={(e) => setTagihan1Amount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      = {formatRupiah(tagihan1Amount)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tagihan 2 Box */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-[10px]">2</span>
                    Tagihan Kedua (Setiap Bulan)
                  </span>
                  <span className="text-[11px] text-indigo-700 font-mono">Akhir bulan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Uraian Tagihan 2
                    </label>
                    <input
                      type="text"
                      required
                      value={tagihan2Name}
                      onChange={(e) => setTagihan2Name(e.target.value)}
                      placeholder="Termin 2 (BPJS & Fee)"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nominal per Bulan (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      value={tagihan2Amount || ''}
                      onChange={(e) => setTagihan2Amount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      = {formatRupiah(tagihan2Amount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Uraian Termin Bulanan
                  </label>
                  <input
                    type="text"
                    required
                    value={singleTagihanName}
                    onChange={(e) => setSingleTagihanName(e.target.value)}
                    placeholder="Termin"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nominal Tagihan per Bulan (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={singleTagihanAmount || ''}
                    onChange={(e) => setSingleTagihanAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    = {formatRupiah(singleTagihanAmount)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Preview Summary */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Kalkulasi Skema Baru ({totalTerminCount} Termin di Tahun {year}):
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-400">Total per Bulan:</span>
                <div className="font-mono font-bold text-sm text-cyan-300">{formatRupiah(totalPerMonth)}</div>
              </div>
              <div>
                <span className="text-xs text-slate-400">Total Nilai Kontrak (1 Thn):</span>
                <div className="font-mono font-bold text-sm text-emerald-400">{formatRupiah(totalPerYear)}</div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
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
              <Sparkles className="w-4 h-4" />
              <span>Terapkan Skema ({totalTerminCount} Termin)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
