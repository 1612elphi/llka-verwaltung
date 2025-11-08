/**
 * Global command menu hook for Cmd+K search
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useCommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const navigateTo = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return {
    open,
    setOpen,
    navigateTo,
  };
}
