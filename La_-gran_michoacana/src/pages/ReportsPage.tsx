import { useState, useEffect, Fragment } from 'react';
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
import { branchService } from '@/lib/branchService';
import { formatDate, formatDateShort } from '@/lib/utils';
import type { Branch } from '@/types/branch';
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
  const [weeklyTrendData, setWeeklyTrendData] = useState<any[]>([]);
  const [monthlyComparisonData, setMonthlyComparisonData] = useState<any[]>([]);
  const [cashierCutData, setCashierCutData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [salesList, setSalesList] = useState<any[]>([]);
  
  // Estados para tabla mejorada
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<'id' | 'date' | 'total' | 'items' | 'paymentMethod'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  // Cargar sucursales si el usuario es admin
  useEffect(() => {
    const loadBranches = async () => {
      if (user?.role === 'ADMIN') {
        try {
          const fetchedBranches = await branchService.getBranches();
          setBranches(fetchedBranches);
        } catch (error) {
          console.error('Error loading branches:', error);
        }
      }
    };
    loadBranches();
  }, [user]);

  // Cargar estadísticas del backend cuando cambia el período o la sucursal
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

        const queryParams = selectedBranchId ? `?branchId=${selectedBranchId}` : '';
        const stats = await saleService.getSalesStats(startStr, endStr, queryParams);
        setStatsData(stats || null);
      } catch (error) {
        setStatsData(null);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [selectedPeriod, selectedBranchId]);

  // Cargar tendencia semanal cuando cambia el período o la sucursal
  useEffect(() => {
    const loadWeeklyTrend = async () => {
      try {
        const range = calculateDateRange(selectedPeriod);
        const startStr = range.start.toISOString();
        const endStr = range.end.toISOString();
        
        const queryParams = selectedBranchId ? `?branchId=${selectedBranchId}` : '';
        const trend = await saleService.getWeeklyTrend(startStr, endStr, queryParams);
        setWeeklyTrendData(trend || []);
      } catch (error) {
        setWeeklyTrendData([]);
      }
    };

    loadWeeklyTrend();
  }, [selectedPeriod, selectedBranchId]);

  // Cargar comparación mensual cuando cambia el período o la sucursal
  useEffect(() => {
    const loadMonthlyComparison = async () => {
      try {
        const range = calculateDateRange(selectedPeriod);
        const startStr = range.start.toISOString();
        const endStr = range.end.toISOString();
        
        const queryParams = selectedBranchId ? `?branchId=${selectedBranchId}` : '';
        const comparison = await saleService.getMonthlyComparison(startStr, endStr, queryParams);
        setMonthlyComparisonData(comparison || []);
      } catch (error) {
        setMonthlyComparisonData([]);
      }
    };

    loadMonthlyComparison();
  }, [selectedPeriod, selectedBranchId]);

  // Cargar lista de ventas cuando cambia el período o la sucursal
  useEffect(() => {
    const loadSalesList = async () => {
      try {
        const range = calculateDateRange(selectedPeriod);
        const sales = await saleService.getAllSales({
          startDate: range.start.toISOString(),
          endDate: range.end.toISOString(),
        });
        
        // Debug: ver qué estamos recibiendo
        console.log('Sales cargadas:', sales);
        console.log('Tipo de sales:', typeof sales, Array.isArray(sales));
        if (sales && sales.length > 0) {
          console.log('Estructura de primera venta:', JSON.stringify(sales[0], null, 2));
        }
        
        // Asegurar que siempre es un array
        const salesArray = Array.isArray(sales) ? sales : (sales ? [sales] : []);
        setSalesList(salesArray);
        setCurrentPage(1); // Reset de paginación
        setExpandedRowId(null); // Cerrar filas expandidas
      } catch (error) {
        console.error('Error cargando ventas:', error);
        setSalesList([]);
        setCurrentPage(1);
        setExpandedRowId(null);
      }
    };

    loadSalesList();
  }, [selectedPeriod, selectedBranchId]);

  // Cargar reporte diario cuando cambia la fecha específica o la sucursal
  useEffect(() => {
    const loadDailyReport = async () => {
      try {
        setLoading(true);
        
        // Usar la fecha seleccionada como rango de un solo día
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);
        
        const queryParams = selectedBranchId ? `?branchId=${selectedBranchId}` : '';
        
        // Cargar datos con el rango de ese día
        const [stats, weeklyTrend, monthlyComparison] = await Promise.all([
          saleService.getSalesStats(start.toISOString(), end.toISOString(), queryParams),
          saleService.getWeeklyTrend(start.toISOString(), end.toISOString(), queryParams),
          saleService.getMonthlyComparison(start.toISOString(), end.toISOString(), queryParams),
        ]);
        
        setStatsData(stats);
        setWeeklyTrendData(weeklyTrend || []);
        setMonthlyComparisonData(monthlyComparison || []);
        setDateRange({ 
          start: start.toISOString(), 
          end: end.toISOString() 
        });
      } catch (error) {
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
  }, [selectedDate, useSpecificDate, selectedBranchId]);

  // Cargar corte de caja cuando se activa esa pestaña o cambia la sucursal
  useEffect(() => {
    const loadCashierCut = async () => {
      try {
        setLoading(true);
        const queryParams = selectedBranchId ? `?branchId=${selectedBranchId}` : '';
        const data = await saleService.getCashierCut(queryParams);
        setCashierCutData(data);
      } catch (error) {
        setCashierCutData(null);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'cashier-cut') {
      loadCashierCut();
    }
  }, [activeTab, selectedBranchId]);

  // Función para cambiar ordenamiento
  const handleSort = (field: 'id' | 'date' | 'total' | 'items' | 'paymentMethod') => {
    if (sortField === field) {
      // Si ya está ordenado por este campo, cambiar dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Si es un nuevo campo, ordenar descendente
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset a primera página
  };

  // Función para obtener ventas ordenadas
  const getSortedSales = () => {
    const sorted = [...salesList];
    sorted.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortField === 'id') {
        aVal = a.id || 0;
        bVal = b.id || 0;
      } else if (sortField === 'date') {
        aVal = new Date(a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || 0).getTime();
      } else if (sortField === 'total') {
        aVal = a.total || 0;
        bVal = b.total || 0;
      } else if (sortField === 'items') {
        aVal = a.items?.length || 0;
        bVal = b.items?.length || 0;
      } else if (sortField === 'paymentMethod') {
        aVal = a.paymentMethod || '';
        bVal = b.paymentMethod || '';
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return sorted;
  };

  // Función para obtener ventas paginadas
  const getSortedAndPaginatedSales = () => {
    const sorted = getSortedSales();
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    return sorted.slice(startIdx, endIdx);
  };

  // Información de paginación
  const sortedSalesList = getSortedSales();
  const totalPages = Math.ceil(sortedSalesList.length / pageSize);
  const displayedSales = getSortedAndPaginatedSales();

  // Dato para renderizar indicador de sort
  const getSortIndicator = (field: 'id' | 'date' | 'total' | 'items' | 'paymentMethod') => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

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
      ${dateRange.start ? `Del: ${formatDateShort(new Date(dateRange.start))}` : ''}
      ${dateRange.end ? `Al:  ${formatDateShort(new Date(dateRange.end))}` : ''}
      
      Generado: ${formatDate(new Date())}
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
      ['Fecha de Generación', formatDateShort(new Date())],
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

      {/* Selector de sucursal para admin */}
      {user?.role === 'ADMIN' && branches.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label htmlFor="branch-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Filtrar por sucursal:
              </label>
              <select
                id="branch-select"
                value={selectedBranchId || ''}
                onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : undefined)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Todas las sucursales</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

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
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setUseSpecificDate(true);
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
                      Mostrando datos del {formatDateShort(new Date(selectedDate + 'T00:00:00'))}
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
                      {topProductsData.map((entry: any, index: number) => (
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

          {/* Detalle de Ventas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Detalle de Ventas ({sortedSalesList.length})
                </div>
                {pageSize && (
                  <div className="text-sm text-gray-500 font-normal">
                    Mostrando {displayedSales.length} de {sortedSalesList.length}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-gray-500">Cargando ventas...</span>
                  </div>
                ) : sortedSalesList && sortedSalesList.length > 0 ? (
                  <>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-center py-3 px-4 font-semibold text-gray-700 w-10">↔</th>
                          <th 
                            onClick={() => handleSort('id')}
                            className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            ID{getSortIndicator('id')}
                          </th>
                          <th 
                            onClick={() => handleSort('date')}
                            className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            Fecha{getSortIndicator('date')}
                          </th>
                          <th 
                            onClick={() => handleSort('total')}
                            className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            Total{getSortIndicator('total')}
                          </th>
                          <th 
                            onClick={() => handleSort('items')}
                            className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            Productos{getSortIndicator('items')}
                          </th>
                          <th 
                            onClick={() => handleSort('paymentMethod')}
                            className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            Forma de Pago{getSortIndicator('paymentMethod')}
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedSales.map((sale: any) => (
                          <Fragment key={sale.id}>
                            <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="text-center py-3 px-4">
                                <button
                                  onClick={() => setExpandedRowId(expandedRowId === sale.id ? null : sale.id)}
                                  className="p-1 hover:bg-primary/10 rounded transition-colors"
                                >
                                  {expandedRowId === sale.id ? '▼' : '▶'}
                                </button>
                              </td>
                              <td className="py-3 px-4 text-gray-800 font-medium">#{sale.id}</td>
                              <td className="py-3 px-4 text-gray-600">
                                {sale.createdAt ? formatDate(new Date(sale.createdAt)) : 'N/A'}
                              </td>
                              <td className="py-3 px-4 font-semibold text-gray-900">
                                ${(sale.total || 0).toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {sale.items ? sale.items.length : 0} artículos
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  sale.paymentMethod === 'EFECTIVO'
                                    ? 'bg-green-100 text-green-800'
                                    : sale.paymentMethod === 'TARJETA'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {sale.paymentMethod === 'EFECTIVO' && '💵 Efectivo'}
                                  {sale.paymentMethod === 'TARJETA' && '💳 Tarjeta'}
                                  {sale.paymentMethod === 'MIXTO' && '🔀 Mixto'}
                                  {!sale.paymentMethod && 'N/A'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  sale.status === 'COMPLETED' || !sale.status
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {sale.status === 'COMPLETED' || !sale.status ? '✓ Completada' : 'Pendiente'}
                                </span>
                              </td>
                            </tr>

                            {/* Fila expandida con detalles */}
                            {expandedRowId === sale.id && sale.items && (
                              <tr key={`${sale.id}-expanded`} className="bg-blue-50 border-b border-gray-100">
                                <td colSpan={7} className="py-4 px-4">
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-800 text-sm mb-3">
                                      Productos en esta venta:
                                    </h4>
                                    <div className="space-y-2">
                                      {sale.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 text-sm">
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-800">
                                              {item.productName || `Producto #${item.productId}`}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {item.quantity} x ${(item.unitPrice || 0).toFixed(2)}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                              ${(item.subtotal || item.quantity * item.unitPrice).toFixed(2)}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm font-semibold">
                                      <span>Total de productos:</span>
                                      <span>${(sale.total || 0).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>

                    {/* Controles de Paginación */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <label htmlFor="pageSize" className="text-sm text-gray-600">
                            Por página:
                          </label>
                          <select
                            id="pageSize"
                            value={pageSize}
                            onChange={(e) => {
                              setPageSize(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            ⏮
                          </button>
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            ◀
                          </button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(p => 
                                p === 1 || 
                                p === totalPages || 
                                (p >= currentPage - 1 && p <= currentPage + 1)
                              )
                              .map((pageNum, idx, arr) => {
                                const prevPageNum = arr[idx - 1];
                                const showEllipsis = prevPageNum && pageNum - prevPageNum > 1;

                                return (
                                  <div key={pageNum} className="flex items-center gap-1">
                                    {showEllipsis && <span className="text-gray-400">...</span>}
                                    <button
                                      onClick={() => setCurrentPage(pageNum)}
                                      className={`px-3 py-1 rounded text-sm transition-colors ${
                                        currentPage === pageNum
                                          ? 'bg-primary text-white'
                                          : 'border border-gray-300 hover:bg-gray-100'
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  </div>
                                );
                              })}
                          </div>

                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            ▶
                          </button>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            ⏭
                          </button>
                        </div>

                        <div className="text-sm text-gray-600">
                          Página {currentPage} de {totalPages}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay ventas registradas para este período
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
                  {formatDateShort(new Date())}
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
                            ? formatDate(new Date(cashierCutData.startTime), true)
                            : 'Sin ventas'} - {formatDate(new Date(), true)}
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
