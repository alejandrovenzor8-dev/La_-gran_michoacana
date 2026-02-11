import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Plus, Minus, Trash2, Package, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { productService, Product } from '@/lib/productService';
import { saleService, Sale, SaleItem } from '@/lib/saleService';

export default function POSPage() {
  const { items, total, addItem, removeItem, updateQuantity, clearCart } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cargar productos del backend
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productService.getAllProducts();
        // Asegurarse de que data es siempre un array
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Error al cargar los productos');
        setProducts([]); // Establecer array vacío en caso de error
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Escuchar el evento de limpiar carrito desde Electron
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onCartCleared(() => {
        // Limpiar el carrito sin llamar a Electron (ya fue limpiado)
        useCartStore.setState({ items: [], total: 0 });
      });
    }
  }, []);

  const handleAddProduct = (product: Product) => {
    addItem({
      id: String(product.id),
      name: product.name,
      price: product.price,
      quantity: 1,
      emoji: '🛒',
      category: product.category,
    });
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    try {
      setIsProcessing(true);

      // Crear objetos de items de venta
      const saleItems: SaleItem[] = items.map((item) => ({
        productId: parseInt(item.id),
        quantity: item.quantity,
        price: item.price,
      }));

      // Crear venta en el backend
      const sale: Sale = {
        total,
        items: saleItems,
        paymentMethod: 'cash',
      };

      const createdSale = await saleService.createSale(sale);
      console.log('✅ Venta registrada:', createdSale);

      // Limpiar carrito
      clearCart();
      alert(`✅ Venta registrada exitosamente. ID: ${createdSale.id}`);

      if (window.electronAPI) {
        window.electronAPI.onCheckoutComplete?.();
      }
    } catch (err) {
      console.error('Error processing checkout:', err);
      alert('Error al procesar la venta');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Panel de Productos */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Punto de Venta
          </h1>
          <p className="text-gray-600 mt-1">Selecciona los productos para agregar al carrito</p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              Conectado como: <span className="font-semibold">{user.username}</span> ({user.role})
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No hay productos disponibles</p>
            </div>
          ) : (
            products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleAddProduct(product)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-6xl mb-3">🛍️</div>
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{product.category}</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Stock: {product.quantity}</p>
                </CardContent>
              </Card>
            ))
          )}
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
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
              disabled={items.length === 0 || isProcessing}
              onClick={handleCheckout}
            >
              {isProcessing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Finalizar Venta'
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={items.length === 0 || isProcessing}
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
