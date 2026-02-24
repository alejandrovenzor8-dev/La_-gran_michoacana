import { useState, useEffect } from 'react';
import { localImageService } from '@/lib/localImageService';

interface LocalImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Componente para mostrar imágenes guardadas localmente en Electron
 * Convierte rutas relativas a URLs file:// automáticamente
 */
export function LocalImage({ src, alt, className, fallback }: LocalImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    // Si ya es una URL completa (data: o http:), usarla directamente
    if (src.startsWith('data:') || src.startsWith('http:') || src.startsWith('https:') || src.startsWith('file:')) {
      setImageUrl(src);
      setLoading(false);
      return;
    }

    // Si es una ruta relativa, obtener la URL completa del servicio
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        const url = await localImageService.getImageUrl(src);
        
        if (url) {
          setImageUrl(url);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [src]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="animate-pulse text-gray-400">Cargando...</div>
      </div>
    );
  }

  if (error || !imageUrl) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-gray-400 text-xs">Sin imagen</div>
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
