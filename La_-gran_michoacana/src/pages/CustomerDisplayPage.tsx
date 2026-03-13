import { useEffect, useState, useRef } from 'react';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/lib/eventBus';

export default function CustomerDisplayPage() {
  const [localItems, setLocalItems] = useState<CartItem[]>([]);
  const [localTotal, setLocalTotal] = useState(0);
  const [logoImage, setLogoImage] = useState<string>('./logo.png');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [saleId, setSaleId] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [branchName, setBranchName] = useState('Sin sucursal');
  const shouldShowAd = localItems.length === 0 && !isProcessing;

  useEffect(() => {
    const readBranchName = () => {
      const name = localStorage.getItem('pos_branch_name') || 'Sin sucursal';
      setBranchName(name);
    };

    readBranchName();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'pos_branch_name') {
        readBranchName();
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Cargar ruta del logo desde Electron
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
        if (isElectron) {
          const result = await (window as any).electronAPI.getLogoPath();
          if (result.success && result.path) {
            setLogoImage(result.path);
          }
        }
      } catch (err) {
        console.error('Error cargando logo:', err);
      }
    };
    loadLogo();
  }, []);

  useEffect(() => {
    // Verificar si estamos en Electron
    if (window.electronAPI) {
      let unsubscribeCartUpdated: (() => void) | undefined;
      let unsubscribeCartCleared: (() => void) | undefined;

      // Cargar estado inicial
      window.electronAPI.getCart().then((cart) => {
        if (cart) {
          setLocalItems(cart.items || []);
          setLocalTotal(cart.total || 0);
        }
      });

      // Escuchar actualizaciones
      unsubscribeCartUpdated = window.electronAPI.onCartUpdated((data) => {
        const newItems = data.items || [];
        setLocalItems(newItems);
        setLocalTotal(data.total || 0);
        setIsProcessing(false);
        setPaymentMethod(null); // Resetear payment method
        setSaleId(null);
      });

      unsubscribeCartCleared = window.electronAPI.onCartCleared(() => {
        setLocalItems([]);
        setLocalTotal(0);
        setIsProcessing(false);
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
      if (window.electronAPI) {
        unsubscribeCartUpdated?.();
        unsubscribeCartCleared?.();
      }
      unsubCheckout();
      unsubPaymentMethod();
      unsubPaymentCompleted();
      unsubCartCleared();
    };
  }, []);

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden flex flex-col">
      {/* Header - Totalmente responsive */}
      <header className="bg-white/10 backdrop-blur-md p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              <img 
                src={logoImage} 
                alt="La Gran Michoacana" 
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 object-cover"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-3xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white truncate">La Gran Michoacana</h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl 2xl:text-3xl text-white/80 truncate">Las mejores paletas y helados</p>
              <p className="text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl 2xl:text-3xl text-white/80 truncate">Sucursal: {branchName}</p>
            </div>
          </div>
          <div className="text-white text-sm sm:text-base md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl text-right flex-shrink-0">
            <div className="font-semibold">
              {formatDateShort(new Date())}
            </div>
            <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl opacity-90">
              {formatDate(new Date(), true).split(' ').slice(-3).join(' ')}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 2xl:p-10 overflow-auto min-h-0">
        <AnimatePresence mode="wait">
          {shouldShowAd ? (
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
      <div className="text-center text-white space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-12 xl:space-y-16 px-4">
        <motion.div
          key={currentAd}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 xl:space-y-8"
        >
          <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] 2xl:text-[12rem]">{ads[currentAd].emoji}</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold">{ads[currentAd].text}</h2>
        </motion.div>

        <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl opacity-90">
          <p>✨ Ingredientes de Primera Calidad</p>
          <p>💯 100% Sabor Natural</p>
          <p>😊 Tu Satisfacción es Nuestra Prioridad</p>
        </div>

        <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-12 text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-semibold">
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
      <div className="flex-1 flex gap-1 sm:gap-2 mb-2 sm:mb-3 md:mb-4 lg:mb-6 xl:mb-8 min-h-0 relative">
        <div 
          ref={scrollContainerRef}
          className="flex-1 bg-white/95 rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 2xl:p-10 shadow-2xl overflow-y-scroll min-h-0" 
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Ocultar scrollbar nativa */}
          <style>{`
            ::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold mb-2 sm:mb-3 md:mb-4 lg:mb-6 xl:mb-8 2xl:mb-10 text-gray-800 border-b-2 sm:border-b-2 md:border-b-3 lg:border-b-4 border-primary pb-2 sm:pb-2 md:pb-3 lg:pb-4">
            Tu Compra
          </h2>

          <div className="space-y-2 sm:space-y-2 md:space-y-3 lg:space-y-4 xl:space-y-6">
            {items.map((item, index) => (
              <motion.div
                key={`${item.id}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg sm:rounded-xl md:rounded-2xl hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8 min-w-0 flex-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 2xl:w-40 2xl:h-40 bg-white rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl shadow-md overflow-hidden flex-shrink-0">
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
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-semibold text-gray-800 truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-gray-600 mt-0.5 sm:mt-0.5 md:mt-1">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-primary flex-shrink-0 ml-2">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Barra de scroll personalizada */}
        <div 
          ref={scrollbarRef}
          className="w-3 sm:w-4 md:w-5 lg:w-6 xl:w-8 bg-gray-200 rounded-full flex-shrink-0"
          style={{ display: 'none', height: '100%' }}
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
        className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 2xl:p-10 shadow-2xl"
      >
        {/* Método de Pago */}
        {paymentMethod && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 sm:mb-3 md:mb-4 lg:mb-6 xl:mb-8 p-2 sm:p-3 md:p-4 lg:p-6 bg-green-50 border border-green-500 sm:border-2 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 min-w-0">
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl flex-shrink-0">
                {paymentMethod === 'EFECTIVO' && '💵'}
                {paymentMethod === 'TARJETA' && '💳'}
                {paymentMethod === 'MIXTO' && '💰'}
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-xs md:text-sm lg:text-base text-gray-600">Método de Pago</p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-green-700 truncate">{paymentMethod}</p>
              </div>
            </div>
            {saleId && (
              <div className="text-right flex-shrink-0">
                <p className="text-xs sm:text-xs md:text-sm lg:text-base text-gray-600">Venta #</p>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800">{saleId.slice(0, 8)}</p>
              </div>
            )}
          </motion.div>
        )}
        
        <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4 lg:mb-6 xl:mb-8 2xl:mb-10 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl text-white">💰</span>
            </div>
            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-gray-800">TOTAL</span>
          </div>
          <motion.div
            key={total}
            initial={{ scale: 1.2, color: '#10b981' }}
            animate={{ scale: 1, color: '#8b5cf6' }}
            transition={{ duration: 0.3 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-primary flex-shrink-0"
          >
            {formatCurrency(total)}
          </motion.div>
        </div>
        
        {/* Botones de Acción */}
        <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6">
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
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-2 sm:py-3 md:py-4 lg:py-5 xl:py-6 2xl:py-8 px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 rounded-lg sm:rounded-xl md:rounded-2xl text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
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
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-2 sm:py-3 md:py-4 lg:py-5 xl:py-6 2xl:py-8 px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 rounded-lg sm:rounded-xl md:rounded-2xl text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
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
