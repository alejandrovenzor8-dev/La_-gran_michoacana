import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Plus, Edit2, Loader2, X, Power } from 'lucide-react';
import { branchService } from '@/lib/branchService';
import { Branch, BranchCreateInput } from '@/types/branch';

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
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
      setLoading(true);
      setError('');
      const branchesData = await branchService.getBranches();
      setBranches(branchesData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las sucursales. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setShowForm(true);
    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      active: branch.active,
    });
    setError('');
    setSuccess('');
    
    // Scroll al formulario
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Limpiar formulario
      setFormData({
        name: '',
        address: '',
        phone: '',
        active: true,
      });
      setShowForm(false);
      setEditingId(null);
      
      // Recargar lista después de guardar
      await loadBranches();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la sucursal. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    if (!confirm(`¿Estás seguro que deseas ${currentStatus ? 'desactivar' : 'activar'} esta sucursal?`)) {
      return;
    }

    try {
      setError('');
      await branchService.toggleBranchStatus(id, !currentStatus);
      setSuccess(`Sucursal ${!currentStatus ? 'activada' : 'desactivada'} exitosamente.`);
      await loadBranches();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar el estado. Intenta de nuevo.');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Sucursales</h1>
            <p className="text-gray-600 text-sm mt-1">Administra las sucursales del sistema</p>
          </div>
        </div>
        <Button
          onClick={() => {
            if (showForm || editingId) {
              // Cancelar formulario
              handleCancelEdit();
            } else {
              // Mostrar formulario nuevo
              setShowForm(true);
              setEditingId(null);
              setFormData({
                name: '',
                address: '',
                phone: '',
                active: true,
              });
              setError('');
              setSuccess('');
            }
          }}
          className="flex items-center gap-2"
        >
          {(showForm || editingId) ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Nueva Sucursal
            </>
          )}
        </Button>
      </div>

      {/* Mensajes de éxito y error */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-md">
          {error}
        </div>
      )}

      {/* Formulario de crear/editar sucursal */}
      {(showForm || editingId) && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Ej: Sucursal Centro"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Ej: 555-0100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Ej: Av. Principal #123, Col. Centro"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  onClick={handleCancelEdit}
                  variant="outline"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>{editingId ? 'Actualizar' : 'Crear'} Sucursal</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de sucursales */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Sucursales Registradas</h2>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay sucursales registradas. Crea la primera sucursal usando el botón de arriba.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Dirección</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Teléfono</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Usuarios</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Ventas</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Estado</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => (
                    <tr key={branch.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{branch.name}</td>
                      <td className="py-3 px-4 text-gray-600">{branch.address || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{branch.phone || '-'}</td>
                      <td className="py-3 px-4 text-center">{branch._count?.users || 0}</td>
                      <td className="py-3 px-4 text-center">{branch._count?.sales || 0}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              branch.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {branch.active ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={() => handleEdit(branch)}
                            variant="outline"
                            size="sm"
                            className="p-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleToggleStatus(branch.id, branch.active)}
                            variant={branch.active ? 'destructive' : 'default'}
                            size="sm"
                            className="p-2"
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
