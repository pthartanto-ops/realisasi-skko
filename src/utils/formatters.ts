export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

export function formatRupiah(value: number | undefined | null, showPrefix: boolean = true): string {
  if (value === undefined || value === null || isNaN(value)) {
    return showPrefix ? 'Rp 0' : '0';
  }
  
  const isNegative = value < 0;
  const absValue = Math.abs(Math.round(value));
  
  const formatted = absValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  if (isNegative) {
    return showPrefix ? `-Rp ${formatted}` : `-${formatted}`;
  }
  return showPrefix ? `Rp ${formatted}` : formatted;
}

export function formatRupiahShort(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'Rp 0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (abs >= 1_000_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000_000).toFixed(2).replace('.', ',')} T`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(2).replace('.', ',')} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(0).replace('.', ',')} Rb`;
  }
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
}

export function formatPercent(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) return '0,00%';
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

export function parseNumberString(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  
  let s = String(val).trim();
  if (s === '-' || s === '' || s === ' -   ') return 0;
  
  let isNegative = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    isNegative = true;
    s = s.slice(1, -1);
  } else if (s.startsWith('-') || s.startsWith('- ')) {
    isNegative = true;
    s = s.replace(/^-\s*/, '');
  }

  // Remove currency, spaces, quotes, percent
  s = s.replace(/Rp|\$|EUR|["'%\s]/gi, '');

  // Handle Indonesian thousand separator (dots) and decimal commas or vice versa
  if (s.includes('.') && s.includes(',')) {
    // Standard ID: 1.234.567,89 -> remove dots, replace comma with dot
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // Standard US: 1,234,567.89 -> remove commas
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    // If comma only: "1,234" vs "1234,56"
    const parts = s.split(',');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      s = s.replace(/,/g, '');
    } else {
      s = s.replace(',', '.');
    }
  } else if (s.includes('.')) {
    // If multiple dots, they are thousand separators
    const parts = s.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      s = s.replace(/\./g, '');
    }
  }

  const num = parseFloat(s);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

export type PerformanceStatusType = 'optimal' | 'overbudget' | 'kurang_optimal' | 'bermasalah';

export interface PerformanceStatusInfo {
  status: PerformanceStatusType;
  label: string;
  badgeClass: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  colorHex: string;
  thresholdDesc: string;
  description: string;
}

export interface IndicatorRuleDefinition {
  status: PerformanceStatusType;
  label: string;
  range: string;
  min: number;
  max: number;
  badgeClass: string;
  textClass: string;
  borderClass: string;
  colorHex: string;
  description: string;
}

export const PERFORMANCE_INDICATOR_RULES: IndicatorRuleDefinition[] = [
  {
    status: 'optimal',
    label: 'Optimal',
    range: '95% - 100%',
    min: 95,
    max: 100,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    colorHex: '#059669',
    description: 'Capaian realisasi memenuhi target optimal 95% s.d. 100%'
  },
  {
    status: 'overbudget',
    label: 'Overbudget',
    range: '> 100%',
    min: 100.0001,
    max: Infinity,
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    textClass: 'text-rose-600',
    borderClass: 'border-rose-200',
    colorHex: '#e11d48',
    description: 'Realisasi melebihi pagu/target yang ditetapkan (> 100%)'
  },
  {
    status: 'kurang_optimal',
    label: 'Kurang Optimal',
    range: '50% - <95%',
    min: 50,
    max: 94.9999,
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    textClass: 'text-amber-600',
    borderClass: 'border-amber-200',
    colorHex: '#d97706',
    description: 'Realisasi penyerapan di bawah 95% (50% s.d. <95%)'
  },
  {
    status: 'bermasalah',
    label: 'Bermasalah',
    range: '< 50%',
    min: 0,
    max: 49.9999,
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
    colorHex: '#dc2626',
    description: 'Realisasi sangat rendah di bawah 50% (< 50%)'
  }
];

export function getPerformanceStatus(percentage: number | undefined | null): PerformanceStatusInfo {
  const val = percentage ?? 0;

  if (val > 100) {
    return {
      status: 'overbudget',
      label: 'Overbudget',
      badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300',
      textClass: 'text-rose-600',
      bgClass: 'bg-rose-500',
      borderClass: 'border-rose-300',
      colorHex: '#e11d48',
      thresholdDesc: '> 100%',
      description: 'Realisasi melebihi pagu/target (> 100%)'
    };
  }

  if (val >= 95) {
    return {
      status: 'optimal',
      label: 'Optimal',
      badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      textClass: 'text-emerald-600',
      bgClass: 'bg-emerald-500',
      borderClass: 'border-emerald-300',
      colorHex: '#059669',
      thresholdDesc: '95% - 100%',
      description: 'Realisasi optimal (95% - 100%)'
    };
  }

  if (val >= 50) {
    return {
      status: 'kurang_optimal',
      label: 'Kurang Optimal',
      badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300',
      textClass: 'text-amber-600',
      bgClass: 'bg-amber-500',
      borderClass: 'border-amber-300',
      colorHex: '#d97706',
      thresholdDesc: '50% - <95%',
      description: 'Realisasi kurang optimal (50% - <95%)'
    };
  }

  return {
    status: 'bermasalah',
    label: 'Bermasalah',
    badgeClass: 'bg-red-100 text-red-800 border border-red-300',
    textClass: 'text-red-700',
    bgClass: 'bg-red-600',
    borderClass: 'border-red-300',
    colorHex: '#dc2626',
    thresholdDesc: '< 50%',
    description: 'Realisasi bermasalah (< 50%)'
  };
}
