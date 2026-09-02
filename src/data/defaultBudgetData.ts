import { BudgetItem, IndicatorTarget, AdditionalTransaction, AlihDayaContract } from '../types';

export const DEFAULT_BUDGET_ITEMS: BudgetItem[] = [
  {
    "id": "item_1",
    "code": "CODE_1",
    "name": "Beban Usaha",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "",
    "isGroupHeader": true,
    "level": 0,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_2",
    "code": "CODE_2",
    "name": "Pos 52 Beban Kepegawaian",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Pos 52 Beban Kepegawaian",
    "isGroupHeader": true,
    "level": 0,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_3",
    "code": "CODE_3",
    "name": "Beban Kepegawaian dalam Bentuk Kompensasi",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dalam Bentuk Kompensasi",
    "isGroupHeader": true,
    "level": 1,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_4",
    "code": "6105100110",
    "name": "Pay For Person (P1)",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dalam Bentuk Kompensasi",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_5",
    "code": "6105100700",
    "name": "Pay For Position (P2)",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dalam Bentuk Kompensasi",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_6",
    "code": "6105100800",
    "name": "Insentif Kinerja Individu",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dalam Bentuk Kompensasi",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_7",
    "code": "CODE_7",
    "name": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": true,
    "level": 1,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_8",
    "code": "6105200100",
    "name": "Beban Tunjangan Cuti tahunan",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_9",
    "code": "6105200200",
    "name": "Beban Tunjangan Cuti Besar",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_10",
    "code": "6105200400",
    "name": "Beban Penghargaan Kesetiaan kerja (Winduan)",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_11",
    "code": "6105200500",
    "name": "Beban Pesangon Normal",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_12",
    "code": "6105200800",
    "name": "Beban Tunjangan Hari Raya",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_13",
    "code": "6105200900",
    "name": "Beban Iuran Pemberi Kerja",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_14",
    "code": "6105200901",
    "name": "Beban Iuran Pemberi Kerja BPJS JHT",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_15",
    "code": "6105200902",
    "name": "Beban Iuran Pemberi Kerja BPJS Kesehatan",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_16",
    "code": "6105200903",
    "name": "Beban IPK BPJS Jaminan Kecelakaan Kerja",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_17",
    "code": "6105200904",
    "name": "Beban IPK BPJS Jaminan Kematian",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_18",
    "code": "6105200905",
    "name": "Beban Iuran Pemberi Kerja BPJS Jaminan Pensiun",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_19",
    "code": "6105201100",
    "name": "Beban PPh 21 yang ditanggung perusahaan",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_20",
    "code": "6105201500",
    "name": "Beban Pensiun Dini",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_21",
    "code": "6105201700",
    "name": "Beban Pemeliharaan Kesehatan",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_22",
    "code": "6105201800",
    "name": "Beban Pakaian Dinas (Realisasi SWAB RTA)",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_23",
    "code": "6105201900",
    "name": "Bantuan Akomodasi Pegawai Mutasi",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_24",
    "code": "6105202000",
    "name": "Perjalanan Dinas Mutasi jabatan",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_25",
    "code": "6105202100",
    "name": "Bantuan kematian/pemakaman",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_26",
    "code": "6105202300",
    "name": "Beban Fasilitas Kendaraan",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_27",
    "code": "6105202400",
    "name": "Bantuan Fasilitas Sewa Rumah",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Manfaat Pegawai",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_28",
    "code": "CODE_28",
    "name": "Beban Kepegawaian dlm Bentuk Diklat",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Diklat",
    "isGroupHeader": true,
    "level": 1,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_29",
    "code": "6105300100",
    "name": "Beban Peserta Latihan (Inhouse Training)",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Diklat",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_30",
    "code": "6105301110",
    "name": "Pembinaan spiritual, budaya, OR (SBO)",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Diklat",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_31",
    "code": "CODE_31",
    "name": "BKK",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Diklat",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_32",
    "code": "CODE_32",
    "name": "TWMT",
    "pos": "Pos 52 Beban Kepegawaian",
    "posType": "Pos 52",
    "category": "Beban Kepegawaian dlm Bentuk Diklat",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_33",
    "code": "CODE_33",
    "name": "Pos 53 Beban Pemeliharaan",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Pos 53 Beban Pemeliharaan",
    "isGroupHeader": true,
    "level": 0,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_34",
    "code": "CODE_34",
    "name": "Pemakaian material",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Pemakaian material",
    "isGroupHeader": true,
    "level": 1,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_35",
    "code": "6106100100",
    "name": "Beban pemakaian mate - transformator",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Pemakaian material",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_36",
    "code": "6106100200",
    "name": "Beban pemakaian mate - Switchgear dan Jaringan",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Pemakaian material",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_37",
    "code": "6106100300",
    "name": "Beban pemakaian mate - Kabel",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Pemakaian material",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_38",
    "code": "6106100400",
    "name": "Beban pemakaian mate - Alat Ukur",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Pemakaian material",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_39",
    "code": "6106100500",
    "name": "Beban pemakaian mate - Menara dan Tiang",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Pemakaian material",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_40",
    "code": "6106100700",
    "name": "Beban pemakaian mate - Persediaan Umum",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Pemakaian material",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_41",
    "code": "6106100800",
    "name": "Beban pemakaian mate - Minyak dan pelumas",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Pemakaian material",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_42",
    "code": "CODE_42",
    "name": "Jasa borong",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Jasa borong",
    "isGroupHeader": true,
    "level": 1,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_43",
    "code": "6106200100",
    "name": "Beban jasa borong Tanah & Hak atas Tanah",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Jasa borong",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_44",
    "code": "6106200200",
    "name": "Beban jasa borong Bangunan dan Kelengkapan Halaman",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Jasa borong",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_45",
    "code": "6106200200",
    "name": "Beban jasa borong Bangunan dan Kelengkapan Halaman AP",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Jasa borong",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_46",
    "code": "6106200300",
    "name": "Beban jasa borong Bangunan Saluran Air & Perlengk",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Jasa borong",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_47",
    "code": "6106200700",
    "name": "Beban jasa borong Gardu Induk",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Jasa borong",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_48",
    "code": "6106200701",
    "name": "Beban jasa borong Gardu Induk AP",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Jasa borong",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_49",
    "code": "6106200800",
    "name": "Beban jasa borong Saluran Udara Tegangan Tinggi",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Jasa borong",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_50",
    "code": "6106200900",
    "name": "Beban jasa borong Kabel di bawah tanah",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Jasa borong",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_51",
    "code": "6106201600",
    "name": "Beban jasa borong perlengk Telekomunikasi",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Jasa borong",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_52",
    "code": "6106201700",
    "name": "Beban jasa borong perlengk Umum",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Jasa borong",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_53",
    "code": "6106201800",
    "name": "Beban jasa borong Kend Bermotor dan Alat Yg Mobil",
    "pos": "Pos 53 Beban Pemeliharaan",
    "posType": "Pos 53",
    "category": "Jasa borong",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_54",
    "code": "CODE_54",
    "name": "Pos 54 Biaya Administrasi dan Umum",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": true,
    "level": 0,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_55",
    "code": "6107200100",
    "name": "Honorarium",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_56",
    "code": "6107200200",
    "name": "Pemakaian Perkakas & Peralatan",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_57",
    "code": "6107200400",
    "name": "Perjalanan Dinas Non Diklat",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_58",
    "code": "6107200700",
    "name": "Teknologi Informasi",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_59",
    "code": "6107200701",
    "name": "Teknologi Informasi Anak Perusahaan",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_60",
    "code": "6107200800",
    "name": "Listrik, Gas dan Air",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_61",
    "code": "6107200900",
    "name": "Pos & Telekomunikasi",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_62",
    "code": "6107201000",
    "name": "Beban Bank",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_63",
    "code": "6107201100",
    "name": "Bahan Makanan & Konsumsi",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_64",
    "code": "6107201200",
    "name": "Sewa gedung / tanah",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_65",
    "code": "6107201300",
    "name": "Sewa Foto Copy dan Kelengkapannya",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_66",
    "code": "6107201400",
    "name": "Alat dan Keperluan Kantor",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_67",
    "code": "6107201500",
    "name": "Barang Cetakan dan Penerbitan",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_68",
    "code": "6107201600",
    "name": "Pajak dan Retribusi",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_69",
    "code": "6107201700",
    "name": "Iuran, Abodemen & Iklan",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_70",
    "code": "6107201900",
    "name": "Beban Keamanan",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_71",
    "code": "6107202000",
    "name": "Beban Amortisasi",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_72",
    "code": "6107202001",
    "name": "Beban Amortisasi IPPKH",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_73",
    "code": "6107202100",
    "name": "Beban Penyisihan Material",
    "pos": "Pos 54 Biaya Administrasi dan Umum",
    "posType": "Pos 54",
    "category": "Pos 54 Biaya Administrasi dan Umum",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_74",
    "code": "CODE_74",
    "name": "Beban Sewa",
    "pos": "Beban Sewa",
    "posType": "Beban Sewa",
    "category": "Beban Sewa",
    "isGroupHeader": true,
    "level": 0,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_sewa_non_ahg",
    "code": "6101310001",
    "name": "Beban Sewa Non AHG",
    "pos": "Beban Sewa",
    "posType": "Beban Sewa",
    "category": "Beban Sewa",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_sewa_anak_prshn",
    "code": "6101310002",
    "name": "Beban Sewa Pembangkit & Non Pembangkit Anak Prshn",
    "pos": "Beban Sewa",
    "posType": "Beban Sewa",
    "category": "Beban Sewa",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_78",
    "code": "CODE_78",
    "name": "Pos 72 Beban Pensiun",
    "pos": "Pos 72 Beban Pensiun",
    "posType": "Pos 72",
    "category": "Pos 72 Beban Pensiun",
    "isGroupHeader": true,
    "level": 0,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_79",
    "code": "6205000000",
    "name": "Beban Pensiun - Perawatan Kesehatan",
    "pos": "Pos 72 Beban Pensiun",
    "posType": "Pos 72",
    "category": "Pos 72 Beban Pensiun",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_80",
    "code": "6205000001",
    "name": "Beban Pensiun - Bingkisan Hari Raya Keagamaan",
    "pos": "Pos 72 Beban Pensiun",
    "posType": "Pos 72",
    "category": "Pos 72 Beban Pensiun",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  },
  {
    "id": "item_81",
    "code": "6210800000",
    "name": "Beban lain-lain - lainnya",
    "pos": "Pos 72 Beban Pensiun",
    "posType": "Pos 72",
    "category": "Pos 72 Beban Pensiun",
    "isGroupHeader": false,
    "level": 2,
    "budgetAnnual": 0,
    "budgetMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "realizationMonthly": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    "notes": ""
  }
];

export const DEFAULT_INDICATORS: IndicatorTarget[] = [
  {
    id: 'ind_pos53',
    code: 'POS53',
    name: 'Optimalisasi Biaya Pemeliharaan (Pos 53)',
    pos: 'Pos 53 Beban Pemeliharaan',
    posType: 'Pos 53',
    unit: '%',
    targetAnnual: 0,
    monthlyTarget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    monthlyRealization: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    monthlyPercentage: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    description: 'Rasio realisasi beban pemeliharaan terhadap target disburse SKKO'
  },
  {
    id: 'ind_pos54',
    code: 'POS54',
    name: 'Optimalisasi Biaya Administrasi & Umum (Pos 54)',
    pos: 'Pos 54 Biaya Administrasi dan Umum',
    posType: 'Pos 54',
    unit: '%',
    targetAnnual: 0,
    monthlyTarget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    monthlyRealization: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    monthlyPercentage: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    description: 'Rasio realisasi biaya administrasi dan umum terhadap target SKKO POS 54'
  },
  {
    id: 'ind_pos52',
    code: 'POS52',
    name: 'Realisasi Beban Kepegawaian (Pos 52)',
    pos: 'Pos 52 Beban Kepegawaian',
    posType: 'Pos 52',
    unit: '%',
    targetAnnual: 0,
    monthlyTarget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    monthlyRealization: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    monthlyPercentage: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    description: 'Realisasi penyerapan anggaran beban kepegawaian (P1, Manfaat, Diklat)'
  },
  {
    id: 'ind_sewa',
    code: 'BEBAN_SEWA',
    name: 'Realisasi Beban Sewa',
    pos: 'Beban Sewa',
    posType: 'Beban Sewa',
    unit: '%',
    targetAnnual: 0,
    monthlyTarget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    monthlyRealization: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    monthlyPercentage: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    description: 'Realisasi sewa kendaraan, laptop, driver, AC, lahan, serta pembangkit & non pembangkit anak perusahaan'
  }
];

export const DEFAULT_ADDITIONAL_TRANSACTIONS: AdditionalTransaction[] = [
  {
    id: 'add_1',
    posType: 'Pos 53',
    posName: 'Pos 53 Beban Pemeliharaan',
    glAccount: '6106201700',
    glAccountName: 'Beban jasa borong perlengk Umum',
    category: 'PEKERJAAN ALIH DAYA',
    name: 'Security Tahap I',
    month: 8,
    amount: 0,
    note: 'Kontrak outsourcing security periode s/d Agustus',
    isActive: true
  },
  {
    id: 'add_2',
    posType: 'Pos 53',
    posName: 'Pos 53 Beban Pemeliharaan',
    glAccount: '6106201700',
    glAccountName: 'Beban jasa borong perlengk Umum',
    category: 'PEKERJAAN ALIH DAYA',
    name: 'Security Tahap II',
    month: 8,
    amount: 0,
    note: 'Tagihan security termin 2',
    isActive: true
  },
  {
    id: 'add_3',
    posType: 'Pos 53',
    posName: 'Pos 53 Beban Pemeliharaan',
    glAccount: '6106200200',
    glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
    category: 'PEKERJAAN ALIH DAYA',
    name: 'Cleaning Service',
    month: 8,
    amount: 0,
    note: 'Pekerjaan kebersihan kantor dan gardu induk',
    isActive: true
  },
  {
    id: 'add_4',
    posType: 'Pos 53',
    posName: 'Pos 53 Beban Pemeliharaan',
    glAccount: '6106200700',
    glAccountName: 'Beban jasa borong Gardu Induk',
    category: 'PEKERJAAN ALIH DAYA',
    name: 'YanHar Tahap I',
    month: 8,
    amount: 0,
    note: 'Pelayanan Pemeliharaan Tahap 1',
    isActive: true
  },
  {
    id: 'add_5',
    posType: 'Pos 53',
    posName: 'Pos 53 Beban Pemeliharaan',
    glAccount: '6106200700',
    glAccountName: 'Beban jasa borong Gardu Induk',
    category: 'PEKERJAAN ALIH DAYA',
    name: 'YanHar Tahap II - Varcost',
    month: 8,
    amount: 0,
    note: 'Variable cost pelayanan pemeliharaan',
    isActive: true
  },
  {
    id: 'add_6',
    posType: 'Pos 53',
    posName: 'Pos 53 Beban Pemeliharaan',
    glAccount: '6106200800',
    glAccountName: 'Beban jasa borong Saluran Udara Tegangan Tinggi',
    category: 'PEKERJAAN ALIH DAYA',
    name: 'Ground Patrol',
    month: 8,
    amount: 0,
    note: 'Inspeksi & patroli jalur transmisi & distribusi',
    isActive: true
  },
  {
    id: 'add_7',
    posType: 'Pos 53',
    posName: 'Pos 53 Beban Pemeliharaan',
    glAccount: '6106200700',
    glAccountName: 'Beban jasa borong Gardu Induk',
    category: 'PEKERJAAN ALIH DAYA',
    name: 'OPGI Tahap I',
    month: 8,
    amount: 0,
    note: 'Operasi & Pemeliharaan Gardu Induk',
    isActive: true
  },
  {
    id: 'add_8',
    posType: 'Pos 53',
    posName: 'Pos 53 Beban Pemeliharaan',
    glAccount: '6106200700',
    glAccountName: 'Beban jasa borong Gardu Induk',
    category: 'PEKERJAAN ALIH DAYA',
    name: 'OPGI Tahap II',
    month: 8,
    amount: 0,
    note: 'Operasi & Pemeliharaan Gardu Induk Termin 2',
    isActive: true
  },
  {
    id: 'add_9',
    posType: 'Pos 54',
    posName: 'Pos 54 Biaya Administrasi dan Umum',
    glAccount: '6107200800',
    glAccountName: 'Listrik, Gas dan Air',
    category: 'RINCIAN PEKERJAAN AGUSTUS 2026',
    name: 'Listrik, Gas dan Air',
    month: 8,
    amount: 0,
    note: 'Biaya utilitas kantor operasional',
    isActive: true
  },
  {
    id: 'add_10',
    posType: 'Pos 54',
    posName: 'Pos 54 Biaya Administrasi dan Umum',
    glAccount: '6107201100',
    glAccountName: 'Bahan Makanan & Konsumsi',
    category: 'RINCIAN PEKERJAAN AGUSTUS 2026',
    name: 'Bahan Makanan & Konsumsi',
    month: 8,
    amount: 0,
    note: 'Konsumsi rapat koordinasi & operasional',
    isActive: true
  },
  {
    id: 'add_11',
    posType: 'Pos 54',
    posName: 'Pos 54 Biaya Administrasi dan Umum',
    glAccount: '6107201400',
    glAccountName: 'Alat dan Keperluan Kantor',
    category: 'RINCIAN PEKERJAAN AGUSTUS 2026',
    name: 'Alat dan Keperluan Kantor (ATK)',
    month: 8,
    amount: 0,
    note: 'Pengadaan ATK dan logistik cetak',
    isActive: true
  },
  {
    id: 'add_12',
    posType: 'Pos 54',
    posName: 'Pos 54 Biaya Administrasi dan Umum',
    glAccount: '6107202001',
    glAccountName: 'Beban Amortisasi IPPKH',
    category: 'RINCIAN PEKERJAAN AGUSTUS 2026',
    name: 'Beban Amortisasi & IPPKH',
    month: 8,
    amount: 0,
    note: 'Amortisasi dan izin pinjam pakai kawasan hutan',
    isActive: true
  },
  {
    id: 'add_13',
    posType: 'Beban Sewa',
    posName: 'Beban Sewa',
    glAccount: '6101310001',
    glAccountName: 'Beban Sewa Non AHG',
    category: 'SEWA NON AHG',
    name: 'Fixcost Driver',
    month: 8,
    amount: 0,
    note: 'Biaya tetap pengemudi operasional',
    isActive: true
  },
  {
    id: 'add_14',
    posType: 'Beban Sewa',
    posName: 'Beban Sewa',
    glAccount: '6101310001',
    glAccountName: 'Beban Sewa Non AHG',
    category: 'SEWA NON AHG',
    name: 'Varcost Driver',
    month: 8,
    amount: 0,
    note: 'Biaya variabel / lembur pengemudi',
    isActive: true
  },
  {
    id: 'add_15',
    posType: 'Beban Sewa',
    posName: 'Beban Sewa',
    glAccount: '6101310001',
    glAccountName: 'Beban Sewa Non AHG',
    category: 'SEWA NON AHG',
    name: 'Sewa Laptop',
    month: 8,
    amount: 0,
    note: 'Sewa perangkat IT & laptop pegawai',
    isActive: true
  }
];

export const DEFAULT_ALIH_DAYA_CONTRACTS: AlihDayaContract[] = [
  {
    id: 'kontrak_ad_1',
    namaKontrak: 'Jasa Pengamanan / Security Gardu Induk & Kantor UPT Madiun',
    nomerKontrak: '012.PJ/DAN.02.01/UPT-MDN/2026',
    vendor: 'PT Haleyora Power',
    posType: 'Pos 53',
    glAccountDefault: '6106201700',
    glAccountDefaultName: 'Beban jasa borong perlengk Umum',
    tahun: 2026,
    periodeAwal: '2026-01-01',
    periodeAkhir: '2026-12-31',
    keterangan: 'Kontrak outsourcing personil pengamanan (2 termin per bulan: Upah/Gaji & BPJS/Fee)',
    termins: [
      // JANUARI (2 Tagihan)
      {
        id: 't_ad_1_1_a',
        termin: 'Termin 1 (Upah/Gaji Pokok Satpam - Januari 2026)',
        bulanIndex: 0,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 60000000,
        documentNumber: '5000189021',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-01-15',
        notes: 'Tagihan upah & gaji satpam bulan Januari'
      },
      {
        id: 't_ad_1_1_b',
        termin: 'Termin 2 (Management Fee, BPJS & Ops - Januari 2026)',
        bulanIndex: 0,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 25500000,
        documentNumber: '5000189022',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-01-31',
        notes: 'Tagihan BPJS & Fee security bulan Januari'
      },
      // FEBRUARI (2 Tagihan)
      {
        id: 't_ad_1_2_a',
        termin: 'Termin 1 (Upah/Gaji Pokok Satpam - Februari 2026)',
        bulanIndex: 1,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 60000000,
        documentNumber: '5000192304',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-02-15',
        notes: 'Tagihan gaji satpam Februari'
      },
      {
        id: 't_ad_1_2_b',
        termin: 'Termin 2 (Management Fee, BPJS & Ops - Februari 2026)',
        bulanIndex: 1,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 25500000,
        documentNumber: '5000192305',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-02-28',
        notes: 'Tagihan fee & BPJS Februari'
      },
      // MARET (2 Tagihan)
      {
        id: 't_ad_1_3_a',
        termin: 'Termin 1 (Upah/Gaji Pokok Satpam - Maret 2026)',
        bulanIndex: 2,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 60000000,
        documentNumber: '5000198762',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-03-15',
        notes: 'Tagihan gaji satpam Maret'
      },
      {
        id: 't_ad_1_3_b',
        termin: 'Termin 2 (Management Fee, BPJS & Ops - Maret 2026)',
        bulanIndex: 2,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 25500000,
        documentNumber: '5000198763',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-03-31',
        notes: 'Tagihan fee & BPJS Maret'
      },
      // APRIL (2 Tagihan)
      {
        id: 't_ad_1_4_a',
        termin: 'Termin 1 (Upah/Gaji Pokok Satpam - April 2026)',
        bulanIndex: 3,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 60000000,
        documentNumber: '5000204118',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-04-15',
        notes: 'Tagihan gaji satpam April'
      },
      {
        id: 't_ad_1_4_b',
        termin: 'Termin 2 (Management Fee, BPJS & Ops - April 2026)',
        bulanIndex: 3,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 25500000,
        documentNumber: '5000204119',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-04-30',
        notes: 'Tagihan fee & BPJS April'
      },
      // MEI (2 Tagihan)
      {
        id: 't_ad_1_5_a',
        termin: 'Termin 1 (Upah/Gaji Pokok Satpam - Mei 2026)',
        bulanIndex: 4,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 60000000,
        documentNumber: '5000210984',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-05-15',
        notes: 'Tagihan gaji satpam Mei'
      },
      {
        id: 't_ad_1_5_b',
        termin: 'Termin 2 (Management Fee, BPJS & Ops - Mei 2026)',
        bulanIndex: 4,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 25500000,
        documentNumber: '5000210985',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-05-31',
        notes: 'Tagihan fee & BPJS Mei'
      },
      // JUNI (2 Tagihan)
      {
        id: 't_ad_1_6_a',
        termin: 'Termin 1 (Upah/Gaji Pokok Satpam - Juni 2026)',
        bulanIndex: 5,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 60000000,
        documentNumber: '5000219401',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-06-15',
        notes: 'Tagihan gaji satpam Juni'
      },
      {
        id: 't_ad_1_6_b',
        termin: 'Termin 2 (Management Fee, BPJS & Ops - Juni 2026)',
        bulanIndex: 5,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 25500000,
        documentNumber: '5000219402',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-06-30',
        notes: 'Tagihan fee & BPJS Juni'
      },
      // JULI (2 Tagihan)
      {
        id: 't_ad_1_7_a',
        termin: 'Termin 1 (Upah/Gaji Pokok Satpam - Juli 2026)',
        bulanIndex: 6,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 60000000,
        documentNumber: '5000227103',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-07-15',
        notes: 'Tagihan gaji satpam Juli'
      },
      {
        id: 't_ad_1_7_b',
        termin: 'Termin 2 (Management Fee, BPJS & Ops - Juli 2026)',
        bulanIndex: 6,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 25500000,
        documentNumber: '5000227104',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-07-31',
        notes: 'Tagihan fee & BPJS Juli'
      },
      // AGUSTUS (2 Tagihan - Belum Tercatat)
      {
        id: 't_ad_1_8_a',
        termin: 'Termin 1 (Upah/Gaji Pokok Satpam - Agustus 2026)',
        bulanIndex: 7,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 60000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-08-15',
        notes: 'Proses verifikasi absensi & SPJ Agustus'
      },
      {
        id: 't_ad_1_8_b',
        termin: 'Termin 2 (Management Fee, BPJS & Ops - Agustus 2026)',
        bulanIndex: 7,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 25500000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-08-31',
        notes: 'Proses verifikasi BPJS ketenagakerjaan'
      },
      // SEPTEMBER (2 Tagihan)
      {
        id: 't_ad_1_9_a',
        termin: 'Termin 1 (Upah/Gaji Pokok Satpam - September 2026)',
        bulanIndex: 8,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 60000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-09-15',
        notes: 'Rencana tagihan September'
      },
      {
        id: 't_ad_1_9_b',
        termin: 'Termin 2 (Management Fee, BPJS & Ops - September 2026)',
        bulanIndex: 8,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 25500000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-09-30',
        notes: 'Rencana tagihan September'
      },
      // OKTOBER (2 Tagihan)
      {
        id: 't_ad_1_10_a',
        termin: 'Termin 1 (Upah/Gaji Pokok Satpam - Oktober 2026)',
        bulanIndex: 9,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 60000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-10-15',
        notes: 'Rencana tagihan Oktober'
      },
      {
        id: 't_ad_1_10_b',
        termin: 'Termin 2 (Management Fee, BPJS & Ops - Oktober 2026)',
        bulanIndex: 9,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 25500000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-10-31',
        notes: 'Rencana tagihan Oktober'
      },
      // NOVEMBER (2 Tagihan)
      {
        id: 't_ad_1_11_a',
        termin: 'Termin 1 (Upah/Gaji Pokok Satpam - November 2026)',
        bulanIndex: 10,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 60000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-11-15',
        notes: 'Rencana tagihan November'
      },
      {
        id: 't_ad_1_11_b',
        termin: 'Termin 2 (Management Fee, BPJS & Ops - November 2026)',
        bulanIndex: 10,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 25500000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-11-30',
        notes: 'Rencana tagihan November'
      },
      // DESEMBER (2 Tagihan)
      {
        id: 't_ad_1_12_a',
        termin: 'Termin 1 (Upah/Gaji Pokok Satpam - Desember 2026)',
        bulanIndex: 11,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 60000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-12-15',
        notes: 'Rencana tagihan Desember'
      },
      {
        id: 't_ad_1_12_b',
        termin: 'Termin 2 (Management Fee, BPJS & Ops - Desember 2026)',
        bulanIndex: 11,
        glAccount: '6106201700',
        glAccountName: 'Beban jasa borong perlengk Umum',
        posType: 'Pos 53',
        amount: 25500000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-12-31',
        notes: 'Rencana tagihan Desember'
      }
    ]
  },
  {
    id: 'kontrak_ad_2',
    namaKontrak: 'Jasa Kebersihan (Cleaning Service) Kantor & Gardu Induk',
    nomerKontrak: '018.PJ/DAN.02.01/UPT-MDN/2026',
    vendor: 'PT Kiat Daya Mandiri',
    posType: 'Pos 53',
    glAccountDefault: '6106200200',
    glAccountDefaultName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
    tahun: 2026,
    periodeAwal: '2026-01-01',
    periodeAkhir: '2026-12-31',
    keterangan: 'Pekerjaan pengelolaan kebersihan gedung (2 termin per bulan: Upah CS & Bahan/Fee)',
    termins: [
      // JANUARI (2 Tagihan)
      {
        id: 't_ad_2_1_a',
        termin: 'Termin 1 (Upah Tenaga CS - Januari 2026)',
        bulanIndex: 0,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 30000000,
        documentNumber: '5000189035',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-01-15',
        notes: 'Tagihan upah CS Januari'
      },
      {
        id: 't_ad_2_1_b',
        termin: 'Termin 2 (Bahan & Peralatan CS - Januari 2026)',
        bulanIndex: 0,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 12000000,
        documentNumber: '5000189036',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-01-31',
        notes: 'Tagihan material & fee CS Januari'
      },
      // FEBRUARI (2 Tagihan)
      {
        id: 't_ad_2_2_a',
        termin: 'Termin 1 (Upah Tenaga CS - Februari 2026)',
        bulanIndex: 1,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 30000000,
        documentNumber: '5000192319',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-02-15',
        notes: 'Tagihan upah CS Februari'
      },
      {
        id: 't_ad_2_2_b',
        termin: 'Termin 2 (Bahan & Peralatan CS - Februari 2026)',
        bulanIndex: 1,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 12000000,
        documentNumber: '5000192320',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-02-28',
        notes: 'Tagihan material CS Februari'
      },
      // MARET (2 Tagihan)
      {
        id: 't_ad_2_3_a',
        termin: 'Termin 1 (Upah Tenaga CS - Maret 2026)',
        bulanIndex: 2,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 30000000,
        documentNumber: '5000198780',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-03-15',
        notes: 'Tagihan upah CS Maret'
      },
      {
        id: 't_ad_2_3_b',
        termin: 'Termin 2 (Bahan & Peralatan CS - Maret 2026)',
        bulanIndex: 2,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 12000000,
        documentNumber: '5000198781',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-03-31',
        notes: 'Tagihan material CS Maret'
      },
      // APRIL (2 Tagihan)
      {
        id: 't_ad_2_4_a',
        termin: 'Termin 1 (Upah Tenaga CS - April 2026)',
        bulanIndex: 3,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 30000000,
        documentNumber: '5000204130',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-04-15',
        notes: 'Tagihan upah CS April'
      },
      {
        id: 't_ad_2_4_b',
        termin: 'Termin 2 (Bahan & Peralatan CS - April 2026)',
        bulanIndex: 3,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 12000000,
        documentNumber: '5000204131',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-04-30',
        notes: 'Tagihan material CS April'
      },
      // MEI (2 Tagihan)
      {
        id: 't_ad_2_5_a',
        termin: 'Termin 1 (Upah Tenaga CS - Mei 2026)',
        bulanIndex: 4,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 30000000,
        documentNumber: '5000210996',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-05-15',
        notes: 'Tagihan upah CS Mei'
      },
      {
        id: 't_ad_2_5_b',
        termin: 'Termin 2 (Bahan & Peralatan CS - Mei 2026)',
        bulanIndex: 4,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 12000000,
        documentNumber: '5000210997',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-05-31',
        notes: 'Tagihan material CS Mei'
      },
      // JUNI (2 Tagihan)
      {
        id: 't_ad_2_6_a',
        termin: 'Termin 1 (Upah Tenaga CS - Juni 2026)',
        bulanIndex: 5,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 30000000,
        documentNumber: '5000219415',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-06-15',
        notes: 'Tagihan upah CS Juni'
      },
      {
        id: 't_ad_2_6_b',
        termin: 'Termin 2 (Bahan & Peralatan CS - Juni 2026)',
        bulanIndex: 5,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 12000000,
        documentNumber: '5000219416',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-06-30',
        notes: 'Tagihan material CS Juni'
      },
      // JULI (2 Tagihan)
      {
        id: 't_ad_2_7_a',
        termin: 'Termin 1 (Upah Tenaga CS - Juli 2026)',
        bulanIndex: 6,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 30000000,
        documentNumber: '5000227118',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-07-15',
        notes: 'Tagihan upah CS Juli'
      },
      {
        id: 't_ad_2_7_b',
        termin: 'Termin 2 (Bahan & Peralatan CS - Juli 2026)',
        bulanIndex: 6,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 12000000,
        documentNumber: '5000227119',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-07-31',
        notes: 'Tagihan material CS Juli'
      },
      // AGUSTUS (2 Tagihan)
      {
        id: 't_ad_2_8_a',
        termin: 'Termin 1 (Upah Tenaga CS - Agustus 2026)',
        bulanIndex: 7,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 30000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-08-15',
        notes: 'Tagihan CS Agustus menunggu verifikasi kelengkapan'
      },
      {
        id: 't_ad_2_8_b',
        termin: 'Termin 2 (Bahan & Peralatan CS - Agustus 2026)',
        bulanIndex: 7,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 12000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-08-31',
        notes: 'Tagihan bahan CS Agustus'
      },
      // SEPTEMBER (2 Tagihan)
      {
        id: 't_ad_2_9_a',
        termin: 'Termin 1 (Upah Tenaga CS - September 2026)',
        bulanIndex: 8,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 30000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-09-15',
        notes: 'Rencana tagihan September'
      },
      {
        id: 't_ad_2_9_b',
        termin: 'Termin 2 (Bahan & Peralatan CS - September 2026)',
        bulanIndex: 8,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 12000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-09-30',
        notes: 'Rencana tagihan September'
      },
      // OKTOBER (2 Tagihan)
      {
        id: 't_ad_2_10_a',
        termin: 'Termin 1 (Upah Tenaga CS - Oktober 2026)',
        bulanIndex: 9,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 30000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-10-15',
        notes: 'Rencana tagihan Oktober'
      },
      {
        id: 't_ad_2_10_b',
        termin: 'Termin 2 (Bahan & Peralatan CS - Oktober 2026)',
        bulanIndex: 9,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 12000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-10-31',
        notes: 'Rencana tagihan Oktober'
      },
      // NOVEMBER (2 Tagihan)
      {
        id: 't_ad_2_11_a',
        termin: 'Termin 1 (Upah Tenaga CS - November 2026)',
        bulanIndex: 10,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 30000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-11-15',
        notes: 'Rencana tagihan November'
      },
      {
        id: 't_ad_2_11_b',
        termin: 'Termin 2 (Bahan & Peralatan CS - November 2026)',
        bulanIndex: 10,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 12000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-11-30',
        notes: 'Rencana tagihan November'
      },
      // DESEMBER (2 Tagihan)
      {
        id: 't_ad_2_12_a',
        termin: 'Termin 1 (Upah Tenaga CS - Desember 2026)',
        bulanIndex: 11,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 30000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-12-15',
        notes: 'Rencana tagihan Desember'
      },
      {
        id: 't_ad_2_12_b',
        termin: 'Termin 2 (Bahan & Peralatan CS - Desember 2026)',
        bulanIndex: 11,
        glAccount: '6106200200',
        glAccountName: 'Beban jasa borong Bangunan dan Kelengkapan Halaman',
        posType: 'Pos 53',
        amount: 12000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-12-31',
        notes: 'Rencana tagihan Desember'
      }
    ]
  },
  {
    id: 'kontrak_ad_3',
    namaKontrak: 'Pelayanan Pemeliharaan Gardu Induk (YanHar GI) Tahap I & II',
    nomerKontrak: '025.PJ/DAN.01.02/UPT-MDN/2026',
    vendor: 'PT Haleyora Powerindo',
    posType: 'Pos 53',
    glAccountDefault: '6106200700',
    glAccountDefaultName: 'Beban jasa borong Gardu Induk',
    tahun: 2026,
    periodeAwal: '2026-01-01',
    periodeAkhir: '2026-12-31',
    keterangan: 'Jasa pelayanan pemeliharaan preventif dan korektif peralatan Gardu Induk',
    termins: [
      {
        id: 't_ad_3_1',
        termin: 'Termin 1 - Fixcost Q1',
        bulanIndex: 2,
        glAccount: '6106200700',
        glAccountName: 'Beban jasa borong Gardu Induk',
        posType: 'Pos 53',
        amount: 120000000,
        documentNumber: '5000198810',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-03-31',
        notes: 'Fixcost YanHar Triwulan I'
      },
      {
        id: 't_ad_3_2',
        termin: 'Termin 2 - Fixcost Q2',
        bulanIndex: 5,
        glAccount: '6106200700',
        glAccountName: 'Beban jasa borong Gardu Induk',
        posType: 'Pos 53',
        amount: 120000000,
        documentNumber: '5000219430',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-06-30',
        notes: 'Fixcost YanHar Triwulan II'
      },
      {
        id: 't_ad_3_3',
        termin: 'Termin 3 - Varcost Semester 1',
        bulanIndex: 6,
        glAccount: '6106200700',
        glAccountName: 'Beban jasa borong Gardu Induk',
        posType: 'Pos 53',
        amount: 65000000,
        documentNumber: '5000227140',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-07-25',
        notes: 'Variable cost kegiatan pemeliharaan darurat Smt 1'
      },
      {
        id: 't_ad_3_4',
        termin: 'Termin 4 - Fixcost Q3 (Agustus)',
        bulanIndex: 7,
        glAccount: '6106200700',
        glAccountName: 'Beban jasa borong Gardu Induk',
        posType: 'Pos 53',
        amount: 120000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-08-31',
        notes: 'Fixcost YanHar Triwulan III dalam proses penagihan'
      },
      {
        id: 't_ad_3_5',
        termin: 'Termin 5 - Varcost Q3',
        bulanIndex: 8,
        glAccount: '6106200700',
        glAccountName: 'Beban jasa borong Gardu Induk',
        posType: 'Pos 53',
        amount: 35000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-09-30',
        notes: 'Estimasi tagihan variable cost Q3'
      },
      {
        id: 't_ad_3_6',
        termin: 'Termin 6 - Fixcost Q4',
        bulanIndex: 11,
        glAccount: '6106200700',
        glAccountName: 'Beban jasa borong Gardu Induk',
        posType: 'Pos 53',
        amount: 120000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-12-15',
        notes: 'Rencana Fixcost Triwulan IV'
      }
    ]
  },
  {
    id: 'kontrak_ad_4',
    namaKontrak: 'Jasa Ground Patrol & ROW Jalur Transmisi SUTT/SUTET',
    nomerKontrak: '031.PJ/DAN.01.03/UPT-MDN/2026',
    vendor: 'PT Mandiri Daya Transmisi',
    posType: 'Pos 53',
    glAccountDefault: '6106200800',
    glAccountDefaultName: 'Beban jasa borong Saluran Udara Tegangan Tinggi',
    tahun: 2026,
    periodeAwal: '2026-01-01',
    periodeAkhir: '2026-12-31',
    keterangan: 'Inspeksi berkala jalur ROW, pemotongan pohon mendekati konduktor, dan patroli tapak tower',
    termins: [
      {
        id: 't_ad_4_1',
        termin: 'Termin 1 (Semester I)',
        bulanIndex: 5,
        glAccount: '6106200800',
        glAccountName: 'Beban jasa borong Saluran Udara Tegangan Tinggi',
        posType: 'Pos 53',
        amount: 175000000,
        documentNumber: '5000219450',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-06-30',
        notes: 'Realisasi pekerjaan patroli & perabasan Semester 1'
      },
      {
        id: 't_ad_4_2',
        termin: 'Termin 2 (Triwulan III - Agustus)',
        bulanIndex: 7,
        glAccount: '6106200800',
        glAccountName: 'Beban jasa borong Saluran Udara Tegangan Tinggi',
        posType: 'Pos 53',
        amount: 90000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-08-31',
        notes: 'Pekerjaan perabasan intensif jalur kritis musim kemarau'
      },
      {
        id: 't_ad_4_3',
        termin: 'Termin 3 (Triwulan IV - November)',
        bulanIndex: 10,
        glAccount: '6106200800',
        glAccountName: 'Beban jasa borong Saluran Udara Tegangan Tinggi',
        posType: 'Pos 53',
        amount: 85000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-11-30',
        notes: 'Rencana termin akhir'
      }
    ]
  },
  {
    id: 'kontrak_ad_5',
    namaKontrak: 'Jasa Pengemudi / Driver Operasional & Pelayanan Kantor',
    nomerKontrak: '007.PJ/DAN.03.01/UPT-MDN/2026',
    vendor: 'PT Pelayanan Trans Madiun',
    posType: 'Beban Sewa',
    glAccountDefault: '6101310001',
    glAccountDefaultName: 'Beban Sewa Non AHG',
    tahun: 2026,
    periodeAwal: '2026-01-01',
    periodeAkhir: '2026-12-31',
    keterangan: 'Penyediaan tenaga pengemudi operasional dinas dan piket gangguan UPT Madiun',
    termins: [
      {
        id: 't_ad_5_1',
        termin: 'Termin 1 (Januari 2026)',
        bulanIndex: 0,
        glAccount: '6101310001',
        glAccountName: 'Beban Sewa Non AHG',
        posType: 'Beban Sewa',
        amount: 32000000,
        documentNumber: '5000189060',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-01-31',
        notes: 'Tagihan driver Januari'
      },
      {
        id: 't_ad_5_2',
        termin: 'Termin 2 (Februari 2026)',
        bulanIndex: 1,
        glAccount: '6101310001',
        glAccountName: 'Beban Sewa Non AHG',
        posType: 'Beban Sewa',
        amount: 32000000,
        documentNumber: '5000192340',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-02-28',
        notes: 'Tagihan driver Februari'
      },
      {
        id: 't_ad_5_3',
        termin: 'Termin 3 (Maret 2026)',
        bulanIndex: 2,
        glAccount: '6101310001',
        glAccountName: 'Beban Sewa Non AHG',
        posType: 'Beban Sewa',
        amount: 32000000,
        documentNumber: '5000198830',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-03-31',
        notes: 'Tagihan driver Maret'
      },
      {
        id: 't_ad_5_4',
        termin: 'Termin 4 (April 2026)',
        bulanIndex: 3,
        glAccount: '6101310001',
        glAccountName: 'Beban Sewa Non AHG',
        posType: 'Beban Sewa',
        amount: 32000000,
        documentNumber: '5000204150',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-04-30',
        notes: 'Tagihan driver April'
      },
      {
        id: 't_ad_5_5',
        termin: 'Termin 5 (Mei 2026)',
        bulanIndex: 4,
        glAccount: '6101310001',
        glAccountName: 'Beban Sewa Non AHG',
        posType: 'Beban Sewa',
        amount: 32000000,
        documentNumber: '5000211010',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-05-31',
        notes: 'Tagihan driver Mei'
      },
      {
        id: 't_ad_5_6',
        termin: 'Termin 6 (Juni 2026)',
        bulanIndex: 5,
        glAccount: '6101310001',
        glAccountName: 'Beban Sewa Non AHG',
        posType: 'Beban Sewa',
        amount: 32000000,
        documentNumber: '5000219470',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-06-30',
        notes: 'Tagihan driver Juni'
      },
      {
        id: 't_ad_5_7',
        termin: 'Termin 7 (Juli 2026)',
        bulanIndex: 6,
        glAccount: '6101310001',
        glAccountName: 'Beban Sewa Non AHG',
        posType: 'Beban Sewa',
        amount: 32000000,
        documentNumber: '5000227160',
        statusBeban: 'Tercatat',
        tglTagihan: '2026-07-31',
        notes: 'Tagihan driver Juli'
      },
      {
        id: 't_ad_5_8',
        termin: 'Termin 8 (Agustus 2026)',
        bulanIndex: 7,
        glAccount: '6101310001',
        glAccountName: 'Beban Sewa Non AHG',
        posType: 'Beban Sewa',
        amount: 32000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-08-31',
        notes: 'Tagihan Agustus dalam verifikasi timesheet pengemudi'
      },
      {
        id: 't_ad_5_9',
        termin: 'Termin 9 (September 2026)',
        bulanIndex: 8,
        glAccount: '6101310001',
        glAccountName: 'Beban Sewa Non AHG',
        posType: 'Beban Sewa',
        amount: 32000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-09-30',
        notes: 'Rencana tagihan September'
      },
      {
        id: 't_ad_5_10',
        termin: 'Termin 10 (Oktober 2026)',
        bulanIndex: 9,
        glAccount: '6101310001',
        glAccountName: 'Beban Sewa Non AHG',
        posType: 'Beban Sewa',
        amount: 32000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-10-31',
        notes: 'Rencana tagihan Oktober'
      },
      {
        id: 't_ad_5_11',
        termin: 'Termin 11 (November 2026)',
        bulanIndex: 10,
        glAccount: '6101310001',
        glAccountName: 'Beban Sewa Non AHG',
        posType: 'Beban Sewa',
        amount: 32000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-11-30',
        notes: 'Rencana tagihan November'
      },
      {
        id: 't_ad_5_12',
        termin: 'Termin 12 (Desember 2026)',
        bulanIndex: 11,
        glAccount: '6101310001',
        glAccountName: 'Beban Sewa Non AHG',
        posType: 'Beban Sewa',
        amount: 32000000,
        documentNumber: '',
        statusBeban: 'Belum Tercatat',
        tglTagihan: '2026-12-31',
        notes: 'Rencana tagihan Desember'
      }
    ]
  }
];

