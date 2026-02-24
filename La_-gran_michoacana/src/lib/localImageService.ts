/**
 * Servicio para gestionar imágenes localmente en el sistema de archivos
 * Solo para aplicaciones Electron
 */

// Verificar si estamos en Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

export interface ImageSaveResult {
  success: boolean;
  path?: string;
  fullPath?: string;
  error?: string;
}

export interface ImagePathResult {
  success: boolean;
  path?: string;
  fullPath?: string;
  error?: string;
}

class LocalImageService {
  /**
   * Guarda una imagen en el sistema de archivos local
   * @param base64Data - Imagen en formato Base64 (data:image/...)
   * @returns Ruta relativa de la imagen guardada
   */
  async saveImage(base64Data: string): Promise<ImageSaveResult> {
    if (!isElectron() || !window.electronAPI) {
      return {
        success: false,
        error: 'Función solo disponible en Electron',
      };
    }

    try {
      const result = await window.electronAPI.saveImage(base64Data);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Obtiene la URL completa de una imagen local
   * @param relativePath - Ruta relativa (ej: uploads/products/imagen.jpg)
   * @returns URL file:// para usar en <img src>
   */
  async getImageUrl(relativePath: string | null | undefined): Promise<string | null> {
    if (!relativePath) {
      return null;
    }

    if (!isElectron() || !window.electronAPI) {
      // En modo desarrollo web, retornar la ruta tal cual
      return relativePath;
    }

    try {
      const result = await window.electronAPI.getImagePath(relativePath);
      
      if (result.success && result.path) {
        return result.path;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Elimina una imagen del sistema de archivos
   * @param relativePath - Ruta relativa de la imagen
   */
  async deleteImage(relativePath: string | null | undefined): Promise<boolean> {
    if (!relativePath) {
      return true;
    }

    if (!isElectron() || !window.electronAPI) {
      return false;
    }

    try {
      const result = await window.electronAPI.deleteImage(relativePath);
      return result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verifica si una imagen existe y está accesible
   * @param relativePath - Ruta relativa de la imagen
   */
  async imageExists(relativePath: string | null | undefined): Promise<boolean> {
    if (!relativePath) {
      return false;
    }

    if (!isElectron() || !window.electronAPI) {
      return false;
    }

    try {
      const result = await window.electronAPI.getImagePath(relativePath);
      return result.success;
    } catch (error) {
      return false;
    }
  }
}

export const localImageService = new LocalImageService();
