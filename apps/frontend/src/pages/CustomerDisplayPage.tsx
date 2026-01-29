import React, { useEffect, useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useBroadcastListener } from '@/hooks/useBroadcastListener';
import { customerDisplayConfig } from '../config/customerDisplay.config';

export const CustomerDisplayPage: React.FC = () => {
  // Escuchar cambios desde la ventana POS
  useBroadcastListener();
  
  // Usar los selectores de Zustand para obtener datos reactivos
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const [currentTime, setCurrentTime] = useState(new Date());

  const total = getTotal();
  const itemCount = items.length;

  // Actualizar hora cada segundo para mostrar que está activo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${customerDisplayConfig.gradientFrom} ${customerDisplayConfig.gradientTo} flex flex-col justify-center items-center p-8`}>
      {/* Encabezado */}
      <div className="text-center mb-12">
        <h1 className={`${customerDisplayConfig.titleSize} font-bold ${customerDisplayConfig.textPrimary} mb-2`}>
          {customerDisplayConfig.companyName}
        </h1>
        <p className={`${customerDisplayConfig.subtitleSize} ${customerDisplayConfig.textSecondary}`}>
          {customerDisplayConfig.orderTitle}
        </p>
      </div>

      {/* Contenedor principal */}
      <div className="w-full max-w-4xl">
        {itemCount === 0 ? (
          // Pantalla vacía
          <div className="text-center">
            <div className="text-8xl mb-6">{customerDisplayConfig.emptyStateEmoji}</div>
            <p className={`text-3xl ${customerDisplayConfig.textPrimary} font-semibold mb-2`}>
              {customerDisplayConfig.emptyStateTitle}
            </p>
            <p className={`text-xl ${customerDisplayConfig.textSecondary}`}>
              {customerDisplayConfig.emptyStateSubtitle}
            </p>
          </div>
        ) : (
          // Lista de items
          <div>
            {/* Items */}
            <div className={`bg-white bg-opacity-10 backdrop-blur-lg ${customerDisplayConfig.containerRounding} ${customerDisplayConfig.cardPadding} mb-8 ${customerDisplayConfig.itemSpacing} max-h-96 overflow-y-auto`}>
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center pb-6 border-b border-white border-opacity-20 last:border-0">
                  <div className="flex-1">
                    <h3 className={`${customerDisplayConfig.itemNameSize} font-bold ${customerDisplayConfig.textPrimary} mb-2`}>
                      {item.product.name}
                    </h3>
                    {item.toppings && item.toppings.length > 0 && (
                      <p className={`text-sm ${customerDisplayConfig.textSecondary}`}>
                        Toppings: {item.toppings.join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className={`text-sm ${customerDisplayConfig.textSecondary} italic`}>
                        Notas: {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-xl ${customerDisplayConfig.textSecondary} mb-1`}>
                      Cantidad: {item.quantity}
                    </p>
                    <p className={`${customerDisplayConfig.itemPriceSize} font-bold ${customerDisplayConfig.textPrimary}`}>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Separador */}
            <div className="h-1 bg-white bg-opacity-20 rounded-full mb-8"></div>

            {/* Total */}
            <div className="flex justify-between items-center">
              <p className={`text-4xl font-bold ${customerDisplayConfig.textPrimary}`}>Total:</p>
              <p className={`${customerDisplayConfig.totalSize} font-bold ${customerDisplayConfig.textAccent}`}>
                ${total.toFixed(2)}
              </p>
            </div>

            {/* Estado */}
            <div className="mt-12 text-center">
              <p className={`text-lg ${customerDisplayConfig.textSecondary}`}>
                {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'} en tu orden
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pie de página */}
      {customerDisplayConfig.showTimestamp && (
        <div className={`absolute bottom-8 right-8 ${customerDisplayConfig.textSecondary} text-sm`}>
          <p>🟢 Conectado</p>
          <p>{currentTime.toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
};

export default CustomerDisplayPage;
