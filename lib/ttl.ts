export type TtlStatus =
  | 'fresh'
  | 'aging'
  | 'expiring'
  | 'expired'
  | 'retained'
  | 'no-rule';

const UNIT_MS: Record<string, number> = {
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
  m: 2_592_000_000,
  y: 31_536_000_000,
};

export function parseTtlMs(ttl: string): number {
  const m = ttl.match(/^(\d+)(h|d|w|m|y)$/i);
  if (!m) throw new Error(`Invalid TTL: "${ttl}"`);
  return parseInt(m[1]) * UNIT_MS[m[2].toLowerCase()];
}

export function computeTtlStatus(
  lastModifiedIso: string,
  ttl?: string | null,
  retentionPolicy?: string | null
): { status: TtlStatus; expiresAt: string | null } {
  if (retentionPolicy === 'retain')
    return { status: 'retained', expiresAt: null };
  if (!ttl) return { status: 'no-rule', expiresAt: null };

  const ttlMs = parseTtlMs(ttl);
  const lastModified = new Date(lastModifiedIso).getTime();
  const expiresAt = new Date(lastModified + ttlMs);
  const age = Date.now() - lastModified;
  const fraction = age / ttlMs;

  let status: TtlStatus;
  if (fraction >= 1) status = 'expired';
  else if (fraction >= 0.75) status = 'expiring';
  else if (fraction >= 0.25) status = 'aging';
  else status = 'fresh';

  return { status, expiresAt: expiresAt.toISOString() };
}
