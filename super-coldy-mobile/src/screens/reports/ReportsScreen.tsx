/**
 * Pantalla de Reportes
 * Muestra gráficas y estadísticas de ventas
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Divider,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../stores/authStore';
import { saleService } from '../../api/saleService';
import { getTodayInConfiguredTimezone } from '../../utils/dateFormatter';
import type { DailySalesStats } from '../../types';

type ReportPeriod = 'day' | 'week' | 'month' | 'year';
type ReportQueryMode = 'preset' | 'customDay' | 'customRange';
type DatePickerTarget = 'customDay' | 'rangeStart' | 'rangeEnd';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 32;

export default function ReportsScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('day');
  const [queryMode, setQueryMode] = useState<ReportQueryMode>('preset');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsData, setStatsData] = useState<DailySalesStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [customDay, setCustomDay] = useState<Date>(new Date());
  const [rangeStartDate, setRangeStartDate] = useState<Date>(new Date());
  const [rangeEndDate, setRangeEndDate] = useState<Date>(new Date());
  const [pickerTarget, setPickerTarget] = useState<DatePickerTarget>('customDay');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDateLabel = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const setDateAtBoundary = (date: Date, boundary: 'start' | 'end') => {
    const boundaryDate = new Date(date);
    if (boundary === 'start') {
      boundaryDate.setHours(0, 0, 0, 0);
    } else {
      boundaryDate.setHours(23, 59, 59, 999);
    }
    return boundaryDate;
  };

  const openPicker = (target: DatePickerTarget) => {
    setPickerTarget(target);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    if (pickerTarget === 'customDay') {
      setCustomDay(selectedDate);
      return;
    }

    if (pickerTarget === 'rangeStart') {
      setRangeStartDate(selectedDate);
      if (selectedDate > rangeEndDate) {
        setRangeEndDate(selectedDate);
      }
      return;
    }

    setRangeEndDate(selectedDate);
    if (selectedDate < rangeStartDate) {
      setRangeStartDate(selectedDate);
    }
  };

  const loadStats = async () => {
    try {
      setIsLoading(true);
      
      // Obtener las fechas en la zona horaria correcta
      const today = await getTodayInConfiguredTimezone();
      let startDate: Date;
      let endDate: Date;

      // Convertir string YYYY-MM-DD a Dates
      const [year, month, day] = today.split('-').map(Number);
      endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

      if (queryMode === 'customDay') {
        startDate = setDateAtBoundary(customDay, 'start');
        endDate = setDateAtBoundary(customDay, 'end');
      } else if (queryMode === 'customRange') {
        const minDate = rangeStartDate <= rangeEndDate ? rangeStartDate : rangeEndDate;
        const maxDate = rangeStartDate <= rangeEndDate ? rangeEndDate : rangeStartDate;
        startDate = setDateAtBoundary(minDate, 'start');
        endDate = setDateAtBoundary(maxDate, 'end');
      } else {
        switch (selectedPeriod) {
          case 'day':
            startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
            break;
          case 'week':
            // Calcular lunes de esta semana (no los últimos 7 días)
            const todayDate = new Date(year, month - 1, day);
            const dayOfWeek = todayDate.getDay(); // 0=domingo, 1=lunes, 6=sábado
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Calcular cuántos días atrás es el lunes
            startDate = new Date(year, month - 1, day - daysToMonday, 0, 0, 0, 0);
            // El domingo es 6 días después del lunes
            endDate = new Date(year, month - 1, day - daysToMonday + 6, 23, 59, 59, 999);
            break;
          case 'month':
            startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
            break;
          case 'year':
            startDate = new Date(year, 0, 1, 0, 0, 0, 0);
            break;
          default:
            startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        }
      }

      const stats = await saleService.getReportStats(selectedPeriod, {
        startDate,
        endDate,
      });
      setStatsData(stats);

      // Siempre cargar datos para gráficas
      try {
        const weeklyTrend = await saleService.getWeeklyTrend(startDate, endDate);
        setWeeklyData(weeklyTrend || []);
      } catch (error) {
        console.error('Error fetching weekly trend:', error);
        setWeeklyData([]);
      }

      try {
        const monthlyComparison = await saleService.getMonthlyComparison(startDate, endDate);
        setMonthlyData(monthlyComparison || []);
      } catch (error) {
        console.error('Error fetching monthly comparison:', error);
        setMonthlyData([]);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStatsData(null);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [selectedPeriod, queryMode, customDay, rangeStartDate, rangeEndDate]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  // Función para agrupar datos diarios por mes
  const groupDailyDataByMonth = (dailyData: any[]): any[] => {
    if (!dailyData || dailyData.length === 0) {
      return [];
    }

    const monthlyGrouped: Record<number, number> = {};

    for (const item of dailyData) {
      // Obtener la fecha
      let dateStr = item.date || item.day || '';
      const date = new Date(dateStr);
      
      if (!isNaN(date.getTime())) {
        const month = date.getMonth() + 1; // 1-12
        const ventas = parseFloat(item.ventas || item.sales || '0');
        
        if (!monthlyGrouped[month]) {
          monthlyGrouped[month] = 0;
        }
        monthlyGrouped[month] += ventas;
      }
    }

    // Convertir a array en formato esperado
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months.map((name, index) => ({
      periodo: `${index + 1}`,
      month: index + 1,
      ventas: Math.round(monthlyGrouped[index + 1] || 0),
    }));
  };

  const periodLabels = {
    day: 'Hoy',
    week: 'Esta Semana',
    month: 'Este Mes',
    year: 'Este Año',
  };

  // Preparar datos para gráfica de línea (tendencia según el período)
  const prepareLineChartData = () => {
    const effectivePeriod: ReportPeriod = queryMode === 'preset' ? selectedPeriod : 'week';

    // Definir labels por defecto según el período
    const defaultLabels = effectivePeriod === 'year' 
      ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      : effectivePeriod === 'month'
      ? ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
      : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab', 'Dom'];

    const defaultData = effectivePeriod === 'year' 
      ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      : effectivePeriod === 'month'
      ? [0, 0, 0, 0]
      : [0, 0, 0, 0, 0, 0, 0];

    try {
      if (effectivePeriod === 'year') {
        // Para año: usar monthlyData (semanas del mes actual)
        if (!monthlyData || monthlyData.length === 0) {
          return {
            labels: defaultLabels,
            datasets: [{ data: defaultData }],
          };
        }

        // Agregar todas las semanas del mes actual al mes actual
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthlyGrouped: Record<number, number> = {};
        
        for (const item of monthlyData) {
          const ventas = parseFloat(item.ventas || '0');
          // Asumir que todos los datos son del mes actual (febrero = 2)
          const currentMonth = new Date().getMonth() + 1;
          monthlyGrouped[currentMonth] = (monthlyGrouped[currentMonth] || 0) + ventas;
        }

        const chartData = months.map((name, index) => monthlyGrouped[index + 1] || 0);

        return {
          labels: months,
          datasets: [{ data: chartData }],
        };
      } else if (effectivePeriod === 'month') {
        // Para mes: mostrar semanas del mes desde monthlyData
        if (!monthlyData || monthlyData.length === 0) {
          return {
            labels: defaultLabels,
            datasets: [{ data: defaultData }],
          };
        }

        const labels = monthlyData.map((item: any) => item.periodo || `Sem ${item.week || ''}`);
        const data = monthlyData.map((item: any) => parseFloat(item.ventas || '0'));

        return {
          labels,
          datasets: [{ data }],
        };
      } else {
        // Para semana o día: mostrar días desde weeklyData
        if (!weeklyData || weeklyData.length === 0) {
          return {
            labels: defaultLabels,
            datasets: [{ data: defaultData }],
          };
        }

        const labels = weeklyData.map((item: any) => item.day || '');
        const data = weeklyData.map((item: any) => parseFloat(item.ventas || item.sales || '0'));

        return {
          labels: labels.length > 0 ? labels : defaultLabels,
          datasets: [{ data: data.length > 0 ? data : defaultData }],
        };
      }
    } catch (error) {
      console.error('Error en prepareLineChartData:', error);
      return {
        labels: defaultLabels,
        datasets: [{ data: defaultData }],
      };
    }
  };

  // Preparar datos para gráfica de barras (comparación mensual)
  const prepareBarChartData = () => {
    if (!monthlyData || monthlyData.length === 0) {
      return {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        datasets: [{ data: [0, 0, 0, 0] }],
      };
    }

    // Ordenar datos por período/semana
    const sortedData = [...monthlyData].sort((a: any, b: any) => {
      // Intentar comparar por startDate si lo tienen
      if (a.startDate && b.startDate) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      // Si no, asumir que el nombre está organizado semana 1, 2, 3...
      return 0;
    });

    // El backend retorna array con propiedades: periodo, ventas
    const labels = sortedData.map((item: any) => item.periodo || item.week || '');
    const data = sortedData.map((item: any) => parseFloat(item.ventas || item.sales || '0'));

    return {
      labels: labels.length > 0 ? labels : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      datasets: [{ data: data.length > 0 ? data : [0, 0, 0, 0] }],
    };
  };

  // Preparar datos para gráfica de pastel (métodos de pago)
  const preparePieChartData = () => {
    if (!statsData) {
      return [
        { name: 'Efectivo', population: 0, color: '#1976D2', legendFontColor: '#666' },
        { name: 'Tarjeta', population: 0, color: '#9C27B0', legendFontColor: '#666' },
        { name: 'Mixto', population: 0, color: '#00BCD4', legendFontColor: '#666' },
      ];
    }

    const total =
      (statsData.salesByPaymentMethod?.EFECTIVO || 0) +
      (statsData.salesByPaymentMethod?.TARJETA || 0) +
      (statsData.salesByPaymentMethod?.MIXTO || 0);

    if (total === 0) {
      return [
        { name: 'Efectivo', population: 0, color: '#1976D2', legendFontColor: '#666' },
        { name: 'Tarjeta', population: 0, color: '#9C27B0', legendFontColor: '#666' },
        { name: 'Mixto', population: 0, color: '#00BCD4', legendFontColor: '#666' },
      ];
    }

    return [
      {
        name: 'Efectivo',
        population: statsData.salesByPaymentMethod?.EFECTIVO || 0,
        color: '#1976D2',
        legendFontColor: '#666',
      },
      {
        name: 'Tarjeta',
        population: statsData.salesByPaymentMethod?.TARJETA || 0,
        color: '#9C27B0',
        legendFontColor: '#666',
      },
      {
        name: 'Mixto',
        population: statsData.salesByPaymentMethod?.MIXTO || 0,
        color: '#00BCD4',
        legendFontColor: '#666',
      },
    ];
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            <MaterialCommunityIcons
              name="chart-bar"
              size={28}
              color={theme.colors.primary}
            />
          </View>
          <View>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Reportes
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              Análisis de ventas
            </Text>
          </View>
        </View>
      </View>

      {/* Período selector */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Tipo de consulta
          </Text>
          <View style={styles.modeButtons}>
            <Button
              mode={queryMode === 'preset' ? 'contained' : 'outlined'}
              onPress={() => setQueryMode('preset')}
              style={styles.modeButton}
              labelStyle={styles.periodButtonLabel}
            >
              Rápido
            </Button>
            <Button
              mode={queryMode === 'customDay' ? 'contained' : 'outlined'}
              onPress={() => setQueryMode('customDay')}
              style={styles.modeButton}
              labelStyle={styles.periodButtonLabel}
            >
              Día específico
            </Button>
            <Button
              mode={queryMode === 'customRange' ? 'contained' : 'outlined'}
              onPress={() => setQueryMode('customRange')}
              style={styles.modeButton}
              labelStyle={styles.periodButtonLabel}
            >
              Rango
            </Button>
          </View>

          {queryMode === 'preset' && (
            <>
              <Text variant="titleSmall" style={styles.sectionTitleSecondary}>
                Período
              </Text>
              <View style={styles.periodButtons}>
                {(['day', 'week', 'month', 'year'] as ReportPeriod[]).map((period) => (
                  <Button
                    key={period}
                    mode={selectedPeriod === period ? 'contained' : 'outlined'}
                    onPress={() => setSelectedPeriod(period)}
                    style={styles.periodButton}
                    labelStyle={styles.periodButtonLabel}
                  >
                    {periodLabels[period]}
                  </Button>
                ))}
              </View>
            </>
          )}

          {queryMode === 'customDay' && (
            <View style={styles.customDateContainer}>
              <Text style={styles.dateLabel}>Fecha seleccionada</Text>
              <Button
                mode="outlined"
                icon="calendar"
                onPress={() => openPicker('customDay')}
              >
                {formatDateLabel(customDay)}
              </Button>
            </View>
          )}

          {queryMode === 'customRange' && (
            <View style={styles.customDateContainer}>
              <Text style={styles.dateLabel}>Desde</Text>
              <Button
                mode="outlined"
                icon="calendar-start"
                onPress={() => openPicker('rangeStart')}
                style={styles.dateButton}
              >
                {formatDateLabel(rangeStartDate)}
              </Button>

              <Text style={[styles.dateLabel, styles.dateLabelSpacing]}>Hasta</Text>
              <Button
                mode="outlined"
                icon="calendar-end"
                onPress={() => openPicker('rangeEnd')}
                style={styles.dateButton}
              >
                {formatDateLabel(rangeEndDate)}
              </Button>
            </View>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={
                pickerTarget === 'customDay'
                  ? customDay
                  : pickerTarget === 'rangeStart'
                  ? rangeStartDate
                  : rangeEndDate
              }
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDateChange}
            />
          )}

          <Text variant="bodySmall" style={styles.filterSummary}>
            {queryMode === 'preset'
              ? `Mostrando: ${periodLabels[selectedPeriod]}`
              : queryMode === 'customDay'
              ? `Mostrando día: ${formatDateLabel(customDay)}`
              : `Mostrando rango: ${formatDateLabel(rangeStartDate)} a ${formatDateLabel(rangeEndDate)}`}
          </Text>
        </Card.Content>
      </Card>

      {/* Resumen de Estadísticas */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : statsData ? (
        <>
          {/* Cards de resumen */}
          <View style={styles.gridContainer}>
            <Card style={[styles.statCard, styles.statCardPrimary]}>
              <Card.Content>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.statIcon}
                />
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total Ingresos
                </Text>
                <Text
                  variant="headlineSmall"
                  style={[styles.statValue, { color: theme.colors.primary }]}
                >
                  ${(statsData?.totalAmount || 0).toFixed(2)}
                </Text>
              </Card.Content>
            </Card>

            <Card style={[styles.statCard, styles.statCardSecondary]}>
              <Card.Content>
                <MaterialCommunityIcons
                  name="receipt"
                  size={24}
                  color={theme.colors.secondary}
                  style={styles.statIcon}
                />
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total Ventas
                </Text>
                <Text
                  variant="headlineSmall"
                  style={[styles.statValue, { color: theme.colors.secondary }]}
                >
                  {statsData?.totalSales || 0}
                </Text>
              </Card.Content>
            </Card>

            <Card style={[styles.statCard, styles.statCardTertiary]}>
              <Card.Content>
                <MaterialCommunityIcons
                  name="trending-up"
                  size={24}
                  color={theme.colors.tertiary}
                  style={styles.statIcon}
                />
                <Text variant="bodySmall" style={styles.statLabel}>
                  Ticket Promedio
                </Text>
                <Text
                  variant="headlineSmall"
                  style={[styles.statValue, { color: theme.colors.tertiary }]}
                >
                  ${(statsData?.averageTicket || 0).toFixed(2)}
                </Text>
              </Card.Content>
            </Card>
          </View>

          {/* Gráfica de pastel - Métodos de Pago */}
          <Card style={styles.card}>
            <Card.Title title="💳 Distribución de Métodos de Pago" />
            <Card.Content style={styles.chartContainer}>
              <PieChart
                data={preparePieChartData()}
                width={chartWidth}
                height={200}
                chartConfig={{
                  color: (opacity?: number) => `rgba(26, 255, 146, ${opacity ?? 1})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
              />
            </Card.Content>
          </Card>

          {/* Gráfica de línea - Tendencia Semanal */}
          {weeklyData && weeklyData.length > 0 && (
            <Card style={styles.card}>
              <Card.Title title="📈 Tendencia de Ventas" />
              <Card.Content style={styles.chartContainer}>
                <LineChart
                  data={prepareLineChartData()}
                  width={chartWidth}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity?: number) => `rgba(25, 118, 210, ${opacity ?? 1})`,
                    labelColor: (opacity?: number) => `rgba(102, 102, 102, ${opacity ?? 1})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: '#1976D2',
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              </Card.Content>
            </Card>
          )}

          {/* Gráfica de barras - Comparación Mensual */}
          {monthlyData && monthlyData.length > 0 && (
            <Card style={styles.card}>
              <Card.Title title="📊 Comparación por Semanas" />
              <Card.Content style={styles.chartContainer}>
                <BarChart
                  data={prepareBarChartData()}
                  width={chartWidth}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity?: number) => `rgba(156, 39, 176, ${opacity ?? 1})`,
                    labelColor: (opacity?: number) => `rgba(102, 102, 102, ${opacity ?? 1})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '0',
                    },
                  }}
                  style={styles.chart}
                />
              </Card.Content>
            </Card>
          )}

          {/* Métodos de Pago - Detalle */}
          <Card style={styles.card}>
            <Card.Title title="💵 Métodos de Pago - Detalle" />
            <Card.Content>
              <View style={styles.paymentRow}>
                <MaterialCommunityIcons
                  name="cash"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.paymentIcon}
                />
                <Text style={styles.paymentLabel}>Efectivo</Text>
                <Text style={styles.paymentAmount}>
                  ${(statsData?.salesByPaymentMethod?.EFECTIVO || 0).toFixed(2)}
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.paymentRow}>
                <MaterialCommunityIcons
                  name="credit-card"
                  size={24}
                  color={theme.colors.secondary}
                  style={styles.paymentIcon}
                />
                <Text style={styles.paymentLabel}>Tarjeta</Text>
                <Text style={styles.paymentAmount}>
                  ${(statsData?.salesByPaymentMethod?.TARJETA || 0).toFixed(2)}
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.paymentRow}>
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={24}
                  color={theme.colors.tertiary}
                  style={styles.paymentIcon}
                />
                <Text style={styles.paymentLabel}>Mixto</Text>
                <Text style={styles.paymentAmount}>
                  ${(statsData?.salesByPaymentMethod?.MIXTO || 0).toFixed(2)}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Top Productos */}
          {statsData?.topProducts && statsData.topProducts.length > 0 && (
            <Card style={styles.card}>
              <Card.Title title="🏆 Productos Más Vendidos" />
              <Card.Content>
                {statsData.topProducts.slice(0, 5).map((product, idx) => (
                  <View key={idx}>
                    <View style={styles.productRow}>
                      <View style={styles.productRank}>
                        <Text style={styles.productRankText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.productName}</Text>
                        <Text style={styles.productQuantity}>
                          {product.quantitySold} unidades
                        </Text>
                      </View>
                      <Text style={styles.productRevenue}>
                        ${product.revenue.toFixed(2)}
                      </Text>
                    </View>
                    {idx < Math.min(4, statsData.topProducts.length - 1) && (
                      <Divider style={styles.divider} />
                    )}
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="chart-box-outline"
            size={48}
            color={theme.colors.outline}
          />
          <Text style={styles.emptyText}>No hay datos disponibles</Text>
        </View>
      )}

      <View style={styles.spacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#666',
    marginTop: 2,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionTitleSecondary: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  modeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    minWidth: '30%',
  },
  periodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    minWidth: '45%',
  },
  periodButtonLabel: {
    fontSize: 12,
  },
  customDateContainer: {
    marginTop: 8,
  },
  dateLabel: {
    color: '#666',
    marginBottom: 8,
  },
  dateLabelSpacing: {
    marginTop: 12,
  },
  dateButton: {
    alignSelf: 'flex-start',
  },
  filterSummary: {
    color: '#666',
    marginTop: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    gap: 8,
    marginVertical: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    marginHorizontal: 8,
  },
  statCardPrimary: {
    backgroundColor: '#E3F2FD',
  },
  statCardSecondary: {
    backgroundColor: '#F3E5F5',
  },
  statCardTertiary: {
    backgroundColor: '#E0F2F1',
  },
  statIcon: {
    marginBottom: 8,
  },
  statLabel: {
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '700',
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  paymentIcon: {
    width: 24,
  },
  paymentLabel: {
    flex: 1,
    fontWeight: '500',
  },
  paymentAmount: {
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    marginVertical: 4,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productRankText: {
    fontWeight: '700',
    color: '#1976D2',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  productQuantity: {
    fontSize: 12,
    color: '#999',
  },
  productRevenue: {
    fontWeight: '600',
    fontSize: 16,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    color: '#999',
  },
  spacing: {
    height: 20,
  },
});
