'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePageSize } from '@/components/page-size-provider';
import type { BucketPublicInfo, LifecycleRule } from '@/lib/config';
import type { EnrichedObject, TtlStatus } from '@/lib/types';
import { cn, formatAbsolute, formatBytes, formatRelative } from '@/lib/utils';
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import * as React from 'react';

// ─── TTL badge ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TtlStatus, string> = {
  fresh:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  aging:
    'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  expiring:
    'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  expired: 'border-destructive/30 bg-destructive/10 text-destructive',
  retained:
    'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'no-rule': 'border-border bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<TtlStatus, string> = {
  fresh: 'Fresh',
  aging: 'Aging',
  expiring: 'Expiring soon',
  expired: 'Expired',
  retained: 'Retained',
  'no-rule': 'No rule',
};

function TtlBadge({ status }: { status: TtlStatus }) {
  return (
    <Badge className={cn('border font-normal', STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

// ─── Expiry cell ─────────────────────────────────────────────────────────────

function ExpiryCell({
  expiresAt,
  retentionPolicy,
  ttl,
  status,
}: {
  expiresAt: string | null;
  retentionPolicy: string | null;
  ttl: string | null;
  status: TtlStatus;
}) {
  if (retentionPolicy === 'retain') {
    return <span className="text-muted-foreground">Never</span>;
  }
  if (!ttl || !expiresAt) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span
      title={formatAbsolute(expiresAt)}
      className={status === 'expired' ? 'text-destructive' : ''}
    >
      {formatRelative(expiresAt)}
    </span>
  );
}

// ─── Object row ──────────────────────────────────────────────────────────────

function ObjectRow({
  obj,
  bucketId,
  rulePrefix,
  onDeleted,
}: {
  obj: EnrichedObject;
  bucketId: string;
  rulePrefix: string | null;
  onDeleted: (key: string) => void;
}) {
  const [downloading, setDownloading] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const displayKey =
    rulePrefix && obj.key.startsWith(rulePrefix)
      ? obj.key.slice(rulePrefix.length)
      : obj.key;

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/buckets/${bucketId}/download?key=${encodeURIComponent(obj.key)}`
      );
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to get download URL');
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      alert(`Download failed: ${e}`);
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/buckets/${bucketId}/objects?key=${encodeURIComponent(obj.key)}`,
        { method: 'DELETE' }
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Delete failed');
      onDeleted(obj.key);
    } catch (e) {
      alert(`Delete failed: ${e}`);
    } finally {
      setDeleting(false);
      setPendingDelete(false);
    }
  }

  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-xs">
          <span className="block max-w-xs truncate" title={displayKey}>
            {displayKey}
          </span>
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {formatBytes(obj.size)}
        </TableCell>
        <TableCell
          className="tabular-nums"
          title={formatAbsolute(obj.lastModified)}
        >
          {formatRelative(obj.lastModified)}
        </TableCell>
        <TableCell>
          <ExpiryCell
            expiresAt={obj.expiresAt}
            retentionPolicy={obj.retentionPolicy}
            ttl={obj.ttl}
            status={obj.ttlStatus}
          />
        </TableCell>
        <TableCell>
          <TtlBadge status={obj.ttlStatus} />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={downloading}
              onClick={handleDownload}
              title="Download"
            >
              <Download />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPendingDelete(true)}
              title="Delete"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <AlertDialog open={pendingDelete} onOpenChange={setPendingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete backup?</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs break-all">
              {obj.key}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Rule group ──────────────────────────────────────────────────────────────

function RuleGroup({
  rule,
  objects,
  bucketId,
  onDeleted,
}: {
  rule: LifecycleRule | null;
  objects: EnrichedObject[];
  bucketId: string;
  onDeleted: (key: string) => void;
}) {
  const { pageSize } = usePageSize();
  const [expanded, setExpanded] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);

  const effectivePageSize = pageSize === 'all' ? objects.length : pageSize;
  const totalPages =
    effectivePageSize > 0 ? Math.ceil(objects.length / effectivePageSize) : 1;

  // Reset to page 1 when page size changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  // Clamp current page when objects are deleted
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [objects.length, totalPages, currentPage]);

  const startIdx = (currentPage - 1) * effectivePageSize;
  const endIdx = Math.min(startIdx + effectivePageSize, objects.length);
  const visibleObjects = objects.slice(startIdx, endIdx);

  const totalSize = objects.reduce((s, o) => s + o.size, 0);
  const prefix = rule?.prefix ?? null;
  const label = prefix ? `${prefix}` : '(root)';
  const ruleDescription = rule
    ? rule.retentionPolicy === 'retain'
      ? 'retained indefinitely'
      : rule.ttl
        ? `${rule.ttl} TTL`
        : 'no TTL configured'
    : 'no matching rule';

  const showPagination = pageSize !== 'all' && totalPages > 1;

  return (
    <div>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 py-2 text-left text-muted-foreground transition-colors hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="size-3 shrink-0" />
        ) : (
          <ChevronRight className="size-3 shrink-0" />
        )}
        <span className="font-mono text-xs font-medium text-foreground">
          {label}
        </span>
        <span className="text-xs">{ruleDescription}</span>
        <span className="ml-auto text-xs tabular-nums">
          {objects.length} {objects.length === 1 ? 'object' : 'objects'}{' '}
          &middot; {formatBytes(totalSize)}
        </span>
      </button>

      {expanded && (
        <div className="mb-4 overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Path</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-18"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleObjects.map((obj) => (
                <ObjectRow
                  key={obj.key}
                  obj={obj}
                  bucketId={bucketId}
                  rulePrefix={prefix}
                  onDeleted={onDeleted}
                />
              ))}
            </TableBody>
          </Table>

          {showPagination && (
            <div className="flex items-center justify-between border-t border-border px-3 py-2">
              <span className="text-xs text-muted-foreground tabular-nums">
                {startIdx + 1}–{endIdx} of {objects.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  title="Previous page"
                >
                  <ChevronLeft />
                </Button>
                <span className="min-w-[5rem] text-center text-xs text-muted-foreground tabular-nums">
                  page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  title="Next page"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Bucket section ──────────────────────────────────────────────────────────

export function BucketSection({ bucket }: { bucket: BucketPublicInfo }) {
  const [objects, setObjects] = React.useState<EnrichedObject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchObjects = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/buckets/${bucket.id}/objects`);
      const data = (await res.json()) as {
        objects?: EnrichedObject[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Request failed');
      setObjects(data.objects ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [bucket.id]);

  React.useEffect(() => {
    fetchObjects();
  }, [fetchObjects]);

  function handleDeleted(key: string) {
    setObjects((prev) => prev.filter((o) => o.key !== key));
  }

  // Group objects by rule prefix, respecting the order defined in config
  const rules = bucket.config?.lifecycleRules ?? [];
  const prefixOrder: (string | null)[] = rules.map((r) => r.prefix);
  if (!prefixOrder.includes(null)) prefixOrder.push(null); // "no rule" group last

  const grouped = new Map<string | null, EnrichedObject[]>();
  for (const obj of objects) {
    const key = obj.rulePrefix;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(obj);
  }

  // Ensure rule-defined groups appear in config order, even if empty
  const orderedGroups: [string | null, EnrichedObject[]][] = prefixOrder
    .filter((p) => grouped.has(p))
    .map((p) => [p, grouped.get(p)!]);
  // Append any groups not covered by config rules
  for (const [k, v] of grouped) {
    if (!prefixOrder.includes(k)) orderedGroups.push([k, v]);
  }

  const totalSize = objects.reduce((s, o) => s + o.size, 0);

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-heading text-sm font-semibold">{bucket.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {bucket.bucketName}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            {!loading && !error && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {objects.length} objects &middot; {formatBytes(totalSize)}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={fetchObjects}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={cn('size-3', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator className="mt-3" />

      <CardContent className="pt-4">
        {loading && (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && objects.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No objects found
          </p>
        )}

        {!loading && !error && orderedGroups.length > 0 && (
          <div className="space-y-1">
            {orderedGroups.map(([prefix, objs], i) => {
              const rule = rules.find((r) => r.prefix === prefix) ?? null;
              return (
                <React.Fragment key={prefix ?? '__no_rule__'}>
                  {i > 0 && <Separator className="my-2" />}
                  <RuleGroup
                    rule={rule}
                    objects={objs}
                    bucketId={bucket.id}
                    onDeleted={handleDeleted}
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
