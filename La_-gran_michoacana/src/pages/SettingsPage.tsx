import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Info, Database } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-primary" />
            Configuración
          </h1>
          <p className="text-gray-600">Administra la configuración del sistema POS</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del Sistema */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-gray-800">Información del Sistema</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Versión de Aplicación</p>
                  <p className="font-semibold text-gray-800">v1.0.0</p>
                </div>
                <div>
                  <p className="text-gray-600">Nombre del Negocio</p>
                  <p className="font-semibold text-gray-800">La Gran Michoacana</p>
                </div>
                <div>
                  <p className="text-gray-600">Última Actualización</p>
                  <p className="font-semibold text-gray-800">29 de Enero de 2026</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gestión de Datos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-gray-800">Gestión de Datos</h3>
              </div>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    if (confirm('¿Deseas exportar los datos del carrito actual?')) {
                    }
                  }}
                >
                  Exportar Datos
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('¿Deseas limpiar todos los datos locales? Esta acción no se puede deshacer.')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                >
                  Limpiar Datos Locales
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Pantalla */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Pantalla del Cliente</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Estado</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="font-semibold text-gray-800">Conectada</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    const displayWindow = window.open('/customer-display', 'CustomerDisplay');
                    if (displayWindow) {
                      displayWindow.resizeTo(1920, 1080);
                    }
                  }}
                >
                  Abrir en Nueva Ventana
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ayuda */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Ayuda y Soporte</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Para agregar productos, selecciona del catálogo</p>
                <p>• Usa el carrito para administrar la venta</p>
                <p>• La pantalla del cliente muestra el resumen</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
