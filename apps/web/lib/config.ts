import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';

export interface LifecycleRule {
  prefix: string;
  retentionPolicy?: 'delete' | 'retain';
  ttl?: string;
}

export interface BucketConfig {
  lifecycleRules?: LifecycleRule[];
}

export interface BucketEntry {
  id: string;
  name: string;
  bucketName: string;
  s3ApiUrl?: string;
  region?: string;
  accessKeyIdName: string;
  secretAccessKeyName: string;
  config?: BucketConfig;
}

// Safe to send to the client — no credentials
export type BucketPublicInfo = Omit<
  BucketEntry,
  'accessKeyIdName' | 'secretAccessKeyName'
>;

interface RawConfig {
  buckets: Omit<BucketEntry, 'id'>[];
}

let _config: BucketEntry[] | null = null;

export function loadBuckets(): BucketEntry[] {
  if (_config) return _config;
  const configPath =
    process.env.CONFIG_PATH ?? path.join(process.cwd(), 'config.yaml');
  const raw = fs.readFileSync(configPath, 'utf-8');
  const parsed = parse(raw) as RawConfig;
  _config = parsed.buckets.map((b, i) => ({ ...b, id: String(i) }));
  return _config;
}

export function getBucketById(id: string): BucketEntry | undefined {
  return loadBuckets().find((b) => b.id === id);
}

export function getPublicBuckets(): BucketPublicInfo[] {
  return loadBuckets().map(
    ({ accessKeyIdName: _a, secretAccessKeyName: _s, ...rest }) => rest
  );
}

export function getUniquePrefixes(): string[] {
  const seen = new Set<string>();
  for (const bucket of loadBuckets()) {
    for (const rule of bucket.config?.lifecycleRules ?? []) {
      if (rule.prefix) seen.add(rule.prefix);
    }
  }
  return [...seen].sort();
}

export function findMatchingRule(
  key: string,
  rules?: LifecycleRule[]
): LifecycleRule | undefined {
  if (!rules?.length) return undefined;
  let best: LifecycleRule | undefined;
  let bestLen = -1;
  for (const rule of rules) {
    if (key.startsWith(rule.prefix) && rule.prefix.length > bestLen) {
      best = rule;
      bestLen = rule.prefix.length;
    }
  }
  return best;
}
