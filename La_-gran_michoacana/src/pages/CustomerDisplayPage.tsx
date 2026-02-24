import { useEffect, useState, useRef } from 'react';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/lib/eventBus';

const logoImage = new URL('../../../public/logo.png', import.meta.url).href;

export default function CustomerDisplayPage() {
  const [localItems, setLocalItems] = useState<CartItem[]>([]);
  const [localTotal, setLocalTotal] = useState(0);
  const [showAd, setShowAd] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [saleId, setSaleId] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Verificar si estamos en Electron
    if (window.electronAPI) {
      // Cargar estado inicial
      window.electronAPI.getCart().then((cart) => {
        if (cart) {
          setLocalItems(cart.items || []);
          setLocalTotal(cart.total || 0);
          setShowAd((cart.items || []).length === 0);
        }
      });

      // Escuchar actualizaciones
      window.electronAPI.onCartUpdated((data) => {
        const newItems = data.items || [];
        setLocalItems(newItems);
        setLocalTotal(data.total || 0);
        // Actualizar showAd solo si hay items (no mostrar ad si hay items)
        setShowAd(newItems.length === 0);
        setPaymentMethod(null); // Resetear payment method
        setSaleId(null);
      });

      window.electronAPI.onCartCleared(() => {
        setLocalItems([]);
        setLocalTotal(0);
        setShowAd(true);
        setPaymentMethod(null);
        setSaleId(null);
        setShowSuccessMessage(false);
      });

      // Escuchar notificación de método de pago
      if (window.electronAPI.onPaymentMethod) {
        window.electronAPI.onPaymentMethod((data) => {
          setPaymentMethod(data.method);
          setSaleId(data.saleId);
        });
      }

      // Escuchar notificación de pago completado
      if (window.electronAPI.onPaymentCompleted) {
        window.electronAPI.onPaymentCompleted((data) => {
          setShowSuccessMessage(true);
          // Ocultar el mensaje después de 5 segundos
          setTimeout(() => {
            setShowSuccessMessage(false);
          }, 5000);
        });
      }
    } else {
      // Fallback para desarrollo en navegador
      const items = useCartStore.getState().items;
      const total = useCartStore.getState().total;
      setLocalItems(items);
      setLocalTotal(total);
      setShowAd(items.length === 0);
    }

    // Escuchar eventos globales
    const unsubCheckout = eventBus.on('CHECKOUT_FROM_CLIENT', () => {
      setIsProcessing(true);
    });

    const unsubPaymentMethod = eventBus.on('PAYMENT_METHOD', (data) => {
      setPaymentMethod(data.method);
      setSaleId(data.saleId);
    });

    const unsubPaymentCompleted = eventBus.on('PAYMENT_COMPLETED', () => {
      setTimeout(() => {
        setIsProcessing(false);
        setShowAd(true);
      }, 1500);
    });

    const unsubCartCleared = eventBus.on('CART_CLEARED', () => {
      // Limpiar items locales
      setLocalItems([]);
      setLocalTotal(0);
      setPaymentMethod(null);
      setSaleId(null);
    });

    // Cleanup
    return () => {
      unsubCheckout();
      unsubPaymentMethod();
      unsubPaymentCompleted();
      unsubCartCleared();
    };
  }, []);

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              <img 
                src={logoImage} 
                alt="La Gran Michoacana" 
                className="w-20 h-20 object-cover"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">La Gran Michoacana</h1>
              <p className="text-white/80 text-lg">Las mejores paletas y helados</p>
            </div>
          </div>
          <div className="text-white text-2xl text-right">
            <div className="font-semibold">
              {formatDateShort(new Date())}
            </div>
            <div className="text-lg opacity-90">
              {formatDate(new Date(), true).split(' ').slice(-3).join(' ')}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col p-8 overflow-auto">
        <AnimatePresence mode="wait">
          {showAd ? (
            <Advertisement key="ad" />
          ) : (
            <CartDisplay 
              key="cart" 
              items={localItems} 
              total={localTotal}
              paymentMethod={paymentMethod}
              saleId={saleId}
              showSuccessMessage={showSuccessMessage}
              isProcessing={isProcessing}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Componente de Publicidad
function Advertisement() {
  const ads = [
    { emoji: '🍓', text: 'Paletas de Fruta Natural' },
    { emoji: '🍦', text: 'Helados Artesanales' },
    { emoji: '🎉', text: '¡Promociones Especiales!' },
  ];

  const [currentAd, setCurrentAd] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex-1 flex items-center justify-center"
    >
      <div className="text-center text-white space-y-12">
        <motion.div
          key={currentAd}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          <div className="text-9xl">{ads[currentAd].emoji}</div>
          <h2 className="text-6xl font-bold">{ads[currentAd].text}</h2>
        </motion.div>

        <div className="space-y-4 text-3xl opacity-90">
          <p>✨ Ingredientes de Primera Calidad</p>
          <p>💯 100% Sabor Natural</p>
          <p>😊 Tu Satisfacción es Nuestra Prioridad</p>
        </div>

        <div className="mt-8 text-2xl font-semibold">
          ¡Bienvenido a La Gran Michoacana!
        </div>
      </div>
    </motion.div>
  );
}

// Componente del Carrito
function CartDisplay({ items, total, paymentMethod, saleId, showSuccessMessage, isProcessing }: { items: CartItem[]; total: number; paymentMethod?: string | null; saleId?: string | null; showSuccessMessage?: boolean; isProcessing?: boolean }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const scrollThumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const scrollbar = scrollbarRef.current;
    const scrollThumb = scrollThumbRef.current;

    if (!container || !scrollbar || !scrollThumb) return;

    const updateScrollbar = () => {
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const scrollTop = container.scrollTop;

      // Calcular altura del thumb
      const thumbHeight = Math.max((clientHeight / scrollHeight) * 100, 10);
      
      // Calcular posición del thumb
      const thumbPosition = (scrollTop / (scrollHeight - clientHeight)) * (100 - thumbHeight);

      scrollThumb.style.height = `${thumbHeight}%`;
      scrollThumb.style.transform = `translateY(${thumbPosition}%)`;

      // Mostrar u ocultar la barra según sea necesario
      if (scrollHeight > clientHeight) {
        scrollbar.style.display = 'block';
      } else {
        scrollbar.style.display = 'none';
      }
    };

    container.addEventListener('scroll', updateScrollbar);
    window.addEventListener('resize', updateScrollbar);
    
    // Actualizar inmediatamente
    setTimeout(updateScrollbar, 100);

    return () => {
      container.removeEventListener('scroll', updateScrollbar);
      window.removeEventListener('resize', updateScrollbar);
    };
  }, [items]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col min-h-0"
    >
      {/* Lista de productos */}
      <div className="flex-1 flex gap-2 mb-6 min-h-0 relative">
        <div 
          ref={scrollContainerRef}
          className="flex-1 bg-white/95 rounded-3xl p-8 shadow-2xl overflow-y-scroll min-h-0" 
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Ocultar scrollbar nativa */}
          <style>{`
            ::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          <h2 className="text-5xl font-bold mb-8 text-gray-800 border-b-4 border-primary pb-4">
            Tu Compra
          </h2>

          <div className="space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={`${item.id}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-5xl shadow-md overflow-hidden">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Si la imagen falla al cargar, mostrar emoji
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextSibling) {
                            (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <span 
                      className="w-full h-full flex items-center justify-center"
                      style={{ display: item.imageUrl ? 'none' : 'flex' }}
                    >
                      {item.emoji || '🍦'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-4xl font-semibold text-gray-800">
                      {item.name}
                    </h3>
                    <p className="text-2xl text-gray-600 mt-1">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                </div>
                <div className="text-5xl font-bold text-primary">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Barra de scroll personalizada */}
        <div 
          ref={scrollbarRef}
          className="w-6 bg-gray-200 rounded-full flex-shrink-0"
          style={{ display: 'none', width: '24px', height: '100%' }}
        >
          <div
            ref={scrollThumbRef}
            className="w-full bg-gradient-to-b from-purple-500 to-purple-700 rounded-full cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
            style={{
              minHeight: '30px',
              width: '100%',
              position: 'absolute',
              borderRadius: '12px',
              boxShadow: '0 0 8px rgba(139, 92, 246, 0.6)',
            }}
          />
        </div>
      </div>

      {/* Total y Acciones */}
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-3xl p-8 shadow-2xl"
      >
        {/* Método de Pago */}
        {paymentMethod && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl">
                {paymentMethod === 'EFECTIVO' && '💵'}
                {paymentMethod === 'TARJETA' && '💳'}
                {paymentMethod === 'MIXTO' && '💰'}
              </span>
              <div>
                <p className="text-sm text-gray-600">Método de Pago</p>
                <p className="text-3xl font-bold text-green-700">{paymentMethod}</p>
              </div>
            </div>
            {saleId && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Venta #</p>
                <p className="text-2xl font-bold text-gray-800">{saleId.slice(0, 8)}</p>
              </div>
            )}
          </motion.div>
        )}
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-3xl text-white">💰</span>
            </div>
            <span className="text-5xl font-bold text-gray-800">TOTAL</span>
          </div>
          <motion.div
            key={total}
            initial={{ scale: 1.2, color: '#10b981' }}
            animate={{ scale: 1, color: '#8b5cf6' }}
            transition={{ duration: 0.3 }}
            className="text-7xl font-bold text-primary"
          >
            {formatCurrency(total)}
          </motion.div>
        </div>
        
        {/* Botones de Acción */}
        <div className="flex gap-4">
          <motion.button
            whileHover={!isProcessing ? { scale: 1.05 } : {}}
            whileTap={!isProcessing ? { scale: 0.95 } : {}}
            onClick={() => {
              if (!isProcessing) {
                // Notificar a POSPage que abra el PaymentDialog
                eventBus.emit('CHECKOUT_FROM_CLIENT', {});
                
                // También notificar a través de Electron si está disponible
                if (window.electronAPI?.checkoutFromClient) {
                  window.electronAPI.checkoutFromClient();
                }
              }
            }}
            disabled={items.length === 0 || isProcessing}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-6 px-6 rounded-2xl text-4xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            ✅ Aceptar
          </motion.button>
          <motion.button
            whileHover={!isProcessing ? { scale: 1.05 } : {}}
            whileTap={!isProcessing ? { scale: 0.95 } : {}}
            onClick={() => {
              if (!isProcessing && window.electronAPI) {
                window.electronAPI.clearCart();
              }
            }}
            disabled={isProcessing}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-6 px-6 rounded-2xl text-4xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            ❌ Cancelar
          </motion.button>
        </div>
      </motion.div>

      {/* Mensaje de Procesando */}
      <AnimatePresence>
        {isProcessing && <ProcessingMessage />}
      </AnimatePresence>
    </motion.div>
  );
}

// Componente de mensaje de éxito
function ProcessingMessage({ success = false }: { success?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-12 text-center"
      >
        {/* Spinner animado */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="mx-auto w-24 h-24 mb-6 border-8 border-blue-100 border-t-blue-500 rounded-full"
        />
        <h2 className="text-5xl font-bold text-gray-800 mb-3">Procesando venta...</h2>
        <p className="text-2xl text-gray-600">Por favor espere</p>
      </motion.div>
    </motion.div>
  );
}
