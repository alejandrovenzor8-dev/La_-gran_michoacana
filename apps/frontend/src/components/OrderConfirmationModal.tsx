import { CartItem } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';
import { X, CheckCircle, XCircle } from 'lucide-react';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function OrderConfirmationModal({
  isOpen,
  items,
  total,
  paymentMethod,
  onConfirm,
  onCancel,
}: OrderConfirmationModalProps) {
  if (!isOpen) return null;

  const paymentMethodLabel = paymentMethod === 'Efectivo' ? '💵 Efectivo' : '💳 Tarjeta';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Confirmar Pedido</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Items Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-3">Productos:</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.product.name}</p>
                  <p className="text-xs text-gray-600">Cantidad: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {formatCurrency(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Método de pago:</p>
          <p className="text-lg font-semibold text-blue-600">{paymentMethodLabel}</p>
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800">Total:</span>
            <span className="text-2xl font-bold text-purple-600">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Confirmation Message */}
        <p className="text-center text-gray-600 mb-6">
          ¿El cliente acepta este pedido?
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-red-100 text-red-600 py-3 rounded-lg font-semibold hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Rechazar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
