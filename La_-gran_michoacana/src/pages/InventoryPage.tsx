import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Package, Edit, Trash2, Upload, X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { productService, Product } from '@/lib/productService';
import { branchService } from '@/lib/branchService';
import { localImageService } from '@/lib/localImageService';
import { LocalImage } from '@/components/LocalImage';
import { useAuthStore } from '@/stores/authStore';
import type { Branch } from '@/types/branch';

export default function InventoryPage() {
  const user = useAuthStore((state) => state.user);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editImageChanged, setEditImageChanged] = useState(false);  // Rastrear si la imagen fue cambiada
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  // Si no es ADMIN, usar automáticamente la sucursal del usuario
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(
    user?.role !== 'ADMIN' ? user?.branchId ?? undefined : undefined
  );
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const itemsPerPage = 3;

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    emoji: '',
    image: '',
    quantity: 0,
    price: 0,
    category: '',
    branchId: user?.role !== 'ADMIN' ? (user?.branchId ?? undefined) : undefined
  });

  const [editFormData, setEditFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    image: '',
    quantity: 0,
    price: 0,
    category: '',
    branchId: undefined
  });

  // Actualizar selectedBranchId cuando el usuario cambie (si no es ADMIN)
  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.branchId) {
      setSelectedBranchId(user.branchId);
      // Actualizar formData con branchId del usuario
      setFormData(prev => ({
        ...prev,
        branchId: user.branchId ?? undefined
      }));
    }
  }, [user?.branchId, user?.role]);

  // Cargar productos del backend
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const branchIdParam = selectedBranchId ? `?branchId=${selectedBranchId}` : '';
        const data = await productService.getAllProducts(branchIdParam);
        // Asegurarse de que data es siempre un array
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setProducts([]); // Establecer array vacío en caso de error
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedBranchId]);

  // Cargar sucursales si es admin
  useEffect(() => {
    const loadBranches = async () => {
      if (user?.role === 'ADMIN') {
        try {
          const data = await branchService.getBranches({ active: true });
          setBranches(data);
        } catch (err) {
          // Error al cargar sucursales
        }
      }
    };

    loadBranches();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Convertir a Base64 temporalmente para guardarlo
        const reader = new FileReader();
        reader.onloadend = async () => {
          const imageData = reader.result as string;
          
          // Guardar imagen localmente y obtener la ruta
          const result = await localImageService.saveImage(imageData);
          
          if (result.success && result.path) {
            // Guardar solo la ruta relativa en el formulario
            setFormData((prev) => ({ ...prev, image: result.path, emoji: '' }));
          } else {
            alert('Error al guardar la imagen: ' + (result.error || 'Error desconocido'));
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        alert('Error al procesar la imagen');
      }
    }
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Convertir a Base64 temporalmente para guardarlo
        const reader = new FileReader();
        reader.onloadend = async () => {
          const imageData = reader.result as string;
          
          // Guardar imagen localmente y obtener la ruta
          const result = await localImageService.saveImage(imageData);
          
          if (result.success && result.path) {
            // Guardar solo la ruta relativa en el formulario
            setEditFormData((prev) => ({ ...prev, image: result.path, emoji: '' }));
            setEditImageChanged(true);  // Marcar que la imagen ha sido cambiada por el usuario
          } else {
            alert('Error al guardar la imagen: ' + (result.error || 'Error desconocido'));
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        alert('Error al procesar la imagen');
      }
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: '' }));
  };

  const removeEditImage = () => {
    setEditFormData((prev) => ({ ...prev, image: '' }));
    setEditImageChanged(true);  // Marcar que la imagen ha sido modificada
  };

  const nextProduct = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.ceil(products.length / itemsPerPage) - 1;
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const prevProduct = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.ceil(products.length / itemsPerPage) - 1;
      return prev <= 0 ? maxIndex : prev - 1;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      alert('Por favor completa el nombre y precio del producto');
      return;
    }

    // Validar que tenga branchId
    const branchIdToUse = user?.role === 'ADMIN' 
      ? formData.branchId 
      : user?.branchId;
    
    if (!branchIdToUse) {
      alert('Por favor selecciona una sucursal para el producto');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Preparar datos del producto
      const quantity = Number(formData.quantity) || 0;
      
      // Crear producto en el backend
      const newProduct = await productService.createProduct({
        name: formData.name,
        description: formData.description || '',
        price: Number(formData.price),
        quantity: quantity,
        category: formData.category,
        image: formData.image, // Solo la ruta relativa
        branchId: branchIdToUse
      });

      // Manejar diferentes estructuras de respuesta
      let product = newProduct;
      if ((newProduct as any).product) {
        product = (newProduct as any).product;
      }
      
      // Validar que el producto tenga datos mínimos
      if (!product || !product.name) {
        alert('Error: El producto no tiene datos válidos. Por favor revisa la consola.');
        return;
      }
      
      // Usar el id del producto, o generar uno si es necesario
      const productId = product.id || Date.now();
      
      // Normalizar el producto recibido del servidor
      const normalizedProduct: Product = {
        id: productId,
        name: product.name || 'Producto sin nombre',
        description: product.description || '',
        price: typeof product.price === 'string' ? Number(product.price) : (product.price ?? 0),
        quantity: typeof product.quantity === 'string' ? Number(product.quantity) : (product.quantity ?? 0),
        category: product.category || '',
        image: product.image || '',
      };
      
      // Agregar el producto a la lista local
      const updatedProducts = [...(Array.isArray(products) ? products : []), normalizedProduct];
      setProducts(updatedProducts);
      
      // Resetear formulario
      setFormData({
        name: '',
        description: '',
        emoji: '',
        image: '',
        quantity: 0,
        price: 0,
        category: '',
        branchId: user?.role !== 'ADMIN' ? (user?.branchId ?? undefined) : undefined
      });

      alert('✅ Producto creado exitosamente');

    } catch (err: any) {
      const errorMessage = err?.message || 'Error al crear el producto';
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct || !editFormData.name || !editFormData.price) {
      alert('Por favor completa el nombre y precio del producto');
      return;
    }

    // Validar que tenga branchId
    const branchIdToUse = user?.role === 'ADMIN' 
      ? editFormData.branchId 
      : (editingProduct.branchId || user?.branchId);
    
    if (!branchIdToUse) {
      alert('Por favor selecciona una sucursal para el producto');
      return;
    }

    try {
      setIsSubmitting(true);

      // Preparar datos del producto
      const quantity = Number(editFormData.quantity) || 0;
      
      // Construir payload
      const payload: any = {
        name: editFormData.name,
        description: editFormData.description || '',
        price: Number(editFormData.price),
        quantity: quantity,
        category: editFormData.category,
        branchId: branchIdToUse
      };
      
      // Solo agregar imagen si el usuario la cambió
      if (editImageChanged) {
        payload.image = editFormData.image || '';
        
        // Si borró la imagen anterior (y había una), eliminarla del sistema
        if (editingProduct.image && !editFormData.image) {
          await localImageService.deleteImage(editingProduct.image);
        }
      }

      // Actualizar producto en el backend
      const updatedProduct = await productService.updateProduct(editingProduct.id, payload);

      // Actualizar la lista local
      setProducts((Array.isArray(products) ? products : []).map(p => 
        p.id === editingProduct.id 
          ? updatedProduct
          : p
      ));

      // RESETEAR TODO ANTES DE CERRAR MODAL
      setEditFormData({
        name: '',
        description: '',
        emoji: '',
        image: '',
        quantity: 0,
        price: 0,
        category: '',
        branchId: undefined
      });
      setEditingProduct(null);
      setEditImageChanged(false);
      setShowEditModal(false);  // Cerrar modal ÚLTIMO
      
      alert('✅ Producto actualizado exitosamente');
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al actualizar el producto';
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
      // Asegurar que el estado se limpia completamente
      if (!showEditModal) {
        setEditingProduct(null);
        setEditImageChanged(false);
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditFormData(product);
    setEditImageChanged(false);  // Reiniciar el estado de imagen
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        setIsSubmitting(true);
        
        // Encontrar el producto para obtener la ruta de la imagen
        const productToDelete = (Array.isArray(products) ? products : []).find(p => p.id === id);
        
        // Eliminar imagen local si existe
        if (productToDelete?.image) {
          await localImageService.deleteImage(productToDelete.image);
        }
        
        // Eliminar del backend
        await productService.deleteProduct(id);
        
        // Eliminar de la lista local
        setProducts((Array.isArray(products) ? products : []).filter(p => p.id !== id));
        
        // Ajustar el índice si es necesario
        const newProductsLength = (Array.isArray(products) ? products : []).length - 1;
        const maxIndex = Math.ceil(newProductsLength / itemsPerPage) - 1;
        if (currentIndex > maxIndex && maxIndex >= 0) {
          setCurrentIndex(maxIndex);
        }

        alert('✅ Producto eliminado exitosamente');
      } catch (err) {
        alert('Error al eliminar el producto');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Asegurar que products es siempre un array
  const safeProducts = Array.isArray(products) ? products : [];
  // Filtrar productos válidos (con id)
  const validProducts = safeProducts.filter(p => p && p.id);
  const getBranchName = (branchId?: number) => {
    if (!branchId) return 'Sin sucursal';
    return branches.find((branch) => branch.id === branchId)?.name || 'Sin sucursal';
  };
  const startIndex = currentIndex * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = validProducts.slice(startIndex, endIndex);
  const totalPages = validProducts.length > 0 ? Math.ceil(validProducts.length / itemsPerPage) : 0;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
              <p className="text-gray-600">Gestiona tus productos</p>
            </div>
          </div>

          {/* Selector de sucursal para admin */}
          {user?.role === 'ADMIN' && branches.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Sucursal:</label>
              <select
                value={selectedBranchId || ''}
                onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : undefined)}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Todas las sucursales</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Modal de edición */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-primary to-purple-600 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Editar Producto</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                    setEditImageChanged(false);  // Resetear el estado de imagen
                  }}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Columna 1: Imagen */}
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium mb-2">Imagen del Producto</label>
                    <div className="space-y-3">
                      {editFormData.image ? (
                        <div className="relative inline-block w-full">
                          <LocalImage
                            src={editFormData.image} 
                            alt="Preview" 
                            className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={removeEditImage}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center py-6">
                            <Upload className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="text-sm text-gray-600 font-medium">
                              Click para subir imagen
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG (MAX. 5MB)</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleEditImageUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Columna 2 y 3: Información del producto */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nombre del Producto *</label>
                      <input
                        type="text"
                        value={editFormData.name ?? ''}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Ej: Paleta de Fresa"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Categoría</label>
                      <input
                        type="text"
                        value={editFormData.category ?? ''}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Ej: Paletas, Helados"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Cantidad en Stock *</label>
                      <input
                        type="number"
                        value={editFormData.quantity ?? 0}
                        onChange={(e) => setEditFormData({ ...editFormData, quantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Precio de Venta ($) *</label>
                      <input
                        type="number"
                        value={editFormData.price ?? 0}
                        onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    {/* Selector de sucursal - Solo visible para ADMIN */}
                    {user?.role === 'ADMIN' && branches.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Sucursal *</label>
                        <select
                          value={editFormData.branchId || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, branchId: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        >
                          <option value="">Selecciona una sucursal</option>
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="md:col-span-2 flex gap-3 justify-end pt-4 border-t">
                      <Button
                        type="button"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingProduct(null);
                          setEditImageChanged(false);  // Resetear el estado de imagen
                        }}
                        className="bg-gray-500 hover:bg-gray-600 px-6"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="px-6" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          'Guardar Cambios'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Formulario para agregar/editar producto */}
        <Card className="p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-bold mb-6">
            Nuevo Producto
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna 1: Imagen */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium mb-2">Imagen del Producto</label>
                <div className="space-y-3">
                  {formData.image ? (
                    <div className="relative inline-block w-full">
                      <LocalImage
                        src={formData.image} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center py-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="text-sm text-gray-600 font-medium">
                          Click para subir imagen
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Columna 2 y 3: Información del producto */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del Producto *</label>
                  <input
                    type="text"
                    value={formData.name ?? ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ej: Paleta de Fresa"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Categoría</label>
                  <input
                    type="text"
                    value={formData.category ?? ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ej: Paletas, Helados"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cantidad en Stock *</label>
                  <input
                    type="number"
                    value={formData.quantity ?? 0}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Precio de Venta ($) *</label>
                  <input
                    type="number"
                    value={formData.price ?? 0}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {/* Selector de sucursal - Solo visible para ADMIN */}
                {user?.role === 'ADMIN' && branches.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Sucursal *</label>
                    <select
                      value={formData.branchId || ''}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    >
                      <option value="">Selecciona una sucursal</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="md:col-span-2 flex gap-3 justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setFormData({
                        name: '',
                        description: '',
                        emoji: '',
                        image: '',
                        quantity: 0,
                        price: 0,
                        category: '',
                        branchId: user?.role !== 'ADMIN' ? (user?.branchId ?? undefined) : undefined
                      });
                      setEditingProduct(null);
                    }}
                    className="bg-gray-500 hover:bg-gray-600 px-6"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="px-6" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Agregar Producto'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Card>

        {/* Carrusel de Productos */}
        {Array.isArray(products) && products.length > 0 ? (
          <>
            <div className="relative mb-8">
              <Card className="p-8 shadow-2xl">
                {/* Controles del carrusel */}
                <div className="flex items-center justify-between mb-6">
                  <Button
                    type="button"
                    onClick={prevProduct}
                    className="rounded-full w-12 h-12 flex items-center justify-center shrink-0"
                    disabled={validProducts.length <= itemsPerPage}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  
                  <div className="text-center">
                    <span className="text-sm text-gray-500">
                      Página {currentIndex + 1} de {totalPages}
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={nextProduct}
                    className="rounded-full w-12 h-12 flex items-center justify-center shrink-0"
                    disabled={validProducts.length <= itemsPerPage}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </div>

                {/* Vista de productos en carrusel (3 a la vez) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {currentProducts.map((product) => (
                    <Card key={product.id} className="p-6 hover:shadow-xl transition-shadow">
                      {/* Imagen/Emoji del producto */}
                      <div className="flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-100 rounded-xl p-8 mb-4">
                        {product.image ? (
                          <LocalImage
                            src={product.image} 
                            alt={product.name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        ) : product.emoji ? (
                          <div className="text-6xl">{product.emoji}</div>
                        ) : (
                          <Package className="w-24 h-24 text-gray-300" />
                        )}
                      </div>

                      {/* Información del producto */}
                      <div>
                        {product.category && (
                          <span className="inline-block px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium mb-2">
                            {product.category}
                          </span>
                        )}
                        {user?.role === 'ADMIN' && (
                          <div className="text-xs text-gray-500 mb-2">
                            Sucursal: {getBranchName(product.branchId)}
                          </div>
                        )}
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                          {product.name || 'Producto sin nombre'}
                        </h3>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Stock</p>
                            <p className="text-lg font-bold text-green-600">
                              {product.quantity || 0}
                            </p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Precio</p>
                            <p className="text-lg font-bold text-blue-600">
                              ${Number(product.price || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {(product.quantity || 0) < 10 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                            <p className="text-red-600 text-xs font-medium">
                              ⚠️ Stock bajo
                            </p>
                          </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-sm py-2"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            disabled={isSubmitting}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-sm py-2 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {isSubmitting ? 'Eliminando...' : 'Eliminar'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Indicadores del carrusel */}
                <div className="flex justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentIndex
                          ? 'bg-primary w-8'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </Card>
            </div>

            {/* Lista completa de productos */}
            <Card className="shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-purple-600 p-6">
                <h2 className="text-2xl font-bold text-white">Lista Completa de Productos</h2>
                <p className="text-white/80 text-sm">Todos los productos del inventario</p>
              </div>
              
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(Array.isArray(products) ? products : []).map((product, index) => (
                      <tr 
                        key={product.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <LocalImage
                                src={product.image} 
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="text-3xl">{product.emoji || '📦'}</div>
                            )}
                            <div className="font-semibold text-gray-800">{product.name || 'Producto sin nombre'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.category ? (
                            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                              {product.category}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">Sin categoría</span>
                          )}
                          {user?.role === 'ADMIN' && (
                            <div className="text-xs text-gray-500 mt-1">
                              Sucursal: {getBranchName(product.branchId)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-3 py-2 rounded-lg font-bold ${
                            (product.quantity || 0) < 10 
                              ? 'bg-red-100 text-red-600' 
                              : (product.quantity || 0) < 30
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {product.quantity || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-lg font-bold text-blue-600">
                            ${Number(product.price || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={() => handleEdit(product)}
                              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(product.id)}
                              disabled={isSubmitting}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Resumen */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    <strong>{products.length}</strong> productos en total
                  </span>
                  <span className="text-gray-600">
                    <strong>{(Array.isArray(products) ? products : []).reduce((sum, p) => sum + (Number(p.quantity) || 0), 0)}</strong> unidades en stock
                  </span>
                  <span className="text-gray-600">
                    Valor total: <strong className="text-blue-600">
                      ${(Array.isArray(products) ? products : []).reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.quantity) || 0)), 0).toFixed(2)}
                    </strong>
                  </span>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <Card className="p-12 text-center">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No hay productos en el inventario
            </h3>
            <p className="text-gray-500">
              Comienza agregando tu primer producto usando el formulario de arriba
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
