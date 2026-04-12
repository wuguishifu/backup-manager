'use client';

import * as React from 'react';

export type PageSize = 5 | 10 | 20 | 50 | 'all';
export const PAGE_SIZES: PageSize[] = [5, 10, 20, 50, 'all'];
const STORAGE_KEY = 'backup-manager-page-size';
const DEFAULT: PageSize = 10;

interface PageSizeCtx {
  pageSize: PageSize;
  setPageSize: (size: PageSize) => void;
}

const Ctx = React.createContext<PageSizeCtx>({
  pageSize: DEFAULT,
  setPageSize: () => {},
});

export function PageSizeProvider({ children }: { children: React.ReactNode }) {
  const [pageSize, setPageSizeState] = React.useState<PageSize>(DEFAULT);

  // Read from localStorage once on mount (avoid SSR mismatch)
  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'all') {
      setPageSizeState('all');
    } else {
      const n = Number(stored);
      if ((PAGE_SIZES as (number | string)[]).includes(n)) {
        setPageSizeState(n as PageSize);
      }
    }
  }, []);

  function setPageSize(size: PageSize) {
    setPageSizeState(size);
    localStorage.setItem(STORAGE_KEY, String(size));
  }

  return (
    <Ctx.Provider value={{ pageSize, setPageSize }}>{children}</Ctx.Provider>
  );
}

export function usePageSize(): PageSizeCtx {
  return React.useContext(Ctx);
}
