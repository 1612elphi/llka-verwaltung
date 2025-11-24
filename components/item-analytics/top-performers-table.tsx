/**
 * Top Performers Table
 * Shows items with highest rental counts and utilization
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrophyIcon } from 'lucide-react';
import type { ItemAnalytics } from '@/lib/utils/item-stats';
import { getCategoryLabel } from '@/lib/constants/categories';

interface TopPerformersTableProps {
  items: ItemAnalytics[];
}

export function TopPerformersTable({ items }: TopPerformersTableProps) {
  // Sort by total rentals and take top 10
  const topPerformers = [...items]
    .sort((a, b) => b.total_rentals - a.total_rentals)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-yellow-500" />
          <span>Top-Performer</span>
        </CardTitle>
        <CardDescription>
          Die 10 am häufigsten ausgeliehenen Gegenstände
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topPerformers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left py-3 px-4">Rang</th>
                  <th className="text-left py-3 px-4">Gegenstand</th>
                  <th className="text-left py-3 px-4">Kategorie</th>
                  <th className="text-center py-3 px-4">Ausleihen</th>
                  <th className="text-center py-3 px-4">Auslastung</th>
                  <th className="text-center py-3 px-4">Frequenz</th>
                  <th className="text-center py-3 px-4">Leistung</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((item, index) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <span className="text-lg">🥇</span>}
                        {index === 1 && <span className="text-lg">🥈</span>}
                        {index === 2 && <span className="text-lg">🥉</span>}
                        {index > 2 && <span className="text-muted-foreground">#{index + 1}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {String(item.iid).padStart(4, '0')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.category.slice(0, 2).map(cat => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {getCategoryLabel(cat)}
                          </Badge>
                        ))}
                        {item.category.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.category.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">
                      {item.total_rentals}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{item.utilization_rate.toFixed(1)}%</span>
                        <div className="w-16 bg-muted rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              item.utilization_rate > 50 ? 'bg-green-500' :
                              item.utilization_rate > 20 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, item.utilization_rate)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm">{item.rental_frequency.toFixed(1)}/Jahr</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          item.performance_category === 'high' ? 'default' :
                          item.performance_category === 'medium' ? 'secondary' :
                          'outline'
                        }
                        className="text-xs"
                      >
                        {item.performance_category === 'high' ? 'Hoch' :
                         item.performance_category === 'medium' ? 'Mittel' : 'Niedrig'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Keine Daten verfügbar
          </p>
        )}
      </CardContent>
    </Card>
  );
}
