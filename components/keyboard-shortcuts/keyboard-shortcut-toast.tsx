/**
 * Visual feedback component for keyboard shortcut sequences
 * Shows when first key is pressed, displays available options
 */

'use client';

import { Keyboard, ArrowRight } from 'lucide-react';

interface ShortcutOption {
  key: string;
  description: string;
}

interface KeyboardShortcutToastProps {
  firstKey: string;
  availableOptions?: ShortcutOption[];
}

export function KeyboardShortcutToast({
  firstKey,
  availableOptions,
}: KeyboardShortcutToastProps) {
  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      {/* Current sequence state */}
      <div className="flex items-center gap-2">
        <Keyboard className="h-4 w-4" />
        <div className="flex items-center gap-1 font-mono font-semibold">
          <kbd className="px-2 py-1 bg-muted border border-border rounded">
            {firstKey.toUpperCase()}
          </kbd>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">?</span>
        </div>
      </div>

      {/* Available options */}
      {availableOptions && availableOptions.length > 0 && (
        <div className="text-xs space-y-1 pl-6">
          {availableOptions.map(({ key, description }) => (
            <div key={key} className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded font-mono">
                {key.toUpperCase()}
              </kbd>
              <span className="text-muted-foreground">{description}</span>
            </div>
          ))}
        </div>
      )}

      {/* ESC hint */}
      <div className="text-xs text-muted-foreground pl-6">
        Drücke{' '}
        <kbd className="px-1 py-0.5 bg-muted border border-border rounded">
          ESC
        </kbd>{' '}
        zum Abbrechen
      </div>
    </div>
  );
}
