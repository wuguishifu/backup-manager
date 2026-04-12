import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;
  const prefix = future ? 'in ' : '';
  const suffix = future ? '' : ' ago';

  if (abs < 60_000) return 'just now';
  if (abs < 3_600_000) return `${prefix}${Math.floor(abs / 60_000)}m${suffix}`;
  if (abs < 86_400_000)
    return `${prefix}${Math.floor(abs / 3_600_000)}h${suffix}`;
  if (abs < 2_592_000_000)
    return `${prefix}${Math.floor(abs / 86_400_000)}d${suffix}`;
  if (abs < 31_536_000_000)
    return `${prefix}${Math.floor(abs / 2_592_000_000)}mo${suffix}`;
  return `${prefix}${Math.floor(abs / 31_536_000_000)}y${suffix}`;
}

export function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}
