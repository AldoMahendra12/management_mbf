import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatMoney = (amount: number, short: boolean = false) => {
  if (short && amount >= 1000000) {
    const formatted = (amount / 1000000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
    return `Rp ${formatted} jt`;
  }
  // Using en-US to get commas as per user request: Rp 12,000,000
  const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(amount);
  return `Rp ${formatted}`;
};
