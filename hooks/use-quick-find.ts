/**
 * Global quick find hook for Cmd+P 4-digit ID search
 */

'use client';

import { useEffect, useState } from 'react';

export function useQuickFind() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+P or Ctrl+P
      if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Also support Cmd+Shift+F or Ctrl+Shift+F
      if (e.key === 'f' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return {
    open,
    setOpen,
  };
}
