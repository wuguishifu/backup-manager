import type { TtlStatus } from './ttl';

export type { TtlStatus };

export interface EnrichedObject {
  key: string;
  size: number;
  lastModified: string;
  rulePrefix: string | null;
  ttl: string | null;
  retentionPolicy: string | null;
  ttlStatus: TtlStatus;
  expiresAt: string | null;
}
