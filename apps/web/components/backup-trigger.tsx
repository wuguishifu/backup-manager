'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2, Loader2, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn, formatRelative } from '@/lib/utils';
import type { BackupJob } from '@backup-manager/types';

// ─── Status config ────────────────────────────────────────────────────────────

type StatusConfig = {
  label: string;
  className: string;
  icon: React.ElementType;
  spin: boolean;
};

const STATUS_CONFIG: Record<BackupJob['status'], StatusConfig> = {
  pending: {
    label: 'Pending',
    className: 'border-border bg-muted text-muted-foreground',
    icon: Loader2,
    spin: true,
  },
  running: {
    label: 'Running',
    className:
      'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    icon: Loader2,
    spin: true,
  },
  succeeded: {
    label: 'Succeeded',
    className:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    icon: CheckCircle2,
    spin: false,
  },
  failed: {
    label: 'Failed',
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
    icon: AlertCircle,
    spin: false,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BackupTrigger({ prefixes }: { prefixes: string[] }) {
  const [selected, setSelected] = React.useState(prefixes[0] ?? '');
  const [job, setJob] = React.useState<BackupJob | null>(null);
  const [triggering, setTriggering] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isTerminal = job?.status === 'succeeded' || job?.status === 'failed';
  const isActive = !!job && !isTerminal;

  // Poll every 3 s while the job is running.
  React.useEffect(() => {
    if (!job || isTerminal) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/backup/${job.jobId}`);
        if (res.ok) setJob((await res.json()) as BackupJob);
      } catch {
        // Silently retry on transient network errors.
      }
    }, 3000);
    return () => clearInterval(id);
  }, [job, isTerminal]);

  async function handleTrigger() {
    setTriggering(true);
    setError(null);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: selected }),
      });
      const data = (await res.json()) as BackupJob | { error: string };
      if (!res.ok)
        throw new Error('error' in data ? data.error : 'Trigger failed');
      setJob(data as BackupJob);
    } catch (e) {
      setError(String(e));
    } finally {
      setTriggering(false);
    }
  }

  if (prefixes.length === 0) return null;

  const config = job ? STATUS_CONFIG[job.status] : null;
  const Icon = config?.icon;

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-4">
          <p className="font-heading text-sm font-semibold">Manual Backup</p>
          {config && Icon && (
            <Badge
              className={cn('gap-1.5 border font-normal', config.className)}
            >
              <Icon className={cn('size-3', config.spin && 'animate-spin')} />
              {config.label}
            </Badge>
          )}
        </div>
      </CardHeader>

      <Separator className="mt-3" />

      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-xs text-muted-foreground">Prefix</span>
          <div className="flex flex-wrap gap-1">
            {prefixes.map((prefix) => (
              <Button
                key={prefix}
                size="sm"
                variant={selected === prefix ? 'default' : 'outline'}
                onClick={() => setSelected(prefix)}
                disabled={isActive || triggering}
                className="h-7 font-mono text-xs"
              >
                {prefix}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={handleTrigger}
            disabled={!selected || isActive || triggering}
            className="ml-auto shrink-0"
          >
            {triggering ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Play className="size-3" />
            )}
            {triggering ? 'Starting…' : 'Run Backup'}
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {job && (
          <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <code className="font-mono">{job.jobId}</code>
            <span>started {formatRelative(job.startedAt)}</span>
            {job.completedAt && (
              <span>&middot; completed {formatRelative(job.completedAt)}</span>
            )}
            {isTerminal && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 text-xs"
                onClick={() => {
                  setJob(null);
                  setError(null);
                }}
              >
                Dismiss
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
