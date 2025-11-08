/**
 * Rental Detail Sheet Component
 * Displays and edits rental information (edit mode by default)
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { SaveIcon, XIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { collections } from '@/lib/pocketbase/client';
import { formatDate, formatCurrency, calculateRentalStatus } from '@/lib/utils/formatting';
import type { Rental, RentalExpanded, Customer, Item } from '@/types';

// Validation schema
const rentalSchema = z.object({
  customer_id: z.string().min(1, 'Kunde ist erforderlich'),
  item_ids: z.array(z.string()).min(1, 'Mindestens ein Artikel ist erforderlich'),
  deposit: z.number().min(0, 'Kaution muss positiv sein'),
  deposit_back: z.number().min(0, 'Rückkaution muss positiv sein'),
  rented_on: z.string(),
  returned_on: z.string().optional(),
  expected_on: z.string(),
  extended_on: z.string().optional(),
  remark: z.string().optional(),
  employee: z.string().optional(),
  employee_back: z.string().optional(),
});

type RentalFormValues = z.infer<typeof rentalSchema>;

interface RentalDetailSheetProps {
  rental: RentalExpanded | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (rental: Rental) => void;
}

export function RentalDetailSheet({
  rental,
  open,
  onOpenChange,
  onSave,
}: RentalDetailSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const isNewRental = !rental?.id;

  const form = useForm<RentalFormValues>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      customer_id: '',
      item_ids: [],
      deposit: 0,
      deposit_back: 0,
      rented_on: new Date().toISOString().split('T')[0],
      returned_on: '',
      expected_on: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 days
      extended_on: '',
      remark: '',
      employee: '',
      employee_back: '',
    },
  });

  const { formState: { isDirty } } = form;

  // Load customers and items for dropdowns
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      // Load customers
      const customersResult = await collections.customers().getList<Customer>(1, 500, {
        sort: 'lastname,firstname',
      });
      setCustomers(customersResult.items);

      // Load items
      const itemsResult = await collections.items().getList<Item>(1, 500, {
        sort: 'name',
        filter: 'status!="deleted"',
      });
      setItems(itemsResult.items);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load rental data when rental changes
  useEffect(() => {
    if (rental) {
      form.reset({
        customer_id: rental.customer,
        item_ids: rental.items,
        deposit: rental.deposit,
        deposit_back: rental.deposit_back,
        rented_on: rental.rented_on.split('T')[0],
        returned_on: rental.returned_on?.split('T')[0] || '',
        expected_on: rental.expected_on.split('T')[0],
        extended_on: rental.extended_on?.split('T')[0] || '',
        remark: rental.remark || '',
        employee: rental.employee || '',
        employee_back: rental.employee_back || '',
      });
    } else if (isNewRental) {
      form.reset({
        customer_id: '',
        item_ids: [],
        deposit: 0,
        deposit_back: 0,
        rented_on: new Date().toISOString().split('T')[0],
        returned_on: '',
        expected_on: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        extended_on: '',
        remark: '',
        employee: '',
        employee_back: '',
      });
    }
  }, [rental, isNewRental, form]);

  const handleSave = async (data: RentalFormValues) => {
    setIsLoading(true);
    try {
      const formData: Partial<Rental> = {
        customer: data.customer_id,
        items: data.item_ids,
        deposit: data.deposit,
        deposit_back: data.deposit_back,
        rented_on: data.rented_on,
        returned_on: data.returned_on || undefined,
        expected_on: data.expected_on,
        extended_on: data.extended_on || undefined,
        remark: data.remark || undefined,
        employee: data.employee || undefined,
        employee_back: data.employee_back || undefined,
      };

      let savedRental: Rental;
      if (isNewRental) {
        savedRental = await collections.rentals().create<Rental>(formData);
        toast.success('Leihvorgang erfolgreich erstellt');
      } else if (rental) {
        savedRental = await collections.rentals().update<Rental>(rental.id, formData);
        toast.success('Leihvorgang erfolgreich aktualisiert');
      } else {
        return;
      }

      onSave?.(savedRental);
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving rental:', err);
      toast.error('Fehler beim Speichern des Leihvorgangs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    form.reset();
    onOpenChange(false);
  };

  const rentalStatus = rental
    ? calculateRentalStatus(
        rental.rented_on,
        rental.returned_on,
        rental.expected_on,
        rental.extended_on
      )
    : null;

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Aktiv', variant: 'default' as const },
      returned: { label: 'Zurückgegeben', variant: 'secondary' as const },
      overdue: { label: 'Überfällig', variant: 'destructive' as const },
      due_today: { label: 'Heute fällig', variant: 'secondary' as const },
      returned_today: { label: 'Heute zurückgegeben', variant: 'secondary' as const },
    };
    const { label, variant } = statusMap[status as keyof typeof statusMap] || statusMap.active;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(open) => {
        if (!open && isDirty) {
          setShowCancelDialog(true);
        } else {
          onOpenChange(open);
        }
      }}>
        <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle>
                {isNewRental ? 'Neuer Leihvorgang' : 'Leihvorgang bearbeiten'}
              </SheetTitle>
              {rentalStatus && (
                <div>{getStatusBadge(rentalStatus)}</div>
              )}
            </div>
          </SheetHeader>

          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6 py-6">
            {/* Customer and Items */}
            <section>
              <h3 className="font-semibold text-lg mb-4">Kunde & Artikel</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer_id">Kunde *</Label>
                  <select
                    id="customer_id"
                    {...form.register('customer_id')}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={isLoadingData}
                  >
                    <option value="">Kunde auswählen...</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        #{String(customer.iid).padStart(4, '0')} - {customer.firstname} {customer.lastname}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.customer_id && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.customer_id.message}
                    </p>
                  )}
                  {/* Show expanded customer details if editing */}
                  {rental?.expand?.customer && (
                    <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                      <p className="font-medium">
                        {rental.expand.customer.firstname} {rental.expand.customer.lastname}
                      </p>
                      {rental.expand.customer.email && (
                        <p className="text-muted-foreground">{rental.expand.customer.email}</p>
                      )}
                      {rental.expand.customer.phone && (
                        <p className="text-muted-foreground">{rental.expand.customer.phone}</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="item_ids">Artikel *</Label>
                  <select
                    id="item_ids"
                    {...form.register('item_ids')}
                    multiple
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[150px]"
                    disabled={isLoadingData}
                  >
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        #{String(item.iid).padStart(4, '0')} - {item.name} ({formatCurrency(item.deposit)})
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.item_ids && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.item_ids.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Halten Sie Strg/Cmd für Mehrfachauswahl
                  </p>
                  {/* Show expanded item details if editing */}
                  {rental?.expand?.items && rental.expand.items.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {rental.expand.items.map((item) => (
                        <div key={item.id} className="p-3 bg-muted rounded-md text-sm">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-muted-foreground">
                            Kaution: {formatCurrency(item.deposit)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Dates */}
            <section>
              <h3 className="font-semibold text-lg mb-4">Zeitraum</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rented_on">Ausgeliehen am *</Label>
                  <Input
                    id="rented_on"
                    type="date"
                    {...form.register('rented_on')}
                    className="mt-1"
                  />
                  {form.formState.errors.rented_on && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.rented_on.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="expected_on">Erwartet am *</Label>
                  <Input
                    id="expected_on"
                    type="date"
                    {...form.register('expected_on')}
                    className="mt-1"
                  />
                  {form.formState.errors.expected_on && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.expected_on.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="extended_on">Verlängert bis</Label>
                  <Input
                    id="extended_on"
                    type="date"
                    {...form.register('extended_on')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="returned_on">Zurückgegeben am</Label>
                  <Input
                    id="returned_on"
                    type="date"
                    {...form.register('returned_on')}
                    className="mt-1"
                  />
                </div>
              </div>
            </section>

            {/* Financial */}
            <section>
              <h3 className="font-semibold text-lg mb-4">Kaution</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deposit">Kaution gegeben (€) *</Label>
                  <Input
                    id="deposit"
                    type="number"
                    step="0.01"
                    {...form.register('deposit', { valueAsNumber: true })}
                    className="mt-1"
                  />
                  {form.formState.errors.deposit && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.deposit.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="deposit_back">Kaution zurückgegeben (€) *</Label>
                  <Input
                    id="deposit_back"
                    type="number"
                    step="0.01"
                    {...form.register('deposit_back', { valueAsNumber: true })}
                    className="mt-1"
                  />
                  {form.formState.errors.deposit_back && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.deposit_back.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Additional Information */}
            <section>
              <h3 className="font-semibold text-lg mb-4">Zusätzliche Informationen</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee">Mitarbeiter (Ausgabe)</Label>
                  <Input
                    id="employee"
                    {...form.register('employee')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="employee_back">Mitarbeiter (Rückgabe)</Label>
                  <Input
                    id="employee_back"
                    {...form.register('employee_back')}
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="remark">Bemerkung</Label>
                  <Textarea
                    id="remark"
                    {...form.register('remark')}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </section>
          </form>

          <SheetFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <XIcon className="size-4 mr-2" />
              Abbrechen
            </Button>
            <Button
              type="submit"
              onClick={form.handleSubmit(handleSave)}
              disabled={isLoading || isLoadingData}
            >
              <SaveIcon className="size-4 mr-2" />
              {isLoading ? 'Speichern...' : 'Speichern'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Änderungen verwerfen?</DialogTitle>
            <DialogDescription>
              Sie haben ungespeicherte Änderungen. Möchten Sie diese wirklich verwerfen?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Zurück
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              Verwerfen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
