import { useState } from 'react';
import { useCartStore, Product } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';
import { Search, Trash2, Plus, Minus, CreditCard, Banknote, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import OrderConfirmationModal from '@/components/OrderConfirmationModal';

// Mock products - Reemplazar con datos de la API
const mockProducts: Product[] = [
  { id: '1', name: 'Paleta de Fresa', price: 25.0, category: 'Paletas', imageUrl: '🍓' },
  { id: '2', name: 'Paleta de Mango', price: 25.0, category: 'Paletas', imageUrl: '🥭' },
  { id: '3', name: 'Paleta de Limón', price: 22.0, category: 'Paletas', imageUrl: '🍋' },
  { id: '4', name: 'Helado de Chocolate', price: 35.0, category: 'Helados', imageUrl: '🍫' },
  { id: '5', name: 'Helado de Vainilla', price: 35.0, category: 'Helados', imageUrl: '🍦' },
  { id: '6', name: 'Raspado de Tamarindo', price: 30.0, category: 'Raspados', imageUrl: '🧊' },
  { id: '7', name: 'Nieve de Limón', price: 28.0, category: 'Nieves', imageUrl: '🍋' },
  { id: '8', name: 'Paleta de Coco', price: 27.0, category: 'Paletas', imageUrl: '🥥' },
];

const categories = ['Todos', 'Paletas', 'Helados', 'Raspados', 'Nieves'];

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<string | null>(null);
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCheckoutClick = (paymentMethod: string) => {
    if (items.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    setPendingPaymentMethod(paymentMethod);
    setShowConfirmation(true);
  };

  const handleConfirmOrder = () => {
    if (pendingPaymentMethod) {
      // TODO: Procesar venta en la API
      toast.success(`Venta completada - ${pendingPaymentMethod}`);
      clearCart();
    }
    setShowConfirmation(false);
    setPendingPaymentMethod(null);
  };

  const handleCancelOrder = () => {
    setShowConfirmation(false);
    setPendingPaymentMethod(null);
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Products Section */}
      <div className="flex-1 flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Punto de Venta</h1>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addItem(product)}
                className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow text-left"
              >
                <div className="text-4xl mb-3 text-center">{product.imageUrl}</div>
                <h3 className="font-medium text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(product.price)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white rounded-xl shadow-md p-6 flex flex-col">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Carrito</h2>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto mb-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingBag className="w-16 h-16 mb-3" />
              <p>Carrito vacío</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">{item.product.imageUrl}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 text-sm truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-gray-600">{formatCurrency(item.product.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(getTotal())}</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total</span>
            <span className="text-purple-600">{formatCurrency(getTotal())}</span>
          </div>
        </div>

        {/* Payment Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => handleCheckoutClick('Efectivo')}
            disabled={items.length === 0}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Banknote className="w-5 h-5" />
            Cobrar en Efectivo
          </button>
          <button
            onClick={() => handleCheckoutClick('Tarjeta')}
            disabled={items.length === 0}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Cobrar con Tarjeta
          </button>
        </div>
      </div>

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={showConfirmation}
        items={items}
        total={getTotal()}
        paymentMethod={pendingPaymentMethod || ''}
        onConfirm={handleConfirmOrder}
        onCancel={handleCancelOrder}
      />    </div>
  );
}