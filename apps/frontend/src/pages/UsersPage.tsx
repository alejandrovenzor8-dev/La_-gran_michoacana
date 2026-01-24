import { useState } from 'react';
import { Trash2, Edit } from 'lucide-react';

interface User {
  id: number;
  userId: string;
  name: string;
  username: string;
  sucursal: string;
  registrationDate: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      userId: 'USR001',
      name: 'María García',
      username: 'maria.garcia',
      sucursal: 'Centro',
      registrationDate: '2026-01-15',
    },
    {
      id: 2,
      userId: 'USR002',
      name: 'Juan López',
      username: 'juan.lopez',
      sucursal: 'Norte',
      registrationDate: '2026-01-18',
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    sucursal: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const generateUserId = () => {
    return `USR${String(users.length + 1).padStart(3, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.username || !formData.password || !formData.confirmPassword || !formData.sucursal) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const newUser: User = {
      id: users.length + 1,
      userId: generateUserId(),
      name: formData.name,
      username: formData.username,
      sucursal: formData.sucursal,
      registrationDate: new Date().toISOString().split('T')[0],
    };

    setUsers([newUser, ...users]);
    setFormData({
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
      sucursal: '',
    });
  };

  const handleDeleteUser = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <p className="text-gray-600 mt-2">Administración de usuarios del sistema</p>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Registrar Nuevo Usuario</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: María García"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de Usuario *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: maria.garcia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sucursal *
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

          {/* Right Column */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirma tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition mt-2"
            >
              Registrar Usuario
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Usuarios Registrados</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  ID Usuario
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Nombre
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Usuario
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Sucursal
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Fecha Registro
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{user.userId}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{user.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{user.username}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      {user.sucursal}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{user.registrationDate}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button className="text-blue-500 hover:text-blue-700 transition" title="Editar">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
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
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No hay usuarios registrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
