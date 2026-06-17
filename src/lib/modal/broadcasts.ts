import { escapeHtml } from '../client-utils';
import { readStoredString, writeStoredString } from '../ui/storage';

export const BROADCAST_REGION_KEY = 'rt-broadcast-region';

export type BroadcastRegion = 'NL' | 'US' | 'UK';

export interface BroadcastChannel {
  channel: string;
  type: string;
  note?: string;
}

export interface BroadcastDb {
  series?: Record<string, Record<string, BroadcastChannel[]>>;
}

function isBroadcastRegion(value: string): value is BroadcastRegion {
  return value === 'NL' || value === 'US' || value === 'UK';
}

export function parseBroadcastDb(raw: string): BroadcastDb {
  try {
    return JSON.parse(raw) as BroadcastDb;
  } catch {
    return {};
  }
}

export function readBroadcastRegion(fallback: BroadcastRegion = 'NL'): BroadcastRegion {
  const stored = readStoredString(BROADCAST_REGION_KEY, fallback);
  return isBroadcastRegion(stored) ? stored : fallback;
}

export function writeBroadcastRegion(region: BroadcastRegion): void {
  writeStoredString(BROADCAST_REGION_KEY, region);
}

export function getBroadcastChannels(
  db: BroadcastDb,
  seriesId: string | undefined,
  region: BroadcastRegion,
): BroadcastChannel[] {
  if (!seriesId) return [];
  return db.series?.[seriesId]?.[region] ?? [];
}

export function renderBroadcastChannels(channels: BroadcastChannel[]): string {
  return channels.map((channel) => {
    const icon = channel.type === 'streaming'
      ? '<svg class="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" /></svg>'
      : '<svg class="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" /></svg>';

    return `<div class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-900">
      ${icon}
      <span class="text-sm text-zinc-300 font-medium">${escapeHtml(channel.channel)}</span>
      <span class="text-[10px] uppercase tracking-wide font-semibold ${channel.type === 'streaming' ? 'text-blue-400' : 'text-zinc-500'}">${escapeHtml(channel.type)}</span>
      ${channel.note ? `<span class="text-[10px] text-zinc-600 ml-auto">${escapeHtml(channel.note)}</span>` : ''}
    </div>`;
  }).join('');
}