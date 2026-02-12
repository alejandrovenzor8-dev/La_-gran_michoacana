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
  const [useSpecificDate, setUseSpecificDate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any>(null);
  const [weeklyTrendData, setWeeklyTrendData] = useState<any[]>([]);
  const [monthlyComparisonData, setMonthlyComparisonData] = useState<any[]>([]);
  const [cashierCutData, setCashierCutData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  // Calcular rango de fechas según el período seleccionado
  const calculateDateRange = (period: ReportPeriod): { start: Date; end: Date } => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (period) {
      case 'day':
        start = new Date(today);
        end = new Date(today);
        break;
      case 'week':
        // Últimos 7 días
        start = new Date(today);
        start.setDate(today.getDate() - 6);
        end = new Date(today);
        break;
      case 'month':
        // Primer día del mes actual hasta hoy
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today);
        break;
      case 'year':
        // Primer día del año hasta hoy
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today);
        break;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // Cargar estadísticas del backend cuando cambia el período
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const range = calculateDateRange(selectedPeriod);
        const startStr = range.start.toISOString();
        const endStr = range.end.toISOString();
        
        setDateRange({
          start: startStr,
          end: endStr,
        });

        const stats = await saleService.getSalesStats(startStr, endStr);
        setStatsData(stats || null);
      } catch (error) {
        console.error('Error loading stats:', error);
        setStatsData(null);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [selectedPeriod]);

  // Cargar tendencia semanal cuando cambia el período
  useEffect(() => {
    const loadWeeklyTrend = async () => {
      try {
        const range = calculateDateRange(selectedPeriod);
        const startStr = range.start.toISOString();
        const endStr = range.end.toISOString();
        
        const trend = await saleService.getWeeklyTrend(startStr, endStr);
        setWeeklyTrendData(trend || []);
      } catch (error) {
        console.error('Error loading weekly trend:', error);
        setWeeklyTrendData([]);
      }
    };

    loadWeeklyTrend();
  }, [selectedPeriod]);

  // Cargar comparación mensual cuando cambia el período
  useEffect(() => {
    const loadMonthlyComparison = async () => {
      try {
        const range = calculateDateRange(selectedPeriod);
        const startStr = range.start.toISOString();
        const endStr = range.end.toISOString();
        
        const comparison = await saleService.getMonthlyComparison(startStr, endStr);
        setMonthlyComparisonData(comparison || []);
      } catch (error) {
        console.error('Error loading monthly comparison:', error);
        setMonthlyComparisonData([]);
      }
    };

    loadMonthlyComparison();
  }, [selectedPeriod]);

  // Cargar reporte diario cuando cambia la fecha específica
  useEffect(() => {
    const loadDailyReport = async () => {
      try {
        setLoading(true);
        
        // Usar la fecha seleccionada como rango de un solo día
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);
        
        // Cargar datos con el rango de ese día
        const [stats, weeklyTrend, monthlyComparison] = await Promise.all([
          saleService.getSalesStats(start.toISOString(), end.toISOString()),
          saleService.getWeeklyTrend(start.toISOString(), end.toISOString()),
          saleService.getMonthlyComparison(start.toISOString(), end.toISOString()),
        ]);
        
        setStatsData(stats);
        setWeeklyTrendData(weeklyTrend || []);
        setMonthlyComparisonData(monthlyComparison || []);
        setDateRange({ 
          start: start.toISOString(), 
          end: end.toISOString() 
        });
      } catch (error) {
        console.error('Error loading daily report:', error);
        setStatsData(null);
        setWeeklyTrendData([]);
        setMonthlyComparisonData([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDate && useSpecificDate) {
      loadDailyReport();
    }
  }, [selectedDate, useSpecificDate]);

  // Cargar corte de caja cuando se activa esa pestaña
  useEffect(() => {
    const loadCashierCut = async () => {
      try {
        setLoading(true);
        const data = await saleService.getCashierCut();
        setCashierCutData(data);
      } catch (error) {
        console.error('Error loading cashier cut:', error);
        setCashierCutData(null);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'cashier-cut') {
      loadCashierCut();
    }
  }, [activeTab]);

  // Datos para gráfico circular (productos más vendidos)
  const topProductsData =
    statsData?.topProducts?.map((product: any, index: number) => ({
      name: product.productName,
      value: product.revenue,
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][index % 5],
    })) || [];

  // Datos actuales de ventas (usando backend si está disponible)
  const currentData = statsData
    ? {
        total: statsData.totalRevenue || 0,
        transactions: statsData.totalSales || 0,
        avgTicket: statsData.averageTicket || 0,
      }
    : { total: 0, transactions: 0, avgTicket: 0 };

  const handlePrintCut = () => {
    const periodLabel = {
      day: 'HOY',
      week: 'ESTA SEMANA',
      month: 'ESTE MES',
      year: 'ESTE AÑO',
    }[selectedPeriod];

    // Crear contenido para imprimir con datos reales
    const printContent = `
      ========================================
            LA GRAN MICHOACANA
              REPORTE DE VENTAS
      ========================================
      
      Período: ${periodLabel}
      ${dateRange.start ? `Del: ${new Date(dateRange.start).toLocaleDateString('es-MX')}` : ''}
      ${dateRange.end ? `Al:  ${new Date(dateRange.end).toLocaleDateString('es-MX')}` : ''}
      
      Generado: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}
      Usuario: ${user?.username || 'N/A'}
      
      ========================================
              RESUMEN DE VENTAS
      ========================================
      
      Total de Ventas:         $${currentData.total.toFixed(2)}
      Número de Transacciones:        ${currentData.transactions}
      Ticket Promedio:         $${currentData.avgTicket.toFixed(2)}
      
      ========================================
         PRODUCTOS MÁS VENDIDOS
      ========================================
${statsData?.topProducts?.slice(0, 5).map((p: any, i: number) => `
      ${i + 1}. ${p.productName}
         Cantidad: ${p.quantity}
         Ingresos: $${p.revenue.toFixed(2)}`).join('') || '      Sin datos disponibles'}
      
      ========================================
                FIN DEL REPORTE
      ========================================
    `;
    
    // Crear ventana de impresión
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Reporte de Ventas - ${periodLabel}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                padding: 20px; 
                white-space: pre;
                font-size: 12px;
              }
              @media print {
                body { padding: 10px; }
              }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportReport = () => {
    // Crear contenido CSV
    const periodLabel = {
      day: 'Hoy',
      week: 'Esta Semana',
      month: 'Este Mes',
      year: 'Este Año',
    }[selectedPeriod];

    const csvContent = [
      ['Reporte de Ventas', `Período: ${periodLabel}`],
      ['Fecha de Generación', new Date().toLocaleDateString('es-MX')],
      [],
      ['Métrica', 'Valor'],
      ['Total Ventas', `$${currentData.total.toFixed(2)}`],
      ['Transacciones', currentData.transactions],
      ['Ticket Promedio', `$${currentData.avgTicket.toFixed(2)}`],
      [],
      ['Productos Más Vendidos'],
      ['Nombre', 'Cantidad', 'Total Ingresos'],
      ...(statsData?.topProducts?.slice(0, 10).map((p: any) => [
        p.productName,
        p.quantity,
        `$${p.revenue.toFixed(2)}`
      ]) || []),
    ].map(row => row.join(',')).join('\n');

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `reporte_ventas_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Mostrar confirmación
    alert(`✅ Reporte exportado: ${fileName}`);
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
                    onClick={() => {
                      setSelectedPeriod(period.value as ReportPeriod);
                      setUseSpecificDate(false);
                      console.log(`📊 Período cambiado a: ${period.label}`);
                    }}
                    disabled={loading}
                    className={`p-3 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedPeriod === period.value && !useSpecificDate
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
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setUseSpecificDate(true);
                      console.log(`📅 Fecha específica seleccionada: ${e.target.value}`);
                    }}
                    disabled={loading}
                    className={`flex-1 md:flex-none md:w-auto px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      useSpecificDate
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200'
                    }`}
                  />
                  {useSpecificDate && (
                    <button
                      onClick={() => {
                        setUseSpecificDate(false);
                        setSelectedPeriod('day');
                        console.log('🔄 Volviendo a períodos predefinidos');
                      }}
                      disabled={loading}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      ✕ Usar períodos
                    </button>
                  )}
                </div>
                {useSpecificDate && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                    <span className="text-primary font-medium">
                      Mostrando datos del {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-MX', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
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
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-gray-400">Cargando...</span>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        ${currentData.total.toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    )}
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
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-gray-400">Cargando...</span>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        {currentData.transactions}
                      </p>
                    )}
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
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-gray-400">Cargando...</span>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        ${currentData.avgTicket.toFixed(2)}
                      </p>
                    )}
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
                <LineChart data={weeklyTrendData}>
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
                  <BarChart data={monthlyComparisonData}>
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
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-gray-500">Cargando productos...</span>
                  </div>
                ) : statsData?.topProducts && statsData.topProducts.length > 0 ? (
                  statsData.topProducts.slice(0, 5).map((product: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-medium text-primary">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-gray-500">
                            {product.quantity} unidades
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">
                        ${product.revenue.toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay datos de productos para este período
                  </div>
                )}
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
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : cashierCutData ? (
                <>
                  {/* Información del turno */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-700">Cajero</p>
                        <p className="font-medium text-blue-900">{cashierCutData.cashier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700">Turno</p>
                        <p className="font-medium text-blue-900">
                          {cashierCutData.startTime 
                            ? new Date(cashierCutData.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                            : 'Sin ventas'} - {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
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
                        <span className="font-semibold">${cashierCutData.summary.fondoInicial.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-green-700">Ingresos del Turno</span>
                        <span className="font-semibold text-green-900">
                          ${cashierCutData.summary.ingresosTurno.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="text-red-700">Egresos/Retiros</span>
                        <span className="font-semibold text-red-900">-${cashierCutData.summary.egresos.toFixed(2)}</span>
                      </div>
                      
                      <div className="h-px bg-gray-300"></div>
                      
                      <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                        <span className="text-lg font-semibold">
                          Total en Caja
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          ${cashierCutData.summary.totalEnCaja.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-700">Ticket Promedio</span>
                        <span className="font-semibold text-blue-900">
                          ${cashierCutData.totals.averageTicket.toFixed(2)}
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
                        <p className="text-xl font-bold">${cashierCutData.paymentMethods.efectivo.total.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{cashierCutData.paymentMethods.efectivo.transactions} transacciones</p>
                      </div>
                      
                      <div className="p-4 border-2 border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Tarjeta</p>
                        <p className="text-xl font-bold">${cashierCutData.paymentMethods.tarjeta.total.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{cashierCutData.paymentMethods.tarjeta.transactions} transacciones</p>
                      </div>
                      
                      <div className="p-4 border-2 border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Mixto</p>
                        <p className="text-xl font-bold">${cashierCutData.paymentMethods.mixto.total.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{cashierCutData.paymentMethods.mixto.transactions} transacciones</p>
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
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No se pudieron cargar los datos del corte de caja</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
