import { useEffect, useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { branchService } from '@/lib/branchService';
import { toast } from 'sonner';

interface OpenCashDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OpenCashDrawerModal({
  isOpen,
  onClose,
  onComplete,
}: OpenCashDrawerModalProps) {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [currentCash, setCurrentCash] = useState(0);
  const [additionalAmount, setAdditionalAmount] = useState('');
  const [finalCashAmount, setFinalCashAmount] = useState(0);

  // Cargar datos de la sucursal cuando se abre el modal
  useEffect(() => {
    if (isOpen && user?.branchId) {
      loadBranchData();
    }
  }, [isOpen, user?.branchId]);

  const loadBranchData = async () => {
    try {
      setLoading(true);
      if (!user?.branchId) {
        throw new Error('No branch ID available');
      }
      const branch = await branchService.getBranchById(user.branchId);
      const initialCash = Number(branch.initialCash) || 0;
      setCurrentCash(initialCash);
      setFinalCashAmount(initialCash);
      setAdditionalAmount('');
    } catch (error) {
      toast.error('Error al cargar datos de la sucursal');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar el monto final cuando cambia el adicional
  useEffect(() => {
    if (additionalAmount) {
      const additional = parseFloat(additionalAmount) || 0;
      setFinalCashAmount(currentCash + additional);
    } else {
      setFinalCashAmount(currentCash);
    }
  }, [additionalAmount, currentCash]);

  const handleOpenDrawer = async (saveAdditionalAmount: boolean) => {
    try {
      setLoading(true);

      if (saveAdditionalAmount && additionalAmount) {
        const additional = parseFloat(additionalAmount);
        if (isNaN(additional) || additional <= 0) {
          toast.error('Cantidad inválida');
          return;
        }

        // Guardar el nuevo monto inicial
        if (!user?.branchId) {
          toast.error('No se encontró la sucursal');
          return;
        }
        await branchService.updateInitialCash(user.branchId, finalCashAmount);
        toast.success(`✅ Caja abierta con $${finalCashAmount.toFixed(2)}`);
      } else {
        toast.success(`✅ Caja abierta con $${currentCash.toFixed(2)}`);
      }

      onComplete();
      onClose();
    } catch (error) {
      toast.error('Error al abrir caja');
      console.error('Error:', error);
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
            Apertura de Caja
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
          {/* Información actual */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">Fondo Inicial Registrado</Label>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <p className="text-2xl font-bold text-blue-700">
                  ${currentCash.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Campo para dinero adicional */}
          <div className="space-y-2">
            <Label htmlFor="additionalAmount" className="text-sm font-medium">
              Dinero Adicional (Opcional)
            </Label>
            <Input
              id="additionalAmount"
              type="number"
              placeholder="0.00"
              value={additionalAmount}
              onChange={(e) => setAdditionalAmount(e.target.value)}
              disabled={loading}
              step="0.01"
              min="0"
              className="text-lg"
            />
            <p className="text-xs text-gray-500">
              Deja en blanco si no agregas dinero
            </p>
          </div>

          {/* Total final */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-sm font-medium text-gray-600">Total en Caja</Label>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <p className="text-2xl font-bold text-green-700">
                  ${finalCashAmount.toFixed(2)}
                </p>
                {additionalAmount && (
                  <p className="text-xs text-gray-600 mt-2">
                    ${currentCash.toFixed(2)} + ${(parseFloat(additionalAmount) || 0).toFixed(2)} adicional
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => handleOpenDrawer(true)}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Agregar y Abrir'}
            </Button>
            <Button
              onClick={() => handleOpenDrawer(false)}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

