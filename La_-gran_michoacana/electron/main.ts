import { app, BrowserWindow, screen, ipcMain, session } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { printTicket, TicketData } from './printer';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

// Configurar logging para actualizaciones
log.transports.file.level = 'info';
autoUpdater.logger = log;

let mainWindow: BrowserWindow | null = null;
let customerWindow: BrowserWindow | null = null;
let loginWindow: BrowserWindow | null = null;
let isLoggingOut = false; // Bandera para evitar que app.quit() se ejecute durante logout

// app.isPackaged es true SOLO cuando corre desde el instalador/build de producción
// process.env.NODE_ENV puede ser undefined en producción y causar pantalla en blanco
const isDev = !app.isPackaged;
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

// Estado del carrito compartido
let cartState = {
  items: [],
  total: 0,
};

// ============================================================
// SISTEMA DE AUTO-ACTUALIZACIÓN
// ============================================================

/**
 * Configura el sistema de auto-actualización
 */
function setupAutoUpdater() {
  // No verificar actualizaciones en desarrollo
  if (isDev) {
    log.info('Modo desarrollo: auto-actualización deshabilitada');
    return;
  }

  // Configurar para descargar desde GitHub releases con URL completa
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'alejandrovenzor8-dev',
    repo: 'La_-gran_michoacana',
    releaseType: 'release'
  });

  log.info('✓ Auto-actualización configurada desde GitHub');

  // Configurar auto-updater
  autoUpdater.autoDownload = false; // No descargar automáticamente
  autoUpdater.autoInstallOnAppQuit = true; // Instalar al cerrar la app
  
  // Verificar actualizaciones al iniciar (después de 3 segundos)
  setTimeout(() => {
    log.info('Verificando actualizaciones...');
    autoUpdater.checkForUpdates();
  }, 3000);

  // Verificar actualizaciones cada 4 horas
  setInterval(() => {
    log.info('Verificación periódica de actualizaciones');
    autoUpdater.checkForUpdates();
  }, 4 * 60 * 60 * 1000);

  // Eventos del auto-updater
  autoUpdater.on('checking-for-update', () => {
    log.info('Buscando actualizaciones...');
    sendUpdateStatusToWindows('checking');
  });

  autoUpdater.on('update-available', (info: any) => {
    log.info('Actualización disponible:', info.version);
    sendUpdateStatusToWindows('available', info);
    
    // Enviar evento específico a todas las ventanas
    const windows = [mainWindow, customerWindow, loginWindow];
    windows.forEach(win => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('update-available', {
          version: info.version,
          releaseNotes: info.releaseNotes,
        });
      }
    });
  });

  autoUpdater.on('update-not-available', (info: any) => {
    log.info('Sistema actualizado:', info.version);
    sendUpdateStatusToWindows('not-available', info);
    
    // Enviar evento específico a todas las ventanas
    const windows = [mainWindow, customerWindow, loginWindow];
    windows.forEach(win => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('update-not-available', info);
      }
    });
  });

  autoUpdater.on('error', (err: Error) => {
    log.error('Error en actualización:', err);
    // Si es 404, el servidor no tiene releases aún → tratar como no disponible
    if (err.message.includes('404') || err.message.includes('ERR_CONNECTION_REFUSED')) {
      log.info('Servidor de actualizaciones no disponible (404), omitiendo...');
      return;
    }
    sendUpdateStatusToWindows('error', { message: err.message });
    
    // Enviar evento específico de error a todas las ventanas
    const windows = [mainWindow, customerWindow, loginWindow];
    windows.forEach(win => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('update-error', { message: err.message });
      }
    });
  });

  autoUpdater.on('download-progress', (progressObj: any) => {
    const message = `Velocidad: ${progressObj.bytesPerSecond} - Descargado: ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    log.info(message);
    sendUpdateStatusToWindows('downloading', progressObj);
    
    // Enviar evento específico a todas las ventanas
    const windows = [mainWindow, customerWindow, loginWindow];
    windows.forEach(win => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('download-progress', progressObj);
      }
    });
  });

  autoUpdater.on('update-downloaded', (info: any) => {
    log.info('Actualización descargada:', info.version);
    sendUpdateStatusToWindows('downloaded', info);
    
    // Enviar evento específico a todas las ventanas
    const windows = [mainWindow, customerWindow, loginWindow];
    windows.forEach(win => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('update-downloaded', {
          version: info.version,
        });
      }
    });
  });
}

/**
 * Envía el estado de actualización a todas las ventanas abiertas
 */
function sendUpdateStatusToWindows(status: string, data?: any) {
  const windows = [mainWindow, customerWindow, loginWindow];
  windows.forEach(win => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('update-status', { status, data });
    }
  });
}

// IPC Handlers para auto-actualización
ipcMain.on('check-for-updates', () => {
  if (!isDev) {
    autoUpdater.checkForUpdates();
  }
});

ipcMain.on('download-update', () => {
  if (!isDev) {
    autoUpdater.downloadUpdate();
  }
});

ipcMain.on('install-update', () => {
  if (!isDev) {
    autoUpdater.quitAndInstall(false, true);
  }
});

// ============================================================
// VENTANAS DE LA APLICACIÓN
// ============================================================

function createLoginWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const iconPath = isDev ? path.join(__dirname, '../public/app-icon.png') : path.join(app.getAppPath(), 'app-icon.png');
  
  loginWindow = new BrowserWindow({
    x: primaryDisplay.bounds.x,
    y: primaryDisplay.bounds.y,
    width: primaryDisplay.bounds.width,
    height: primaryDisplay.bounds.height,
    title: 'La Michoacana POS - Login',
    resizable: true,
    fullscreen: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    loginWindow.loadURL(`${VITE_DEV_SERVER_URL}/#/login`);
    loginWindow.webContents.openDevTools();
  } else {
    loginWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/login',
    });
  }

  loginWindow.on('closed', () => {
    loginWindow = null;
  });
}

function createMainWindow() {
  const iconPath = isDev ? path.join(__dirname, '../public/app-icon.png') : path.join(app.getAppPath(), 'app-icon.png');
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 1024,
    title: 'La Gran Michoacana POS - Cajero',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL(`${VITE_DEV_SERVER_URL}/#/pos`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/pos',
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (customerWindow) {
      customerWindow.close();
    }
  });
}

function createCustomerDisplay() {
  const displays = screen.getAllDisplays();
  
  let displayBounds;
  
  // Buscar display externo (cualquiera que NO sea el primario)
  const primaryDisplay = screen.getPrimaryDisplay();
  const externalDisplay = displays.find((display) => {
    return display.id !== primaryDisplay.id;
  });

  if (externalDisplay) {
    displayBounds = externalDisplay.bounds;
  } else {
    // Abrir en la misma pantalla pero desplazado
    const primaryDisplay = screen.getPrimaryDisplay();
    displayBounds = {
      x: primaryDisplay.bounds.x + 50,
      y: primaryDisplay.bounds.y + 50,
      width: 1280,
      height: 720,
    };
  }

  const iconPath = isDev ? path.join(__dirname, '../public/app-icon.png') : path.join(app.getAppPath(), 'app-icon.png');
  
  customerWindow = new BrowserWindow({
    x: displayBounds.x,
    y: displayBounds.y,
    width: displayBounds.width,
    height: displayBounds.height,
    title: 'La Gran Michoacana - Pantalla Cliente',
    fullscreen: !!externalDisplay,
    frame: !externalDisplay, // Con frame si es misma pantalla, sin frame si es externo
    alwaysOnTop: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    customerWindow.loadURL(`${VITE_DEV_SERVER_URL}/#/customer-display`);
  } else {
    customerWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/customer-display',
    });
  }

  customerWindow.on('closed', () => {
    customerWindow = null;
  });
}


// IPC Handlers para comunicación entre ventanas
ipcMain.on('cart:update', (event, data) => {
  cartState = data;
  // Enviar actualización a la pantalla del cliente
  if (customerWindow && !customerWindow.isDestroyed()) {
    customerWindow.webContents.send('cart:updated', data);
  }
});

ipcMain.on('cart:clear', () => {
  cartState = { items: [], total: 0 };
  // Enviar evento a la pantalla del cliente
  if (customerWindow && !customerWindow.isDestroyed()) {
    customerWindow.webContents.send('cart:cleared');
  }
  // Enviar evento a la pantalla principal para limpiar Zustand
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('cart:cleared');
  }
});

ipcMain.handle('cart:get', () => {
  return cartState;
});

// IPC Handler para login exitoso - abre las dos ventanas principales
ipcMain.handle('login:success', () => {
  // Cerrar ventana de login
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.close();
    loginWindow = null;
  }
  
  // Crear las dos ventanas principales
  createMainWindow();
  createCustomerDisplay();
  
  return { success: true };
});

// IPC Handler para limpiar sesión
ipcMain.handle('clear:session', async () => {
  try {
    // Limpiar localStorage
    await session.defaultSession.clearStorageData({
      storages: ['localstorage'],
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
});

// IPC Handler para logout - cierra todas las ventanas y vuelve al login
ipcMain.handle('logout', async () => {
  try {
    // Establecer bandera para evitar que app.quit() se ejecute
    isLoggingOut = true;
    
    // PRIMERO: Crear ventana de login antes de cerrar las otras
    createLoginWindow();
    
    // Esperar un momento para que la ventana de login se cree
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // SEGUNDO: Cerrar ventana del cliente
    if (customerWindow && !customerWindow.isDestroyed()) {
      customerWindow.close();
      customerWindow = null;
    }
    
    // TERCERO: Cerrar ventana principal
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
      mainWindow = null;
    }
    
    // Limpiar localStorage
    await session.defaultSession.clearStorageData({
      storages: ['localstorage'],
    });
    
    // Restablecer bandera
    isLoggingOut = false;
    
    return { success: true };
  } catch (error) {
    isLoggingOut = false;
    return { success: false };
  }
});

// IPC Handler para imprimir ticket
ipcMain.handle('print-ticket', async (event, ticketData: TicketData) => {
  try {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) {
      throw new Error('No hay ventana activa');
    }
    await printTicket(window, ticketData);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
});

// ============================================================
// GESTIÓN DE IMÁGENES LOCALES
// ============================================================

/**
 * Guarda una imagen en el sistema de archivos local
 * @param base64Data - Imagen en formato Base64 (data:image/...)
 * @returns Ruta relativa de la imagen guardada
 */
ipcMain.handle('image:save', async (event, base64Data: string) => {
  try {
    // Obtener el directorio de datos de la aplicación
    const userDataPath = app.getPath('userData');
    const uploadsDir = path.join(userDataPath, 'uploads', 'products');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      log.info('Directorio de imágenes creado:', uploadsDir);
    }
    
    // Verificar que sea una imagen válida
    if (!base64Data.startsWith('data:image/')) {
      throw new Error('Formato de imagen inválido');
    }
    
    // Extraer tipo de imagen y datos Base64
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      throw new Error('No se pudo parsear la imagen');
    }
    
    const imageType = matches[1]; // png, jpg, jpeg, webp, etc.
    const imageBuffer = Buffer.from(matches[2], 'base64');
    
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const filename = `product-${timestamp}-${randomHash}.${imageType}`;
    const filePath = path.join(uploadsDir, filename);
    
    // Guardar archivo
    fs.writeFileSync(filePath, imageBuffer);
    
    // Retornar ruta relativa (para guardar en BD)
    const relativePath = `uploads/products/${filename}`;
    
    log.info('Imagen guardada:', relativePath);
    
    return {
      success: true,
      path: relativePath,
      fullPath: filePath,
    };
  } catch (error) {
    log.error('Error guardando imagen:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
});

/**
 * Obtiene la ruta absoluta de una imagen
 * @param relativePath - Ruta relativa (ej: uploads/products/imagen.jpg)
 * @returns Ruta absoluta del archivo
 */
ipcMain.handle('image:getPath', async (event, relativePath: string) => {
  try {
    const userDataPath = app.getPath('userData');
    const fullPath = path.join(userDataPath, relativePath);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(fullPath)) {
      log.warn('Imagen no encontrada:', fullPath);
      return {
        success: false,
        error: 'Imagen no encontrada',
      };
    }
    
    // Convertir a file:// URL para que pueda ser usado en <img src=...
    const fileUrl = `file://${fullPath.replace(/\\/g, '/')}`;
    
    return {
      success: true,
      path: fileUrl,
      fullPath: fullPath,
    };
  } catch (error) {
    log.error('Error obteniendo ruta de imagen:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
});

/**
 * Obtiene la ruta del logo como file:// URL
 */
ipcMain.handle('asset:getLogoPath', async (event) => {
  try {
    const appPath = app.getAppPath();
    const logoPath = path.join(appPath, 'dist', 'logo.png');
    
    // Verificar si el archivo existe
    if (!fs.existsSync(logoPath)) {
      log.warn('Logo no encontrado en:', logoPath);
      return {
        success: false,
        error: 'Logo no encontrado',
      };
    }
    
    // Convertir a file:// URL
    const fileUrl = `file://${logoPath.replace(/\\/g, '/')}`;
    
    return {
      success: true,
      path: fileUrl,
    };
  } catch (error) {
    log.error('Error obteniendo ruta del logo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
});

/**
 * Elimina una imagen del sistema de archivos
 * @param relativePath - Ruta relativa de la imagen
 */
ipcMain.handle('image:delete', async (event, relativePath: string) => {
  try {
    const userDataPath = app.getPath('userData');
    const fullPath = path.join(userDataPath, relativePath);
    
    // Verificar si el archivo existe
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      log.info('Imagen eliminada:', relativePath);
      return { success: true };
    } else {
      log.warn('Imagen no encontrada para eliminar:', relativePath);
      return { success: true }; // No es error si ya no existe
    }
  } catch (error) {
    log.error('Error eliminando imagen:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
});

// IPC Handler para cerrar la aplicación completamente
ipcMain.on('app:close', () => {
  app.quit();
});

app.whenReady().then(() => {
  // Configurar sistema de auto-actualización
  setupAutoUpdater();
  
  // Solo crear ventana de login al inicio
  createLoginWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLoginWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  // Si estamos en proceso de logout, NO cerrar la aplicación
  if (isLoggingOut) {
    return;
  }
  
  // Limpiar sesión y localStorage antes de cerrar
  try {
    await session.defaultSession.clearStorageData({
      storages: ['localstorage'],
    });
  } catch (error) {
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
