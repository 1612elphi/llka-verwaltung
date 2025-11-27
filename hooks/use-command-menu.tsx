/**
 * Global command menu hook for search
 * Keyboard shortcut: O → S
 */

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface CommandMenuContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  navigateTo: (path: string) => void;
}

const CommandMenuContext = createContext<CommandMenuContextType | undefined>(undefined);

export function CommandMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const navigateTo = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <CommandMenuContext.Provider value={{ open, setOpen, navigateTo }}>
      {children}
    </CommandMenuContext.Provider>
  );
}

export function useCommandMenu() {
  const context = useContext(CommandMenuContext);
  if (context === undefined) {
    throw new Error('useCommandMenu must be used within a CommandMenuProvider');
  }
  return context;
}
