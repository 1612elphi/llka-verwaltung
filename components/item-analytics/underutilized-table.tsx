/**
 * Underutilized Items Table
 * Shows items with low utilization or idle status
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangleIcon } from 'lucide-react';
import type { ItemAnalytics } from '@/lib/utils/item-stats';
import { getCategoryLabel } from '@/lib/constants/categories';

interface UnderutilizedTableProps {
  items: ItemAnalytics[];
}

export function UnderutilizedTable({ items }: UnderutilizedTableProps) {
  // Filter for low performers and idle items
  const underutilized = items
    .filter(item =>
      item.performance_category === 'low' ||
      item.performance_category === 'idle' ||
      item.utilization_rate < 20
    )
    .sort((a, b) => a.utilization_rate - b.utilization_rate)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangleIcon className="h-5 w-5 text-orange-500" />
          <span>Wenig genutzte Gegenstände</span>
        </CardTitle>
        <CardDescription>
          Gegenstände mit geringer Auslastung (&lt;20%) oder über 90 Tage nicht ausgeliehen
        </CardDescription>
      </CardHeader>
      <CardContent>
        {underutilized.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left py-3 px-4">Gegenstand</th>
                  <th className="text-left py-3 px-4">Kategorie</th>
                  <th className="text-center py-3 px-4">Ausleihen</th>
                  <th className="text-center py-3 px-4">Auslastung</th>
                  <th className="text-center py-3 px-4">Zuletzt ausgeliehen</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Empfehlung</th>
                </tr>
              </thead>
              <tbody>
                {underutilized.map((item) => {
                  const isIdle = item.performance_category === 'idle';
                  const isNew = item.days_in_inventory < 30;

                  return (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
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
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.total_rentals}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-medium ${
                            item.utilization_rate < 10 ? 'text-red-600' :
                            item.utilization_rate < 20 ? 'text-orange-600' :
                            'text-muted-foreground'
                          }`}>
                            {item.utilization_rate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.days_since_last_rental !== null ? (
                          <span className={`text-sm ${
                            item.days_since_last_rental > 90 ? 'text-red-600 font-semibold' :
                            'text-muted-foreground'
                          }`}>
                            vor {item.days_since_last_rental} Tagen
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Nie</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={isIdle ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {isIdle ? 'Inaktiv' : 'Niedrig'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {isNew ? (
                          <span>Zu neu für Bewertung</span>
                        ) : isIdle && item.total_rentals === 0 ? (
                          <span className="text-red-600">Auslistung erwägen</span>
                        ) : isIdle ? (
                          <span className="text-orange-600">Re-Marketing oder Auslistung</span>
                        ) : item.utilization_rate < 10 ? (
                          <span className="text-orange-600">Nachfrage prüfen</span>
                        ) : (
                          <span>Beobachten</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-2">
              Keine wenig genutzten Gegenstände gefunden
            </p>
            <p className="text-xs text-muted-foreground">
              Alle Gegenstände haben eine gute Auslastung! 🎉
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
