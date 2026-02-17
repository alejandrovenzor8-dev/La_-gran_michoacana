import { app, BrowserWindow, screen, ipcMain, session } from 'electron';
import path from 'path';
import { printTicket, TicketData } from './printer';

let mainWindow: BrowserWindow | null = null;
let customerWindow: BrowserWindow | null = null;
let loginWindow: BrowserWindow | null = null;
let isLoggingOut = false; // Bandera para evitar que app.quit() se ejecute durante logout

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

// IPC Handler para cerrar la aplicación completamente
ipcMain.on('app:close', () => {
  app.quit();
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
