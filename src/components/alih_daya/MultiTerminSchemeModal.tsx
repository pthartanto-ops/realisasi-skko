import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Check, 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Info,
  Sliders,
  FileText,
  Clock
} from 'lucide-react';
import { AlihDayaContract, AlihDayaTermin, PosType } from '../../types';
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
  const existingTotal = (contract.termins || []).reduce((acc, t) => acc + (t.nominalTagihan ?? t.amount ?? 0), 0);
  const [schemeType, setSchemeType] = useState<'1_per_year' | '1_per_month' | '2_per_month'>('1_per_year');
  
  // === SKEMA 1: DITAGIHKAN SEKALI DALAM 1 TAHUN (TAHUNAN / LUMPSUM) ===
  const [annualMonthIndex, setAnnualMonthIndex] = useState<number>(11); // Default Bulan 12 (Desember)
  const [annualTagihanName, setAnnualTagihanName] = useState(
    `${contract.namaKontrak ? `${contract.namaKontrak} - ` : ''}Tagihan Tahunan (Sekali dalam 1 Tahun ${year})`
  );
  const [annualAmount, setAnnualAmount] = useState<number>(existingTotal > 0 ? existingTotal : 120000000);
  const [annualGL, setAnnualGL] = useState(contract.glAccountDefault || '6106201700');
  const [annualGLName, setAnnualGLName] = useState(contract.glAccountNameDefault || contract.glAccountDefaultName || 'Beban Jasa Tenaga Kerja Kontrak Rutin');
  const [annualPosType, setAnnualPosType] = useState<PosType>((contract.posAnggaran || contract.posType || 'Pos 53') as PosType);
  const [annualDocNumber, setAnnualDocNumber] = useState('');
  const [annualDueDate, setAnnualDueDate] = useState(`${year}-12-${new Date(year, 12, 0).getDate()}`);
  const [annualNotes, setAnnualNotes] = useState(`Tagihan sekaligus ditagihkan sekali dalam 1 tahun (${year})`);

  // Handle month change for annual scheme
  const handleAnnualMonthChange = (newMonthIdx: number) => {
    setAnnualMonthIndex(newMonthIdx);
    const monthNum = String(newMonthIdx + 1).padStart(2, '0');
    const lastDay = new Date(year, newMonthIdx + 1, 0).getDate();
    setAnnualDueDate(`${year}-${monthNum}-${lastDay}`);
    setAnnualTagihanName(
      `${contract.namaKontrak ? `${contract.namaKontrak} - ` : ''}Tagihan Tahunan (${MONTH_NAMES[newMonthIdx]} ${year})`
    );
  };

  // === SKEMA 2: 1 TAGIHAN PER BULAN (12 TERMIN) ===
  const [singleTagihanName, setSingleTagihanName] = useState('Termin Bulanan');
  const [singleTagihanAmount, setSingleTagihanAmount] = useState<number>(
    existingTotal > 0 ? Math.round(existingTotal / 12) : 85500000
  );

  // === SKEMA 3: 2 TAGIHAN PER BULAN (24 TERMIN) ===
  // Tagihan 1 config
  const [tagihan1Name, setTagihan1Name] = useState('Termin 1 (Upah / Gaji Pokok)');
  const [tagihan1Amount, setTagihan1Amount] = useState<number>(60000000);
  const [tagihan1GL, setTagihan1GL] = useState(contract.glAccountDefault || '6106201700');
  const [tagihan1GLName, setTagihan1GLName] = useState(contract.glAccountNameDefault || 'Beban Jasa Tenaga Kerja Kontrak Rutin');

  // Tagihan 2 config
  const [tagihan2Name, setTagihan2Name] = useState('Termin 2 (Management Fee, BPJS & Ops)');
  const [tagihan2Amount, setTagihan2Amount] = useState<number>(25500000);
  const [tagihan2GL, setTagihan2GL] = useState(contract.glAccountDefault || '6106201700');
  const [tagihan2GLName, setTagihan2GLName] = useState(contract.glAccountNameDefault || 'Beban Jasa Tenaga Kerja Kontrak Rutin');

  if (!isOpen) return null;

  const totalPerMonth = schemeType === '2_per_month' 
    ? (tagihan1Amount + tagihan2Amount) 
    : (schemeType === '1_per_month' ? singleTagihanAmount : 0);

  const totalPerYear = schemeType === '1_per_year'
    ? annualAmount
    : (totalPerMonth * 12);

  const totalTerminCount = schemeType === '2_per_month' 
    ? 24 
    : (schemeType === '1_per_month' ? 12 : 1);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    const generated: AlihDayaTermin[] = [];

    if (schemeType === '1_per_year') {
      // Skema: Ditagihkan sekali dalam 1 tahun (1 termin tunggal)
      const monthNum = String(annualMonthIndex + 1).padStart(2, '0');
      const lastDay = new Date(year, annualMonthIndex + 1, 0).getDate();
      const finalDueDate = annualDueDate || `${year}-${monthNum}-${lastDay}`;
      
      generated.push({
        id: `t_ad_gen_${Date.now()}_annual_1`,
        terminTagihan: annualTagihanName.trim() || `Tagihan Tahunan (${MONTH_NAMES[annualMonthIndex]} ${year})`,
        bulanIndex: annualMonthIndex,
        glAccount: annualGL.trim() || contract.glAccountDefault || '6106201700',
        glAccountName: annualGLName.trim() || 'Beban Jasa Tenaga Kerja Kontrak Rutin',
        posType: annualPosType,
        nominalTagihan: annualAmount,
        amount: annualAmount,
        documentNumber: annualDocNumber.trim(),
        statusBeban: annualDocNumber.trim() ? 'Tercatat' : 'Belum Tercatat',
        tanggalJatuhTempo: finalDueDate,
        notes: annualNotes.trim() || `Ditagihkan sekali dalam 1 tahun (${year})`
      });
    } else {
      // Skema Bulanan (1 atau 2 per bulan)
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
            glAccountName: tagihan1GLName.trim() || 'Beban Jasa Tenaga Kerja Kontrak Rutin',
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
            glAccountName: tagihan2GLName.trim() || 'Beban Jasa Tenaga Kerja Kontrak Rutin',
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
            glAccountName: tagihan1GLName.trim() || 'Beban Jasa Tenaga Kerja Kontrak Rutin',
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
    }

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
              Pilih Skema Tagihan Termin Kontrak:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSchemeType('1_per_year')}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  schemeType === '1_per_year'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Sekali dalam 1 Tahun</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    schemeType === '1_per_year' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-800'
                  }`}>
                    1 Termin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Ditagihkan sekaligus 1 kali dalam 1 tahun anggaran (Lumpsum / Tahunan).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSchemeType('1_per_month')}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  schemeType === '1_per_month'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">1 Tagihan / Bulan</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    schemeType === '1_per_month' ? 'bg-blue-200 text-blue-900' : 'bg-slate-200 text-slate-800'
                  }`}>
                    12 Termin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Tiap bulan memiliki 1 tagihan tunggal (Januari s.d. Desember).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSchemeType('2_per_month')}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  schemeType === '2_per_month'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">2 Tagihan / Bulan</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    schemeType === '2_per_month' ? 'bg-indigo-200 text-indigo-900' : 'bg-slate-200 text-slate-800'
                  }`}>
                    24 Termin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Tiap bulan muncul 2 tagihan (Upah Pokok &amp; Fee/BPJS).
                </p>
              </button>
            </div>
          </div>

          {/* Form details based on selected Scheme */}
          {schemeType === '1_per_year' ? (
            /* =================================================== */
            /* SKEMA: DITAGIHKAN SEKALI DALAM 1 TAHUN              */
            /* =================================================== */
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/70">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Rincian Tagihan Sekali dalam 1 Tahun (Lumpsum)
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  1 Tagihan Penuh di Tahun {year}
                </span>
              </div>

              {/* Bulan Penagihan & Tanggal Jatuh Tempo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Bulan Penagihan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={annualMonthIndex}
                    onChange={(e) => handleAnnualMonthChange(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {MONTH_NAMES.map((mName, idx) => (
                      <option key={mName} value={idx}>
                        Bulan {idx + 1} - {mName} {year}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Pilih bulan saat tagihan 1 tahun ditagihkan
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Tanggal Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={annualDueDate}
                    onChange={(e) => setAnnualDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Uraian Tagihan & Nominal Sekaligus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Uraian Tagihan Tahunan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={annualTagihanName}
                    onChange={(e) => setAnnualTagihanName(e.target.value)}
                    placeholder="Contoh: Tagihan Tahunan Kontrak ..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Nominal Tagihan Sekaligus (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={annualAmount || ''}
                    onChange={(e) => setAnnualAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-emerald-950"
                  />
                  <div className="text-[10px] text-emerald-700 mt-0.5 font-mono font-semibold">
                    = {formatRupiah(annualAmount)}
                  </div>
                </div>
              </div>

              {/* Pos Anggaran & No Dokumen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Pos Anggaran
                  </label>
                  <select
                    value={annualPosType}
                    onChange={(e) => setAnnualPosType(e.target.value as PosType)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Pos 53">Pos 53 (Beban Pemeliharaan &amp; Jasa)</option>
                    <option value="Pos 54">Pos 54 (Beban Administrasi &amp; Umum)</option>
                    <option value="Pos 52">Pos 52 (Beban Operasi / Kepegawaian)</option>
                    <option value="Beban Sewa">Beban Sewa</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nomor Dokumen / SPP / SPM (Opsional)
                  </label>
                  <input
                    type="text"
                    value={annualDocNumber}
                    onChange={(e) => setAnnualDocNumber(e.target.value)}
                    placeholder="Kosongkan jika belum terbit SPP"
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* GL Account & Nama Akun */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    GL Account
                  </label>
                  <input
                    type="text"
                    value={annualGL}
                    onChange={(e) => setAnnualGL(e.target.value)}
                    placeholder="6106201700"
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Uraian Nama Akun GL
                  </label>
                  <input
                    type="text"
                    value={annualGLName}
                    onChange={(e) => setAnnualGLName(e.target.value)}
                    placeholder="Beban Jasa Tenaga Kerja Kontrak Rutin"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Tagihan
                </label>
                <input
                  type="text"
                  value={annualNotes}
                  onChange={(e) => setAnnualNotes(e.target.value)}
                  placeholder="Keterangan tagihan tahunan..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>
          ) : schemeType === '2_per_month' ? (
            /* =================================================== */
            /* SKEMA: 2 TAGIHAN PER BULAN                          */
            /* =================================================== */
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
            /* =================================================== */
            /* SKEMA: 1 TAGIHAN PER BULAN                          */
            /* =================================================== */
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
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Kalkulasi Skema ({totalTerminCount} Termin di Tahun {year}):</span>
              {schemeType === '1_per_year' && (
                <span className="text-[10px] text-emerald-400 font-normal">
                  Ditagihkan pada Bulan {MONTH_NAMES[annualMonthIndex]} {year}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-400">
                  {schemeType === '1_per_year' ? 'Frekuensi Penagihan:' : 'Total per Bulan:'}
                </span>
                <div className="font-mono font-bold text-sm text-cyan-300">
                  {schemeType === '1_per_year' ? '1x Sekaligus / Thn' : formatRupiah(totalPerMonth)}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400">Total Nilai Tagihan (1 Thn):</span>
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
