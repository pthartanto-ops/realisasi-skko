import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Briefcase, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Lock, 
  Check, 
  X, 
  UserCheck, 
  Sparkles,
  LayoutDashboard,
  Target,
  FileText,
  Calculator,
  TableProperties
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppUser, UserRole, ROLE_PERMISSIONS, ActiveTab } from '../types';

export const UserManagementView: React.FC = () => {
  const { 
    users, 
    currentUser, 
    addUser, 
    updateUser, 
    deleteUser, 
    switchUser 
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Password visibility map for table rows
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    nama: string;
    nip: string;
    jabatan: string;
    password: string;
    role: UserRole;
  }>({
    nama: '',
    nip: '',
    jabatan: '',
    password: '',
    role: 'user'
  });
  const [modalPasswordVisible, setModalPasswordVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  // Success notification banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const toggleRowPassword = (id: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setFormData({
      nama: '',
      nip: '',
      jabatan: '',
      password: '',
      role: 'user'
    });
    setFormError(null);
    setModalPasswordVisible(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: AppUser) => {
    setEditingUserId(user.id);
    setFormData({
      nama: user.nama,
      nip: user.nip,
      jabatan: user.jabatan,
      password: user.password,
      role: user.role
    });
    setFormError(null);
    setModalPasswordVisible(false);
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.nama.trim()) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }
    if (!formData.nip.trim()) {
      setFormError('NIP wajib diisi.');
      return;
    }
    if (!formData.jabatan.trim()) {
      setFormError('Jabatan wajib diisi.');
      return;
    }
    if (!formData.password) {
      setFormError('Password wajib diisi.');
      return;
    }

    if (editingUserId) {
      const res = updateUser(editingUserId, formData);
      if (!res.success) {
        setFormError(res.message || 'Gagal memperbarui pengguna.');
        return;
      }
      showNotification('success', `Profil pengguna "${formData.nama}" berhasil diperbarui.`);
    } else {
      const res = addUser(formData);
      if (!res.success) {
        setFormError(res.message || 'Gagal menambahkan pengguna.');
        return;
      }
      showNotification('success', `Pengguna baru "${formData.nama}" dengan role ${ROLE_PERMISSIONS[formData.role].label} berhasil dibuat.`);
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    const res = deleteUser(userToDelete.id);
    if (!res.success) {
      showNotification('error', res.message || 'Gagal menghapus pengguna.');
    } else {
      showNotification('success', `Pengguna "${userToDelete.nama}" berhasil dihapus.`);
    }
    setUserToDelete(null);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchRole = roleFilter === 'all' || user.role === roleFilter;
      const q = searchQuery.toLowerCase();
      const matchQuery = 
        user.nama.toLowerCase().includes(q) ||
        user.nip.toLowerCase().includes(q) ||
        user.jabatan.toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [users, roleFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      management: users.filter(u => u.role === 'management').length,
      user: users.filter(u => u.role === 'user').length,
    };
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Manajemen Pengguna &amp; Hak Akses Role
              </h2>
              <p className="text-xs text-slate-500">
                Kelola profil pengguna (Nama, NIP, Jabatan, Password) dan tentukan hak akses menu sesuai peran
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-add-user"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Role Permission Matrix Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Admin Card */}
        <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                Role: Admin
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                Akses Semua ({counts.admin} Akun)
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Memiliki wewenang penuh atas seluruh fitur, penginputan anggaran &amp; realisasi, import data, serta manajemen akun user.
            </p>
          </div>
          <div className="pt-2.5 border-t border-rose-100">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Cakupan Akses:</span>
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">Semua Menu &amp; Pengaturan</span>
              <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-medium border border-rose-200">Manajemen User</span>
            </div>
          </div>
        </div>

        {/* Management Card */}
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-amber-600" />
                Role: Management
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Eksekutif ({counts.management} Akun)
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Dirancang untuk jajaran pimpinan dan manajemen untuk memantau ringkasan performa, efisiensi anggaran, dan laporan eksekutif.
            </p>
          </div>
          <div className="pt-2.5 border-t border-amber-100">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Cakupan Akses:</span>
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-medium border border-amber-200 flex items-center gap-1">
                <LayoutDashboard className="w-2.5 h-2.5" /> Dashboard Utama
              </span>
              <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-medium border border-amber-200 flex items-center gap-1">
                <Target className="w-2.5 h-2.5" /> Indikator &amp; Kinerja
              </span>
              <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-medium border border-amber-200 flex items-center gap-1">
                <FileText className="w-2.5 h-2.5" /> Laporan &amp; Ringkasan
              </span>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                Role: User
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Operasional ({counts.user} Akun)
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Ditujukan untuk staf operasional pemantauan anggaran, simulasi prognosa, dan matriks pemantauan akun bulanan.
            </p>
          </div>
          <div className="pt-2.5 border-t border-blue-100">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Cakupan Akses:</span>
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium border border-blue-200">
                Dashboard Utama
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium border border-blue-200">
                Indikator &amp; Kinerja
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium border border-blue-200">
                Laporan &amp; Ringkasan
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium border border-blue-200 flex items-center gap-1">
                <Calculator className="w-2.5 h-2.5" /> Prognosa
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium border border-blue-200 flex items-center gap-1">
                <TableProperties className="w-2.5 h-2.5" /> Matriks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Role Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              roleFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({counts.all})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              roleFilter === 'admin'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            Admin ({counts.admin})
          </button>
          <button
            onClick={() => setRoleFilter('management')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              roleFilter === 'management'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            Management ({counts.management})
          </button>
          <button
            onClick={() => setRoleFilter('user')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              roleFilter === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            User ({counts.user})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIP, jabatan..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">NIP</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">Role Akses</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Status Sesi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada pengguna yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser.id === u.id;
                  const isPasswordVisible = showPasswordMap[u.id] || false;

                  return (
                    <tr 
                      key={u.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrent ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Nama & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === 'admin' 
                              ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                              : u.role === 'management'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {u.nama
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.nama}</span>
                              {isCurrent && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 border border-blue-200">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">ID: {u.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* NIP */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {u.nip}
                      </td>

                      {/* Jabatan */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {u.jabatan}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          u.role === 'admin'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : u.role === 'management'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {u.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />}
                          {u.role === 'management' && <Briefcase className="w-3.5 h-3.5 text-amber-600" />}
                          {u.role === 'user' && <Users className="w-3.5 h-3.5 text-blue-600" />}
                          <span>{ROLE_PERMISSIONS[u.role]?.label || u.role}</span>
                        </span>
                      </td>

                      {/* Password */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-600">
                            {isPasswordVisible ? u.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleRowPassword(u.id)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
                            title={isPasswordVisible ? 'Sembunyikan password' : 'Lihat password'}
                          >
                            {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Sesi Status / Quick Switch */}
                      <td className="py-3.5 px-4">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Sedang Digunakan
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              switchUser(u.id);
                              showNotification('success', `Berhasil beralih ke akun "${u.nama}" (${ROLE_PERMISSIONS[u.role].label}).`);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                            title="Gunakan akun ini untuk melihat aplikasi dari perspektif role ini"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>Gunakan Akun Ini</span>
                          </button>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Pengguna"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setUserToDelete(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                            }`}
                            title={isCurrent ? 'Tidak bisa menghapus akun yang sedang aktif' : 'Hapus Pengguna'}
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

      {/* Modal: Tambah / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  {editingUserId ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingUserId ? 'Edit Profil Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi data Nama, NIP, Jabatan, Password, dan tetapkan Hak Akses Role
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Ir. Bambang Trihartanto, M.M."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* NIP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Induk Pegawai (NIP) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="Contoh: 197604181999031001"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Jabatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  placeholder="Contoh: Manager Unit Pelaksana Transmisi / Staff Operasi"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Akun <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={modalPasswordVisible ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Masukkan password akun"
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setModalPasswordVisible(!modalPasswordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {modalPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tentukan Role Pengguna <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  {/* Option: Admin */}
                  <label 
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.role === 'admin'
                        ? 'border-rose-500 bg-rose-50/60 ring-1 ring-rose-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="role"
                          value="admin"
                          checked={formData.role === 'admin'}
                          onChange={() => setFormData({ ...formData, role: 'admin' })}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <span className="font-bold text-xs text-rose-900">Admin</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-200/80 text-rose-800">
                          Akses Semua
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 pl-5">
                      Bisa akses semua modul (Dashboard, Input Anggaran, Realisasi, Import, Prognosa, Matriks, Alih Daya, Indikator, Laporan &amp; Manajemen User).
                    </p>
                  </label>

                  {/* Option: Management */}
                  <label 
                    onClick={() => setFormData({ ...formData, role: 'management' })}
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.role === 'management'
                        ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="role"
                          value="management"
                          checked={formData.role === 'management'}
                          onChange={() => setFormData({ ...formData, role: 'management' })}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-bold text-xs text-amber-900">Management</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-800">
                          3 Modul Eksekutif
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 pl-5">
                      Bisa akses: <strong>Dashboard Utama</strong>; <strong>Indikator &amp; Kinerja</strong>; <strong>Laporan &amp; Ringkasan</strong>.
                    </p>
                  </label>

                  {/* Option: User */}
                  <label 
                    onClick={() => setFormData({ ...formData, role: 'user' })}
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.role === 'user'
                        ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="role"
                          value="user"
                          checked={formData.role === 'user'}
                          onChange={() => setFormData({ ...formData, role: 'user' })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-bold text-xs text-blue-900">User</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-200/80 text-blue-800">
                          5 Modul Operasional
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 pl-5">
                      Bisa akses: <strong>Dashboard Utama</strong>; <strong>Indikator &amp; Kinerja</strong>; <strong>Laporan &amp; Ringkasan</strong>; <strong>Prognosa Anggaran</strong>; <strong>Matriks Monitoring</strong>.
                    </p>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  {editingUserId ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Hapus Pengguna?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus akun pengguna <strong>{userToDelete.nama}</strong> (NIP: {userToDelete.nip}, Role: {ROLE_PERMISSIONS[userToDelete.role].label})?
            </p>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
              >
                Ya, Hapus Pengguna
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
