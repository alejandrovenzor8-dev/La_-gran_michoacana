import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Definición de tipos para los recursos del sistema
interface SystemResources {
  totalMemoryGB: number;
  freeMemoryGB: number;
  cpuCount: number;
  arch: string;
  platform: string;
  cpuModel: string;
  shouldUseBasicMode: boolean;
  is32Bit: boolean;
  isLowMemory: boolean;
  isLowCPU: boolean;
}

// Extender la interfaz de Window para incluir las nuevas funciones de ElectronAPI
declare global {
  interface Window {
    electronAPI?: {
      getSystemResources?: () => Promise<{ 
        success: boolean; 
        resources?: SystemResources;
        error?: string;
      }>;
      savePerformanceConfig?: (config: { useBasicMode: boolean }) => Promise<{ success: boolean; error?: string }>;
      loadPerformanceConfig?: () => Promise<{ success: boolean; config?: { useBasicMode: boolean } | null; error?: string }>;
      [key: string]: any;
    };
  }
}

interface PerformanceStore {
  // Configuración del modo de rendimiento
  useBasicMode: boolean;
  isAutoDetected: boolean;
  systemResources: SystemResources | null;
  isInitialized: boolean;

  // Acciones
  setBasicMode: (enabled: boolean, isAuto?: boolean) => void;
  initializePerformanceMode: () => Promise<void>;
  detectSystemResources: () => Promise<void>;
  saveConfig: () => Promise<void>;
}

export const usePerformanceStore = create<PerformanceStore>()(
  persist(
    (set, get) => ({
      useBasicMode: false,
      isAutoDetected: false,
      systemResources: null,
      isInitialized: false,

      /**
       * Establece el modo de rendimiento
       */
      setBasicMode: (enabled: boolean, isAuto: boolean = false) => {
        set({ 
          useBasicMode: enabled,
          isAutoDetected: isAuto
        });

        // Aplicar clase al documento
        if (enabled) {
          document.documentElement.classList.add('basic-mode');
          document.documentElement.classList.add('no-animations');
        } else {
          document.documentElement.classList.remove('basic-mode');
          document.documentElement.classList.remove('no-animations');
        }

        // Guardar configuración en Electron si está disponible
        get().saveConfig();
      },

      /**
       * Inicializa el modo de rendimiento detectando recursos del sistema
       */
      initializePerformanceMode: async () => {
        if (get().isInitialized) {
          return;
        }

        try {
          const isElectron = typeof window !== 'undefined' && window.electronAPI;
          
          if (!isElectron || !window.electronAPI) {
            // Si no es Electron, usar modo normal
            set({ 
              isInitialized: true,
              useBasicMode: false,
              isAutoDetected: false
            });
            return;
          }

          // Intentar cargar configuración guardada
          const configResult = await window.electronAPI.loadPerformanceConfig?.();
          
          if (configResult?.success && configResult.config !== null && configResult.config !== undefined) {
            // El usuario ya configuró manualmente el modo
            const useBasic = configResult.config.useBasicMode;
            set({ 
              useBasicMode: useBasic,
              isAutoDetected: false,
              isInitialized: true
            });
            
            // Aplicar clase al documento
            if (useBasic) {
              document.documentElement.classList.add('basic-mode');
              document.documentElement.classList.add('no-animations');
            }
            
            console.log('✓ Configuración de rendimiento cargada:', configResult.config);
          } else {
            // No hay configuración guardada, detectar automáticamente
            await get().detectSystemResources();
          }
        } catch (error) {
          console.error('Error inicializando modo de rendimiento:', error);
          set({ 
            isInitialized: true,
            useBasicMode: false,
            isAutoDetected: false
          });
        }
      },

      /**
       * Detecta los recursos del sistema y configura el modo automáticamente
       */
      detectSystemResources: async () => {
        try {
          const isElectron = typeof window !== 'undefined' && window.electronAPI;
          
          if (!isElectron || !window.electronAPI) {
            return;
          }

          const result = await window.electronAPI.getSystemResources?.();
          
          if (result?.success && result.resources) {
            const resources = result.resources;
            
            set({ 
              systemResources: resources,
              useBasicMode: resources.shouldUseBasicMode,
              isAutoDetected: true,
              isInitialized: true
            });

            // Aplicar clase al documento si es necesario
            if (resources.shouldUseBasicMode) {
              document.documentElement.classList.add('basic-mode');
              document.documentElement.classList.add('no-animations');
            }

            console.log('✓ Recursos del sistema detectados:', resources);
            
            if (resources.shouldUseBasicMode) {
              console.log('⚠️ Modo básico activado automáticamente debido a:');
              if (resources.isLowMemory) {
                console.log(`  - Memoria baja: ${resources.totalMemoryGB}GB (recomendado: >2.5GB)`);
              }
              if (resources.is32Bit) {
                console.log('  - Sistema de 32 bits detectado');
              }
              if (resources.isLowCPU) {
                console.log(`  - CPU con pocos núcleos: ${resources.cpuCount} (recomendado: >=2)`);
              }
            } else {
              console.log('✓ Sistema con recursos suficientes. Modo completo activado.');
            }

            // Guardar configuración
            await get().saveConfig();
          }
        } catch (error) {
          console.error('Error detectando recursos del sistema:', error);
          set({ 
            isInitialized: true,
            useBasicMode: false,
            isAutoDetected: false
          });
        }
      },

      /**
       * Guarda la configuración de rendimiento en Electron
       */
      saveConfig: async () => {
        try {
          const isElectron = typeof window !== 'undefined' && window.electronAPI;
          
          if (!isElectron || !window.electronAPI) {
            return;
          }

          const { useBasicMode } = get();
          
          await window.electronAPI.savePerformanceConfig?.({ 
            useBasicMode 
          });
          
          console.log('✓ Configuración de rendimiento guardada');
        } catch (error) {
          console.error('Error guardando configuración de rendimiento:', error);
        }
      },
    }),
    {
      name: 'performance-storage',
      partialize: (state) => ({
        useBasicMode: state.useBasicMode,
        isAutoDetected: state.isAutoDetected,
        systemResources: state.systemResources,
      }),
    }
  )
);
