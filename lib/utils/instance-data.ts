/**
 * Utilities for handling instanced items (items with multiple copies)
 * Instance data is stored in the rental remark field using format:
 * [INSTANCE_DATA:{"item_id_1":2,"item_id_2":3}]User's regular notes...
 */

/**
 * Map of item IDs to their copy counts in a rental
 */
export type InstanceData = Record<string, number>;

/**
 * Parse instance data from a rental remark field
 * @param remark - The remark field from a rental record
 * @returns Object mapping item IDs to copy counts, empty object if not found
 */
export function parseInstanceData(remark: string | undefined): InstanceData {
  if (!remark || typeof remark !== 'string') {
    return {};
  }

  const match = remark.match(/^\[INSTANCE_DATA:(\{[^}]+\})\]/);
  if (!match) {
    return {};
  }

  try {
    return JSON.parse(match[1]) as InstanceData;
  } catch (e) {
    console.warn('Failed to parse instance data from remark:', e);
    return {};
  }
}

/**
 * Serialize instance data and combine with user notes
 * @param instanceData - Map of item IDs to copy counts
 * @param userNotes - User's regular notes (without instance data)
 * @returns Combined string with instance data prepended
 */
export function serializeInstanceData(
  instanceData: InstanceData,
  userNotes: string = ''
): string {
  // If no instance data or all values are 1, don't add the marker
  const hasMultipleCopies = Object.values(instanceData).some(count => count > 1);
  if (!hasMultipleCopies) {
    return userNotes;
  }

  const json = JSON.stringify(instanceData);
  const marker = `[INSTANCE_DATA:${json}]`;

  return userNotes ? `${marker}${userNotes}` : marker;
}

/**
 * Extract user notes from a remark field (removing instance data)
 * @param remark - The remark field from a rental record
 * @returns User's notes without the instance data marker
 */
export function extractUserNotes(remark: string | undefined): string {
  if (!remark || typeof remark !== 'string') {
    return '';
  }

  const match = remark.match(/^\[INSTANCE_DATA:\{[^}]+\}\]/);
  if (!match) {
    return remark;
  }

  return remark.substring(match[0].length);
}

/**
 * Get the copy count for a specific item from instance data
 * @param instanceData - Map of item IDs to copy counts
 * @param itemId - The item ID to look up
 * @returns Copy count (defaults to 1 if not found)
 */
export function getCopyCount(instanceData: InstanceData, itemId: string): number {
  return instanceData[itemId] || 1;
}

/**
 * Set the copy count for a specific item in instance data
 * @param instanceData - Map of item IDs to copy counts
 * @param itemId - The item ID to update
 * @param count - The copy count to set
 * @returns New instance data object with updated count
 */
export function setCopyCount(
  instanceData: InstanceData,
  itemId: string,
  count: number
): InstanceData {
  return {
    ...instanceData,
    [itemId]: count,
  };
}

/**
 * Remove an item from instance data
 * @param instanceData - Map of item IDs to copy counts
 * @param itemId - The item ID to remove
 * @returns New instance data object without the specified item
 */
export function removeCopyCount(
  instanceData: InstanceData,
  itemId: string
): InstanceData {
  const newData = { ...instanceData };
  delete newData[itemId];
  return newData;
}
