import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Plus, Minus, Trash2, Package, Loader, DollarSign, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { productService, Product } from '@/lib/productService';
import { saleService, Sale, SaleItem } from '@/lib/saleService';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { eventBus } from '@/lib/eventBus';
import { branchService } from '@/lib/branchService';
import type { Branch } from '@/types/branch';

interface LastTicketData {
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
  printerName?: string;
}

export default function POSPage() {
  const { items, total, addItem, removeItem, updateQuantity, clearCart } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [lastTicketData, setLastTicketData] = useState<LastTicketData | null>(null);

  const getAdminBranchName = () => {
    if (!selectedBranchId) return 'Todas las sucursales';
    return branches.find((branch) => branch.id === selectedBranchId)?.name || 'Sucursal';
  };

  // Cargar productos del backend (filtrados por sucursal automáticamente)
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Si no es ADMIN, validar que el usuario tenga sucursal asignada
      if (user?.role !== 'ADMIN' && !user?.branchId) {
        setError('⚠️ Tu usuario no tiene una sucursal asignada. No se pueden cargar los productos. Contacta al administrador.');
        setProducts([]);
        setLoading(false);
        return;
      }

      // El backend filtra automáticamente por la sucursal del usuario
      // Si es ADMIN y selecciona una sucursal, pasa el parámetro
      const branchIdParam = selectedBranchId ? `?branchId=${selectedBranchId}` : '';
      const data = await productService.getAllProducts(branchIdParam);
      // Asegurarse de que data es siempre un array
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error al cargar los productos');
      setProducts([]); // Establecer array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  // Escuchar eventos del CustomerDisplay
  useEffect(() => {
    // Escuchar evento de checkout del ClienteDisplay
    const unsubscribe = eventBus.on('CHECKOUT_FROM_CLIENT', () => {
      setIsPaymentDialogOpen(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Cargar sucursales si es admin
  useEffect(() => {
    const loadBranches = async () => {
      if (user?.role === 'ADMIN') {
        try {
          const data = await branchService.getBranches({ active: true });
          setBranches(data);
        } catch (err) {
          // Error al cargar sucursales
        }
      }
    };

    loadBranches();
  }, [user]);

  // Cargar productos del backend (filtra automáticamente por sucursal del usuario)
  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user?.branchId, selectedBranchId]); // Recargar cuando cambie la sucursal del usuario o la selección

  useEffect(() => {
    if (!user) return;

    let branchName = 'Sin sucursal';
    let branchId: number | undefined = undefined;

    if (user.role === 'ADMIN') {
      if (selectedBranchId) {
        branchId = selectedBranchId;
        branchName = branches.find((branch) => branch.id === selectedBranchId)?.name || 'Sucursal';
      } else {
        branchName = 'Todas las sucursales';
      }
    } else {
      branchId = user.branchId ?? undefined;
      branchName = user.branch?.name || 'Sin sucursal';
    }

    localStorage.setItem('pos_branch_name', branchName);
    if (branchId) {
      localStorage.setItem('pos_branch_id', String(branchId));
    } else {
      localStorage.removeItem('pos_branch_id');
    }
  }, [user, selectedBranchId, branches]);

  // Recargar productos cuando el carrito se vacía (después de una venta)
  useEffect(() => {
    if (items.length === 0 && products.length > 0) {
      // Se acaba de completar una venta, recargar productos
      loadProducts();
    }
  }, [items.length]);

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
      emoji: product.emoji || '🛒',
      imageUrl: product.imageUrl,
      category: product.category,
    });
  };

  const handleFinalizeSale = () => {
    if (items.length === 0) {
      alert('El carrito está vacío. Agrega productos antes de finalizar la venta.');
      return;
    }

    if (total <= 0) {
      alert('El total debe ser mayor a $0');
      return;
    }

    // Validar sucursal para registrar venta
    if (user?.role === 'ADMIN' && !selectedBranchId) {
      alert('⚠️ Selecciona una sucursal para registrar la venta.');
      return;
    }

    if (user?.role !== 'ADMIN' && user && !user.branchId) {
      alert('⚠️ Tu usuario no tiene una sucursal asignada. Las ventas no se pueden registrar sin una sucursal. Contacta al administrador.');
      return;
    }

    setIsPaymentDialogOpen(true);
  };

  const printTicketData = async (ticketData: LastTicketData) => {
    console.log('🎫 [POSPage] Iniciando impresión del ticket:', ticketData);
    
    if (!window.electronAPI?.printTicket) {
      alert('La impresión solo está disponible en la app de escritorio.');
      return false;
    }

    let resolvedPrinterName = ticketData.printerName;

    try {
      const branchIdToUse = user?.role === 'ADMIN'
        ? selectedBranchId
        : (user?.branchId ?? undefined);

      if (!resolvedPrinterName && branchIdToUse && window.electronAPI.getSavedPrinter) {
        const savedPrinter = await window.electronAPI.getSavedPrinter(branchIdToUse);
        if (savedPrinter?.printerName && typeof savedPrinter.printerName === 'string') {
          resolvedPrinterName = savedPrinter.printerName;
        }
      }
    } catch (error) {
      // Si falla obtener impresora guardada, continuar con configuración por defecto del sistema
    }

    const payload: LastTicketData = {
      ...ticketData,
      printerName: resolvedPrinterName,
    };

    console.log('🎫 [POSPage] Payload a enviar:', payload);
    const result = await window.electronAPI.printTicket(payload);
    console.log('🎫 [POSPage] Resultado de impresión:', result);
    if (!result?.success) {
      alert(`No se pudo imprimir el ticket: ${result?.error || 'Error desconocido'}`);
      return false;
    }

    return true;
  };

  const handlePaymentComplete = async (sale: any, ticketData?: LastTicketData) => {
    // El PaymentDialog ya limpia el carrito
    // Aquí solo recargamos los productos para la siguiente venta
    loadProducts();
    
    // Cerrar el PaymentDialog automáticamente
    setIsPaymentDialogOpen(false);
    
    if (window.electronAPI) {
      window.electronAPI.onCheckoutComplete?.();
    }

    if (ticketData) {
      const branchIdToUse = user?.role === 'ADMIN'
        ? selectedBranchId
        : (user?.branchId ?? undefined);

      let enrichedTicket: LastTicketData = ticketData;

      if (branchIdToUse && window.electronAPI?.getSavedPrinter) {
        try {
          const savedPrinter = await window.electronAPI.getSavedPrinter(branchIdToUse);
          if (savedPrinter?.printerName && typeof savedPrinter.printerName === 'string') {
            enrichedTicket = {
              ...ticketData,
              printerName: savedPrinter.printerName,
            };
          }
        } catch (error) {
          // Continuar aunque no se pueda resolver impresora guardada
        }
      }

      setLastTicketData(enrichedTicket);
      localStorage.setItem('last_pos_ticket', JSON.stringify(enrichedTicket));
      await printTicketData(enrichedTicket);
    }
  };

  const handlePrintLastTicket = async () => {
    let ticket = lastTicketData;

    if (!ticket) {
      const storedTicket = localStorage.getItem('last_pos_ticket');
      if (storedTicket) {
        try {
          ticket = JSON.parse(storedTicket) as LastTicketData;
          setLastTicketData(ticket);
        } catch (error) {
          ticket = null;
        }
      }
    }

    if (!ticket) {
      alert('No hay ticket reciente para imprimir.');
      return;
    }

    await printTicketData(ticket);
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const branchIdToUse = user?.role === 'ADMIN'
      ? selectedBranchId
      : (user?.branchId ?? undefined);

    if (user?.role === 'ADMIN' && !branchIdToUse) {
      alert('Selecciona una sucursal para registrar la venta');
      return;
    }

    try {
      setIsProcessing(true);

      // Calcular IVA (16% incluido en el precio)
      const calculatedSubtotal = total / 1.16;
      const calculatedTax = total - calculatedSubtotal;

      const saleItems: SaleItem[] = items.map((item) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: (item.price * item.quantity) / 1.16, // Subtotal sin IVA
      }));

      const sale: Sale = {
        total,
        items: saleItems,
        paymentMethod: 'EFECTIVO',
        branchId: branchIdToUse,
        tax: calculatedTax,
        discount: 0,
      };

      const createdSale = await saleService.createSale(sale);

      clearCart();
      alert(`✅ Venta registrada exitosamente. ID: ${createdSale.id}`);

      if (window.electronAPI) {
        window.electronAPI.onCheckoutComplete?.();
      }
    } catch (err) {
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
    <div className="h-full flex flex-col md:flex-row bg-gray-50">
      {/* Panel de Productos */}
      <div className="flex-1 p-3 md:p-4 lg:p-6 overflow-auto">
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-4 gap-3">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
                <Package className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-primary" />
                Punto de Venta
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">Selecciona los productos para agregar al carrito</p>
            </div>

            {/* Selector de sucursal para admin */}
            {user?.role === 'ADMIN' && branches.length > 0 && (
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <label className="text-xs md:text-sm font-medium text-gray-700">Sucursal:</label>
                <select
                  value={selectedBranchId || ''}
                  onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : undefined)}
                  className="px-2 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {user && (
            <div className="mt-3 space-y-1">
              <p className="text-sm text-gray-500">
                Conectado como: <span className="font-semibold">{user.username}</span> ({user.role})
              </p>
              {user.role === 'ADMIN' ? (
                <p className="text-sm text-gray-500">
                  Sucursal: <span className="font-semibold">{getAdminBranchName()}</span>
                </p>
              ) : user.branch ? (
                <p className="text-sm text-gray-500">
                  Sucursal: <span className="font-semibold">{user.branch.name}</span>
                </p>
              ) : (
                <p className="text-sm text-red-600 font-semibold bg-red-50 px-3 py-2 rounded border border-red-200">
                  ⚠️ Sin sucursal asignada - No se pueden registrar ventas
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3 lg:gap-4">
          {error ? (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 mx-auto text-red-300 mb-3" />
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">
                {user?.branchId 
                  ? 'No hay productos disponibles para tu sucursal' 
                  : 'Asigna una sucursal a tu usuario para ver productos'}
              </p>
            </div>
          ) : (
            products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleAddProduct(product)}
              >
                <CardContent className="p-2 md:p-4 lg:p-6 text-center">
                  {product.imageUrl ? (
                    <div className="w-full h-16 md:h-24 lg:h-32 mb-2 md:mb-3 flex items-center justify-center">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain rounded"
                        onError={(e) => {
                          // Fallback si la imagen falla al cargar
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="text-3xl md:text-5xl lg:text-6xl">🛍️</div>';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-3xl md:text-5xl lg:text-6xl mb-2 md:mb-3">{product.emoji || '🛍️'}</div>
                  )}
                  <h3 className="font-semibold text-sm md:text-base lg:text-lg mb-1 md:mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-3 truncate">{product.category}</p>
                  <p className="text-base md:text-xl lg:text-2xl font-bold text-primary">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 md:mt-2">Stock: {product.quantity}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Panel del Carrito */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l shadow-xl flex flex-col max-h-[50vh] md:max-h-full">
        <div className="p-3 md:p-4 lg:p-6 border-b bg-primary text-white">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
            Carrito
          </h2>
          <p className="text-xs md:text-sm opacity-90 mt-1">{items.length} productos</p>
        </div>

        {/* Items del Carrito */}
        <div className="flex-1 overflow-auto p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3 scrollbar-thin">
          {items.length === 0 ? (
            <div className="text-center py-6 md:py-12">
              <ShoppingCart className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-300 mb-2 md:mb-3" />
              <p className="text-sm md:text-base text-gray-500">El carrito está vacío</p>
              <p className="text-xs md:text-sm text-gray-400 mt-1">
                Selecciona productos para comenzar
              </p>
            </div>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-2 md:p-3 lg:p-4">
                  <div className="flex items-start justify-between mb-2 md:mb-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      {item.imageUrl ? (
                        <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex items-center justify-center flex-shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = '<div class="text-xl md:text-2xl lg:text-3xl">🛒</div>';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-xl md:text-2xl lg:text-3xl flex-shrink-0">{item.emoji || '🛒'}</div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs md:text-sm lg:text-base line-clamp-1">{item.name}</h4>
                        <p className="text-xs md:text-sm text-gray-600">
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
                    <div className="flex items-center gap-1 md:gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-7 w-7 md:h-8 md:w-8 lg:h-10 lg:w-10"
                      >
                        <Minus className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                      <span className="w-8 md:w-10 lg:w-12 text-center font-semibold text-xs md:text-sm lg:text-base">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-7 w-7 md:h-8 md:w-8 lg:h-10 lg:w-10"
                      >
                        <Plus className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                    </div>
                    <div className="text-sm md:text-base lg:text-lg font-bold text-primary">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Total y Acciones */}
        <div className="border-t p-3 md:p-4 lg:p-6 space-y-2 md:space-y-4 bg-gray-50">
          <div className="flex items-center justify-between text-lg md:text-xl lg:text-2xl font-bold">
            <span>Total:</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleFinalizeSale}
              disabled={items.length === 0 || isProcessing}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 md:py-4 lg:py-6 text-sm md:text-base lg:text-lg"
            >
              <DollarSign className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
              Finalizar Venta (${total.toFixed(2)})
            </Button>
            <Button
              onClick={clearCart}
              variant="outline"
              disabled={items.length === 0}
              className="w-full text-xs md:text-sm lg:text-base"
            >
              <Trash2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              Limpiar Carrito
            </Button>
            <Button
              onClick={handlePrintLastTicket}
              variant="outline"
              className="w-full text-xs md:text-sm lg:text-base"
            >
              <Printer className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              Imprimir Último Ticket
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        onPaymentComplete={handlePaymentComplete}
        selectedBranchId={selectedBranchId}
      />
    </div>
  );
}
