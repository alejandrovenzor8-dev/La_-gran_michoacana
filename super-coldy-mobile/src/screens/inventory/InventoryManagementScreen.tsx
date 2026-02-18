import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  Modal,
  TextInput as RNTextInput,
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

export default function InventoryManagementScreen() {
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

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
      await inventoryService.adjustStock(selectedProduct.id, {
        newQuantity: parseInt(adjustQuantity),
        reason: adjustReason || undefined,
      });
      
      setShowAdjustModal(false);
      setAdjustQuantity('');
      setAdjustReason('');
      setSelectedProduct(null);
      loadData();
      alert('Stock ajustado exitosamente');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error al ajustar el stock');
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const isLowStock = item.stock <= item.minStock;
    const isOutOfStock = item.stock === 0;

    return (
      <Card style={[styles.productCard, { marginBottom: 8 }]} elevation={1}>
        <Card.Content>
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Text variant="titleSmall" style={styles.productName} numberOfLines={2}>
                {item.emoji} {item.name}
              </Text>
              <Text variant="bodySmall" style={styles.productCategory}>
                {item.category}
              </Text>
              {item.barcode && (
                <Text variant="labelSmall" style={styles.barcode}>
                  {item.barcode}
                </Text>
              )}
            </View>
            <View style={styles.priceSection}>
              <Text variant="labelSmall" style={styles.priceLabel}>
                PRECIO
              </Text>
              <Text variant="titleSmall" style={styles.price}>
                ${formatPrice(item.price)}
              </Text>
            </View>
          </View>

          <View style={styles.stockSection}>
            <View style={styles.stockInfo}>
              <Text variant="labelSmall" style={styles.stockLabel}>
                STOCK ACTUAL
              </Text>
              <View style={styles.stockValue}>
                <Text
                  variant="headlineSmall"
                  style={[
                    styles.stock,
                    isOutOfStock && { color: '#ef4444' },
                    isLowStock && !isOutOfStock && { color: '#f59e0b' },
                  ]}
                >
                  {item.stock}
                </Text>
                <Text variant="labelSmall" style={styles.unit}>
                  unidades
                </Text>
              </View>
            </View>

            <View style={styles.minStockInfo}>
              <Text variant="labelSmall" style={styles.minStockLabel}>
                MÍNIMO
              </Text>
              <Text variant="titleSmall" style={styles.minStock}>
                {item.minStock}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                size="small"
                onPress={() => {
                  setSelectedProduct(item);
                  setShowAdjustModal(true);
                }}
                icon="pencil"
              >
                Ajustar
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Buscar por nombre o código..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Button
            mode={selectedTab === 'all' ? 'contained' : 'outlined'}
            onPress={() => setSelectedTab('all')}
            style={styles.tab}
            icon="package-variant"
          >
            Todos ({products.length})
          </Button>
          <Button
            mode={selectedTab === 'lowStock' ? 'contained' : 'outlined'}
            onPress={() => setSelectedTab('lowStock')}
            style={styles.tab}
            icon="alert-circle"
          >
            Bajo Stock ({lowStockProducts.length})
          </Button>
        </View>

        {/* Productos */}
        <View style={styles.listContainer}>
          {filteredProducts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <View style={styles.emptyContent}>
                  <MaterialCommunityIcons
                    name="package-off"
                    size={48}
                    color={theme.colors.outline}
                  />
                  <Text variant="bodyLarge" style={styles.emptyText}>
                    {searchQuery ? 'No se encontraron productos' : 'Sin productos'}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderProductItem}
              scrollEnabled={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal de ajuste */}
      <Portal>
        <Dialog
          visible={showAdjustModal}
          onDismiss={() => {
            setShowAdjustModal(false);
            setSelectedProduct(null);
          }}
        >
          <Dialog.Title>Ajustar Stock: {selectedProduct?.name}</Dialog.Title>
          <Dialog.Content>
            <Text variant="labelSmall" style={styles.currentStockText}>
              Stock actual: {selectedProduct?.stock} unidades
            </Text>
            
            <TextInput
              label="Nuevo Stock"
              value={adjustQuantity}
              onChangeText={setAdjustQuantity}
              keyboardType="numeric"
              style={styles.input}
              placeholder="Ingresa la cantidad"
            />
            
            <TextInput
              label="Razón (opcional)"
              value={adjustReason}
              onChangeText={setAdjustReason}
              placeh="Motivo del ajuste"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAdjustModal(false)}>Cancelar</Button>
            <Button onPress={handleAdjustStock} mode="contained">
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  productCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productCategory: {
    color: '#6b7280',
    marginBottom: 4,
  },
  barcode: {
    color: '#9ca3af',
  },
  priceSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceLabel: {
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  price: {
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 4,
  },
  stockSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  stockInfo: {
    alignItems: 'center',
  },
  stockLabel: {
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  stockValue: {
    alignItems: 'center',
  },
  stock: {
    fontWeight: 'bold',
    color: '#2563eb',
  },
  unit: {
    color: '#9ca3af',
    marginTop: 2,
  },
  minStockInfo: {
    alignItems: 'center',
  },
  minStockLabel: {
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  minStock: {
    fontWeight: 'bold',
  },
  actionButtons: {
    marginLeft: 'auto',
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
  currentStockText: {
    marginBottom: 16,
    color: '#6b7280',
  },
  input: {
    marginBottom: 12,
  },
});
