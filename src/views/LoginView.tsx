import React, { useState } from 'react';
import { 
  Lock, 
  CreditCard, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginView: React.FC = () => {
  const { loginUser } = useApp();

  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedNip = nip.trim();
    if (!trimmedNip) {
      setErrorMessage('Silakan masukkan Nomor Induk Pegawai (NIP).');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan password akun Anda.');
      return;
    }

    setIsLoading(true);

    // Small artificial delay for smooth UI feedback
    setTimeout(() => {
      const result = loginUser(trimmedNip, password);
      if (!result.success) {
        setErrorMessage(result.message || 'NIP atau Password yang Anda masukkan tidak sesuai.');
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Brand Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
              PT PLN (Persero)
            </div>
            <div className="text-sm font-black text-white tracking-tight">
              Unit Pelaksana Transmisi Madiun
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Sistem Terotentikasi Internal</span>
        </div>
      </div>

      {/* Center Container: Login Card & Quick Demo Selector */}
      <div className="w-full max-w-5xl mx-auto py-8 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left column: Overview / Hero info */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Sistem Pengelolaan Anggaran &amp; Kinerja Keuangan</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Monitoring &amp; Evaluasi Anggaran Operasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">UPT Madiun</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
            Aplikasi terpadu untuk pengendalian anggaran, realisasi bulanan, prognosa akhir tahun, monitoring kontrak rutin, serta evaluasi indikator kinerja keuangan.
          </p>
        </div>

        {/* Right column: Login Form Card */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 text-slate-900 relative">
            
            {/* Form Header */}
            <div className="mb-6 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Masuk ke Akun
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Masukkan <strong>NIP</strong> dan <strong>Password</strong> akun dinas Anda untuk melanjutkan.
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div 
                id="login-error-alert" 
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4.5">
              {/* Field NIP */}
              <div>
                <label 
                  htmlFor="login-input-nip" 
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  NIP (Nomor Induk Pegawai) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    id="login-input-nip"
                    type="text"
                    required
                    value={nip}
                    onChange={(e) => {
                      setNip(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Contoh: 198503152009121002"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-slate-900 font-mono text-sm placeholder:text-slate-400 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Field Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label 
                    htmlFor="login-input-password" 
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Password <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-input-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Masukkan password akun"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-slate-900 text-sm placeholder:text-slate-400 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-login"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi NIP &amp; Password...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Sistem</span>
                  </>
                )}
              </button>
            </form>

          </div>
        </div>

      </div>

      {/* Bottom Footer note */}
      <div className="w-full max-w-5xl mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Hak Cipta &copy; 2026 <strong>PT PLN (Persero) UPT Madiun</strong>. Seluruh hak cipta dilindungi.
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Keamanan Data Dinas</span>
          <span>&bull;</span>
          <span>Versi Sistem 2.4</span>
        </div>
      </div>
    </div>
  );
};
