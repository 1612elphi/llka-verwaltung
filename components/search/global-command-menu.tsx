/**
 * Global command menu (Cmd+K) for searching across all entities
 */

'use client';

import { useEffect, useState } from 'react';
import { useCommandMenu } from '@/hooks/use-command-menu';
import { collections } from '@/lib/pocketbase/client';
import type { Customer, Item, Reservation, RentalExpanded } from '@/types';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Search, User, Package, Calendar, FileText } from 'lucide-react';

interface SearchResults {
  customers: Customer[];
  items: Item[];
  reservations: Reservation[];
  rentals: RentalExpanded[];
}

export function GlobalCommandMenu() {
  const { open, setOpen, navigateTo } = useCommandMenu();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    customers: [],
    items: [],
    reservations: [],
    rentals: [],
  });
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search across all entities
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ customers: [], items: [], reservations: [], rentals: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchTerm = query.toLowerCase();

        // Search in parallel
        const [customers, items, reservations, rentals] = await Promise.all([
          // Customers: search by name, email, phone
          collections.customers().getList<Customer>(1, 5, {
            filter: `firstname ~ "${searchTerm}" || lastname ~ "${searchTerm}" || email ~ "${searchTerm}" || phone ~ "${searchTerm}"`,
            sort: '-created',
          }),
          // Items: search by name, brand, iid
          collections.items().getList<Item>(1, 5, {
            filter: `name ~ "${searchTerm}" || brand ~ "${searchTerm}" || iid ~ "${searchTerm}"`,
            sort: '-created',
          }),
          // Reservations: search by customer name, phone
          collections.reservations().getList<Reservation>(1, 5, {
            filter: `customer_name ~ "${searchTerm}" || customer_phone ~ "${searchTerm}"`,
            sort: '-created',
            expand: 'items',
          }),
          // Rentals: search by customer name
          collections.rentals().getList<RentalExpanded>(1, 5, {
            filter: `customer.firstname ~ "${searchTerm}" || customer.lastname ~ "${searchTerm}"`,
            sort: '-created',
            expand: 'customer,items',
          }),
        ]);

        setResults({
          customers: customers.items,
          items: items.items,
          reservations: reservations.items,
          rentals: rentals.items,
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const totalResults =
    results.customers.length +
    results.items.length +
    results.reservations.length +
    results.rentals.length;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Suche Kund:innen, Gegenstände, Reservierungen, Leihvorgänge..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? 'Suche läuft...' : 'Keine Ergebnisse gefunden.'}
        </CommandEmpty>

        {/* Quick Navigation */}
        {!query && (
          <CommandGroup heading="Schnellnavigation">
            <CommandItem
              onSelect={() => navigateTo('/customers')}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span>Kund:innen</span>
            </CommandItem>
            <CommandItem
              onSelect={() => navigateTo('/items')}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              <span>Gegenstände</span>
            </CommandItem>
            <CommandItem
              onSelect={() => navigateTo('/reservations')}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Reservierungen</span>
            </CommandItem>
            <CommandItem
              onSelect={() => navigateTo('/rentals')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              <span>Leihvorgänge</span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Customers */}
        {results.customers.length > 0 && (
          <>
            {!query && <CommandSeparator />}
            <CommandGroup heading={`Kund:innen (${results.customers.length})`}>
              {results.customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={`customer-${customer.id}`}
                  onSelect={() => navigateTo(`/customers?id=${customer.id}`)}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {customer.firstname} {customer.lastname}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground font-mono">
                    #{String(customer.iid).padStart(4, '0')}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Items */}
        {results.items.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Gegenstände (${results.items.length})`}>
              {results.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`item-${item.id}`}
                  onSelect={() => navigateTo(`/items?id=${item.id}`)}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{item.name}</span>
                  {item.brand && (
                    <span className="text-xs text-muted-foreground">
                      ({item.brand})
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground font-mono">
                    #{String(item.iid).padStart(4, '0')}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Reservations */}
        {results.reservations.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Reservierungen (${results.reservations.length})`}>
              {results.reservations.map((reservation) => (
                <CommandItem
                  key={reservation.id}
                  value={`reservation-${reservation.id}`}
                  onSelect={() => navigateTo(`/reservations?id=${reservation.id}`)}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{reservation.customer_name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(reservation.pickup).toLocaleDateString('de-DE')}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Rentals */}
        {results.rentals.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Leihvorgänge (${results.rentals.length})`}>
              {results.rentals.map((rental) => (
                <CommandItem
                  key={rental.id}
                  value={`rental-${rental.id}`}
                  onSelect={() => navigateTo(`/rentals?id=${rental.id}`)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {rental.expand?.customer
                      ? `${rental.expand.customer.firstname} ${rental.expand.customer.lastname}`
                      : 'Unbekannt'}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(rental.rented_on).toLocaleDateString('de-DE')}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Search hint */}
        {query && totalResults > 0 && (
          <div className="px-2 py-1 text-xs text-muted-foreground text-center border-t">
            {totalResults} Ergebnis{totalResults !== 1 ? 'se' : ''} gefunden
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
