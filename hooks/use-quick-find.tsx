/**
 * Global quick find hook for 4-digit ID search
 * Keyboard shortcut: O → F
 */

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface QuickFindContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const QuickFindContext = createContext<QuickFindContextType | undefined>(undefined);

export function QuickFindProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <QuickFindContext.Provider value={{ open, setOpen }}>
      {children}
    </QuickFindContext.Provider>
  );
}

export function useQuickFind() {
  const context = useContext(QuickFindContext);
  if (context === undefined) {
    throw new Error('useQuickFind must be used within a QuickFindProvider');
  }
  return context;
}
