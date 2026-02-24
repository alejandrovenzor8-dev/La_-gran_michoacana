/**
 * Pantalla de Gestión de Permisos
 * Asignar acceso a módulos para cada usuario
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
  ActivityIndicator,
  useTheme,
  Chip,
  Dialog,
  Portal,
  Checkbox,
  Searchbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { permissionService } from '../../api/permissionService';
import { userService } from '../../api/userService';
import type { User, UserRole } from '../../types';

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: '#ef4444',
  GERENTE: '#3b82f6',
  CAJERO: '#10b981',
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: '👤 Administrador',
  GERENTE: '📊 Gerente',
  CAJERO: '💳 Cajero',
};

interface Module {
  id: number;
  key: string;
  name: string;
  description?: string;
  icon?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserWithPermissions extends User {
  permissionsMap: Record<string, boolean>;
}

export default function PermissionsScreen() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithPermissions[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allUsers, availableModules] = await Promise.all([
        userService.getAllUsers(),
        permissionService.getAvailableModules(),
      ]);

      const modulesTyped = (availableModules as any as Module[]) || [];
      setModules(modulesTyped);

      // Cargar permisos para cada usuario
      const usersWithPermissions = await Promise.all(
        (allUsers as User[]).map(async (user) => {
          try {
            const userPermsMap = await permissionService.getUserPermissions(user.id);
            return {
              ...user,
              permissionsMap: userPermsMap || {},
            } as UserWithPermissions;
          } catch (error) {
            console.error(`Error loading permissions for user ${user.id}:`, error);
            return {
              ...user,
              permissionsMap: {},
            } as UserWithPermissions;
          }
        })
      );

      setUsers(usersWithPermissions);
      setFilteredUsers(usersWithPermissions);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.fullName?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openPermissionsDialog = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setSelectedModules({ ...user.permissionsMap });
    setShowPermissionsDialog(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      setIsSaving(true);
      await permissionService.assignPermissionsToRole(selectedUser.id, selectedModules);
      await loadData();
      setShowPermissionsDialog(false);
      setSelectedUser(null);
      setSelectedModules({});
      alert('Permisos actualizados correctamente');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Error al actualizar los permisos');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleModule = (moduleKey: string) => {
    setSelectedModules((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando permisos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Información */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="shield-lock-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text variant="bodySmall" style={styles.infoText}>
                Gestiona qué módulos y funciones puede acceder cada usuario
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Buscador */}
        <Searchbar
          placeholder="Buscar usuario..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        {/* Lista de usuarios */}
        {filteredUsers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="account-multiple"
                size={48}
                color={theme.colors.outline}
              />
              <Text style={styles.emptyText}>Sin usuarios</Text>
            </Card.Content>
          </Card>
        ) : (
          filteredUsers.map((user) => {
            const enabledModules = Object.entries(user.permissionsMap)
              .filter(([_, enabled]) => enabled)
              .map(([moduleKey]) => moduleKey);

            return (
              <Card key={user.id} style={styles.userCard}>
                <Card.Content>
                  <View style={styles.userHeader}>
                    <View style={styles.userInfo}>
                      <Text variant="titleMedium">{user.fullName || user.username}</Text>
                      <Text variant="bodySmall" style={styles.email}>
                        {user.email}
                      </Text>
                    </View>
                    <View style={styles.userBadges}>
                      <Chip
                        style={{
                          backgroundColor: ROLE_COLORS[user.role] + '20',
                          marginBottom: 8,
                        }}
                        textStyle={{
                          color: ROLE_COLORS[user.role],
                          fontSize: 12,
                        }}
                      >
                        {ROLE_LABELS[user.role]}
                      </Chip>
                      <Chip
                        style={{
                          backgroundColor: enabledModules.length > 0 ? '#d1fae5' : '#fee2e2',
                        }}
                        textStyle={{
                          color: enabledModules.length > 0 ? '#065f46' : '#991b1b',
                          fontSize: 12,
                        }}
                      >
                        {enabledModules.length} módulos
                      </Chip>
                    </View>
                  </View>

                  {/* Módulos habilitados */}
                  {modules.length > 0 && (
                    <View style={styles.permissionsContainer}>
                      <View style={styles.modulesGrid}>
                        {modules.map((module) => (
                          <Chip
                            key={module.key}
                            mode={
                              user.permissionsMap[module.key] ? 'flat' : 'outlined'
                            }
                            style={{
                              marginRight: 8,
                              marginBottom: 8,
                              backgroundColor: user.permissionsMap[module.key]
                                ? ROLE_COLORS[user.role] + '40'
                                : 'transparent',
                            }}
                            textStyle={{
                              color: user.permissionsMap[module.key]
                                ? ROLE_COLORS[user.role]
                                : '#9ca3af',
                              fontSize: 12,
                            }}
                          >
                            {module.name}
                          </Chip>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Botón de editar */}
                  <Button
                    mode="contained"
                    onPress={() => openPermissionsDialog(user)}
                    style={styles.editButton}
                    icon="pencil"
                    buttonColor={ROLE_COLORS[user.role]}
                  >
                    Editar Acceso
                  </Button>
                </Card.Content>
              </Card>
            );
          })
        )}

        {/* Spacing final */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Dialog para editar permisos */}
      <Portal>
        <Dialog visible={showPermissionsDialog} onDismiss={() => setShowPermissionsDialog(false)}>
          <Dialog.Title>
            Editar Acceso - {selectedUser?.fullName || selectedUser?.username}
          </Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.permissionsDialogScroll}>
              <Text variant="labelMedium" style={styles.moduleDialogLabel}>
                Módulos Disponibles
              </Text>
              {modules.map((module) => (
                <View key={module.key} style={styles.permissionCheckRow}>
                  <Checkbox
                    status={selectedModules[module.key] ? 'checked' : 'unchecked'}
                    onPress={() => toggleModule(module.key)}
                    disabled={isSaving}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text variant="bodySmall">{module.name}</Text>
                    {module.description && (
                      <Text variant="labelSmall" style={styles.permissionDescription}>
                        {module.description}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setShowPermissionsDialog(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onPress={handleSavePermissions}
              loading={isSaving}
              disabled={isSaving}
            >
              Guardar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  infoCard: {
    marginBottom: 16,
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#1e40af',
  },
  searchbar: {
    marginBottom: 12,
  },
  emptyCard: {
    marginVertical: 20,
    paddingVertical: 40,
  },
  emptyContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  userCard: {
    marginBottom: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  email: {
    marginTop: 4,
    color: '#6b7280',
  },
  userBadges: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  permissionsContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  editButton: {
    marginTop: 8,
  },
  permissionsDialogScroll: {
    maxHeight: 400,
  },
  moduleDialogLabel: {
    marginBottom: 12,
    color: '#374151',
    fontWeight: '600',
  },
  permissionCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionDescription: {
    color: '#9ca3af',
    marginTop: 2,
  },
});
