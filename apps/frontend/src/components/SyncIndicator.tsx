import React, { useState, useEffect } from 'react';

interface SyncIndicatorProps {
  isConnected: boolean;
  itemsCount: number;
  lastUpdate?: Date;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ 
  isConnected, 
  itemsCount, 
  lastUpdate 
}) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setBlink((prev) => !prev);
    }, 600);

    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      isConnected
        ? `bg-green-100 text-green-700 ${blink ? 'opacity-100' : 'opacity-60'}`
        : 'bg-gray-100 text-gray-600'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-500' : 'bg-gray-400'
      }`} />
      <span>
        {isConnected ? `${itemsCount} sincronizados` : 'Desconectado'}
      </span>
    </div>
  );
};

export default SyncIndicator;
