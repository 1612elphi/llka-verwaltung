/**
 * Global command menu hook for search
 * Keyboard shortcut: O → S
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useCommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
