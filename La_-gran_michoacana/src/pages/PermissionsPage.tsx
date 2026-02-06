import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Save, Users as UsersIcon, AlertCircle } from 'lucide-react';
import { usePermissionsStore } from '@/stores/permissionsStore';
import { useAuthStore } from '@/stores/authStore';
import { AVAILABLE_MODULES } from '@/types/permissions';
import type { UserPermissions } from '@/types/permissions';

interface User {
  username: string;
  role: 'admin' | 'cajero' | 'gerente';
}

// Lista simulada de usuarios (en producción vendría de una API/DB)
const USERS_LIST: User[] = [
  { username: 'admin', role: 'admin' },
  { username: 'cajero', role: 'cajero' },
  { username: 'gerente', role: 'gerente' },
];

export default function PermissionsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const { getUserPermissions, updateUserPermissions, hasPermission } = usePermissionsStore();
  
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Verificar si el usuario actual tiene permisos para editar
  const canEdit = currentUser ? hasPermission(currentUser.username, 'permissions') : false;

  useEffect(() => {
    if (selectedUser) {
      const userPerms = getUserPermissions(selectedUser);
      setPermissions(userPerms);
    }
  }, [selectedUser, getUserPermissions]);

  const handleUserSelect = (username: string) => {
    setSelectedUser(username);
    setSaveSuccess(false);
  };

  const handlePermissionChange = (moduleId: string, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleId]: value,
    }));
    setSaveSuccess(false);
  };

  const handleSavePermissions = () => {
    if (selectedUser && canEdit) {
      updateUserPermissions(selectedUser, permissions);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const selectedUserData = USERS_LIST.find((u) => u.username === selectedUser);

  // Filtrar módulos: excluir el login
  const availableModules = AVAILABLE_MODULES;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Permisos y Seguridad
            </h1>
            <p className="text-gray-500">
              Gestiona los permisos de acceso de cada usuario
            </p>
          </div>
        </div>
      </div>

      {!canEdit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Acceso limitado</p>
            <p className="text-sm text-yellow-700">
              No tienes permisos para editar la configuración de seguridad.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de selección de usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              Seleccionar Usuario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {USERS_LIST.map((user) => (
                <button
                  key={user.username}
                  onClick={() => handleUserSelect(user.username)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedUser === user.username
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{user.username}</div>
                  <div
                    className={`text-sm ${
                      selectedUser === user.username
                        ? 'text-white/80'
                        : 'text-gray-500'
                    }`}
                  >
                    Rol: {user.role}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Panel de configuración de permisos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {selectedUser
                  ? `Permisos de ${selectedUser}`
                  : 'Selecciona un usuario'}
              </span>
              {selectedUser && canEdit && (
                <Button
                  onClick={handleSavePermissions}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedUser ? (
              <div className="text-center py-12 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Selecciona un usuario para configurar sus permisos</p>
              </div>
            ) : (
              <div className="space-y-6">
                {saveSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                    ✓ Permisos guardados exitosamente
                  </div>
                )}

                {selectedUserData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-900">
                          Usuario: {selectedUserData.username}
                        </p>
                        <p className="text-sm text-blue-700">
                          Rol: {selectedUserData.role}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de permisos */}
                <div className="space-y-3">
                  {availableModules.map((module) => (
                    <div
                      key={module.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {module.label}
                          </p>
                          <p className="text-sm text-gray-500">
                            {module.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">
                            {permissions[module.id] ? 'Permitido' : 'Denegado'}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={permissions[module.id] || false}
                              onChange={(e) =>
                                handlePermissionChange(module.id, e.target.checked)
                              }
                              disabled={!canEdit}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const userPerms = getUserPermissions(selectedUser);
                        setPermissions(userPerms);
                        setSaveSuccess(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSavePermissions}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Guardar Cambios
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
