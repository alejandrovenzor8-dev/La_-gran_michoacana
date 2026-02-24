/**
 * Pantalla de Gestión de Sucursales
 * CRUD completo de sucursales
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
import { branchService } from '../../api/branchService';
import type { Branch, BranchCreateInput } from '../../types';

export default function BranchesScreen() {
  const theme = useTheme();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<BranchCreateInput>({
    name: '',
    address: '',
    phone: '',
    active: true,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar sucursales al montar el componente
  const loadBranches = async () => {
    try {
      setError('');
      setLoading(true);
      const data = await branchService.getBranches();
      setBranches(data);
      filterBranches(data, searchQuery);
    } catch (err: any) {
      setError(err.message || 'Error al cargar sucursales');
      console.error('Error loading branches:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar sucursales por búsqueda
  const filterBranches = (data: Branch[], query: string) => {
    if (!query) {
      setFilteredBranches(data);
      return;
    }
    const filtered = data.filter((branch) =>
      branch.name.toLowerCase().includes(query.toLowerCase()) ||
      branch.address?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredBranches(filtered);
  };

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    filterBranches(branches, searchQuery);
  }, [searchQuery, branches]);

  // Limpiar mensaje de éxito después de 3 segundos
  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timeout);
    }
  }, [success]);

  const handleOnRefresh = () => {
    setRefreshing(true);
    loadBranches().finally(() => setRefreshing(false));
  };

  const handleEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      active: branch.active,
    });
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      active: true,
    });
    setError('');
    setShowForm(false);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Validar nombre
    if (!formData.name || formData.name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Actualizar sucursal existente
        await branchService.updateBranch(editingId, formData);
        setSuccess('Sucursal actualizada exitosamente.');
      } else {
        // Crear nueva sucursal
        await branchService.createBranch(formData);
        setSuccess('Sucursal creada exitosamente.');
      }
      handleCancelEdit();
      loadBranches();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la sucursal.');
      console.error('Error saving branch:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsSubmitting(true);
    try {
      await branchService.deleteBranch(deletingId);
      setSuccess('Sucursal eliminada exitosamente.');
      setShowDeleteConfirm(false);
      setDeletingId(null);
      loadBranches();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la sucursal.');
      console.error('Error deleting branch:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (branch: Branch) => {
    try {
      await branchService.toggleBranchStatus(branch.id, !branch.active);
      setSuccess(`Sucursal ${!branch.active ? 'activada' : 'desactivada'}.`);
      loadBranches();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado de sucursal.');
      console.error('Error toggling branch status:', err);
    }
  };

  const handleNewBranch = () => {
    setEditingId(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      active: true,
    });
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando sucursales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mensaje de éxito */}
      {success && (
        <View style={[styles.messageBox, styles.successBox]}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}

      {/* Mensaje de error */}
      {error && (
        <View style={[styles.messageBox, styles.errorBox]}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Searchbar
        placeholder="Buscar sucursal..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        icon="magnify"
      />

      <FlatList
        data={filteredBranches}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.branchHeader}>
                <View style={styles.branchInfo}>
                  <Text variant="titleMedium" style={styles.branchName}>
                    {item.name}
                  </Text>
                  {item.address && (
                    <Text variant="bodySmall" style={styles.grayText}>
                      📍 {item.address}
                    </Text>
                  )}
                  {item.phone && (
                    <Text variant="bodySmall" style={styles.grayText}>
                      📞 {item.phone}
                    </Text>
                  )}
                </View>
                <Chip
                  label={item.active ? 'Activa' : 'Inactiva'}
                  style={{
                    backgroundColor: item.active ? '#10b981' : '#ef4444',
                  }}
                  mode="flat"
                  textStyle={{ color: 'white' }}
                />
              </View>

              {item._count || item._count === undefined ? (
                <View style={styles.statsRow}>
                  <Chip
                    icon="account-multiple"
                    label={`${item._count?.users ?? 0} usuarios`}
                    style={styles.statChip}
                    compact={true}
                  />
                  <Chip
                    icon="cash-multiple"
                    label={`${item._count?.sales ?? 0} ventas`}
                    style={styles.statChip}
                    compact={true}
                  />
                  <Chip
                    icon="package"
                    label={`${item._count?.products ?? 0} productos`}
                    style={styles.statChip}
                    compact={true}
                  />
                </View>
              ) : null}

              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  onPress={() => handleEdit(item)}
                  icon="pencil"
                  style={styles.actionButton}
                >
                  Editar
                </Button>
                <Button
                  mode={item.active ? 'contained-tonal' : 'contained'}
                  onPress={() => handleToggleStatus(item)}
                  icon={item.active ? 'power-off' : 'power'}
                  style={styles.actionButton}
                >
                  {item.active ? 'Desactivar' : 'Activar'}
                </Button>
                <Button
                  mode="outlined"
                  icon="trash-can"
                  style={styles.actionButton}
                  onPress={() => {
                    setDeletingId(item.id);
                    setShowDeleteConfirm(true);
                  }}
                >
                  Eliminar
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleOnRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="folder-open"
                size={48}
                color={theme.colors.outline}
              />
              <Text style={styles.emptyText}>No hay sucursales</Text>
              <Text style={styles.emptySubtext}>Crea una nueva sucursal para comenzar</Text>
            </View>
          ) : null
        }
      />

      {/* Modal de Formulario */}
      <Portal>
        <Modal visible={showForm} onDismiss={handleCancelEdit} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text variant="headlineSmall" style={styles.modalTitle}>
                {editingId ? '✏️ Editar Sucursal' : '➕ Nueva Sucursal'}
              </Text>
              <Button
                icon="close"
                onPress={handleCancelEdit}
                disabled={isSubmitting}
              />
            </View>

            <ScrollView style={styles.modalContent}>
              {error && (
                <View style={styles.errorBox}>
                  <MaterialCommunityIcons name="alert-circle" size={18} color="#dc2626" />
                  <Text style={styles.errorTextModal}>{error}</Text>
                </View>
              )}

              <TextInput
                label="Nombre *"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, name: text }))
                }
                style={styles.input}
                placeholder="Ej: Sucursal Centro"
                disabled={isSubmitting}
              />

              <TextInput
                label="Dirección"
                value={formData.address || ''}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, address: text }))
                }
                style={styles.input}
                placeholder="Ej: Calle Principal 123"
                disabled={isSubmitting}
              />

              <TextInput
                label="Teléfono"
                value={formData.phone || ''}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, phone: text }))
                }
                style={styles.input}
                placeholder="Ej: +52 123 456 7890"
                disabled={isSubmitting}
                keyboardType="phone-pad"
              />

              <View style={styles.activeToggle}>
                <Text variant="labelMedium" style={styles.statusLabel}>Estado de la sucursal:</Text>
                <View style={styles.statusChips}>
                  <Chip
                    selected={formData.active === true}
                    onPress={() =>
                      setFormData((prev) => ({ ...prev, active: true }))
                    }
                    mode={formData.active === true ? 'flat' : 'outlined'}
                    label="Activa"
                    icon={formData.active === true ? 'check' : undefined}
                    style={[
                      styles.statusChip,
                      formData.active === true && { backgroundColor: '#10b981' }
                    ]}
                    textStyle={formData.active === true ? { color: '#fff' } : { color: '#10b981' }}
                    disabled={isSubmitting}
                  />
                  <Chip
                    selected={formData.active === false}
                    onPress={() =>
                      setFormData((prev) => ({ ...prev, active: false }))
                    }
                    mode={formData.active === false ? 'flat' : 'outlined'}
                    label="Inactiva"
                    icon={formData.active === false ? 'check' : undefined}
                    style={[
                      styles.statusChip,
                      formData.active === false && { backgroundColor: '#ef4444' }
                    ]}
                    textStyle={formData.active === false ? { color: '#fff' } : { color: '#ef4444' }}
                    disabled={isSubmitting}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={handleCancelEdit}
                disabled={isSubmitting}
                style={styles.modalButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting || !formData.name.trim()}
                style={styles.modalButton}
              >
                {editingId ? 'Actualizar' : 'Crear'}
              </Button>
            </View>
          </View>
        </Modal>

        {/* Diálogo de confirmación de eliminación */}
        <Dialog visible={showDeleteConfirm} onDismiss={() => setShowDeleteConfirm(false)}>
          <Dialog.Title>Eliminar Sucursal</Dialog.Title>
          <Dialog.Content>
            <Text>
              ¿Estás seguro de que deseas eliminar esta sucursal? Esta acción no se puede deshacer.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteConfirm(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onPress={handleDeleteConfirm}
              loading={isSubmitting}
              disabled={isSubmitting}
              textColor="#ef4444"
            >
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* FAB para crear nueva sucursal */}
      <FAB
        icon="plus"
        label="Nueva Sucursal"
        onPress={handleNewBranch}
        style={styles.fab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
    gap: 10,
  },
  successBox: {
    backgroundColor: '#dcfce7',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  successText: {
    color: '#166534',
    flex: 1,
  },
  errorText: {
    color: '#dc2626',
    flex: 1,
  },
  searchBar: {
    margin: 12,
  },
  card: {
    margin: 8,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  branchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  branchInfo: {
    flex: 1,
    marginRight: 8,
  },
  branchName: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 16,
  },
  grayText: {
    color: '#666',
    marginVertical: 2,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 12,
  },
  statChip: {
    marginRight: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 4,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginVertical: 10,
  },
  errorTextModal: {
    color: '#dc2626',
    flex: 1,
    marginLeft: 8,
  },
  activeToggle: {
    marginVertical: 16,
  },
  statusLabel: {
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  statusChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statusChip: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
