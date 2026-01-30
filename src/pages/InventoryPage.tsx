import { useState } from 'react';
import { ChevronLeft, ChevronRight, Package, Edit, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Product {
  id: string;
  name: string;
  description: string;
  image?: string;
  quantity: number;
  price: number;
  category?: string;
  emoji?: string;
}

export default function InventoryPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const itemsPerPage = 3;
  
  // Productos de ejemplo - esto debería venir de una base de datos
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Paleta de Fresa',
      description: 'Deliciosa paleta de agua sabor fresa',
      emoji: '🍓',
      quantity: 50,
      price: 15,
      category: 'Paletas'
    },
    {
      id: '2',
      name: 'Paleta de Mango',
      description: 'Refrescante paleta de mango natural',
      emoji: '🥭',
      quantity: 45,
      price: 15,
      category: 'Paletas'
    },
    {
      id: '3',
      name: 'Paleta de Limón',
      description: 'Paleta de limón con chile',
      emoji: '🍋',
      quantity: 40,
      price: 15,
      category: 'Paletas'
    },
    {
      id: '4',
      name: 'Helado de Vainilla',
      description: 'Cremoso helado de vainilla',
      emoji: '🍦',
      quantity: 30,
      price: 25,
      category: 'Helados'
    },
    {
      id: '5',
      name: 'Helado de Chocolate',
      description: 'Delicioso helado de chocolate',
      emoji: '🍫',
      quantity: 28,
      price: 25,
      category: 'Helados'
    },
    {
      id: '6',
      name: 'Helado de Napolitano',
      description: 'Tres sabores en uno',
      emoji: '🍨',
      quantity: 25,
      price: 30,
      category: 'Helados'
    },
    {
      id: '7',
      name: 'Raspado',
      description: 'Raspado de hielo con jarabe',
      emoji: '🧊',
      quantity: 35,
      price: 20,
      category: 'Raspados'
    },
    {
      id: '8',
      name: 'Agua Fresca',
      description: 'Agua fresca del día',
      emoji: '🥤',
      quantity: 20,
      price: 18,
      category: 'Bebidas'
    },
  ]);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    emoji: '',
    image: '',
    quantity: 0,
    price: 0,
    category: ''
  });

  const [editFormData, setEditFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    emoji: '',
    image: '',
    quantity: 0,
    price: 0,
    category: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string, emoji: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData({ ...editFormData, image: reader.result as string, emoji: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: '' });
  };

  const removeEditImage = () => {
    setEditFormData({ ...editFormData, image: '' });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Crear nuevo producto
    const newProduct: Product = {
      id: Date.now().toString(),
      name: formData.name || '',
      description: formData.description || '',
      emoji: formData.emoji,
      image: formData.image,
      quantity: formData.quantity || 0,
      price: formData.price || 0,
      category: formData.category
    };
    setProducts([...products, newProduct]);
    
    // Resetear formulario
    setFormData({
      name: '',
      description: '',
      emoji: '',
      image: '',
      quantity: 0,
      price: 0,
      category: ''
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      // Editar producto existente
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...p, ...editFormData } as Product
          : p
      ));
      setShowEditModal(false);
      setEditingProduct(null);
      setEditFormData({
        name: '',
        description: '',
        emoji: '',
        image: '',
        quantity: 0,
        price: 0,
        category: ''
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditFormData(product);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== id));
      // Ajustar el índice si es necesario
      const newProductsLength = products.length - 1;
      const maxIndex = Math.ceil(newProductsLength / itemsPerPage) - 1;
      if (currentIndex > maxIndex && maxIndex >= 0) {
        setCurrentIndex(maxIndex);
      }
    }
  };

  const startIndex = currentIndex * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Package className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
            <p className="text-gray-600">Gestiona tus productos</p>
          </div>
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
                          <img 
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
                        value={editFormData.name}
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
                        value={editFormData.category}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Ej: Paletas, Helados"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Cantidad en Stock *</label>
                      <input
                        type="number"
                        value={editFormData.quantity}
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
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="md:col-span-2 flex gap-3 justify-end pt-4 border-t">
                      <Button
                        type="button"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingProduct(null);
                        }}
                        className="bg-gray-500 hover:bg-gray-600 px-6"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="px-6">
                        Guardar Cambios
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
                      <img 
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
                    value={formData.name}
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
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ej: Paletas, Helados"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cantidad en Stock *</label>
                  <input
                    type="number"
                    value={formData.quantity}
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
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

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
                        category: ''
                      });
                      setEditingProduct(null);
                    }}
                    className="bg-gray-500 hover:bg-gray-600 px-6"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="px-6">
                    Agregar Producto
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Card>

        {/* Carrusel de Productos */}
        {products.length > 0 ? (
          <>
            <div className="relative mb-8">
              <Card className="p-8 shadow-2xl">
                {/* Controles del carrusel */}
                <div className="flex items-center justify-between mb-6">
                  <Button
                    type="button"
                    onClick={prevProduct}
                    className="rounded-full w-12 h-12 flex items-center justify-center shrink-0"
                    disabled={products.length <= itemsPerPage}
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
                    disabled={products.length <= itemsPerPage}
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
                          <img 
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
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                          {product.name}
                        </h3>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Stock</p>
                            <p className="text-lg font-bold text-green-600">
                              {product.quantity}
                            </p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Precio</p>
                            <p className="text-lg font-bold text-blue-600">
                              ${product.price.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {product.quantity < 10 && (
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
                            className="flex-1 bg-red-500 hover:bg-red-600 text-sm py-2"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Eliminar
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
                    {products.map((product, index) => (
                      <tr 
                        key={product.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="text-3xl">{product.emoji || '📦'}</div>
                            )}
                            <div className="font-semibold text-gray-800">{product.name}</div>
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-3 py-2 rounded-lg font-bold ${
                            product.quantity < 10 
                              ? 'bg-red-100 text-red-600' 
                              : product.quantity < 30
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {product.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-lg font-bold text-blue-600">
                            ${product.price.toFixed(2)}
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
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
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
                    <strong>{products.reduce((sum, p) => sum + p.quantity, 0)}</strong> unidades en stock
                  </span>
                  <span className="text-gray-600">
                    Valor total: <strong className="text-blue-600">
                      ${products.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)}
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
