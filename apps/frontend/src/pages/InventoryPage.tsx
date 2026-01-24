import { useState } from 'react';
import { Upload, X, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  registrationDate: string;
  sucursal: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'Paleta Michoacana',
      price: 45.0,
      image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=300&fit=crop',
      registrationDate: '2026-01-20',
      sucursal: 'Centro',
    },
    {
      id: 2,
      name: 'Helado de Vainilla',
      price: 35.0,
      image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=300&fit=crop',
      registrationDate: '2026-01-21',
      sucursal: 'Norte',
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    sucursal: '',
    image: null as File | null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [carouselIndex, setCarouselIndex] = useState(0);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.sucursal || !imagePreview) {
      alert('Por favor completa todos los campos');
      return;
    }

    const newProduct: Product = {
      id: products.length + 1,
      name: formData.name,
      price: parseFloat(formData.price),
      image: imagePreview,
      registrationDate: new Date().toISOString().split('T')[0],
      sucursal: formData.sucursal,
    };

    setProducts([newProduct, ...products]);
    setFormData({ name: '', price: '', sucursal: '', image: null });
    setImagePreview(null);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
  };

  const handleDeleteProduct = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
    // Ajusta el índice del carrusel si es necesario
    if (carouselIndex >= products.length - 1) {
      setCarouselIndex(Math.max(0, carouselIndex - 1));
    }
  };

  const handlePrevSlide = () => {
    setCarouselIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCarouselIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
        <p className="text-gray-600 mt-2">Gestión de productos</p>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Agregar Nuevo Producto</h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Image Upload */}
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="sr-only">Cargar imagen</span>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">Clic para cargar imagen</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </label>
          </div>

          {/* Middle - Form Fields */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Paleta Michoacana"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de Venta
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sucursal
              </label>
              <select
                value={formData.sucursal}
                onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona una sucursal</option>
                <option value="Centro">Centro</option>
                <option value="Norte">Norte</option>
                <option value="Sur">Sur</option>
                <option value="Oriente">Oriente</option>
              </select>
            </div>
          </div>

          {/* Right - Submit Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Agregar Producto
            </button>
          </div>
        </form>
      </div>

      {/* Products Carousel */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Productos Registrados</h2>
        {products.length > 0 ? (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-center gap-4">
              {/* Previous Button */}
              <button
                onClick={handlePrevSlide}
                className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition flex-shrink-0"
                title="Anterior"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>

              {/* Carousel Content - 3 Products */}
              <div className="flex-1 overflow-hidden">
                <div className="flex gap-4 justify-center">
                  {[0, 1, 2].map((offset) => {
                    const index = (carouselIndex + offset) % products.length;
                    const product = products[index];
                    return (
                      <div key={offset} className="flex-1 max-w-xs">
                        <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-60 object-cover"
                          />
                        </div>
                        <div className="mt-4 text-center">
                          <h3 className="text-lg font-bold text-gray-800 truncate">{product.name}</h3>
                          <p className="text-2xl font-bold text-blue-600 mt-2">
                            {formatCurrency(product.price)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{product.sucursal}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next Button */}
              <button
                onClick={handleNextSlide}
                className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition flex-shrink-0"
                title="Siguiente"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCarouselIndex(index)}
                  className={`w-3 h-3 rounded-full transition ${
                    index === carouselIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  title={`Ir al producto ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
            <p>No hay productos registrados. Agrega tu primer producto arriba.</p>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Detalle de Productos</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Imagen</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Nombre</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Precio</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Sucursal</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Fecha Registro</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">{product.name}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{product.sucursal}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{product.registrationDate}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        className="text-blue-500 hover:text-blue-700 transition"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-500 hover:text-red-700 transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
