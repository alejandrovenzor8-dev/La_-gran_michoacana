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
import { useAuthStore } from '../../stores/authStore';
import { saleService } from '../../api/saleService';
import type { DailySalesStats } from '../../types';

type ReportPeriod = 'day' | 'week' | 'month' | 'year';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 32;

export default function ReportsScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('day');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsData, setStatsData] = useState<DailySalesStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      
      // Según el período, cargar estadísticas diferentes
      let salesData;
      
      if (selectedPeriod === 'day') {
        salesData = await saleService.getDailySales();
      } else {
        // Para otros períodos, usar getReportStats
        const stats = await saleService.getReportStats(selectedPeriod);
        salesData = { stats };
      }
      
      setStatsData(salesData.stats);

      // Cargar datos para gráficas
      if (selectedPeriod === 'week' || selectedPeriod === 'month') {
        const weeklyTrend = await saleService.getWeeklyTrend();
        setWeeklyData(weeklyTrend);
      }

      if (selectedPeriod === 'month' || selectedPeriod === 'year') {
        const monthlyComparison = await saleService.getMonthlyComparison();
        setMonthlyData(monthlyComparison);
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
  }, [selectedPeriod]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const periodLabels = {
    day: 'Hoy',
    week: 'Esta Semana',
    month: 'Este Mes',
    year: 'Este Año',
  };

  // Preparar datos para gráfica de línea (tendencia semanal)
  const prepareLineChartData = () => {
    if (!weeklyData || weeklyData.length === 0) {
      return {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab', 'Dom'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
      };
    }

    const labels = weeklyData.map((item: any) => item.day?.substring(0, 3) || '');
    const data = weeklyData.map((item: any) => parseFloat(item.totalSales || item.sales || '0'));

    return {
      labels: labels.length > 0 ? labels : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab', 'Dom'],
      datasets: [{ data: data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0] }],
    };
  };

  // Preparar datos para gráfica de barras (comparación mensual)
  const prepareBarChartData = () => {
    if (!monthlyData || monthlyData.length === 0) {
      return {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        datasets: [{ data: [0, 0, 0, 0] }],
      };
    }

    const labels = monthlyData.map((item: any) => item.week || `Sem ${item.weekNumber || ''}`);
    const data = monthlyData.map((item: any) => parseFloat(item.totalSales || item.sales || '0'));

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
          {(selectedPeriod === 'week' || selectedPeriod === 'month') && weeklyData.length > 0 && (
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
          {(selectedPeriod === 'month' || selectedPeriod === 'year') && monthlyData.length > 0 && (
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
