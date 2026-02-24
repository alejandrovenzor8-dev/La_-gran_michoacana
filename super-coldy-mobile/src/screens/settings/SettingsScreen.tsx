/**
 * Pantalla de Configuración
 * Gestiona timezone, preferencias del usuario
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  useTheme,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { userService } from '../../api/userService';
import { API_CONFIG } from '../../config/api.config';

// Timezones comunes (basado en América Latina principalmente)
const TIMEZONES = [
  { value: 'America/Mexico_City', label: 'México (CDMX)' },
  { value: 'America/Guatemala', label: 'Guatemala' },
  { value: 'America/El_Salvador', label: 'El Salvador' },
  { value: 'America/Honduras', label: 'Honduras' },
  { value: 'America/Managua', label: 'Nicaragua' },
  { value: 'America/Costa_Rica', label: 'Costa Rica' },
  { value: 'America/Panama', label: 'Panamá' },
  { value: 'America/Colombia', label: 'Colombia' },
  { value: 'America/Ecuador', label: 'Ecuador' },
  { value: 'America/Bogota', label: 'Bogotá' },
  { value: 'America/Peru', label: 'Perú' },
  { value: 'America/Lima', label: 'Lima' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina' },
  { value: 'America/Santiago', label: 'Chile' },
  { value: 'America/La_Paz', label: 'Bolivia' },
  { value: 'America/Caracas', label: 'Venezuela' },
  { value: 'America/Toronto', label: 'Toronto (EST)' },
  { value: 'America/New_York', label: 'Nueva York (EST)' },
  { value: 'America/Chicago', label: 'Chicago (CST)' },
  { value: 'America/Denver', label: 'Denver (MST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'Europe/London', label: 'Londres (UTC)' },
  { value: 'Europe/Madrid', label: 'España (CET)' },
  { value: 'Europe/Paris', label: 'Francia (CET)' },
  { value: 'UTC', label: 'UTC (Hora Universal)' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    user?.timezone || 'America/Mexico_City'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingTimezone, setIsSavingTimezone] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Detectar si hay cambios
  useEffect(() => {
    setHasChanges(selectedTimezone !== (user?.timezone || 'America/Mexico_City'));
  }, [selectedTimezone, user?.timezone]);

  const handleSaveTimezone = async () => {
    if (!user) return;

    try {
      setIsSavingTimezone(true);
      
      // Actualizar en el backend
      const updatedUser = await userService.updateUser(user.id, {
        timezone: selectedTimezone,
      });

      if (updatedUser) {
        // Actualizar en el store local
        updateProfile({
          ...user,
          timezone: selectedTimezone,
        });

        Alert.alert('✅ Éxito', 'Zona horaria actualizada correctamente');
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error actualizando timezone:', error);
      Alert.alert('❌ Error', 'No se pudo actualizar la zona horaria');
    } finally {
      setIsSavingTimezone(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

  const currentTimezoneLabel = TIMEZONES.find(
    (tz) => tz.value === selectedTimezone
  )?.label || selectedTimezone;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Información del usuario */}
        <Card style={styles.section}>
          <Card.Content>
            <View style={styles.headerRow}>
              <MaterialCommunityIcons
                name="account-circle"
                size={48}
                color={theme.colors.primary}
              />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text variant="titleMedium">{user.fullName || user.username}</Text>
                <Text variant="bodySmall" style={styles.secondaryText}>
                  {user.email}
                </Text>
                <Text variant="labelSmall" style={styles.roleLabel}>
                  Estado: {(user.active ?? true) ? '✓ Activo' : '✗ Inactivo'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Zona Horaria */}
        <Card style={styles.section}>
          <Card.Title
            title="Zona Horaria"
            subtitle={`Actual: ${currentTimezoneLabel}`}
            left={(props) => (
              <MaterialCommunityIcons
                name="clock-outline"
                size={24}
                color={theme.colors.primary}
              />
            )}
          />
          <Card.Content>
            <View style={styles.timezoneList}>
              {TIMEZONES.slice(0, 10).map((tz) => (
                <Chip
                  key={tz.value}
                  onPress={() => setSelectedTimezone(tz.value)}
                  selected={selectedTimezone === tz.value}
                  mode={selectedTimezone === tz.value ? 'flat' : 'outlined'}
                  style={styles.timezoneChip}
                  textStyle={{
                    color:
                      selectedTimezone === tz.value ? '#fff' : theme.colors.primary,
                    fontSize: 12,
                  }}
                >
                  {tz.label}
                </Chip>
              ))}
            </View>

            {TIMEZONES.length > 10 && (
              <Text variant="labelSmall" style={styles.moreZonesText}>
                y {TIMEZONES.length - 10} zonas horarias más
              </Text>
            )}

            {hasChanges && (
              <Button
                mode="contained"
                onPress={handleSaveTimezone}
                loading={isSavingTimezone}
                disabled={isSavingTimezone}
                style={styles.saveButton}
                icon="check"
              >
                Guardar Zona Horaria
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Información de la app */}
        <Card style={styles.section}>
          <Card.Title
            title="Acerca de"
            left={(props) => (
              <MaterialCommunityIcons
                name="information-outline"
                size={24}
                color={theme.colors.primary}
              />
            )}
          />
          <Card.Content>
            <View style={styles.infoRow}>
              <Text variant="bodySmall" style={styles.label}>
                Versión de la App:
              </Text>
              <Text variant="bodySmall">1.1.1</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodySmall" style={styles.label}>
                Plataforma:
              </Text>
              <Text variant="bodySmall">React Native + Expo</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodySmall" style={styles.label}>
                Servidor API:
              </Text>
              <Text
                variant="bodySmall"
                numberOfLines={1}
                style={styles.monospace}
              >
                {API_CONFIG.baseURL}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Útiles */}
        <Card style={styles.section}>
          <Card.Title
            title="Útiles"
            left={(props) => (
              <MaterialCommunityIcons
                name="tools"
                size={24}
                color={theme.colors.primary}
              />
            )}
          />
          <Card.Content style={styles.actionButtons}>
            <Button
              mode="outlined"
              style={styles.actionButton}
              icon="refresh"
            >
              Sincronizar Datos
            </Button>
            <Button
              mode="outlined"
              style={styles.actionButton}
              icon="trash-can-outline"
              textColor="#ef4444"
            >
              Limpiar Cache
            </Button>
          </Card.Content>
        </Card>

        {/* Spacing final */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 12,
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
  section: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryText: {
    marginTop: 4,
    color: '#6b7280',
  },
  roleLabel: {
    marginTop: 4,
    color: '#059669',
    fontWeight: '600',
  },
  timezoneList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  timezoneChip: {
    marginBottom: 8,
  },
  moreZonesText: {
    color: '#9ca3af',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  label: {
    fontWeight: '600',
    color: '#374151',
  },
  monospace: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#6b7280',
  },
  actionButtons: {
    gap: 8,
  },
  actionButton: {
    marginBottom: 8,
  },
});
