/**
 * Filter utility functions
 */

export interface ActiveFilter {
  id: string;
  type: 'status' | 'date' | 'category' | 'numeric' | 'text';
  field: string;
  operator: string;
  value: string | number | boolean | [string, string] | [number, number];
  label: string;
}

/**
 * Convert active filters to PocketBase filter string
 */
export function buildPocketBaseFilter(
  filters: ActiveFilter[],
  searchQuery?: string
): string {
  const filterParts: string[] = [];

  // Add search query if present
  if (searchQuery && searchQuery.trim()) {
    const searchTerm = searchQuery.toLowerCase();
    // This will be combined with entity-specific search fields
    filterParts.push(`__SEARCH__:"${searchTerm}"`);
  }

  // Add each filter
  filters.forEach((filter) => {
    switch (filter.type) {
      case 'status':
        filterParts.push(`${filter.field} = '${filter.value}'`);
        break;

      case 'category':
        // Use array contains operator for category fields (which are arrays)
        filterParts.push(`${filter.field} ?= '${filter.value}'`);
        break;

      case 'date':
        if (Array.isArray(filter.value)) {
          const [start, end] = filter.value;
          filterParts.push(
            `${filter.field} >= '${start}' && ${filter.field} <= '${end}'`
          );
        }
        break;

      case 'numeric':
        if (Array.isArray(filter.value)) {
          const [min, max] = filter.value;
          filterParts.push(
            `${filter.field} >= ${min} && ${filter.field} <= ${max}`
          );
        } else if (filter.operator) {
          filterParts.push(`${filter.field} ${filter.operator} ${filter.value}`);
        }
        break;

      case 'text':
        filterParts.push(`${filter.field} ~ '${filter.value}'`);
        break;
    }
  });

  return filterParts.join(' && ');
}

/**
 * Format filter label for display
 */
export function formatFilterLabel(filter: ActiveFilter): string {
  return filter.label;
}

/**
 * Generate unique filter ID
 */
export function generateFilterId(filter: Omit<ActiveFilter, 'id' | 'label'>): string {
  return `${filter.type}-${filter.field}-${String(filter.value)}`;
}
