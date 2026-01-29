import { app, BrowserWindow, screen, ipcMain, session } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;
let customerWindow: BrowserWindow | null = null;
let loginWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV !== 'production';
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

// Estado del carrito compartido
let cartState = {
  items: [],
  total: 0,
};

function createLoginWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  
  loginWindow = new BrowserWindow({
    x: primaryDisplay.bounds.x,
    y: primaryDisplay.bounds.y,
    width: primaryDisplay.bounds.width,
    height: primaryDisplay.bounds.height,
    title: 'Super Coldy POS - Login',
    resizable: true,
    fullscreen: true,
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
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 1024,
    title: 'La Gran Michoacana POS - Cajero',
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
  
  console.log('🖥️ Displays detectados:', displays.length);
  displays.forEach((display, index) => {
    console.log(`Display ${index}:`, display.bounds);
  });

  let displayBounds;
  
  // Buscar display externo (cualquiera que NO sea el primario)
  const primaryDisplay = screen.getPrimaryDisplay();
  const externalDisplay = displays.find((display) => {
    return display.id !== primaryDisplay.id;
  });

  if (externalDisplay) {
    console.log('✅ Segundo monitor detectado');
    displayBounds = externalDisplay.bounds;
  } else {
    console.log('⚠️ Solo un monitor detectado, abriendo en posición alternativa');
    // Abrir en la misma pantalla pero desplazado
    const primaryDisplay = screen.getPrimaryDisplay();
    displayBounds = {
      x: primaryDisplay.bounds.x + 50,
      y: primaryDisplay.bounds.y + 50,
      width: 1280,
      height: 720,
    };
  }

  customerWindow = new BrowserWindow({
    x: displayBounds.x,
    y: displayBounds.y,
    width: displayBounds.width,
    height: displayBounds.height,
    title: 'La Gran Michoacana - Pantalla Cliente',
    fullscreen: !!externalDisplay,
    frame: !externalDisplay, // Con frame si es misma pantalla, sin frame si es externo
    alwaysOnTop: false,
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
  if (customerWindow && !customerWindow.isDestroyed()) {
    customerWindow.webContents.send('cart:cleared');
  }
});

ipcMain.handle('cart:get', () => {
  return cartState;
});

// IPC Handler para login exitoso - abre las dos ventanas principales
ipcMain.handle('login:success', () => {
  console.log('🔓 Login exitoso detectado en main.ts');
  
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
  console.log('🔐 Limpiando sesión y localStorage...');
  
  try {
    // Limpiar localStorage
    await session.defaultSession.clearStorageData({
      storages: ['localstorage'],
    });
    console.log('✅ localStorage limpiado');
    return { success: true };
  } catch (error) {
    console.error('❌ Error limpiando localStorage:', error);
    return { success: false };
  }
});

// IPC Handler para logout - cierra todas las ventanas y vuelve al login
ipcMain.handle('logout', async () => {
  console.log('🚪 Logout detectado - cerrando ventanas...');
  
  try {
    // Cerrar ventana del cliente
    if (customerWindow && !customerWindow.isDestroyed()) {
      customerWindow.close();
      customerWindow = null;
      console.log('✅ Pantalla cliente cerrada');
    }
    
    // Cerrar ventana principal
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
      mainWindow = null;
      console.log('✅ Ventana principal cerrada');
    }
    
    // Limpiar localStorage
    await session.defaultSession.clearStorageData({
      storages: ['localstorage'],
    });
    console.log('✅ Sesión limpiada');
    
    // Crear ventana de login
    createLoginWindow();
    console.log('✅ Ventana de login reabierta');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error en logout:', error);
    return { success: false };
  }
});

app.whenReady().then(() => {
  // Solo crear ventana de login al inicio
  createLoginWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLoginWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  // Limpiar sesión y localStorage antes de cerrar
  console.log('🔐 Limpiando sesión al cerrar la aplicación...');
  try {
    await session.defaultSession.clearStorageData({
      storages: ['localstorage'],
    });
    console.log('✅ Sesión limpiada al cerrar');
  } catch (error) {
    console.error('❌ Error limpiando sesión:', error);
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
