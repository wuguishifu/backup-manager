'use client';

import { Moon, Sun, Database } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  PAGE_SIZES,
  usePageSize,
  type PageSize,
} from '@/components/page-size-provider';

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const { pageSize, setPageSize } = usePageSize();

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center border-b border-border bg-background/95 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Database className="size-4 text-muted-foreground" />
        <span className="font-heading text-sm font-semibold tracking-tight">
          Backup Manager
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Per page</span>
          <select
            value={String(pageSize)}
            onChange={(e) => {
              const v = e.target.value;
              setPageSize((v === 'all' ? 'all' : Number(v)) as PageSize);
            }}
            className="cursor-pointer rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground ring-ring transition-colors outline-none focus-visible:ring-2"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={String(s)}>
                {s === 'all' ? 'All' : s}
              </option>
            ))}
          </select>
        </label>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          <Sun className="size-3.5 dark:hidden" />
          <Moon className="hidden size-3.5 dark:block" />
        </Button>
      </div>
    </header>
  );
}
