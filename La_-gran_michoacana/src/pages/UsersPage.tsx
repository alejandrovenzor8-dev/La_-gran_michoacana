import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Trash2, Edit2, Loader } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: 'ADMIN' | 'CAJERO' | 'GERENTE';
  active: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'CAJERO' as const,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users');
      if (response.data) {
        setUsers(response.data.users || []);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.username.trim()) {
      setError('El nombre de usuario es requerido');
      return;
    }

    if (formData.username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    if (!formData.email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Ingresa un email válido');
      return;
    }

    if (!formData.password) {
      setError('La contraseña es requerida');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (users.some((u) => u.username === formData.username)) {
      setError('El usuario ya existe');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post('/users', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName || undefined,
        role: formData.role,
      });

      if (response.data) {
        setSuccess(`Usuario "${formData.username}" creado exitosamente`);
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          role: 'CAJERO',
        });

        // Recargar lista de usuarios
        await loadUsers();

        setTimeout(() => {
          setShowForm(false);
          setSuccess('');
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al crear usuario';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      await apiClient.delete(`/users/${id}`);
      setSuccess('Usuario eliminado exitosamente');
      
      // Recargar lista de usuarios
      await loadUsers();

      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar usuario';
      setError(errorMessage);
      console.error('Error:', err);
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-primary" />
              Gestión de Usuarios
            </h1>
            <p className="text-gray-600">Administra los usuarios del sistema POS</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2 flex items-center"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancelar' : 'Nuevo Usuario'}
          </Button>
        </div>

        {/* Formulario */}
        {showForm && (
          <Card className="mb-8 border-primary/20 bg-blue-50/50">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Crear Nuevo Usuario
              </h2>

              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
                  {success}
                </div>
              )}

      <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Ingresa el nombre de usuario"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Ingresa el email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre Completo (Opcional)
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Ingresa el nombre completo"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rol
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="CAJERO">Cajero</option>
                      <option value="GERENTE">Gerente</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Ingresa una contraseña"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirma la contraseña"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      'Crear Usuario'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de Usuarios */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Usuarios Registrados</h2>

          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader className="w-8 h-8 mx-auto text-primary animate-spin mb-3" />
                <p className="text-gray-500">Cargando usuarios...</p>
              </CardContent>
            </Card>
          ) : users.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No hay usuarios registrados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <Card key={user.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {user.username}
                      </h3>
                      {user.fullName && (
                        <p className="text-sm text-gray-600">{user.fullName}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full capitalize">
                          {user.role.toLowerCase()}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      Creado: {new Date(user.createdAt).toLocaleDateString('es-MX')}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-1 gap-1 text-sm"
                        disabled
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-1 gap-1 text-sm text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
