import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useCartStore } from '@/stores/cartStore';
import { saleService } from '@/lib/saleService';
import { useAuthStore } from '@/stores/authStore';
import { eventBus } from '@/lib/eventBus';
import { formatDate } from '@/lib/utils';

// Type definition para window.api (Electron)
declare global {
  interface Window {
    api?: {
      printTicket: (ticketData: any) => Promise<{ success: boolean; error?: string }>;
    }
  }
}

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (sale: any) => void;
}

export function PaymentDialog({
  isOpen,
  onClose,
  onPaymentComplete
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'MIXTO'>('EFECTIVO');
  const [amountReceived, setAmountReceived] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changeAmount, setChangeAmount] = useState(0);

  const { items, total, clearCart } = useCartStore();
  const { user } = useAuthStore();

  // Calcular cambio automáticamente
  useEffect(() => {
    if (paymentMethod === 'EFECTIVO' && amountReceived) {
      const received = parseFloat(amountReceived);
      if (!isNaN(received) && received >= total) {
        setChangeAmount(received - total);
      } else {
        setChangeAmount(0);
      }
    } else {
      setChangeAmount(0);
    }
  }, [amountReceived, total, paymentMethod]);

  // Validar pago
  const validatePayment = (): boolean => {
    if (!user) {
      setError('Usuario no autenticado');
      return false;
    }

    if (items.length === 0) {
      setError('El carrito está vacío');
      return false;
    }

    if (paymentMethod === 'EFECTIVO') {
      if (!amountReceived || amountReceived.trim() === '') {
        setError('Ingresa el monto recibido');
        return false;
      }
      const received = parseFloat(amountReceived);
      if (isNaN(received) || received < total) {
        setError(`El monto recibido debe ser al menos $${total.toFixed(2)}`);
        return false;
      }
    }

    return true;
  };

  // Procesar pago
  const handlePayment = async () => {
    if (!validatePayment()) return;

    setLoading(true);
    setError(null);

    try {
      // Preparar datos de la venta
      const saleData = {
        items: items.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity,
          discount: 0
        })),
        paymentMethod,
        amountReceived: paymentMethod === 'EFECTIVO' ? parseFloat(amountReceived) : undefined,
        changeAmount: paymentMethod === 'EFECTIVO' ? changeAmount : undefined,
        discount: 0,
        tax: 0,
        notes: notes.trim() || undefined,
        source: 'DESKTOP'
      };

      // Llamar al servicio de ventas
      const sale = await saleService.createSale(saleData);

      // Notificar éxito con toast
      const saleIdString = String(sale.id || '');
      toast.success('¡Venta completada!', {
        description: `Total: $${sale.total} - Venta #${saleIdString.slice(0, 8)}`,
        duration: 5000
      });

      // Notificar al CustomerDisplay con el método de pago
      if (window.electronAPI?.notifyPaymentMethod) {
        window.electronAPI.notifyPaymentMethod({
          method: paymentMethod,
          total: sale.total,
          saleId: saleIdString
        });
      } else {
        // Fallback usando eventBus
        eventBus.emit('PAYMENT_METHOD', {
          method: paymentMethod,
          total: sale.total,
          saleId: saleIdString
        });
      }

      // Notificar al CustomerDisplay que muestre mensaje de éxito
      if (window.electronAPI?.notifyPaymentCompleted) {
        window.electronAPI.notifyPaymentCompleted({
          total: sale.total,
          saleId: saleIdString
        });
      } else {
        // Fallback usando eventBus
        eventBus.emit('PAYMENT_COMPLETED', {
          total: sale.total,
          saleId: saleIdString
        });
      }

      // Callback con la venta
      onPaymentComplete(sale);

      // Limpiar carrito
      clearCart();

      // Notificar que el carrito se limpió
      eventBus.emit('CART_CLEARED', {});

      // Imprimir ticket
      try {
        const ticketData = {
          saleId: String(sale.id || ''),
          items: items.map(item => {
            const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
            return {
              name: item.name,
              quantity: item.quantity,
              price: price,
              subtotal: price * item.quantity
            };
          }),
          subtotal: total,
          tax: 0, // Puedes calcular IVA si aplica: total * 0.16
          total: total,
          paymentMethod: paymentMethod,
          amountReceived: paymentMethod === 'EFECTIVO' ? parseFloat(amountReceived) : total,
          change: changeAmount,
          cashier: user?.name || 'Cajero',
          date: formatDate(new Date()),
          notes: notes || undefined
        };

        // Verificar si window.api existe (Electron)
        if (window.api && window.api.printTicket) {
          const result = await window.api.printTicket(ticketData);
          if (!result.success) {
            toast.error('Ticket guardado pero no se pudo imprimir');
          } else {
            toast.success('Ticket impreso correctamente');
          }
        }
      } catch (printError) {
        // No bloquear el flujo si falla la impresión
      }

      // Cerrar diálogo
      onClose();

      // Resetear formulario
      setPaymentMethod('EFECTIVO');
      setAmountReceived('');
      setNotes('');
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al procesar el pago. Intenta de nuevo.';
      toast.error('Error en el pago', {
        description: errorMessage
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cerrar diálogo
  const handleClose = () => {
    if (!loading) {
      setPaymentMethod('EFECTIVO');
      setAmountReceived('');
      setNotes('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">Procesar Pago</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Resumen de la venta */}
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Total de items:</span>
              <span className="font-semibold">{items.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total a pagar:</span>
              <span className="text-2xl font-bold text-primary">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Método de pago */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Método de Pago</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value: any) => {
                setPaymentMethod(value);
                setError(null);
              }}
              disabled={loading}
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                <RadioGroupItem value="EFECTIVO" id="efectivo" />
                <Label htmlFor="efectivo" className="flex items-center gap-2 cursor-pointer flex-1">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>Efectivo</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                <RadioGroupItem value="TARJETA" id="tarjeta" />
                <Label htmlFor="tarjeta" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span>Tarjeta</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                <RadioGroupItem value="MIXTO" id="mixto" />
                <Label htmlFor="mixto" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Wallet className="h-5 w-5 text-purple-600" />
                  <span>Mixto (Efectivo + Tarjeta)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Input de monto recibido (solo para efectivo) */}
          {paymentMethod === 'EFECTIVO' && (
            <div className="space-y-2">
              <Label htmlFor="amountReceived" className="text-base font-semibold">
                Monto Recibido
              </Label>
              <Input
                id="amountReceived"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountReceived}
                onChange={(e) => {
                  setAmountReceived(e.target.value);
                  setError(null);
                }}
                disabled={loading}
                className="text-lg"
              />
              {changeAmount > 0 && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 font-medium">Cambio:</span>
                    <span className="text-xl font-bold text-green-700">
                      ${changeAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notas opcionales */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-semibold">
              Notas (opcional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Ej: Cliente frecuente, descuento aplicado, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {notes.length}/500 caracteres
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-lg">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Procesando...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-5 w-5" />
                  Confirmar Pago
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
