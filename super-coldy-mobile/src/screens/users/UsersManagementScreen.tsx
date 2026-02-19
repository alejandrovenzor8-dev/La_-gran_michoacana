import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Searchbar,
  Dialog,
  Portal,
  TextInput,
  useTheme,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { userService } from '../../api/userService';
import type { User, UserRole } from '../../types';

type UserRoleOption = 'ADMIN' | 'GERENTE' | 'CAJERO';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: '👤 Administrador',
  GERENTE: '📊 Gerente',
  CAJERO: '💳 Cajero',
};

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: '#ef4444',
  GERENTE: '#3b82f6',
  CAJERO: '#10b981',
};

const getRoleColor = (role: UserRole | undefined): string => {
  return ROLE_COLORS[role as UserRole] || '#6b7280';
};

export default function UsersManagementScreen() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
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
    
    let toFilter = users;
    
    if (selectedFilter === 'active') {
      toFilter = users.filter((u) => u.active);
    } else if (selectedFilter === 'inactive') {
      toFilter = users.filter((u) => !u.active);
    }
    
    const filtered = toFilter.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.fullName?.toLowerCase().includes(query)
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, selectedFilter, users]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    try {
      const success = selectedUser.active
        ? await userService.deactivateUser(selectedUser.id)
        : await userService.activateUser(selectedUser.id);

      if (success) {
        setShowStatusDialog(false);
        setShowDetailModal(false);
        setSelectedUser(null);
        loadData();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error al actualizar el estado del usuario');
    }
  };

  const parseDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <Card
      style={[styles.userCard, { opacity: item.active ? 1 : 0.6 }]}
      elevation={1}
      onPress={() => {
        setSelectedUser(item);
        setShowDetailModal(true);
      }}
    >
      <Card.Content>
        <View style={styles.userHeader}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: getRoleColor(item.role) }]}>
              <Text variant="headlineSmall" style={styles.avatarText}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.userInfo}>
            <Text variant="titleSmall" style={styles.username}>
              {item.username}
              {!item.active && <Text style={styles.inactiveLabel}> (Inactivo)</Text>}
            </Text>
            <Text variant="bodySmall" style={styles.email}>
              {item.email}
            </Text>
            {item.fullName && (
              <Text variant="bodySmall" style={styles.fullName}>
                {item.fullName}
              </Text>
            )}
          </View>

          <View style={styles.roleChip}>
            <Chip
              icon={() => (
                <MaterialCommunityIcons
                  name={
                    item.role === 'ADMIN'
                      ? 'shield-admin'
                      : item.role === 'GERENTE'
                      ? 'briefcase'
                      : 'cash-register'
                  }
                  size={12}
                  color="white"
                />
              )}
              label={ROLE_LABELS[item.role]}
              style={{ backgroundColor: getRoleColor(item.role) }}
              textStyle={styles.chipText}
            />
          </View>
        </View>

        <View style={styles.dateSection}>
          <Text variant="labelSmall" style={styles.dateLabel}>
            Registrado: {parseDate(item.createdAt)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Buscar por usuario, email..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
        </View>

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <Button
            mode={selectedFilter === 'all' ? 'contained' : 'outlined'}
            onPress={() => setSelectedFilter('all')}
            style={styles.filterButton}
            icon="account-multiple"
          >
            Todos ({users.length})
          </Button>
          <Button
            mode={selectedFilter === 'active' ? 'contained' : 'outlined'}
            onPress={() => setSelectedFilter('active')}
            style={styles.filterButton}
            icon="check-circle"
          >
            Activos ({users.filter((u) => u.active).length})
          </Button>
          <Button
            mode={selectedFilter === 'inactive' ? 'contained' : 'outlined'}
            onPress={() => setSelectedFilter('inactive')}
            style={styles.filterButton}
            icon="close-circle"
          >
            Inactivos ({users.filter((u) => !u.active).length})
          </Button>
        </View>

        {/* Usuarios */}
        <View style={styles.listContainer}>
          {filteredUsers.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <View style={styles.emptyContent}>
                  <MaterialCommunityIcons
                    name="account-off"
                    size={48}
                    color={theme.colors.outline}
                  />
                  <Text variant="bodyLarge" style={styles.emptyText}>
                    {searchQuery ? 'No se encontraron usuarios' : 'Sin usuarios'}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderUserItem}
              scrollEnabled={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal de detalles */}
      <Portal>
        <Dialog visible={showDetailModal} onDismiss={() => setShowDetailModal(false)}>
          <Dialog.Title>Detalles del Usuario</Dialog.Title>
          <Dialog.Content>
            {selectedUser && (
              <View>
                <View style={styles.detailRow}>
                  <Text variant="labelSmall" style={styles.detailLabel}>
                    USUARIO
                  </Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {selectedUser.username}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text variant="labelSmall" style={styles.detailLabel}>
                    EMAIL
                  </Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {selectedUser.email}
                  </Text>
                </View>

                {selectedUser.fullName && (
                  <View style={styles.detailRow}>
                    <Text variant="labelSmall" style={styles.detailLabel}>
                      NOMBRE COMPLETO
                    </Text>
                    <Text variant="bodyMedium" style={styles.detailValue}>
                      {selectedUser.fullName}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text variant="labelSmall" style={styles.detailLabel}>
                    ROL
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[styles.detailValue, { color: getRoleColor(selectedUser.role) }]}
                  >
                    {ROLE_LABELS[selectedUser.role]}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text variant="labelSmall" style={styles.detailLabel}>
                    ESTADO
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.detailValue,
                      { color: selectedUser.active ? '#10b981' : '#ef4444' },
                    ]}
                  >
                    {selectedUser.active ? '✓ Activo' : '✗ Inactivo'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text variant="labelSmall" style={styles.detailLabel}>
                    REGISTRADO
                  </Text>
                  <Text variant="bodySmall" style={styles.detailValue}>
                    {parseDate(selectedUser.createdAt)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text variant="labelSmall" style={styles.detailLabel}>
                    ACTUALIZADO
                  </Text>
                  <Text variant="bodySmall" style={styles.detailValue}>
                    {parseDate(selectedUser.updatedAt)}
                  </Text>
                </View>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDetailModal(false)}>Cerrar</Button>
            <Button
              onPress={() => {
                setShowDetailModal(false);
                setShowStatusDialog(true);
              }}
              mode="contained"
              icon={selectedUser?.active ? 'lock' : 'lock-open'}
            >
              {selectedUser?.active ? 'Desactivar' : 'Activar'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Confirmación de cambio de estado */}
        <Dialog visible={showStatusDialog} onDismiss={() => setShowStatusDialog(false)}>
          <Dialog.Title>Confirmar cambio de estado</Dialog.Title>
          <Dialog.Content>
            <Text>
              ¿Deseas {selectedUser?.active ? 'desactivar' : 'activar'} al usuario{' '}
              <Text style={{ fontWeight: 'bold' }}>{selectedUser?.username}</Text>?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowStatusDialog(false)}>Cancelar</Button>
            <Button onPress={handleToggleStatus} mode="contained">
              Confirmar
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  searchbar: {
    elevation: 1,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  userCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  inactiveLabel: {
    color: '#ef4444',
    fontSize: 11,
  },
  email: {
    color: '#6b7280',
    marginBottom: 2,
  },
  fullName: {
    color: '#9ca3af',
  },
  roleChip: {
    marginLeft: 8,
  },
  chipText: {
    color: '#ffffff',
    fontSize: 11,
  },
  dateSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  dateLabel: {
    color: '#9ca3af',
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    textTransform: 'uppercase',
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  detailValue: {
    color: '#1f2937',
  },
  emptyCard: {
    margin: 16,
    marginTop: 32,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
