/**
 * Reservation Detail Sheet Component
 * Displays and edits reservation information (edit mode by default)
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
import { formatDate, formatCurrency } from '@/lib/utils/formatting';
import type { Reservation, ReservationExpanded, Customer, Item } from '@/types';

// Validation schema
const reservationSchema = z.object({
  customer_iid: z.number().optional(),
  customer_name: z.string().min(1, 'Kundenname ist erforderlich'),
  customer_phone: z.string().optional(),
  customer_email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal('')),
  is_new_customer: z.boolean(),
  item_ids: z.array(z.string()).min(1, 'Mindestens ein Artikel ist erforderlich'),
  pickup: z.string(),
  comments: z.string().optional(),
  done: z.boolean(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

interface ReservationDetailSheetProps {
  reservation: ReservationExpanded | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (reservation: Reservation) => void;
}

export function ReservationDetailSheet({
  reservation,
  open,
  onOpenChange,
  onSave,
}: ReservationDetailSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const isNewReservation = !reservation?.id;

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      customer_iid: undefined,
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      is_new_customer: false,
      item_ids: [],
      pickup: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM
      comments: '',
      done: false,
    },
  });

  const { formState: { isDirty }, watch } = form;
  const isNewCustomer = watch('is_new_customer');
  const selectedCustomerIid = watch('customer_iid');

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

  // Auto-fill customer name when selecting existing customer
  useEffect(() => {
    if (!isNewCustomer && selectedCustomerIid) {
      const customer = customers.find((c) => c.iid === selectedCustomerIid);
      if (customer) {
        form.setValue('customer_name', `${customer.firstname} ${customer.lastname}`);
        form.setValue('customer_phone', customer.phone || '');
        form.setValue('customer_email', customer.email || '');
      }
    }
  }, [selectedCustomerIid, isNewCustomer, customers, form]);

  // Load reservation data when reservation changes
  useEffect(() => {
    if (reservation) {
      form.reset({
        customer_iid: reservation.customer_iid || undefined,
        customer_name: reservation.customer_name,
        customer_phone: reservation.customer_phone || '',
        customer_email: reservation.customer_email || '',
        is_new_customer: reservation.is_new_customer,
        item_ids: reservation.items,
        pickup: reservation.pickup.slice(0, 16), // Convert to datetime-local format
        comments: reservation.comments || '',
        done: reservation.done,
      });
    } else if (isNewReservation) {
      form.reset({
        customer_iid: undefined,
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        is_new_customer: false,
        item_ids: [],
        pickup: new Date().toISOString().slice(0, 16),
        comments: '',
        done: false,
      });
    }
  }, [reservation, isNewReservation, form]);

  const handleSave = async (data: ReservationFormValues) => {
    setIsLoading(true);
    try {
      const formData: Partial<Reservation> = {
        customer_iid: data.is_new_customer ? undefined : data.customer_iid,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone || undefined,
        customer_email: data.customer_email || undefined,
        is_new_customer: data.is_new_customer,
        items: data.item_ids,
        pickup: data.pickup,
        comments: data.comments || undefined,
        done: data.done,
      };

      let savedReservation: Reservation;
      if (isNewReservation) {
        savedReservation = await collections.reservations().create<Reservation>(formData);
        toast.success('Reservierung erfolgreich erstellt');
      } else if (reservation) {
        savedReservation = await collections.reservations().update<Reservation>(reservation.id, formData);
        toast.success('Reservierung erfolgreich aktualisiert');
      } else {
        return;
      }

      onSave?.(savedReservation);
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving reservation:', err);
      toast.error('Fehler beim Speichern der Reservierung');
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
                {isNewReservation ? 'Neue Reservierung' : 'Reservierung bearbeiten'}
              </SheetTitle>
              {reservation && (
                <Badge variant={reservation.done ? 'secondary' : 'default'}>
                  {reservation.done ? 'Erledigt' : 'Offen'}
                </Badge>
              )}
            </div>
          </SheetHeader>

          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6 py-6">
            {/* Customer Information */}
            <section>
              <h3 className="font-semibold text-lg mb-4">Kundeninformationen</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    id="is_new_customer"
                    type="checkbox"
                    {...form.register('is_new_customer')}
                  />
                  <Label htmlFor="is_new_customer" className="cursor-pointer">
                    Neuer Kunde (noch nicht registriert)
                  </Label>
                </div>

                {!isNewCustomer && (
                  <div>
                    <Label htmlFor="customer_iid">Bestehender Kunde</Label>
                    <select
                      id="customer_iid"
                      {...form.register('customer_iid', { valueAsNumber: true })}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={isLoadingData}
                    >
                      <option value="">Kunde auswählen...</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.iid}>
                          #{String(customer.iid).padStart(4, '0')} - {customer.firstname} {customer.lastname}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <Label htmlFor="customer_name">Name *</Label>
                  <Input
                    id="customer_name"
                    {...form.register('customer_name')}
                    className="mt-1"
                    readOnly={!isNewCustomer && !!selectedCustomerIid}
                  />
                  {form.formState.errors.customer_name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.customer_name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_phone">Telefon</Label>
                    <Input
                      id="customer_phone"
                      {...form.register('customer_phone')}
                      className="mt-1"
                      readOnly={!isNewCustomer && !!selectedCustomerIid}
                    />
                  </div>

                  <div>
                    <Label htmlFor="customer_email">E-Mail</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      {...form.register('customer_email')}
                      className="mt-1"
                      readOnly={!isNewCustomer && !!selectedCustomerIid}
                    />
                    {form.formState.errors.customer_email && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.customer_email.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Items */}
            <section>
              <h3 className="font-semibold text-lg mb-4">Artikel</h3>
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
                {reservation?.expand?.items && reservation.expand.items.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {reservation.expand.items.map((item) => (
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
            </section>

            {/* Reservation Details */}
            <section>
              <h3 className="font-semibold text-lg mb-4">Reservierungsdetails</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pickup">Abholung (Datum & Zeit) *</Label>
                  <Input
                    id="pickup"
                    type="datetime-local"
                    {...form.register('pickup')}
                    className="mt-1"
                  />
                  {form.formState.errors.pickup && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.pickup.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="comments">Kommentar</Label>
                  <Textarea
                    id="comments"
                    {...form.register('comments')}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="done"
                    type="checkbox"
                    {...form.register('done')}
                  />
                  <Label htmlFor="done" className="cursor-pointer">
                    Reservierung erledigt
                  </Label>
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
