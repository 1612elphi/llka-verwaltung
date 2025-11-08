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
    <div className="container mx-auto p-6 space-y-8">
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/rentals?action=new">
            <Plus className="mr-2 h-4 w-4" />
            Neue Ausleihe
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg" className="shadow-sm hover:shadow-md transition-shadow">
          <Link href="/reservations?action=new">
            <Calendar className="mr-2 h-4 w-4" />
            Neue Reservierung
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg" className="shadow-sm hover:shadow-md transition-shadow">
          <Link href="/customers?action=new">
            <Users className="mr-2 h-4 w-4" />
            Neue:r Nutzer:in
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg" className="shadow-sm hover:shadow-md transition-shadow">
          <Link href="/items?action=new">
            <Package className="mr-2 h-4 w-4" />
            Neuer Gegenstand
          </Link>
        </Button>
      </div>

      {/* 4x4 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 auto-rows-fr">
        {/* Top Left: Stats (2x2 grid of 4 stats) */}
        <div className="lg:col-span-2 lg:row-span-1">
          <div className="grid grid-cols-2 gap-4 h-full">
            <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nutzer:innen</CardTitle>
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {loading ? '...' : stats.totalCustomers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Gesamt registriert</p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gegenstände</CardTitle>
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {loading ? '...' : stats.totalItems}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Im Inventar</p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktive Ausleihen</CardTitle>
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {loading ? '...' : stats.activeRentals}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Aktuell ausgeliehen</p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Überfällig</CardTitle>
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700 dark:text-red-300">
                  {loading ? '...' : stats.overdueRentals}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Rückgabe überfällig</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Right: Notes Section */}
        <div className="lg:col-span-2 lg:row-span-1">
          <div className="h-full">
            <DashboardNotes />
          </div>
        </div>

        {/* Bottom Left: Active Rentals */}
        <div className="lg:col-span-2 lg:row-span-1">
          <div className="h-full">
            <ActiveRentalsSection onRentalReturned={loadStats} />
          </div>
        </div>

        {/* Bottom Right: Today's Reservations */}
        <div className="lg:col-span-2 lg:row-span-1">
          <div className="h-full">
            <TodaysReservationsSection onReservationCompleted={loadStats} />
          </div>
        </div>
      </div>
    </div>
  );
}
