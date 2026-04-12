'use client';

import { Moon, Sun, Database } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center border-b border-border bg-background/95 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Database className="size-4 text-muted-foreground" />
        <span className="font-heading text-sm font-semibold tracking-tight">
          Backup Manager
        </span>
      </div>
      <div className="ml-auto">
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
