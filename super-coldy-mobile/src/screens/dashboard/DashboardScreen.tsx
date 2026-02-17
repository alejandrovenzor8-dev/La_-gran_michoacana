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
} from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../api/client';
import type { DailySalesStats, UserStats } from '../../types';

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesStats, setSalesStats] = useState<DailySalesStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar estadísticas reales del backend
      try {
        const salesResponse = await apiClient.get<{ success: boolean; data: { sales: any[]; stats: DailySalesStats } }>('/sales/daily');
        console.log('📊 Sales data loaded:', salesResponse.data.stats);
        setSalesStats(salesResponse.data.stats);
      } catch (salesError) {
        console.error('Error loading sales stats:', salesError);
        // Set null para mostrar "Sin datos"
        setSalesStats(null);
      }
      
      try {
        const userResponse = await apiClient.get<any>('/users');
        console.log('👥 User stats response:', userResponse);
        
        // La respuesta tiene estructura { data: { users, pagination }, status }
        const userData = userResponse?.data || userResponse;
        const users = userData?.users || userResponse?.users || [];
        
        if (Array.isArray(users) && users.length > 0) {
          const stats: UserStats = {
            total: userData?.pagination?.total || users.length,
            active: users.filter((u: any) => u.active === true).length,
            inactive: users.filter((u: any) => u.active === false).length,
            byRole: [],
          };
          console.log('👥 Calculated stats:', stats);
          setUserStats(stats);
        } else {
          setUserStats(null);
        }
      } catch (userError) {
        console.error('Error loading user stats:', userError);
        setUserStats(null);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
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
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">¡Hola, {user?.fullName || user?.username}! 👋</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Rol: {user?.role} • {new Date().toLocaleDateString('es-MX', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </Card.Content>
      </Card>

      {/* Ventas del día */}
      <Card style={styles.card}>
        <Card.Title title="📊 Ventas del Día" />
        <Card.Content>
          {!salesStats ? (
            <Text variant="bodyMedium" style={styles.noData}>
              Sin datos disponibles
            </Text>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statValue}>
                  {salesStats?.totalSales || 0}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Ventas
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statValue}>
                  ${typeof salesStats?.totalAmount === 'number' ? salesStats.totalAmount.toFixed(2) : '0.00'}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Ingresos
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statValue}>
                  ${typeof salesStats?.averageTicket === 'number' ? salesStats.averageTicket.toFixed(2) : '0.00'}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Ticket Promedio
                </Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Métodos de pago */}
      <Card style={styles.card}>
        <Card.Title title="💳 Métodos de Pago" />
        <Card.Content>
          {!salesStats?.salesByPaymentMethod || Object.keys(salesStats.salesByPaymentMethod).length === 0 ? (
            <Text variant="bodyMedium" style={styles.noData}>
              Sin transacciones registradas
            </Text>
          ) : (
            <>
              <View style={styles.paymentRow}>
                <Text>💵 Efectivo:</Text>
                <Text style={styles.bold}>
                  {salesStats?.salesByPaymentMethod?.EFECTIVO || 0} ventas
                </Text>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.paymentRow}>
                <Text>💳 Tarjeta:</Text>
                <Text style={styles.bold}>
                  {salesStats?.salesByPaymentMethod?.TARJETA || 0} ventas
                </Text>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.paymentRow}>
                <Text>🔀 Mixto:</Text>
                <Text style={styles.bold}>
                  {salesStats?.salesByPaymentMethod?.MIXTO || 0} ventas
                </Text>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Usuarios */}
      <Card style={styles.card}>
        <Card.Title title="👥 Usuarios" />
        <Card.Content>
          {!userStats ? (
            <Text variant="bodyMedium" style={styles.noData}>
              Sin datos disponibles
            </Text>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statValue}>
                  {userStats?.active || 0}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Activos
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statValue}>
                  {userStats?.total || 0}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total
                </Text>
              </View>
            </View>
          )}
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
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  subtitle: {
    marginTop: 4,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statLabel: {
    marginTop: 4,
    color: '#6b7280',
  },
  noData: {
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 4,
  },
  logoutButton: {
    margin: 16,
    marginTop: 24,
  },
  spacer: {
    height: 32,
  },
});
