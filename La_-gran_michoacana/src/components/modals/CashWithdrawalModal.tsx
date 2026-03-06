import { useState, useMemo } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { branchService } from '@/lib/branchService';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface CashWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashierCutData: any;
  branchId?: number;
  currentBranch?: any;
  onWithdrawalComplete?: () => void;
}

export function CashWithdrawalModal({
  isOpen,
  onClose,
  cashierCutData,
  branchId,
  currentBranch,
  onWithdrawalComplete,
}: CashWithdrawalModalProps) {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [error, setError] = useState('');

  // Calcular el total de efectivo en caja
  const totalCashInDrawer = useMemo(() => {
    if (!cashierCutData?.summary) return 0;
    
    // Usar el initialCash actual del currentBranch si está disponible, 
    // si no, usar el fondoInicial del cashierCutData
    const fondoInicial = Number(currentBranch?.initialCash || cashierCutData.summary.fondoInicial) || 0;
    // Usar realTotal que incluye efectivo de ventas MIXTO
    const efectivoTurno = Number(cashierCutData.paymentMethods?.efectivo?.realTotal || cashierCutData.paymentMethods?.efectivo?.total) || 0;
    
    return fondoInicial + efectivoTurno;
  }, [cashierCutData, currentBranch]);

  const handleWithdrawal = async (isWithdrawing: boolean) => {
    try {
      setLoading(true);
      setError('');

      if (isWithdrawing) {
        if (!withdrawalAmount || withdrawalAmount.trim() === '') {
          setError('Ingresa el monto a retirar');
          return;
        }

        const amount = parseFloat(withdrawalAmount);
        if (isNaN(amount) || amount <= 0) {
          setError('Monto inválid');
          return;
        }

        if (amount > totalCashInDrawer) {
          setError(`No puedes retirar más de $${totalCashInDrawer.toFixed(2)}`);
          return;
        }

        // Actualizar el initialCash en el backend
        const branchIdToUse = branchId || user?.branchId;
        if (!branchIdToUse) {
          setError('No se encontró la sucursal');
          return;
        }

        // El nuevo initialCash es el total menos lo retirado
        const newInitialCash = totalCashInDrawer - amount;
        await branchService.updateInitialCash(branchIdToUse, newInitialCash);

        toast.success(`✅ Retiro de $${amount.toFixed(2)} registrado`);
      } else {
        toast.success(`✅ Corte de caja finalizado anular retiro`);
      }

      onWithdrawalComplete?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar el retiro');
      toast.error('Error al procesar el retiro');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Retiro de Efectivo
          </CardTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Total de efectivo en caja */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">Total de Efectivo en Caja</Label>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <p className="text-2xl font-bold text-blue-700">
                  ${totalCashInDrawer.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Fondo: ${(Number(currentBranch?.initialCash || cashierCutData?.summary?.fondoInicial) || 0).toFixed(2)} + 
                  Efectivo: ${(Number(cashierCutData?.paymentMethods?.efectivo?.realTotal || cashierCutData?.paymentMethods?.efectivo?.total) || 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Opción 1: Sin retiro */}
          <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-sm font-medium text-gray-700">
              Opción 1: Sin retiro
            </p>
            <p className="text-xs text-gray-600 mt-1">
              El dinero se quedará en la caja
            </p>
          </div>

          {/* Opción 2: Con retiro */}
          <div className="p-3 border border-green-200 rounded-lg bg-green-50 space-y-2">
            <p className="text-sm font-medium text-green-700">
              Opción 2: Retiro de efectivo
            </p>
            <div className="space-y-2">
              <Label htmlFor="withdrawalAmount" className="text-xs font-semibold">
                Monto a retirar
              </Label>
              <Input
                id="withdrawalAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={withdrawalAmount}
                onChange={(e) => {
                  setWithdrawalAmount(e.target.value);
                  setError('');
                }}
                disabled={loading}
                className="text-lg"
              />
              {withdrawalAmount && (
                <div className="text-xs text-green-700 font-medium">
                  Quedará en caja: ${(totalCashInDrawer - (parseFloat(withdrawalAmount) || 0)).toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => handleWithdrawal(false)}
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              Sin Retiro
            </Button>
            <Button
              onClick={() => handleWithdrawal(true)}
              disabled={loading || !withdrawalAmount}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Procesando...' : 'Retirar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
