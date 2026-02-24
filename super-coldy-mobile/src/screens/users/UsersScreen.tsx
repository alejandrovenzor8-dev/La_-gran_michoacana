/**
 * Pantalla de Gestión de Usuarios
 * CRUD completo de empleados
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  Modal,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Searchbar,
  FAB,
  Dialog,
  Portal,
  TextInput,
  useTheme,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { userService } from '../../api/userService';
import { branchService } from '../../api/branchService';
import type { User, UserRole, Branch } from '../../types';

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

export default function UsersScreen() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Formulario de edición
  const [editForm, setEditForm] = useState<{
    fullName: string;
    email: string;
    role: UserRole;
    branchId?: number;
  }>({
    fullName: '',
    email: '',
    role: 'CAJERO',
    branchId: undefined,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allUsers, allBranches] = await Promise.all([
        userService.getAllUsers(),
        branchService.getBranches(),
      ]);
      setUsers(allUsers);
      setFilteredUsers(allUsers);
      setBranches(allBranches);
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
      setIsProcessing(true);
      await userService.toggleUserStatus(selectedUser.id);
      await loadData();
      setShowDetailModal(false);
      alert('Estado del usuario actualizado');
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Error al actualizar el estado');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser || !editForm.fullName || !editForm.email) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      setIsProcessing(true);
      await userService.updateUser(selectedUser.id, {
        fullName: editForm.fullName,
        email: editForm.email,
        role: editForm.role,
        branchId: editForm.branchId,
      });
      
      await loadData();
      setShowEditModal(false);
      setSelectedUser(null);
      alert('Usuario actualizado exitosamente');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error al actualizar el usuario');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      setIsProcessing(true);
      const result = await userService.resetPassword(selectedUser.id);
      if (result?.temporaryPassword) {
        alert(`Contraseña temporal: ${result.temporaryPassword}`);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Error al resetear la contraseña');
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName || '',
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    });
    setShowDetailModal(false);
    setShowEditModal(true);
  };

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
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Buscador */}
        <Searchbar
          placeholder="Buscar usuario..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <Button
            mode={selectedFilter === 'all' ? 'contained' : 'outlined'}
            onPress={() => setSelectedFilter('all')}
            style={styles.filterButton}
          >
            Todos ({users.length})
          </Button>
          <Button
            mode={selectedFilter === 'active' ? 'contained' : 'outlined'}
            onPress={() => setSelectedFilter('active')}
            style={styles.filterButton}
          >
            Activos
          </Button>
          <Button
            mode={selectedFilter === 'inactive' ? 'contained' : 'outlined'}
            onPress={() => setSelectedFilter('inactive')}
            style={styles.filterButton}
          >
            Inactivos
          </Button>
        </View>

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
          <FlatList
            scrollEnabled={false}
            data={filteredUsers}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <Card 
                style={[
                  styles.userCard,
                  !item.active && styles.inactiveCard
                ]}
                onPress={() => {
                  setSelectedUser(item);
                  setShowDetailModal(true);
                }}
                key={item.id}
              >
                <Card.Content>
                  <View style={styles.userHeader}>
                    <View style={styles.userInfo}>
                      <Text variant="titleMedium" numberOfLines={1}>
                        {item.fullName || item.username}
                      </Text>
                      <Text variant="bodySmall" style={styles.email}>
                        {item.username} • {item.email}
                      </Text>
                    </View>
                    <View style={styles.statusContainer}>
                      <Chip
                        style={{
                          backgroundColor: getRoleColor(item.role) + '20',
                        }}
                        textStyle={{
                          color: getRoleColor(item.role),
                          fontSize: 12,
                        }}
                      >
                        {ROLE_LABELS[item.role]}
                      </Chip>
                      <Chip
                        style={{
                          marginTop: 6,
                          backgroundColor: item.active ? '#d1fae5' : '#fee2e2',
                        }}
                        textStyle={{
                          color: item.active ? '#065f46' : '#991b1b',
                          fontSize: 12,
                        }}
                      >
                        {item.active ? '✓ Activo' : '✗ Inactivo'}
                      </Chip>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}
          />
        )}
      </ScrollView>

      {/* Modal de detalles */}
      <Portal>
        <Dialog visible={showDetailModal} onDismiss={() => setShowDetailModal(false)}>
          {selectedUser && (
            <View>
              <Dialog.Title>{selectedUser.fullName || selectedUser.username}</Dialog.Title>
              <Dialog.Content>
                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.label}>Usuario:</Text>
                  <Text variant="bodySmall">{selectedUser.username}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.label}>Email:</Text>
                  <Text variant="bodySmall">{selectedUser.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.label}>Rol:</Text>
                  <Text variant="bodySmall">{ROLE_LABELS[selectedUser.role]}</Text>
                </View>
                {selectedUser.branchId && (
                  <View style={styles.detailRow}>
                    <Text variant="bodySmall" style={styles.label}>Sucursal:</Text>
                    <Text variant="bodySmall">
                      {branches.find(b => b.id === selectedUser.branchId)?.name || 'Sin asignar'}
                    </Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.label}>Estado:</Text>
                  <Text variant="bodySmall">
                    {selectedUser.active ? '✓ Activo' : '✗ Inactivo'}
                  </Text>
                </View>
              </Dialog.Content>

              <Dialog.Actions>
                <Button onPress={() => setShowDetailModal(false)}>
                  Cerrar
                </Button>
                <Button 
                  onPress={() => openEditModal(selectedUser)}
                  icon="pencil"
                >
                  Editar
                </Button>
              </Dialog.Actions>
            </View>
          )}
        </Dialog>

        {/* Modal de edición */}
        <Dialog visible={showEditModal} onDismiss={() => setShowEditModal(false)}>
          <Dialog.Title>Editar Usuario</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nombre Completo"
              value={editForm.fullName}
              onChangeText={(text) => setEditForm({ ...editForm, fullName: text })}
              style={styles.input}
              mode="outlined"
              disabled={isProcessing}
            />

            <TextInput
              label="Email"
              value={editForm.email}
              onChangeText={(text) => setEditForm({ ...editForm, email: text })}
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
              disabled={isProcessing}
            />

            {/* Selector de rol */}
            <Text variant="labelMedium" style={{ marginTop: 12 }}>Rol</Text>
            <View style={styles.roleChipsContainer}>
              {(['ADMIN', 'GERENTE', 'CAJERO'] as UserRole[]).map((role) => (
                <Chip
                  key={role}
                  onPress={() => setEditForm({ ...editForm, role })}
                  selected={editForm.role === role}
                  style={{ marginRight: 8, marginBottom: 8 }}
                >
                  {ROLE_LABELS[role]}
                </Chip>
              ))}
            </View>

            {/* Selector de sucursal */}
            {branches.length > 0 && (
              <View>
                <Text variant="labelMedium" style={{ marginTop: 12 }}>Sucursal</Text>
                <View style={styles.branchChipsContainer}>
                  <Chip
                    onPress={() => setEditForm({ ...editForm, branchId: undefined })}
                    selected={editForm.branchId === undefined}
                    style={{ marginRight: 8, marginBottom: 8 }}
                  >
                    Sin sucursal
                  </Chip>
                  {branches.map((branch) => (
                    <Chip
                      key={branch.id}
                      onPress={() => setEditForm({ ...editForm, branchId: branch.id })}
                      selected={editForm.branchId === branch.id}
                      style={{ marginRight: 8, marginBottom: 8 }}
                    >
                      {branch.name}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {/* Botones de acción */}
            {selectedUser && (
              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  onPress={handleToggleStatus}
                  disabled={isProcessing}
                  style={{ flex: 1 }}
                >
                  {selectedUser.active ? 'Desactivar' : 'Activar'}
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleResetPassword}
                  disabled={isProcessing}
                  style={{ flex: 1, marginLeft: 8 }}
                >
                  Reset Pass
                </Button>
              </View>
            )}
          </Dialog.Content>

          <Dialog.Actions>
            <Button 
              onPress={() => setShowEditModal(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onPress={handleSaveEdit}
              loading={isProcessing}
              disabled={isProcessing}
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
  searchbar: {
    marginBottom: 12,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    color: '#9ca3af',
  },
  userCard: {
    marginBottom: 12,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  email: {
    marginTop: 4,
    color: '#6b7280',
  },
  statusContainer: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  label: {
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  roleChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  branchChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});
