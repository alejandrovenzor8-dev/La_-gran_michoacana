import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Trash2, Edit2, Loader2, X, Lock } from 'lucide-react';
import { formatDate, MEXICO_TIMEZONES, getConfiguredTimezone } from '@/lib/utils';
import { userService, type User as ServiceUser } from '@/lib/userService';
import { branchService } from '@/lib/branchService';
import type { Branch } from '@/types/branch';
import { toast } from 'sonner';

// Extender el tipo User del servicio para la UI
interface User extends Omit<ServiceUser, 'role'> {
  role: 'ADMIN' | 'CAJERO' | 'GERENTE';
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'CAJERO' as const,
    timezone: getConfiguredTimezone(),
    branchId: '',
  });

  const [editFormData, setEditFormData] = useState({
    email: '',
    fullName: '',
    role: 'CAJERO' as 'ADMIN' | 'CAJERO' | 'GERENTE',
    active: true,
    timezone: getConfiguredTimezone(),
    branchId: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para cambio de contraseña
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Cargar usuarios y sucursales al montar el componente
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const usersData = await userService.getUsers(100, 0);
      // Convertir roles de minúsculas a mayúsculas para la UI
      const usersUI: User[] = usersData.map(u => ({
        ...u,
        role: u.role.toUpperCase() as 'ADMIN' | 'CAJERO' | 'GERENTE'
      }));
      setUsers(usersUI);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los usuarios. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const branchesData = await branchService.getBranches({ active: true });
      setBranches(branchesData);
    } catch (err: any) {
      // Error al cargar sucursales
    }
  };

  useEffect(() => {
    loadUsers();
    loadBranches();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value } = target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    
    if (type === 'checkbox') {
      const checked = (target as HTMLInputElement).checked;
      setEditFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setEditFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditFormData({
      email: user.email,
      fullName: user.fullName || '',
      role: user.role,
      active: user.active,
      timezone: user.timezone || getConfiguredTimezone(),
      branchId: user.branchId ? user.branchId.toString() : '',
    });
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      email: '',
      fullName: '',
      role: 'CAJERO',
      active: true,
      timezone: getConfiguredTimezone(),
      branchId: '',
    });
    setError('');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editingId) return;

    // Validaciones
    if (!editFormData.email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      setError('El email no es válido');
      return;
    }

    // Verificar que el email no esté en uso por otro usuario
    if (users.some((u) => u.id !== editingId && u.email === editFormData.email)) {
      setError('El email ya está registrado por otro usuario');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const updatedUser = await userService.updateUser(editingId, {
        email: editFormData.email,
        fullName: editFormData.fullName || undefined,
        role: editFormData.role as 'ADMIN' | 'CAJERO' | 'GERENTE',
        active: editFormData.active,
        timezone: editFormData.timezone,
        branchId: editFormData.branchId ? parseInt(editFormData.branchId) : null,
      });

      // Actualizar el usuario en la lista (convertir rol a mayúsculas)
      const userUI: User = {
        ...updatedUser,
        role: updatedUser.role.toUpperCase() as 'ADMIN' | 'CAJERO' | 'GERENTE'
      };
      
      setUsers((prev) =>
        prev.map((u) => (u.id === editingId ? userUI : u))
      );

      setSuccess('Usuario actualizado exitosamente');
      
      // Recargar usuarios para asegurar que los datos estén sincronizados
      await loadUsers();
      setEditingId(null);
      setEditFormData({
        email: '',
        fullName: '',
        role: 'CAJERO',
        active: true,
        timezone: getConfiguredTimezone(),
        branchId: '',
      });

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el usuario. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
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
      setError('El nombre de usuario debe tener entre 3 y 20 caracteres');
      return;
    }

    if (!formData.email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('El email no es válido');
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

    if (users.some((u) => u.email === formData.email)) {
      setError('El email ya está registrado');
      return;
    }

    // Crear usuario en el backend
    try {
      setIsSubmitting(true);
      const newUser = await userService.createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName || undefined,
        role: formData.role as 'ADMIN' | 'CAJERO' | 'GERENTE',
        branchId: formData.branchId ? parseInt(formData.branchId) : undefined,
      });
      
      // Actualizar timezone del usuario recién creado
      if (formData.timezone) {
        await userService.updateUser(newUser.id, {
          timezone: formData.timezone,
        });
      }

      // Agregar usuario a la lista (convertir rol a mayúsculas)
      const userUI: User = {
        ...newUser,
        role: newUser.role.toUpperCase() as 'ADMIN' | 'CAJERO' | 'GERENTE'
      };
      
      setUsers((prev) => [...prev, userUI]);
      setSuccess(`Usuario "${formData.username}" creado exitosamente`);
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        role: 'CAJERO',
        timezone: getConfiguredTimezone(),
        branchId: '',
      });

      setTimeout(() => {
        setShowForm(false);
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al crear el usuario. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await userService.deleteUser(id);
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setSuccess('Usuario eliminado exitosamente');
        setTimeout(() => setSuccess(''), 2000);
      } catch (err: any) {
        setError(err.message || 'Error al eliminar el usuario. Intenta de nuevo.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleOpenChangePasswordModal = (user: User) => {
    setSelectedUserForPassword(user);
    setPasswordForm({
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordError('');
    setShowChangePasswordModal(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!selectedUserForPassword) return;

    // Validaciones
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Los campos de contraseña son requeridos');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setIsChangingPassword(true);
      await userService.changeUserPassword(selectedUserForPassword.id, passwordForm.newPassword);

      toast.success('Contraseña actualizada', {
        description: `La contraseña de ${selectedUserForPassword.username} ha sido cambiada exitosamente`,
      });

      setShowChangePasswordModal(false);
      setSelectedUserForPassword(null);
      setPasswordForm({
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cambiar la contraseña';
      setPasswordError(message);
      toast.error('Error', {
        description: message,
      });
    } finally {
      setIsChangingPassword(false);
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
            disabled={loading || editingId !== null}
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancelar' : 'Nuevo Usuario'}
          </Button>
        </div>

        {/* Formulario de Creación */}
        {showForm && editingId === null && (
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
                      Nombre de Usuario *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Ingresa el nombre de usuario"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="usuario@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Nombre completo (opcional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rol *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isSubmitting}
                    >
                      <option value="CAJERO">Cajero</option>
                      <option value="GERENTE">Gerente</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Zona Horaria *
                    </label>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                      disabled={isSubmitting}
                    >
                      {MEXICO_TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sucursal
                    </label>
                    <select
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isSubmitting}
                    >
                      <option value="">Sin sucursal asignada</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Ingresa una contraseña"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirmar Contraseña *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirma la contraseña"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 gap-2" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Formulario de Edición */}
        {editingId !== null && (
          <Card className="mb-8 border-amber-200 bg-amber-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Editar Usuario
                </h2>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={isSubmitting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

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

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditInputChange}
                      placeholder="usuario@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={editFormData.fullName}
                      onChange={handleEditInputChange}
                      placeholder="Nombre completo"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rol *
                    </label>
                    <select
                      name="role"
                      value={editFormData.role}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isSubmitting}
                    >
                      <option value="CAJERO">Cajero</option>
                      <option value="GERENTE">Gerente</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Zona Horaria *
                    </label>
                    <select
                      name="timezone"
                      value={editFormData.timezone}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                      disabled={isSubmitting}
                    >
                      {MEXICO_TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sucursal
                    </label>
                    <select
                      name="branchId"
                      value={editFormData.branchId}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isSubmitting}
                    >
                      <option value="">Sin sucursal asignada</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center pt-8">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="active"
                        checked={editFormData.active}
                        onChange={handleEditInputChange}
                        className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary/20"
                        disabled={isSubmitting}
                      />
                      <span className="font-semibold text-gray-700">
                        Usuario Activo
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1"
                    disabled={isSubmitting}
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
          <h2 className="text-xl font-semibold text-gray-800">
            Usuarios Registrados {!loading && `(${users.length})`}
          </h2>

          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-3" />
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
                <Card key={user.id} className={`hover:shadow-lg transition-shadow ${editingId === user.id ? 'border-amber-300 bg-amber-50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {user.username}
                      </h3>
                      {user.fullName && (
                        <p className="text-sm text-gray-600">{user.fullName}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                      {user.branch && (
                        <p className="text-xs text-blue-600 mt-1 font-medium">
                          📍 {user.branch.name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full capitalize">
                          {user.role.toLowerCase()}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-4">
                      Creado: {formatDate(user.createdAt, false)}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-1 gap-1 text-sm"
                        onClick={() => handleEdit(user)}
                        disabled={loading || editingId !== null}
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-1 gap-1 text-sm text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleOpenChangePasswordModal(user)}
                        disabled={loading || editingId !== null}
                      >
                        <Lock className="w-4 h-4" />
                        Contraseña
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-1 gap-1 text-sm text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(user.id)}
                        disabled={loading || editingId !== null}
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

      {/* Modal de Cambio de Contraseña */}
      {showChangePasswordModal && selectedUserForPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Cambiar Contraseña</h2>
              <p className="text-gray-600 text-sm mb-4">
                Usuario: <span className="font-semibold">{selectedUserForPassword.username}</span>
              </p>

              {passwordError && (
                <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    placeholder="Ingresa la nueva contraseña (mín. 6 caracteres)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    disabled={isChangingPassword}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmar Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    placeholder="Confirma la nueva contraseña"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    disabled={isChangingPassword}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? 'Guardando...' : 'Cambiar Contraseña'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setSelectedUserForPassword(null);
                      setPasswordForm({
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setPasswordError('');
                    }}
                    disabled={isChangingPassword}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
