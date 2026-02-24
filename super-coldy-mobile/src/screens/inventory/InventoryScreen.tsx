/**
 * Pantalla de Inventario
 * Muestra tabbed interface: todos los productos y bajo stock
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  Modal,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
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
import { productService } from '../../api/productService';
import { inventoryService } from '../../api/inventoryService';
import type { Product } from '../../types';

// Helper function para formatear precios de forma segura
const formatPrice = (value: any): string => {
  const num = Number(value);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

export default function InventoryScreen() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  
  const [selectedTab, setSelectedTab] = useState<'all' | 'lowStock'>('all');
  
  // Modales
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Ajuste de stock
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  // Formulario (Create/Update)
  const [formData, setFormData] = useState<{
    name: string;
    description?: string;
    price: string;
    cost?: string;
    category: string;
    stock: string;
    minStock: string;
    barcode?: string;
    emoji?: string;
  }>({
    name: '',
    description: '',
    price: '0',
    cost: '0',
    category: 'General',
    stock: '0',
    minStock: '0',
    barcode: '',
    emoji: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allProducts, lowStock] = await Promise.all([
        productService.getAllProducts(),
        inventoryService.getLowStockProducts(),
      ]);
      setProducts(allProducts);
      setFilteredProducts(allProducts);
      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Error loading inventory:', error);
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
    const toFilter = selectedTab === 'lowStock' ? lowStockProducts : products;
    
    const filtered = toFilter.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedTab, products, lowStockProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct || !adjustQuantity) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      setIsAdjusting(true);
      const newQty = parseInt(adjustQuantity);
      
      if (newQty < 0) {
        alert('La cantidad no puede ser negativa');
        return;
      }

      await inventoryService.adjustStock(selectedProduct.id, {
        newQuantity: newQty,
        reason: adjustReason || undefined,
      });
      
      setShowAdjustModal(false);
      setAdjustQuantity('');
      setAdjustReason('');
      setSelectedProduct(null);
      
      await loadData();
      alert('Stock ajustado exitosamente');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error al ajustar el stock');
    } finally {
      setIsAdjusting(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      price: '0',
      cost: '0',
      category: 'General',
      stock: '0',
      minStock: '0',
      barcode: '',
      emoji: '',
    });
    setIsEditMode(false);
    setSelectedProduct(null);
    setShowFormModal(true);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: String(product.price || 0),
      cost: String(product.cost || 0),
      category: product.category,
      stock: String(product.stock || 0),
      minStock: String(product.minStock || 0),
      barcode: product.barcode || '',
      emoji: product.emoji || '',
    });
    setIsEditMode(true);
    setSelectedProduct(product);
    setShowFormModal(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.category || !formData.price) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    try {
      setIsProcessing(true);

      const productData = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        category: formData.category,
        stock: parseInt(formData.stock) || 0,
        minStock: parseInt(formData.minStock) || 0,
        barcode: formData.barcode || undefined,
        emoji: formData.emoji || undefined,
        active: true,
      };

      if (isEditMode && selectedProduct) {
        await productService.updateProduct(selectedProduct.id, productData);
        alert('Producto actualizado exitosamente');
      } else {
        await productService.createProduct(productData);
        alert('Producto creado exitosamente');
      }

      setShowFormModal(false);
      await loadData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      setIsProcessing(true);
      await productService.deleteProduct(selectedProduct.id);
      setShowDeleteDialog(false);
      setSelectedProduct(null);
      await loadData();
      alert('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando inventario...</Text>
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
          placeholder="Buscar producto..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Button
            mode={selectedTab === 'all' ? 'contained' : 'outlined'}
            onPress={() => setSelectedTab('all')}
            style={styles.tabButton}
          >
            Todos ({products.length})
          </Button>
          <Button
            mode={selectedTab === 'lowStock' ? 'contained' : 'outlined'}
            onPress={() => setSelectedTab('lowStock')}
            style={styles.tabButton}
          >
            Bajo Stock ({lowStockProducts.length})
          </Button>
        </View>

        {/* Lista de productos */}
        {filteredProducts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons 
                name="package-variant" 
                size={48} 
                color={theme.colors.outline}
              />
              <Text style={styles.emptyText}>Sin productos</Text>
            </Card.Content>
          </Card>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={filteredProducts}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <Card style={styles.productCard} key={item.id}>
                <Card.Content>
                  <View style={styles.productHeader}>
                    <View style={styles.productInfo}>
                      <Text variant="titleMedium" numberOfLines={1}>
                        {item.emoji && `${item.emoji} `}{item.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.category}>
                        {item.category} {item.barcode && `• ${item.barcode}`}
                      </Text>
                    </View>
                    <View style={[
                      styles.stockBadge,
                      { backgroundColor: item.stock > item.minStock ? '#d1fae5' : '#fee2e2' }
                    ]}>
                      <Text style={[
                        styles.stockText,
                        { color: item.stock > item.minStock ? '#065f46' : '#991b1b' }
                      ]}>
                        {item.stock}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.productDetails}>
                    <View style={styles.priceRow}>
                      <Text variant="bodySmall">Precio:</Text>
                      <Text variant="bodySmall" style={styles.bold}>
                        ${formatPrice(item.price)}
                      </Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text variant="bodySmall">Mín. Stock:</Text>
                      <Text variant="bodySmall">{item.minStock}</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text variant="bodySmall">Total:</Text>
                      <Text variant="bodySmall" style={styles.bold}>
                        ${formatPrice((item.stock || 0) * Number(item.price || 0))}
                      </Text>
                    </View>
                  </View>

                  {item.stock <= item.minStock && (
                    <Chip
                      icon="alert-circle"
                      style={styles.alertChip}
                      textStyle={styles.alertChipText}
                    >
                      Bajo Stock
                    </Chip>
                  )}

                  <Button
                    mode="contained"
                    onPress={() => {
                      setSelectedProduct(item);
                      setAdjustQuantity(String(item.stock));
                      setShowAdjustModal(true);
                    }}
                    style={styles.adjustButton}
                    icon="pencil"
                  >
                    Ajustar Stock
                  </Button>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <Button
                      mode="outlined"
                      onPress={() => openEditModal(item)}
                      style={{ flex: 1 }}
                      icon="pencil"
                    >
                      Editar
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setSelectedProduct(item);
                        setShowDeleteDialog(true);
                      }}
                      style={{ flex: 1 }}
                      icon="trash-can-outline"
                      textColor="#ef4444"
                    >
                      Eliminar
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            )}
          />
        )}
      </ScrollView>

      {/* Modal de ajuste de stock */}
      <Portal>
        <Dialog visible={showAdjustModal} onDismiss={() => setShowAdjustModal(false)}>
          <Dialog.Title>Ajustar Stock</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              {selectedProduct?.name}
            </Text>
            
            <TextInput
              label="Nueva cantidad"
              value={adjustQuantity}
              onChangeText={setAdjustQuantity}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Razón (opcional)"
              value={adjustReason}
              onChangeText={setAdjustReason}
              placeholder="Ej: Reconteo, Pérdida, Compra"
              style={styles.input}
              mode="outlined"
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setShowAdjustModal(false)}>
              Cancelar
            </Button>
            <Button 
              onPress={handleAdjustStock}
              loading={isAdjusting}
              disabled={isAdjusting}
            >
              Guardar
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Modal de crear/editar producto */}
        <Dialog visible={showFormModal} onDismiss={() => setShowFormModal(false)}>
          <Dialog.Title>{isEditMode ? 'Editar Producto' : 'Crear Producto'}</Dialog.Title>
          <Dialog.Content>
            <ScrollView 
              style={styles.formScrollView}
              keyboardShouldPersistTaps="handled"
            >
              <TextInput
                label="Nombre *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                style={styles.input}
                mode="outlined"
                disabled={isProcessing}
              />

              <TextInput
                label="Descripción"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                style={styles.input}
                mode="outlined"
                disabled={isProcessing}
              />

              <TextInput
                label="Categoría *"
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
                style={styles.input}
                mode="outlined"
                disabled={isProcessing}
              />

              <TextInput
                label="Precio *"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="decimal-pad"
                style={styles.input}
                mode="outlined"
                disabled={isProcessing}
              />

              <TextInput
                label="Costo"
                value={formData.cost}
                onChangeText={(text) => setFormData({ ...formData, cost: text })}
                keyboardType="decimal-pad"
                style={styles.input}
                mode="outlined"
                disabled={isProcessing}
              />

              <TextInput
                label="Stock"
                value={formData.stock}
                onChangeText={(text) => setFormData({ ...formData, stock: text })}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                disabled={isProcessing}
              />

              <TextInput
                label="Stock Mínimo"
                value={formData.minStock}
                onChangeText={(text) => setFormData({ ...formData, minStock: text })}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                disabled={isProcessing}
              />

              <TextInput
                label="Código de Barras"
                value={formData.barcode}
                onChangeText={(text) => setFormData({ ...formData, barcode: text })}
                style={styles.input}
                mode="outlined"
                disabled={isProcessing}
              />

              <TextInput
                label="Emoji"
                value={formData.emoji}
                onChangeText={(text) => setFormData({ ...formData, emoji: text })}
                style={styles.input}
                mode="outlined"
                disabled={isProcessing}
                maxLength={2}
              />
            </ScrollView>
          </Dialog.Content>

          <Dialog.Actions>
            <Button 
              onPress={() => setShowFormModal(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onPress={handleSaveProduct}
              loading={isProcessing}
              disabled={isProcessing}
            >
              {isEditMode ? 'Actualizar' : 'Crear'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Dialog de confirmación de eliminar */}
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Eliminar Producto</Dialog.Title>
          <Dialog.Content>
            <Text>¿Estás seguro de que quieres eliminar "{selectedProduct?.name}"?</Text>
            <Text style={styles.warningText}>Esta acción no se puede deshacer.</Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onPress={handleDeleteProduct}
              loading={isProcessing}
              disabled={isProcessing}
              textColor="#ef4444"
            >
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* FAB para crear nuevo producto */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openCreateModal}
        label="Producto"
      />
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
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabButton: {
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
  productCard: {
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  category: {
    marginTop: 4,
    color: '#6b7280',
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  stockText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productDetails: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  alertChip: {
    marginBottom: 12,
    backgroundColor: '#fee2e2',
  },
  alertChipText: {
    color: '#991b1b',
  },
  adjustButton: {
    marginTop: 8,
  },
  dialogText: {
    marginBottom: 16,
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    marginBottom: 12,
  },
  warningText: {
    marginTop: 8,
    color: '#9ca3af',
    fontStyle: 'italic',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  formScrollView: {
    maxHeight: 400,
  },
});
