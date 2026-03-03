import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import log from 'electron-log';

/**
 * Controla la caja registradora Qian
 * Utiliza comunicación serial a través de puerto COM
 * 
 * Comando ESC/POS para abrir caja registradora:
 * ESC p m t1 t2 (0x1B 0x70 0x00 0x32 0x32)
 */

export interface CashDrawerConfig {
  port: string; // Puerto COM (ej: 'COM3')
  baudRate?: number; // Velocidad (por defecto 9600)
  timeout?: number; // Timeout en ms (por defecto 3000)
}

/**
 * Abre la caja registradora Qian
 * @param config Configuración del puerto serial
 */
export async function openCashDrawer(config: CashDrawerConfig): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    try {
      const port = new SerialPort(
        {
          path: config.port,
          baudRate: config.baudRate || 9600,
          autoOpen: true,
        },
        (err) => {
          if (err) {
            log.error('Error al abrir puerto serial:', err);
            resolve({
              success: false,
              message: `Error al abrir puerto ${config.port}: ${err.message}`,
            });
            return;
          }

          // Comando ESC/POS para abrir caja registradora
          // ESC p 0 32 32
          const openCommand = Buffer.from([0x1b, 0x70, 0x00, 0x32, 0x32]);

          port.write(openCommand, (err) => {
            if (err) {
              log.error('Error al enviar comando a caja registradora:', err);
              port.close(() => {
                resolve({
                  success: false,
                  message: `Error al enviar comando: ${err.message}`,
                });
              });
              return;
            }

            log.info('Comando de apertura de caja enviado correctamente');

            // Esperar un poco antes de cerrar el puerto
            setTimeout(() => {
              port.close(() => {
                resolve({
                  success: true,
                  message: 'Caja registradora abierta correctamente',
                });
              });
            }, 500);
          });
        }
      );

      // Timeout si no se completa después de cierto tiempo
      const timeout = setTimeout(() => {
        if (port.isOpen) {
          port.close();
        }
        resolve({
          success: false,
          message: `Timeout al abrir caja (puerto no respondió en ${config.timeout || 3000}ms)`,
        });
      }, config.timeout || 3000);

      // Limpiar timeout si se completa exitosamente
      port.on('close', () => {
        clearTimeout(timeout);
      });
    } catch (error: any) {
      log.error('Error en openCashDrawer:', error);
      resolve({
        success: false,
        message: `Error inesperado: ${error.message}`,
      });
    }
  });
}

/**
 * Obtiene la lista de puertos serie disponibles
 */
export async function getAvailablePorts(): Promise<string[]> {
  try {
    const ports = await SerialPort.list();
    return ports
      .map((portInfo) => portInfo.path)
      .filter((path) => path); // Filtrar puertos vacíos
  } catch (error) {
    log.error('Error al obtener puertos disponibles:', error);
    return [];
  }
}

/**
 * Detecta automáticamente el puerto de la caja registradora
 * (Por defecto intenta puertos COM comunes)
 */
export async function detectCashDrawerPort(): Promise<string | undefined> {
  try {
    const ports = await getAvailablePorts();
    
    // Buscar primero puertos que contienen palabras clave comunes
    const keywordPorts = ports.filter(
      (port) =>
        port.toLowerCase().includes('com') ||
        port.toLowerCase().includes('usb') ||
        port.toLowerCase().includes('serial')
    );

    if (keywordPorts.length > 0) {
      return keywordPorts[0];
    }

    // Si no encuentra, retornar el primer puerto disponible
    return ports.length > 0 ? ports[0] : undefined;
  } catch (error) {
    log.error('Error al detectar puerto de caja registradora:', error);
    return undefined;
  }
}
