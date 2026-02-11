import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Download,
  Receipt,
  Clock,
  Loader,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { saleService } from '@/lib/saleService';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type ReportPeriod = 'day' | 'week' | 'month' | 'year';
type TabType = 'sales' | 'cashier-cut';

export default function ReportsPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<TabType>('sales');
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('day');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any>(null);

  // Cargar estadísticas del backend
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const stats = await saleService.getSalesStats();
        setStatsData(stats || null);
      } catch (error) {
        console.error('Error loading stats:', error);
        setStatsData(null);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Cargar reporte diario cuando cambia la fecha
  useEffect(() => {
    const loadDailyReport = async () => {
      try {
        setLoading(true);
        const report = await saleService.getDailyReport(selectedDate);
        setDailyData(report || null);
      } catch (error) {
        console.error('Error loading daily report:', error);
        setDailyData(null);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDate) {
      loadDailyReport();
    }
  }, [selectedDate]);

  // Datos para gráfico de líneas (ventas por día)
  const salesTrendData = [
    { day: 'Lun', ventas: 12500, transacciones: 38 },
    { day: 'Mar', ventas: 18200, transacciones: 52 },
    { day: 'Mié', ventas: 15800, transacciones: 45 },
    { day: 'Jue', ventas: 21300, transacciones: 61 },
    { day: 'Vie', ventas: 25600, transacciones: 73 },
    { day: 'Sáb', ventas: 32400, transacciones: 89 },
    { day: 'Dom', ventas: 28900, transacciones: 78 },
  ];

  // Datos para gráfico de barras (comparación de períodos)
  const periodComparisonData = [
    { periodo: 'Sem 1', ventas: 85400 },
    { periodo: 'Sem 2', ventas: 92300 },
    { periodo: 'Sem 3', ventas: 88700 },
    { periodo: 'Sem 4', ventas: 96800 },
  ];

  // Datos para gráfico circular (productos más vendidos)
  const topProductsData =
    statsData?.topProducts?.map((product: any, index: number) => ({
      name: product.name,
      value: product.quantity,
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][index % 5],
    })) || [
      { name: 'Paletas', value: 2175, color: '#FF6B6B' },
      { name: 'Nieves', value: 2940, color: '#4ECDC4' },
      { name: 'Raspados', value: 1740, color: '#45B7D1' },
      { name: 'Helados', value: 2280, color: '#FFA07A' },
      { name: 'Bebidas', value: 975, color: '#98D8C8' },
    ];

  // Datos actuales de ventas (usando backend si está disponible)
  const currentData = dailyData
    ? {
        total: dailyData.totalRevenue || 0,
        transactions: dailyData.transactions || 0,
        avgTicket: dailyData.averageTicket || 0,
      }
    : statsData
      ? {
          total: statsData.totalRevenue || 0,
          transactions: statsData.transactionCount || 0,
          avgTicket: statsData.averageTicket || 0,
        }
      : { total: 0, transactions: 0, avgTicket: 0 };

  const handlePrintCut = () => {
    alert('Imprimiendo corte de caja...');
  };

  const handleExportReport = () => {
    alert('Exportando reporte...');
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
            <p className="text-gray-500">
              Análisis de ventas y cortes de caja
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Usuario</p>
          <p className="font-medium">{user?.username}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'sales'
              ? 'text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Reportes de Ventas
          </div>
          {activeTab === 'sales' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('cashier-cut')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'cashier-cut'
              ? 'text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Corte de Caja
          </div>
          {activeTab === 'cashier-cut' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
          )}
        </button>
      </div>

      {/* Reportes de Ventas */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Filtros de Período */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Seleccionar Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'day', label: 'Hoy' },
                  { value: 'week', label: 'Esta Semana' },
                  { value: 'month', label: 'Este Mes' },
                  { value: 'year', label: 'Este Año' },
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value as ReportPeriod)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedPeriod === period.value
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha específica
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full md:w-auto px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumen de Ventas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Ventas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${currentData.total.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Transacciones</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currentData.transactions}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Receipt className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ticket Promedio</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${currentData.avgTicket.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Tendencia de Ventas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tendencia de Ventas Semanal</CardTitle>
                <Button
                  onClick={handleExportReport}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number | undefined) => value ? `$${value.toLocaleString()}` : '$0'}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ventas"
                    stroke="#4ECDC4"
                    strokeWidth={3}
                    dot={{ fill: '#4ECDC4', r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Ventas ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráficos en Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Barras - Comparación Semanal */}
            <Card>
              <CardHeader>
                <CardTitle>Comparación Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={periodComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="periodo" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number | undefined) => value ? `$${value.toLocaleString()}` : '$0'}
                    />
                    <Bar
                      dataKey="ventas"
                      fill="#4ECDC4"
                      radius={[8, 8, 0, 0]}
                      name="Ventas ($)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico Circular - Top Productos */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Producto</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topProductsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: $${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topProductsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined) => value ? `$${value.toLocaleString()}` : '$0'}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Productos */}
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Paleta de Hielo', qty: 145, total: 2175.0 },
                  { name: 'Nieve Fresa', qty: 98, total: 2940.0 },
                  { name: 'Raspado Grande', qty: 87, total: 1740.0 },
                  { name: 'Helado Vainilla', qty: 76, total: 2280.0 },
                  { name: 'Agua Fresca', qty: 65, total: 975.0 },
                ].map((product, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-medium text-primary">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {product.qty} unidades
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">
                      ${product.total.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Corte de Caja */}
      {activeTab === 'cashier-cut' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Corte de Caja
                </CardTitle>
                <div className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información del turno */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700">Cajero</p>
                    <p className="font-medium text-blue-900">{user?.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Turno</p>
                    <p className="font-medium text-blue-900">
                      08:00 AM - {new Date().toLocaleTimeString('es-MX')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumen de efectivo */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Resumen de Efectivo</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Fondo Inicial</span>
                    <span className="font-semibold">$1,000.00</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700">Ingresos del Turno</span>
                    <span className="font-semibold text-green-900">
                      $15,234.50
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-red-700">Egresos/Retiros</span>
                    <span className="font-semibold text-red-900">-$500.00</span>
                  </div>
                  
                  <div className="h-px bg-gray-300"></div>
                  
                  <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                    <span className="text-lg font-semibold">
                      Total en Caja
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      $15,734.50
                    </span>
                  </div>
                </div>
              </div>

              {/* Desglose por forma de pago */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Formas de Pago</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border-2 border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Efectivo</p>
                    <p className="text-xl font-bold">$12,450.00</p>
                    <p className="text-sm text-gray-500">28 transacciones</p>
                  </div>
                  
                  <div className="p-4 border-2 border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Tarjeta</p>
                    <p className="text-xl font-bold">$2,584.50</p>
                    <p className="text-sm text-gray-500">12 transacciones</p>
                  </div>
                  
                  <div className="p-4 border-2 border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Transferencia</p>
                    <p className="text-xl font-bold">$200.00</p>
                    <p className="text-sm text-gray-500">5 transacciones</p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handlePrintCut}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Imprimir Corte
                </Button>
                <Button
                  onClick={handleExportReport}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
