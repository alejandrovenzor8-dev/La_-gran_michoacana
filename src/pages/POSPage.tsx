import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Plus, Minus, Trash2, Package } from 'lucide-react';
import { useEffect } from 'react';

// Productos de ejemplo
const PRODUCTS = [
  { id: '1', name: 'Paleta de Fresa', price: 15, emoji: '🍓', category: 'Paletas' },
  { id: '2', name: 'Paleta de Mango', price: 15, emoji: '🥭', category: 'Paletas' },
  { id: '3', name: 'Paleta de Limón', price: 15, emoji: '🍋', category: 'Paletas' },
  { id: '4', name: 'Helado de Vainilla', price: 25, emoji: '🍦', category: 'Helados' },
  { id: '5', name: 'Helado de Chocolate', price: 25, emoji: '🍫', category: 'Helados' },
  { id: '6', name: 'Helado de Napolitano', price: 30, emoji: '🍨', category: 'Helados' },
  { id: '7', name: 'Raspado', price: 20, emoji: '🧊', category: 'Raspados' },
  { id: '8', name: 'Agua Fresca', price: 18, emoji: '🥤', category: 'Bebidas' },
];

export default function POSPage() {
  const { items, total, addItem, removeItem, updateQuantity, clearCart } = useCartStore();
  const { user, logout } = useAuthStore((state) => ({
    user: state.user,
    logout: state.logout,
  }));
  const navigate = useNavigate();

  const handleLogout = async () => {
    logout();
    
    // Si está en Electron, llamar al logout handler
    const isElectron = typeof window !== 'undefined' && window.electronAPI;
    if (isElectron) {
      try {
        console.log('📱 Notificando logout a Electron...');
        await window.electronAPI.logout();
        console.log('✅ Electron notificado de logout');
      } catch (err) {
        console.error('❌ Error notificando logout a Electron:', err);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  // Escuchar el evento de limpiar carrito desde Electron
  useEffect(() => {
    if (window.electronAPI) {
      const unsubscribe = window.electronAPI.onCartCleared(() => {
        // Limpiar el carrito sin llamar a Electron (ya fue limpiado)
        useCartStore.setState({ items: [], total: 0 });
      });

      return () => {
        unsubscribe();
      };
    }
  }, []);

  const handleAddProduct = (product: typeof PRODUCTS[0]) => {
    addItem({
      ...product,
      quantity: 1,
    });
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Panel de Productos */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              La Gran Michoacana POS
            </h1>
            <p className="text-gray-600 mt-1">Selecciona los productos para agregar al carrito</p>
            {user && (
              <p className="text-sm text-gray-500 mt-2">
                Conectado como: <span className="font-semibold">{user.username}</span> ({user.role})
              </p>
            )}
          </div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="h-10 gap-2 flex items-center"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {PRODUCTS.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleAddProduct(product)}
            >
              <CardContent className="p-6 text-center">
                <div className="text-6xl mb-3">{product.emoji}</div>
                <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{product.category}</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(product.price)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Panel del Carrito */}
      <div className="w-96 bg-white border-l shadow-xl flex flex-col">
        <div className="p-6 border-b bg-primary text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Carrito
          </h2>
          <p className="text-sm opacity-90 mt-1">{items.length} productos</p>
        </div>

        {/* Items del Carrito */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">El carrito está vacío</p>
              <p className="text-sm text-gray-400 mt-1">
                Selecciona productos para comenzar
              </p>
            </div>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{item.emoji}</div>
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Total y Acciones */}
        <div className="border-t p-6 space-y-4 bg-gray-50">
          <div className="flex items-center justify-between text-2xl font-bold">
            <span>Total:</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              disabled={items.length === 0}
              onClick={clearCart}
            >
              Limpiar Carrito
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
