import { useEffect, useState } from 'react';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerDisplayPage() {
  const [localItems, setLocalItems] = useState<CartItem[]>([]);
  const [localTotal, setLocalTotal] = useState(0);
  const [showAd, setShowAd] = useState(true);

  useEffect(() => {
    // Verificar si estamos en Electron
    if (window.electronAPI) {
      // Cargar estado inicial
      window.electronAPI.getCart().then((cart) => {
        if (cart && cart.items) {
          setLocalItems(cart.items);
          setLocalTotal(cart.total);
          setShowAd(cart.items.length === 0);
        }
      });

      // Escuchar actualizaciones
      window.electronAPI.onCartUpdated((data) => {
        setLocalItems(data.items);
        setLocalTotal(data.total);
        setShowAd(data.items.length === 0);
      });

      window.electronAPI.onCartCleared(() => {
        setLocalItems([]);
        setLocalTotal(0);
        setShowAd(true);
      });

      return () => {
        window.electronAPI.removeCartListeners();
      };
    } else {
      // Fallback para desarrollo en navegador
      const items = useCartStore.getState().items;
      const total = useCartStore.getState().total;
      setLocalItems(items);
      setLocalTotal(total);
      setShowAd(items.length === 0);
    }
  }, []);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-4xl">
              🍦
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">La Gran Michoacana</h1>
              <p className="text-white/80 text-lg">Las mejores paletas y helados</p>
            </div>
          </div>
          <div className="text-white text-2xl text-right">
            <div className="font-semibold">
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </div>
            <div className="text-lg opacity-90">
              {new Date().toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex flex-col h-[calc(100vh-120px)] p-8">
        <AnimatePresence mode="wait">
          {showAd ? (
            <Advertisement key="ad" />
          ) : (
            <CartDisplay key="cart" items={localItems} total={localTotal} />
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
function CartDisplay({ items, total }: { items: CartItem[]; total: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col"
    >
      {/* Lista de productos */}
      <div className="flex-1 bg-white/95 rounded-3xl p-8 shadow-2xl overflow-auto mb-6">
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
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-5xl shadow-md">
                  {item.emoji || '🍦'}
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

      {/* Total */}
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between">
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
      </motion.div>
    </motion.div>
  );
}
