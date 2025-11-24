/**
 * Overdue Management Dashboard
 * Focused workspace for managing overdue rentals with operational metrics
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon, AlertCircleIcon } from 'lucide-react';
import { collections } from '@/lib/pocketbase/client';
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription';
import { calculateRentalStatus, calculateDaysOverdue } from '@/lib/utils/formatting';
import type { Rental, RentalExpanded, RentalStatus } from '@/types';
import { RentalStatus as RentalStatusEnum } from '@/types';
import { toast } from 'sonner';
import { OverdueStatsCards } from '@/components/overdue/overdue-stats-cards';
import { OverdueSection } from '@/components/overdue/overdue-section';

// Severity levels for grouping rentals
type SeverityLevel = 'severely_critical' | 'critical' | 'overdue' | 'due_today' | 'due_soon';

interface CategorizedRentals {
  severely_critical: RentalExpanded[]; // 7+ days overdue
  critical: RentalExpanded[];          // 3-6 days overdue
  overdue: RentalExpanded[];           // 1-2 days overdue
  due_today: RentalExpanded[];         // Due today
  due_soon: RentalExpanded[];          // Due in next 3 days
}

export default function OverduePage() {
  const [loading, setLoading] = useState(true);
  const [categorizedRentals, setCategorizedRentals] = useState<CategorizedRentals>({
    severely_critical: [],
    critical: [],
    overdue: [],
    due_today: [],
    due_soon: [],
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadRentals();
  }, []);

  // Real-time subscription for live updates
  useRealtimeSubscription<Rental>('rental', {
    onCreated: async (rental) => {
      // Only handle active rentals
      if (rental.returned_on) return;

      try {
        const expandedRental = await collections.rentals().getOne<RentalExpanded>(
          rental.id,
          { expand: 'customer,items' }
        );
        addRentalToCategory(expandedRental);
      } catch (err) {
        console.error('Error fetching expanded rental:', err);
      }
    },
    onUpdated: async (rental) => {
      try {
        const expandedRental = await collections.rentals().getOne<RentalExpanded>(
          rental.id,
          { expand: 'customer,items' }
        );

        // If returned, remove from all categories
        if (expandedRental.returned_on) {
          removeRentalFromAllCategories(rental.id);
          return;
        }

        // Re-categorize
        removeRentalFromAllCategories(rental.id);
        addRentalToCategory(expandedRental);
      } catch (err) {
        console.error('Error fetching expanded rental:', err);
      }
    },
    onDeleted: (rental) => {
      removeRentalFromAllCategories(rental.id);
    },
  });

  async function loadRentals() {
    try {
      setLoading(true);

      // Fetch all active rentals (not yet returned)
      const rentals = await collections.rentals().getFullList<RentalExpanded>({
        expand: 'customer,items',
        filter: 'returned_on = ""',
        sort: 'expected_on',
      });

      // Categorize rentals by severity
      const categorized = categorizeRentals(rentals);
      setCategorizedRentals(categorized);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load rentals:', error);
      toast.error('Fehler beim Laden der Ausleihen');
    } finally {
      setLoading(false);
    }
  }

  function categorizeRentals(rentals: RentalExpanded[]): CategorizedRentals {
    const categorized: CategorizedRentals = {
      severely_critical: [],
      critical: [],
      overdue: [],
      due_today: [],
      due_soon: [],
    };

    for (const rental of rentals) {
      const status = calculateRentalStatus(
        rental.rented_on,
        rental.returned_on,
        rental.expected_on,
        rental.extended_on
      );

      const daysOverdue = calculateDaysOverdue(
        rental.returned_on,
        rental.expected_on,
        rental.extended_on
      );

      // Categorize by severity
      if (status === RentalStatusEnum.Overdue) {
        if (daysOverdue >= 7) {
          categorized.severely_critical.push(rental);
        } else if (daysOverdue >= 3) {
          categorized.critical.push(rental);
        } else {
          categorized.overdue.push(rental);
        }
      } else if (status === RentalStatusEnum.DueToday) {
        categorized.due_today.push(rental);
      } else if (status === RentalStatusEnum.Active && daysOverdue < 0 && daysOverdue >= -3) {
        // Due in next 3 days
        categorized.due_soon.push(rental);
      }
    }

    return categorized;
  }

  function addRentalToCategory(rental: RentalExpanded) {
    const categorized = categorizeRentals([rental]);

    setCategorizedRentals(prev => ({
      severely_critical: [...prev.severely_critical, ...categorized.severely_critical],
      critical: [...prev.critical, ...categorized.critical],
      overdue: [...prev.overdue, ...categorized.overdue],
      due_today: [...prev.due_today, ...categorized.due_today],
      due_soon: [...prev.due_soon, ...categorized.due_soon],
    }));
  }

  function removeRentalFromAllCategories(rentalId: string) {
    setCategorizedRentals(prev => ({
      severely_critical: prev.severely_critical.filter(r => r.id !== rentalId),
      critical: prev.critical.filter(r => r.id !== rentalId),
      overdue: prev.overdue.filter(r => r.id !== rentalId),
      due_today: prev.due_today.filter(r => r.id !== rentalId),
      due_soon: prev.due_soon.filter(r => r.id !== rentalId),
    }));
  }

  function handleRefresh() {
    loadRentals();
    toast.success('Daten aktualisiert');
  }

  const totalOverdue = categorizedRentals.severely_critical.length +
                       categorizedRentals.critical.length +
                       categorizedRentals.overdue.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertCircleIcon className="h-8 w-8 text-red-500" />
            Überfällige Ausleihen
          </h1>
          <p className="text-muted-foreground mt-1">
            Fokussierter Arbeitsbereich für das Management überfälliger Ausleihen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Zuletzt aktualisiert: {lastRefresh.toLocaleTimeString('de-DE')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && totalOverdue === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-sm text-muted-foreground">Lade Ausleihen...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <OverdueStatsCards categorizedRentals={categorizedRentals} />

          {/* Severely Critical (7+ days overdue) */}
          <OverdueSection
            title="🚨 EXTREM ÜBERFÄLLIG"
            description="7+ Tage überfällig"
            rentals={categorizedRentals.severely_critical}
            variant="severely_critical"
            onRentalUpdated={loadRentals}
          />

          {/* Critical (3-6 days overdue) */}
          <OverdueSection
            title="⚠ KRITISCH"
            description="3-6 Tage überfällig"
            rentals={categorizedRentals.critical}
            variant="critical"
            onRentalUpdated={loadRentals}
          />

          {/* Overdue (1-2 days overdue) */}
          <OverdueSection
            title="📌 ÜBERFÄLLIG"
            description="1-2 Tage überfällig"
            rentals={categorizedRentals.overdue}
            variant="overdue"
            onRentalUpdated={loadRentals}
          />

          {/* Due Today */}
          <OverdueSection
            title="📅 HEUTE FÄLLIG"
            description="Rückgabe heute erwartet"
            rentals={categorizedRentals.due_today}
            variant="due_today"
            onRentalUpdated={loadRentals}
          />

          {/* Due Soon (next 3 days) */}
          <OverdueSection
            title="📆 BALD FÄLLIG"
            description="Fällig in den nächsten 3 Tagen"
            rentals={categorizedRentals.due_soon}
            variant="due_soon"
            onRentalUpdated={loadRentals}
          />

          {/* Empty State */}
          {totalOverdue === 0 &&
           categorizedRentals.due_today.length === 0 &&
           categorizedRentals.due_soon.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold mb-2">Alles im grünen Bereich!</h3>
                <p className="text-muted-foreground">
                  Keine überfälligen Ausleihen vorhanden.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
