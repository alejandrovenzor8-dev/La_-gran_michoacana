/**
 * Pantalla de Dashboard
 * Muestra métricas principales y accesos rápidos
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Divider,
  ActivityIndicator,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';
import { saleService } from '../../api/saleService';
import { inventoryService } from '../../api/inventoryService';
import { productService } from '../../api/productService';
import { userService } from '../../api/userService';
import { formatDateShort, MEXICO_TIMEZONES } from '../../utils/dateFormatter';
import type { DailySalesStats } from '../../types';

const ICON_SIZE = 28;

export default function DashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesStats, setSalesStats] = useState<DailySalesStats | null>(null);
  const [inventorySummary, setInventorySummary] = useState<any>(null);
  const [productStats, setProductStats] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [formattedDate, setFormattedDate] = useState<string>('');

  // Función helper para formatear fechas con timezone del usuario
  const getFormattedDate = (): string => {
    try {
      const timezone = user?.timezone || 'America/Mexico_City';
      const validTimezone = MEXICO_TIMEZONES.some(tz => tz.value === timezone)
        ? timezone
        : 'America/Mexico_City';
      
      return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        timeZone: validTimezone,
      }).format(new Date());
    } catch (e) {
      return new Date().toLocaleDateString('es-ES');
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [salesData, inventoryData, prodStats, userStatsData] = await Promise.all([
        saleService.getDailySales(),
        inventoryService.getInventorySummary(),
        productService.getProductStats(),
        userService.getUserStats(),
      ]);

      console.log('📊 [Dashboard] salesData completo:', salesData);
      console.log('📊 [Dashboard] salesData.stats:', salesData.stats);
      console.log('📊 [Dashboard] averageTicket en stats:', salesData.stats?.averageTicket);
      
      setSalesStats(salesData.stats);
      setInventorySummary(inventoryData);
      setProductStats(prodStats);
      setUserStats(userStatsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    setFormattedDate(getFormattedDate());
  }, []);

  useEffect(() => {
    // Actualizar fecha cuando cambia el usuario (timezone)
    setFormattedDate(getFormattedDate());
  }, [user?.timezone]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header con info del usuario */}
      <Card style={[styles.card, { backgroundColor: theme.colors.primary + '10' }]}>
        <Card.Content>
          <View style={styles.headerContent}>
            <View>
              <Text variant="titleLarge" style={styles.greeting}>
                ¡Hola, {user?.fullName || user?.username}! 👋
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                {user?.role === 'ADMIN' && '👤 Administrador • '}
                {user?.role === 'GERENTE' && '📊 Gerente • '}
                {user?.role === 'CAJERO' && '💳 Cajero • '}
                {formattedDate}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="wave"
              size={40}
              color={theme.colors.primary}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Ventas del día */}
      {salesStats && (
        <Card style={styles.card}>
          <Card.Title
            title="📊 Ventas de Hoy"
            subtitle={formattedDate.split(',')[0]} // Solo la fecha sin el día de la semana
            left={(props) => <MaterialCommunityIcons name="chart-bar" size={24} color={theme.colors.primary} />}
          />
          {console.log('📊 [Render] salesStats actual:', salesStats)}
          <Card.Content>
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: theme.colors.primary + '20' }]}>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={ICON_SIZE}
                  color={theme.colors.primary}
                />
                <Text variant="labelSmall" style={styles.statBoxLabel}>
                  INGRESOS
                </Text>
                <Text variant="headlineSmall" style={[styles.statBoxValue, { color: theme.colors.primary }]} numberOfLines={1}>
                  ${(salesStats?.totalAmount || 0).toFixed(2)}
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: theme.colors.secondary + '20' }]}>
                <MaterialCommunityIcons
                  name="credit-card"
                  size={ICON_SIZE}
                  color={theme.colors.secondary}
                />
                <Text variant="labelSmall" style={styles.statBoxLabel}>
                  VENTAS
                </Text>
                <Text variant="headlineSmall" style={[styles.statBoxValue, { color: theme.colors.secondary }]} numberOfLines={1}>
                  {salesStats?.totalSales || 0}
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: '#fcd34d20' }]}>
                <MaterialCommunityIcons
                  name="percent"
                  size={ICON_SIZE}
                  color="#f59e0b"
                />
                <Text variant="labelSmall" style={styles.statBoxLabel}>
                  PROMEDIO
                </Text>
                {console.log('📊 [PROMEDIO] Renderizando con valor:', (salesStats?.averageTicket || 0).toFixed(2))}
                <Text 
                  variant="headlineSmall" 
                  style={[
                    styles.statBoxValue, 
                    { 
                      color: '#f59e0b',
                      backgroundColor: 'transparent',
                      fontSize: 16,
                      fontWeight: 'bold',
                    }
                  ]} 
                  numberOfLines={1}
                >
                  ${(salesStats?.averageTicket || 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Métodos de pago */}
      {salesStats && (
        <Card style={styles.card}>
          <Card.Title
            title="💳 Métodos de Pago"
            left={(props) => <MaterialCommunityIcons name="wallet" size={24} color="#ef4444" />}
          />
          <Card.Content>
            <View style={styles.paymentRow}>
              <View style={styles.paymentLeft}>
                <MaterialCommunityIcons
                  name="cash"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text variant="bodyMedium" style={styles.paymentLabel}>
                  Efectivo
                </Text>
              </View>
              <Text variant="titleMedium" style={styles.paymentAmount}>
                ${(salesStats?.salesByPaymentMethod?.EFECTIVO || 0).toFixed(2)}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.paymentRow}>
              <View style={styles.paymentLeft}>
                <MaterialCommunityIcons
                  name="credit-card"
                  size={24}
                  color={theme.colors.secondary}
                />
                <Text variant="bodyMedium" style={styles.paymentLabel}>
                  Tarjeta
                </Text>
              </View>
              <Text variant="titleMedium" style={styles.paymentAmount}>
                ${(salesStats?.salesByPaymentMethod?.TARJETA || 0).toFixed(2)}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.paymentRow}>
              <View style={styles.paymentLeft}>
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={24}
                  color={theme.colors.tertiary}
                />
                <Text variant="bodyMedium" style={styles.paymentLabel}>
                  Mixto
                </Text>
              </View>
              <Text variant="titleMedium" style={styles.paymentAmount}>
                ${(salesStats?.salesByPaymentMethod?.MIXTO || 0).toFixed(2)}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Inventario */}
      {inventorySummary && (
        <Card style={styles.card}>
          <Card.Title
            title="📦 Estado del Inventario"
            left={(props) => <MaterialCommunityIcons name="package-variant" size={24} color="#10b981" />}
          />
          <Card.Content>
            <View style={styles.inventoryGrid}>
              <View style={[styles.inventoryBox, { backgroundColor: '#f0f9ff' }]}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={ICON_SIZE}
                  color="#0284c7"
                />
                <Text variant="labelSmall" style={styles.inventoryLabel}>
                  TOTAL
                </Text>
                <Text variant="headlineSmall" style={styles.inventoryValue}>
                  {inventorySummary.totalProducts}
                </Text>
              </View>

              <View style={[styles.inventoryBox, { backgroundColor: '#fef3c7' }]}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={ICON_SIZE}
                  color="#f59e0b"
                />
                <Text variant="labelSmall" style={styles.inventoryLabel}>
                  BAJO STOCK
                </Text>
                <Text variant="headlineSmall" style={styles.inventoryValue}>
                  {inventorySummary.lowStockCount}
                </Text>
              </View>

              <View style={[styles.inventoryBox, { backgroundColor: '#fee2e2' }]}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={ICON_SIZE}
                  color="#ef4444"
                />
                <Text variant="labelSmall" style={styles.inventoryLabel}>
                  AGOTADO
                </Text>
                <Text variant="headlineSmall" style={styles.inventoryValue}>
                  {inventorySummary.outOfStockCount}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Acciones Rápidas */}
      <Card style={styles.card}>
        <Card.Title title="⚡ Acciones Rápidas" />
        <Card.Content>
          <View style={styles.quickActionsGrid}>
            {/* Inventario */}
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Inventory')}
              contentStyle={styles.actionButtonContent}
              icon="package-variant"
              style={styles.actionButton}
            >
              Inventario
            </Button>

            {/* Usuarios */}
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Users')}
              contentStyle={styles.actionButtonContent}
              icon="account-multiple"
              style={styles.actionButton}
            >
              Usuarios
            </Button>

            {/* Reportes */}
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Reports')}
              contentStyle={styles.actionButtonContent}
              icon="chart-line"
              style={styles.actionButton}
            >
              Reportes
            </Button>

            {/* Sincronizar */}
            <Button
              mode="outlined"
              onPress={onRefresh}
              contentStyle={styles.actionButtonContent}
              icon="refresh"
              style={styles.actionButton}
            >
              Actualizar
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Estadísticas Rápidas */}
      <Card style={styles.card}>
        <Card.Title title="📊 Resumen General" />
        <Card.Content>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="package-variant" size={24} color={theme.colors.primary} />
              <Text variant="labelSmall" style={styles.summaryLabel}>Productos</Text>
              <Text variant="labelLarge" style={styles.summaryValue}>{productStats?.total || 0}</Text>
            </View>

            <Divider style={styles.verticalDivider} />

            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="account-multiple" size={24} color={theme.colors.secondary} />
              <Text variant="labelSmall" style={styles.summaryLabel}>Usuarios</Text>
              <Text variant="labelLarge" style={styles.summaryValue}>{userStats?.total || 0}</Text>
            </View>

            <Divider style={styles.verticalDivider} />

            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
              <Text variant="labelSmall" style={styles.summaryLabel}>Activos</Text>
              <Text variant="labelLarge" style={styles.summaryValue}>{userStats?.active || 0}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Botón de logout */}
      <Button
        mode="outlined"
        onPress={handleLogout}
        icon="logout"
        style={styles.logoutButton}
      >
        Cerrar Sesión
      </Button>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
    elevation: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  statBoxLabel: {
    marginTop: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: '#6b7280',
    fontSize: 9,
  },
  statBoxValue: {
    marginTop: 6,
    fontWeight: 'bold',
    fontSize: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentLabel: {
    fontWeight: '500',
  },
  paymentAmount: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 4,
  },
  inventoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  inventoryBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inventoryLabel: {
    marginTop: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: '#6b7280',
    fontSize: 10,
  },
  inventoryValue: {
    marginTop: 4,
    fontWeight: 'bold',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    width: '48%',
    marginBottom: 8,
  },
  actionButtonContent: {
    flexDirection: 'column-reverse',
    paddingVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    marginTop: 6,
    color: '#6b7280',
    fontSize: 10,
    marginBottom: 4,
  },
  summaryValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  verticalDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 12,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  spacer: {
    height: 32,
  },
});
