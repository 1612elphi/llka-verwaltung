/**
 * Analytics Overview Cards
 * Displays high-level aggregate metrics
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PackageIcon, BoxIcon, ClipboardListIcon, TrendingUpIcon, StarIcon } from 'lucide-react';
import type { AggregateAnalytics } from '@/lib/utils/item-stats';
import { getCategoryLabel } from '@/lib/constants/categories';

interface AnalyticsOverviewProps {
  analytics: AggregateAnalytics;
}

export function AnalyticsOverview({ analytics }: AnalyticsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Total Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gesamt Gegenstände</CardTitle>
          <PackageIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total_items}</div>
          <p className="text-xs text-muted-foreground">
            Im Bestand
          </p>
        </CardContent>
      </Card>

      {/* Items in Stock */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Verfügbar</CardTitle>
          <BoxIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.items_in_stock}</div>
          <p className="text-xs text-muted-foreground">
            {((analytics.items_in_stock / analytics.total_items) * 100).toFixed(0)}% auf Lager
          </p>
        </CardContent>
      </Card>

      {/* Total Rentals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gesamt Ausleihen</CardTitle>
          <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total_rentals.toLocaleString('de-DE')}</div>
          <p className="text-xs text-muted-foreground">
            Alle Zeiten
          </p>
        </CardContent>
      </Card>

      {/* Average Utilization */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ø Auslastung</CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.average_utilization.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Durchschnittliche Nutzung
          </p>
        </CardContent>
      </Card>

      {/* Most Popular Category */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Beliebteste Kategorie</CardTitle>
          <StarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate">
            {analytics.most_popular_category
              ? getCategoryLabel(analytics.most_popular_category)
              : '—'}
          </div>
          <p className="text-xs text-muted-foreground">
            {analytics.most_popular_category
              ? `${analytics.category_rentals[analytics.most_popular_category]} Ausleihen`
              : 'Keine Daten'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
