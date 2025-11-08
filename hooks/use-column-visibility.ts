/**
 * Hook for managing column visibility with localStorage persistence
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { EntityColumnConfig } from '@/lib/tables/column-configs';

export interface UseColumnVisibilityOptions {
  /** Entity type for localStorage key */
  entity: 'customers' | 'items' | 'rentals' | 'reservations';

  /** Column configuration */
  config: EntityColumnConfig;

  /** Enable localStorage persistence */
  persist?: boolean;
}

export function useColumnVisibility({
  entity,
  config,
  persist = true,
}: UseColumnVisibilityOptions) {
  // Initialize with default visible columns
  const defaultVisibleColumns = config.columns
    .filter((col) => col.defaultVisible)
    .map((col) => col.id);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisibleColumns);

  // Storage key for this entity
  const storageKey = `column_visibility_${entity}`;

  // Load from localStorage on mount
  useEffect(() => {
    if (!persist) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const savedColumns = JSON.parse(stored) as string[];
        setVisibleColumns(savedColumns);
      }
    } catch (error) {
      console.error('Failed to load column visibility from localStorage:', error);
    }
  }, [storageKey, persist]);

  // Save to localStorage when visibility changes
  useEffect(() => {
    if (!persist) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
    } catch (error) {
      console.error('Failed to save column visibility to localStorage:', error);
    }
  }, [visibleColumns, storageKey, persist]);

  /**
   * Toggle column visibility
   */
  const toggleColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        // Don't allow hiding all columns
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  }, []);

  /**
   * Reset to default visibility
   */
  const resetColumns = useCallback(() => {
    setVisibleColumns(defaultVisibleColumns);
  }, [defaultVisibleColumns]);

  /**
   * Check if a column is visible
   */
  const isColumnVisible = useCallback(
    (columnId: string) => {
      return visibleColumns.includes(columnId);
    },
    [visibleColumns]
  );

  /**
   * Get number of hidden columns
   */
  const hiddenCount = config.columns.length - visibleColumns.length;

  return {
    visibleColumns,
    toggleColumn,
    resetColumns,
    isColumnVisible,
    hiddenCount,
  };
}
