/**
 * Dashboard home page with stats, notes, active rentals, and reservations
 */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Package,
  TrendingUp,
  AlertCircle,
  Plus,
  Calendar,
  ClipboardList,
  StickyNote,
} from 'lucide-react';
import { collections } from '@/lib/pocketbase/client';
import { calculateRentalStatus, formatDate, formatFullName } from '@/lib/utils/formatting';
import type { RentalExpanded, ReservationExpanded, Note } from '@/types';
import { RentalStatus } from '@/types';
import { DashboardNotes } from '@/components/dashboard/dashboard-notes';
import { ActiveRentalsSection } from '@/components/dashboard/active-rentals-section';
import { TodaysReservationsSection } from '@/components/dashboard/todays-reservations-section';
import Link from 'next/link';
import { toast } from 'sonner';

interface DashboardStats {
  totalCustomers: number;
  totalItems: number;
  activeRentals: number;
  overdueRentals: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalItems: 0,
    activeRentals: 0,
    overdueRentals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);

      // Fetch stats in parallel
      const [customersResult, itemsResult, rentalsResult] = await Promise.all([
        collections.customers().getList(1, 1),
        collections.items().getList(1, 1, {
          filter: 'status != "deleted"',
        }),
        collections.rentals().getFullList<RentalExpanded>({
          expand: 'customer,items',
          sort: '-rented_on',
        }),
      ]);

      // Calculate rental stats
      const activeRentals = rentalsResult.filter((r) => !r.returned_on);
      const overdueRentals = activeRentals.filter((r) => {
        const status = calculateRentalStatus(
          r.rented_on,
          r.returned_on,
          r.expected_on,
          r.extended_on
        );
        return status === RentalStatus.Overdue;
      });

      setStats({
        totalCustomers: customersResult.totalItems,
        totalItems: itemsResult.totalItems,
        activeRentals: activeRentals.length,
        overdueRentals: overdueRentals.length,
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      toast.error('Fehler beim Laden der Statistiken');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/rentals?action=new">
            <Plus className="mr-2 h-4 w-4" />
            Neue Ausleihe
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/reservations?action=new">
            <Calendar className="mr-2 h-4 w-4" />
            Neue Reservierung
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/customers?action=new">
            <Users className="mr-2 h-4 w-4" />
            Neue:r Nutzer:in
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/items?action=new">
            <Package className="mr-2 h-4 w-4" />
            Neuer Gegenstand
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nutzer:innen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground">Gesamt registriert</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gegenstände</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalItems}
            </div>
            <p className="text-xs text-muted-foreground">Im Inventar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Ausleihen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.activeRentals}
            </div>
            <p className="text-xs text-muted-foreground">Aktuell ausgeliehen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Überfällig</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {loading ? '...' : stats.overdueRentals}
            </div>
            <p className="text-xs text-muted-foreground">Rückgabe überfällig</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - 2 Columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Notes Section */}
          <DashboardNotes />

          {/* Active Rentals */}
          <ActiveRentalsSection onRentalReturned={loadStats} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Today's Reservations */}
          <TodaysReservationsSection onReservationCompleted={loadStats} />
        </div>
      </div>
    </div>
  );
}
