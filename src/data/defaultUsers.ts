import { AppUser } from '../types';

export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-admin-1',
    nama: 'Puji Tri Hartanto',
    nip: '198503152009121002',
    jabatan: 'Assistant Manager Keuangan dan Umum',
    password: 'admin',
    role: 'admin',
    createdAt: '2026-01-01'
  },
  {
    id: 'user-mgmt-1',
    nama: 'Ir. Bambang Trihartanto, M.M.',
    nip: '197604181999031001',
    jabatan: 'Manager Unit Pelaksana Transmisi',
    password: 'mgmt',
    role: 'management',
    createdAt: '2026-01-01'
  },
  {
    id: 'user-staff-1',
    nama: 'Dyah Paramita, S.T.',
    nip: '199507222019022005',
    jabatan: 'Staff Operasi & Pemeliharaan',
    password: 'user',
    role: 'user',
    createdAt: '2026-01-01'
  }
];
