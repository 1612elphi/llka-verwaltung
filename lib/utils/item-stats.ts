/**
 * Utility functions for fetching and computing item statistics
 */

import { collections } from '@/lib/pocketbase/client';
import { differenceInDays, parseISO } from 'date-fns';
import type { Item, ItemWithStats, Rental, ItemCategory } from '@/types';

/**
 * Performance category for an item
 */
export type PerformanceCategory = 'high' | 'medium' | 'low' | 'idle';

/**
 * Detailed analytics for a single item
 */
export interface ItemAnalytics extends ItemWithStats {
  /** Rentals per year (normalized for item age) */
  rental_frequency: number;

  /** Percentage of time item has been rented */
  utilization_rate: number;

  /** Average rental duration in days */
  average_rental_duration: number;

  /** Percentage of rentals that have been returned */
  return_rate: number;

  /** Total days this item has been rented */
  total_rental_days: number;

  /** Days since item was added to inventory */
  days_in_inventory: number;

  /** Performance classification */
  performance_category: PerformanceCategory;
}

/**
 * Aggregate analytics across all items
 */
export interface AggregateAnalytics {
  /** Total number of items */
  total_items: number;

  /** Items currently in stock */
  items_in_stock: number;

  /** Total rentals across all items */
  total_rentals: number;

  /** Average utilization rate across all items */
  average_utilization: number;

  /** Most popular category by rental count */
  most_popular_category: ItemCategory | null;

  /** Rental counts by category */
  category_rentals: Record<string, number>;

  /** Item counts by category */
  category_items: Record<string, number>;
}

/**
 * Enriches an array of items with their rental statistics
 *
 * @param items - Array of items to enrich
 * @returns Array of items with stats added
 */
export async function enrichItemsWithStats(
  items: Item[]
): Promise<ItemWithStats[]> {
  if (items.length === 0) {
    return [];
  }

  try {
    // Build filter to get rentals for all item IDs using OR operator
    // Note: items field in rentals is an array, so we use the ~ operator for "contains"
    const itemFilters = items.map(i => `items~"${i.id}"`).join('||');

    // Fetch all rentals for these items in one query
    const rentals = await collections.rentals().getFullList<Rental>({
      filter: itemFilters,
      fields: 'id,items,rented_on,returned_on',
    });

    // Create a map to aggregate stats per item
    const statsMap = new Map<string, {
      total: number;
      active: number;
      lastRented: string | null;
    }>();

    // Aggregate rental data
    for (const rental of rentals) {
      // A rental can contain multiple items
      for (const itemId of rental.items) {
        const stats = statsMap.get(itemId) || {
          total: 0,
          active: 0,
          lastRented: null,
        };

        stats.total++;

        // Count active rentals (not yet returned)
        if (!rental.returned_on) {
          stats.active++;
        }

        // Track most recent rental date
        if (!stats.lastRented || rental.rented_on > stats.lastRented) {
          stats.lastRented = rental.rented_on;
        }

        statsMap.set(itemId, stats);
      }
    }

    // Enrich items with their stats
    return items.map(item => {
      const stats = statsMap.get(item.id);
      const lastRented = stats?.lastRented;

      // Calculate days since last rental
      const daysSince = lastRented
        ? differenceInDays(new Date(), parseISO(lastRented))
        : null;

      return {
        ...item,
        total_rentals: stats?.total || 0,
        active_rentals: stats?.active || 0,
        days_since_last_rental: daysSince,
      };
    });
  } catch (err) {
    console.error('Error fetching item stats:', err);
    // On error, return items with zero stats
    return items.map(item => ({
      ...item,
      total_rentals: 0,
      active_rentals: 0,
      days_since_last_rental: null,
    }));
  }
}

/**
 * Calculate detailed analytics for all items
 *
 * @param items - Array of items
 * @param rentals - Array of all rentals
 * @returns Array of items with detailed analytics
 */
export function calculateItemAnalytics(
  items: Item[],
  rentals: Rental[]
): ItemAnalytics[] {
  const today = new Date();

  return items.map(item => {
    // Find all rentals for this item
    const itemRentals = rentals.filter(r => r.items.includes(item.id));
    const totalRentals = itemRentals.length;
    const activeRentals = itemRentals.filter(r => !r.returned_on).length;
    const returnedRentals = itemRentals.filter(r => r.returned_on);

    // Calculate days in inventory
    const daysInInventory = differenceInDays(today, parseISO(item.added_on));

    // Find last rental date
    const lastRented = itemRentals.length > 0
      ? itemRentals.sort((a, b) =>
          parseISO(b.rented_on).getTime() - parseISO(a.rented_on).getTime()
        )[0].rented_on
      : null;

    const daysSinceLastRental = lastRented
      ? differenceInDays(today, parseISO(lastRented))
      : null;

    // Calculate total rental days (only for returned rentals)
    const totalRentalDays = returnedRentals.reduce((sum, rental) => {
      const duration = differenceInDays(
        parseISO(rental.returned_on!),
        parseISO(rental.rented_on)
      );
      return sum + Math.max(0, duration);
    }, 0);

    // Calculate average rental duration
    const averageRentalDuration = returnedRentals.length > 0
      ? totalRentalDays / returnedRentals.length
      : 0;

    // Calculate utilization rate (capped at 100%)
    const utilizationRate = daysInInventory > 0
      ? Math.min(100, (totalRentalDays / daysInInventory) * 100)
      : 0;

    // Calculate rental frequency (rentals per year)
    const rentalFrequency = daysInInventory > 0
      ? (totalRentals / daysInInventory) * 365
      : 0;

    // Calculate return rate
    const returnRate = totalRentals > 0
      ? (returnedRentals.length / totalRentals) * 100
      : 0;

    // Determine performance category
    let performanceCategory: PerformanceCategory;
    if (daysSinceLastRental !== null && daysSinceLastRental > 90) {
      performanceCategory = 'idle';
    } else if (rentalFrequency > 12 && utilizationRate > 50) {
      performanceCategory = 'high';
    } else if (rentalFrequency > 4 && utilizationRate > 20) {
      performanceCategory = 'medium';
    } else {
      performanceCategory = 'low';
    }

    return {
      ...item,
      total_rentals: totalRentals,
      active_rentals: activeRentals,
      days_since_last_rental: daysSinceLastRental,
      rental_frequency: rentalFrequency,
      utilization_rate: utilizationRate,
      average_rental_duration: averageRentalDuration,
      return_rate: returnRate,
      total_rental_days: totalRentalDays,
      days_in_inventory: daysInInventory,
      performance_category: performanceCategory,
    };
  });
}

/**
 * Calculate aggregate analytics across all items
 *
 * @param itemsAnalytics - Array of items with analytics
 * @returns Aggregate analytics
 */
export function calculateAggregateAnalytics(
  itemsAnalytics: ItemAnalytics[]
): AggregateAnalytics {
  const totalItems = itemsAnalytics.length;
  const itemsInStock = itemsAnalytics.filter(i => i.status === 'instock').length;
  const totalRentals = itemsAnalytics.reduce((sum, i) => sum + i.total_rentals, 0);

  // Calculate average utilization
  const averageUtilization = totalItems > 0
    ? itemsAnalytics.reduce((sum, i) => sum + i.utilization_rate, 0) / totalItems
    : 0;

  // Calculate category statistics
  const categoryRentals: Record<string, number> = {};
  const categoryItems: Record<string, number> = {};

  for (const item of itemsAnalytics) {
    // Items can have multiple categories, count for each
    for (const category of item.category) {
      categoryRentals[category] = (categoryRentals[category] || 0) + item.total_rentals;
      categoryItems[category] = (categoryItems[category] || 0) + 1;
    }
  }

  // Find most popular category
  let mostPopularCategory: ItemCategory | null = null;
  let maxRentals = 0;
  for (const [category, count] of Object.entries(categoryRentals)) {
    if (count > maxRentals) {
      maxRentals = count;
      mostPopularCategory = category as ItemCategory;
    }
  }

  return {
    total_items: totalItems,
    items_in_stock: itemsInStock,
    total_rentals: totalRentals,
    average_utilization: averageUtilization,
    most_popular_category: mostPopularCategory,
    category_rentals: categoryRentals,
    category_items: categoryItems,
  };
}
