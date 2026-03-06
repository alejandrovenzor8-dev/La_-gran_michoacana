import { app, BrowserWindow, screen, ipcMain, session, systemPreferences } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import http from 'http';
import https from 'https';
import os from 'os';
import { URL } from 'url';
import { printTicket, TicketData, printCashierCut, CashierCutData } from './printer';
import { openCashDrawer, detectCashDrawerPort } from './cashDrawer';
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

  // Configurar para descargar desde GitHub releases
  // Usar GitHub provider para detectar automáticamente los releases
  log.info(`🔄 Configurando auto-updater con GitHub releases`);
  
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'alejandrovenzor8-dev',
    repo: 'La_-gran_michoacana'
  });

  log.info('✓ Auto-actualización configurada desde GitHub releases');

  // Configurar auto-updater
  autoUpdater.autoDownload = false; // No descargar automáticamente
  autoUpdater.autoInstallOnAppQuit = true; // Instalar al cerrar la app
  
  // Verificar actualizaciones al iniciar (después de 3 segundos)
  setTimeout(() => {
    log.info('⏰ Iniciando verificación de actualizaciones...');
    autoUpdater.checkForUpdates();
  }, 3000);

  // Verificar actualizaciones cada 4 horas
  setInterval(() => {
    log.info('⏰ Verificación periódica de actualizaciones');
    autoUpdater.checkForUpdates();
  }, 4 * 60 * 60 * 1000);

  // Eventos del auto-updater
  autoUpdater.on('checking-for-update', () => {
    log.info('🔍 Buscando actualizaciones en GitHub releases');
    sendUpdateStatusToWindows('checking');
  });

  autoUpdater.on('update-available', (info: any) => {
    log.info('✅ Actualización disponible:', info.version);
    log.info('📜 Release notes:', info.releaseNotes);
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
    log.info('✔️ Sistema actualizado - Versión actual:', info.version);
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
    log.error('❌ Error en actualización:', err.message);
    log.error('Stack:', err.stack);
    
    // Si es 404, el servidor no tiene releases aún → tratar como no disponible
    if (err.message.includes('404') || err.message.includes('ERR_CONNECTION_REFUSED')) {
      log.warn('⚠️ Servidor de actualizaciones no disponible (404 o conexión rechazada), omitiendo...');
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
    log.info('Iniciando descarga de actualización...');
    // Enviar estado inicial de descarga
    sendUpdateStatusToWindows('downloading', {
      percent: 0,
      bytesPerSecond: 0,
      transferred: 0,
      total: 0
    });
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
    fullscreen: true,
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
  console.log('🎫 [IPC Handler] Recibido print-ticket:', ticketData);
  try {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) {
      throw new Error('No hay ventana activa');
    }
    console.log('🎫 [IPC Handler] Llamando a printTicket...');
    await printTicket(window, ticketData);
    console.log('🎫 [IPC Handler] Impresión exitosa');
    return { success: true };
  } catch (error) {
    console.error('🎫 [IPC Handler] Error en impresión:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
});

// IPC Handler para imprimir corte de caja
ipcMain.handle('print-cashier-cut', async (event, cutData: CashierCutData, username: string, branchName?: string) => {
  console.log('💰 [IPC Handler] Recibido print-cashier-cut:', cutData);
  try {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) {
      throw new Error('No hay ventana activa');
    }
    console.log('💰 [IPC Handler] Llamando a printCashierCut...');
    await printCashierCut(window, cutData, username, branchName);
    console.log('💰 [IPC Handler] Impresión del corte exitosa');
    return { success: true };
  } catch (error) {
    console.error('💰 [IPC Handler] Error en impresión del corte:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
});

// ============================================================
// GESTIÓN DE IMPRESORAS
// ============================================================

// IPC Handler para obtener impresora predefinida
ipcMain.handle('printers:getDefault', async (event) => {
  try {
    const printerName = loadPrinterConfig();
    return { printerName: printerName || null };
  } catch (error) {
    return { error: 'Error al obtener impresora predefinida' };
  }
});

// IPC Handler para establecer impresora predefinida
ipcMain.handle('printers:setDefault', async (event, printerName: string) => {
  try {
    // Guardar usando localStorage de Electron (en la app data)
    const appPath = app.getPath('userData');
    const configPath = path.join(appPath, 'printer-config.json');
    
    const config = {
      defaultPrinter: printerName,
      savedAt: new Date().toISOString(),
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al guardar impresora',
    };
  }
});

// Cargar configuración de impresora al iniciar
function loadPrinterConfig() {
  try {
    const appPath = app.getPath('userData');
    const configPath = path.join(appPath, 'printer-config.json');
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.defaultPrinter;
    }
  } catch (error) {
    console.error('Error al cargar configuración de impresora:', error);
  }
  return null;
}


// ============================================================
// CAJA REGISTRADORA
// ============================================================

// IPC Handler para abrir caja registradora
ipcMain.handle('cashDrawer:open', async (event, portConfig?: { port: string }) => {
  try {
    // Si no se especifica puerto, intentar detectarlo automáticamente
    let port = portConfig?.port;
    
    if (!port) {
      port = await detectCashDrawerPort();
    }
    
    if (!port) {
      return {
        success: false,
        message: 'No se encontró puerto serial disponible. Verifica que la caja registradora esté conectada.',
      };
    }
    
    const result = await openCashDrawer({ port, baudRate: 9600 });
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al abrir la caja registradora',
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
 * @returns Imagen en formato base64 (data:image/...) para mostrar directamente
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
    
    // Leer el archivo como buffer
    const imageBuffer = fs.readFileSync(fullPath);
    
    // Detectar tipo de imagen por extensión
    const ext = path.extname(fullPath).toLowerCase();
    let mimeType = 'image/png'; // Default
    
    if (ext === '.jpg' || ext === '.jpeg') {
      mimeType = 'image/jpeg';
    } else if (ext === '.png') {
      mimeType = 'image/png';
    } else if (ext === '.gif') {
      mimeType = 'image/gif';
    } else if (ext === '.webp') {
      mimeType = 'image/webp';
    }
    
    // Convertir a base64
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    
    return {
      success: true,
      path: dataUrl, // Retornar data URL en lugar de file://
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
 * Obtiene el logo como data URL para evitar bloqueos de file:// en renderer
 */
ipcMain.handle('asset:getLogoPath', async (event) => {
  try {
    const appPath = app.getAppPath();
    const possibleLogoPaths = [
      path.join(appPath, 'dist', 'logo.png'),
      path.join(appPath, 'public', 'logo.png'),
      path.join(process.cwd(), 'dist', 'logo.png'),
      path.join(process.cwd(), 'public', 'logo.png'),
    ];

    const logoPath = possibleLogoPaths.find((candidate) => fs.existsSync(candidate));

    if (!logoPath) {
      log.warn('Logo no encontrado en rutas conocidas', { possibleLogoPaths });
      return {
        success: false,
        error: 'Logo no encontrado',
      };
    }

    const imageBuffer = fs.readFileSync(logoPath);
    const mimeType = path.extname(logoPath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

    return {
      success: true,
      path: dataUrl,
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

// ============================================================
// UTILIDADES PARA REQUESTS HTTP
// ============================================================

async function makeHttpRequest(
  method: 'GET' | 'PUT',
  url: string,
  body?: any
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestModule = parsedUrl.protocol === 'http:' ? http : https;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = requestModule.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode || 500, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode || 500, data: { error: 'Invalid JSON' } });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// ============================================================
// RENDIMIENTO DEL SISTEMA
// ============================================================

type PerformanceConfig = {
  useBasicMode: boolean;
};

function getPerformanceConfigPath() {
  return path.join(app.getPath('userData'), 'performance-config.json');
}

ipcMain.handle('system:getResources', async () => {
  try {
    const totalMemoryGB = Number((os.totalmem() / (1024 ** 3)).toFixed(2));
    const freeMemoryGB = Number((os.freemem() / (1024 ** 3)).toFixed(2));
    const cpuInfo = os.cpus();
    const cpuCount = cpuInfo.length;
    const cpuModel = cpuInfo[0]?.model || 'Desconocido';
    const arch = os.arch();
    const platform = os.platform();

    const is32Bit = arch === 'ia32';
    const isLowMemory = totalMemoryGB <= 2.5;
    const isLowCPU = cpuCount < 2;
    const shouldUseBasicMode = is32Bit || isLowMemory || isLowCPU;

    return {
      success: true,
      resources: {
        totalMemoryGB,
        freeMemoryGB,
        cpuCount,
        arch,
        platform,
        cpuModel,
        shouldUseBasicMode,
        is32Bit,
        isLowMemory,
        isLowCPU,
      },
    };
  } catch (error) {
    log.error('Error obteniendo recursos del sistema:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
});

ipcMain.handle('system:savePerformanceConfig', async (_event, config: PerformanceConfig) => {
  try {
    const configPath = getPerformanceConfigPath();
    const payload: PerformanceConfig = {
      useBasicMode: Boolean(config?.useBasicMode),
    };

    fs.writeFileSync(configPath, JSON.stringify(payload, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    log.error('Error guardando configuración de rendimiento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
});

ipcMain.handle('system:loadPerformanceConfig', async () => {
  try {
    const configPath = getPerformanceConfigPath();

    if (!fs.existsSync(configPath)) {
      return { success: true, config: null };
    }

    const rawConfig = fs.readFileSync(configPath, 'utf-8');
    const parsedConfig = JSON.parse(rawConfig);

    return {
      success: true,
      config: {
        useBasicMode: Boolean(parsedConfig?.useBasicMode),
      },
    };
  } catch (error) {
    log.error('Error cargando configuración de rendimiento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
});

// ============================================================
// GESTIÓN DE IMPRESORAS
// ============================================================

/**
 * Obtiene la lista de impresoras disponibles en el sistema
 */
ipcMain.handle('printers:list', async (event) => {
  try {
    // event.sender es el webContents que invocó el handler
    // Funciona con Electron v22+ (getPrintersAsync) y anteriores (getPrinters)
    let printers: Electron.PrinterInfo[] = [];

    if (typeof event.sender.getPrintersAsync === 'function') {
      // Electron v22+
      printers = await event.sender.getPrintersAsync();
    } else {
      // Electron < v22 (síncrono)
      printers = (event.sender as any).getPrinters();
    }

    log.info(`Impresoras detectadas: ${printers.length}`);

    // Mapear al formato esperado por el renderer
    return printers.map((p) => ({
      name: p.name,
      displayName: p.displayName || p.name,
    }));
  } catch (error) {
    log.error('Error obteniendo impresoras:', error);
    throw error;
  }
});

/**
 * Guarda la impresora seleccionada por sucursal
 */

// Guardar impresora seleccionada en Railway backend
ipcMain.handle('printer:save', async (_event, printerName: string, branchId: number) => {
  try {
    // En desarrollo usar localhost, en producción usar Railway
    const apiUrl = !app.isPackaged
      ? 'http://localhost:3000/api'
      : (process.env.API_URL || 'https://la-granmichoacana-production.up.railway.app/api');
    const response = await makeHttpRequest('PUT', `${apiUrl}/settings/printer/${branchId}`, {
      printerName,
    });

    if (response.status < 200 || response.status >= 300) {
      log.error(`Error guardando impresora: ${response.status}`, response.data);
      return { success: false, error: `HTTP ${response.status}` };
    }

    log.info('Impresora guardada exitosamente:', response.data);
    return { success: true };
  } catch (error) {
    log.error('Error guardando impresora:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Obtener impresora guardada desde Railway backend
ipcMain.handle('printer:get', async (_event, branchId: number) => {
  try {
    // En desarrollo usar localhost, en producción usar Railway
    const apiUrl = !app.isPackaged
      ? 'http://localhost:3000/api'
      : (process.env.API_URL || 'https://la-granmichoacana-production.up.railway.app/api');
    const response = await makeHttpRequest('GET', `${apiUrl}/settings/printer/${branchId}`);

    if (response.status < 200 || response.status >= 300) {
      log.error(`Error obteniendo impresora: ${response.status}`, response.data);
      return { printerName: null };
    }

    return { printerName: response.data.data?.printerName || null };
  } catch (error) {
    log.error('Error obteniendo impresora guardada:', error);
    return { printerName: null };
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
