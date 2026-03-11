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
import { usePerformanceStore } from '@/stores/performanceStore';
import { useNetworkStore } from '@/stores/networkStore';
import { eventBus } from '@/lib/eventBus';

interface PosTicketData {
  saleId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'MIXTO';
  amountReceived: number;
  change: number;
  cashier: string;
  date: string;
  notes?: string;
  branchName?: string;
}

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (
    sale: any,
    ticketData: PosTicketData,
    meta?: {
      syncMode: 'online' | 'queued';
      itemsSold: Array<{ productId: number; quantity: number }>;
    }
  ) => void;
  selectedBranchId?: number;
}

export function PaymentDialog({
  isOpen,
  onClose,
  onPaymentComplete,
  selectedBranchId
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'MIXTO'>('EFECTIVO');
  const [amountReceived, setAmountReceived] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changeAmount, setChangeAmount] = useState(0);
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');

  const { items, total, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { useBasicMode } = usePerformanceStore();
  const networkStatus = useNetworkStore((state) => state.healthStatus);

  const getSelectedBranchId = () => {
    if (selectedBranchId) return selectedBranchId;
    const storedBranchId = localStorage.getItem('pos_branch_id');
    return storedBranchId ? Number(storedBranchId) : undefined;
  };

  // Calcular cambio automáticamente y validar montos en MIXTO
  useEffect(() => {
    if (paymentMethod === 'EFECTIVO' && amountReceived) {
      const received = parseFloat(amountReceived);
      if (!isNaN(received) && received >= total) {
        setChangeAmount(received - total);
      } else {
        setChangeAmount(0);
      }
    } else if (paymentMethod === 'MIXTO') {
      // En MIXTO no hay cambio, solo vista previa de la suma
      const cash = parseFloat(cashAmount) || 0;
      const card = parseFloat(cardAmount) || 0;
      // Validación visual pero no se calcula cambio en MIXTO
      setChangeAmount(0);
    } else {
      setChangeAmount(0);
    }
  }, [amountReceived, cashAmount, cardAmount, total, paymentMethod]);

  // Validar pago
  const validatePayment = (): boolean => {
    if (!user) {
      setError('Usuario no autenticado');
      return false;
    }

    const selectedBranchId = getSelectedBranchId();

    // Validar sucursal para venta
    if (user.role === 'ADMIN') {
      if (!selectedBranchId) {
        setError('Selecciona una sucursal para registrar la venta.');
        toast.error('No se puede completar la venta', {
          description: 'Selecciona una sucursal en el POS antes de cobrar.'
        });
        return false;
      }
    } else if (!user.branchId) {
      setError('Tu usuario no tiene una sucursal asignada. Contacta al administrador.');
      toast.error('No se puede completar la venta', {
        description: 'Tu usuario necesita tener una sucursal asignada. Contacta al administrador.'
      });
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
    } else if (paymentMethod === 'MIXTO') {
      if (!cashAmount || cashAmount.trim() === '') {
        setError('Ingresa el monto en efectivo');
        return false;
      }
      if (!cardAmount || cardAmount.trim() === '') {
        setError('Ingresa el monto en tarjeta');
        return false;
      }
      const cash = parseFloat(cashAmount);
      const card = parseFloat(cardAmount);
      if (isNaN(cash) || cash < 0) {
        setError('Monto en efectivo inválido');
        return false;
      }
      if (isNaN(card) || card < 0) {
        setError('Monto en tarjeta inválido');
        return false;
      }
      const totalMixto = cash + card;
      if (Math.abs(totalMixto - total) > 0.01) {
        setError(`La suma de efectivo ($${cash.toFixed(2)}) + tarjeta ($${card.toFixed(2)}) debe ser exactamente $${total.toFixed(2)}`);
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
      const selectedBranchId = getSelectedBranchId();
      const branchIdToUse = user?.role === 'ADMIN'
        ? selectedBranchId
        : (user?.branchId ?? undefined);

      // Preparar datos de la venta
      // Calcular IVA (16% incluido en el precio)
      const calculatedSubtotal = total / 1.16;
      const calculatedTax = total - calculatedSubtotal;

      let salePayload: any = {
        items: items.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: (item.price * item.quantity) / 1.16, // Subtotal sin IVA
          discount: 0
        })),
        branchId: branchIdToUse,
        paymentMethod,
        discount: 0,
        tax: calculatedTax,
        notes: notes.trim() || undefined,
        source: 'DESKTOP'
      };

      if (paymentMethod === 'EFECTIVO') {
        salePayload.amountReceived = parseFloat(amountReceived);
        salePayload.changeAmount = changeAmount;
      } else if (paymentMethod === 'MIXTO') {
        // Para pago mixto, guardar los montos desglosados
        salePayload.amountReceived = parseFloat(cashAmount) + parseFloat(cardAmount);
        salePayload.cashAmount = parseFloat(cashAmount);
        salePayload.cardAmount = parseFloat(cardAmount);
      }
      // Para TARJETA pura no se agrega amountReceived

      const saleData = salePayload;

      // Llamar al servicio de ventas
      const saleResult = await saleService.createSaleAdaptive(saleData);
      const sale = saleResult.sale;
      const saleIdString = saleResult.displaySaleId;

      // Notificar éxito con toast
      if (saleResult.mode === 'online') {
        toast.success('¡Venta completada!', {
          description: `Total: $${sale.total} - Venta #${saleIdString.slice(0, 8)}`,
          duration: 5000,
        });
      } else {
        toast.warning('Venta guardada localmente', {
          description: `Folio ${saleIdString}. Se sincronizara cuando mejore la conexion (${networkStatus}).`,
          duration: 6000,
        });
      }

      // Notificar al CustomerDisplay con el método de pago
      if (window.electronAPI?.notifyPaymentMethod) {
        window.electronAPI.notifyPaymentMethod({
          method: paymentMethod,
          total: sale.total || total,
          saleId: saleIdString
        });
      } else {
        // Fallback usando eventBus
        eventBus.emit('PAYMENT_METHOD', {
          method: paymentMethod,
          total: sale.total || total,
          saleId: saleIdString
        });
      }

      // Notificar al CustomerDisplay que muestre mensaje de éxito
      if (window.electronAPI?.notifyPaymentCompleted) {
        window.electronAPI.notifyPaymentCompleted({
          total: sale.total || total,
          saleId: saleIdString
        });
      } else {
        // Fallback usando eventBus
        eventBus.emit('PAYMENT_COMPLETED', {
          total: sale.total || total,
          saleId: saleIdString
        });
      }

      // Callback con la venta
      const resolvedBranchName = user?.role === 'ADMIN'
        ? (selectedBranchId
            ? localStorage.getItem('pos_branch_name') || 'Sucursal'
            : 'Todas las sucursales')
        : (user?.branch?.name || 'Sucursal');

      const ticketData: PosTicketData = {
        saleId: saleIdString,
        items: items.map(item => {
          const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
          return {
            name: item.name,
            quantity: item.quantity,
            price,
            subtotal: price * item.quantity,
          };
        }),
        subtotal: calculatedSubtotal,
        tax: calculatedTax,
        total: total,
        paymentMethod,
        amountReceived: paymentMethod === 'EFECTIVO' ? parseFloat(amountReceived) : total,
        change: changeAmount,
        cashier: user?.name || user?.username || 'Cajero',
        date: new Date().toLocaleString('es-MX'),
        notes: notes || undefined,
        branchName: resolvedBranchName,
      };

      onPaymentComplete(sale, ticketData, {
        syncMode: saleResult.mode,
        itemsSold: items.map((item) => ({
          productId: Number(item.id),
          quantity: item.quantity,
        })),
      });

      // Limpiar carrito
      clearCart();

      // Notificar que el carrito se limpió
      eventBus.emit('CART_CLEARED', {});

      // Cerrar diálogo
      onClose();

      // Resetear formulario
      setPaymentMethod('EFECTIVO');
      setAmountReceived('');
      setCashAmount('');
      setCardAmount('');
      setNotes('');
      setError(null);
    } catch (err: any) {
      const errorMessage =
        err?.data?.message ||
        err?.message ||
        'Error al procesar el pago. Intenta de nuevo.';
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
      setCashAmount('');
      setCardAmount('');
      setNotes('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${useBasicMode ? 'bg-black/90' : 'bg-black/50'}`}>
      <Card className={`w-full max-w-lg max-h-[90vh] overflow-y-auto ${useBasicMode ? '' : 'animate-in fade-in zoom-in-95 duration-200'}`}>
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

          {/* Input para pago mixto (efectivo + tarjeta) */}
          {paymentMethod === 'MIXTO' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                <p className="text-sm font-medium text-purple-900 mb-3">Desglose de Pago Mixto</p>
                
                <div className="space-y-3">
                  {/* Monto en efectivo */}
                  <div>
                    <Label htmlFor="cashAmount" className="text-sm font-semibold text-purple-900">
                      💵 Monto en Efectivo
                    </Label>
                    <Input
                      id="cashAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={cashAmount}
                      onChange={(e) => {
                        setCashAmount(e.target.value);
                        // Auto-completar tarjeta
                        const cash = parseFloat(e.target.value) || 0;
                        const card = total - cash;
                        setCardAmount(card >= 0 ? card.toFixed(2) : '');
                        setError(null);
                      }}
                      disabled={loading}
                      className="text-lg mt-1"
                    />
                  </div>

                  {/* Monto en tarjeta */}
                  <div>
                    <Label htmlFor="cardAmount" className="text-sm font-semibold text-purple-900">
                      💳 Monto en Tarjeta
                    </Label>
                    <Input
                      id="cardAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={cardAmount}
                      onChange={(e) => {
                        setCardAmount(e.target.value);
                        // Auto-completar efectivo
                        const card = parseFloat(e.target.value) || 0;
                        const cash = total - card;
                        setCashAmount(cash >= 0 ? cash.toFixed(2) : '');
                        setError(null);
                      }}
                      disabled={loading}
                      className="text-lg mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Validación visual de suma */}
              {cashAmount && cardAmount && (
                <div className={`p-3 rounded-lg border-2 ${
                  Math.abs((parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0) - total) < 0.01
                    ? 'bg-green-50 border-green-200'
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-medium ${
                      Math.abs((parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0) - total) < 0.01
                        ? 'text-green-700'
                        : 'text-orange-700'
                    }`}>
                      Total: ${((parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0)).toFixed(2)}
                    </span>
                    <span className={`font-bold text-lg ${
                      Math.abs((parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0) - total) < 0.01
                        ? 'text-green-700'
                        : 'text-orange-700'
                    }`}>
                      {Math.abs((parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0) - total) < 0.01 ? '✓' : '✗'}
                    </span>
                  </div>
                  <p className={`text-xs ${
                    Math.abs((parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0) - total) < 0.01
                      ? 'text-green-700'
                      : 'text-orange-700'
                  }`}>
                    Debe ser exactamente ${total.toFixed(2)}
                  </p>
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
