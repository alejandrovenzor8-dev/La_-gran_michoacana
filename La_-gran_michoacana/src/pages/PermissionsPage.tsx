import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Save, Users as UsersIcon, AlertCircle, Loader2 } from 'lucide-react';
import { usePermissionsStore } from '@/stores/permissionsStore';
import { useAuthStore } from '@/stores/authStore';
import type { UserPermissions } from '@/types/permissions';
import { userService, type User } from '@/lib/userService';
import { permissionService, type Module } from '@/lib/permissionService';

export default function PermissionsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const { getUserPermissions, hasPermission } = usePermissionsStore();
  
  const [usersList, setUsersList] = useState<User[]>([]);
  const [modulesList, setModulesList] = useState<Module[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Verificar si el usuario actual tiene permisos para editar
  const canEdit = currentUser ? hasPermission(currentUser.username, 'permissions') : false;

  // Cargar usuarios desde la base de datos
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        setLoadError(null);
        const users = await userService.getUsers(100, 0); // Cargar hasta 100 usuarios
        setUsersList(users.filter(u => u.active)); // Solo usuarios activos
      } catch (error) {
        setLoadError('No se pudieron cargar los usuarios. Por favor, intenta de nuevo.');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  // Cargar módulos desde la base de datos
  useEffect(() => {
    const loadModules = async () => {
      try {
        setIsLoadingModules(true);
        const modules = await permissionService.getModules();
        setModulesList(modules.filter(m => m.active)); // Solo módulos activos
      } catch (error) {
        setLoadError('No se pudieron cargar los módulos. Por favor, intenta de nuevo.');
      } finally {
        setIsLoadingModules(false);
      }
    };

    loadModules();
  }, []);

  // Cargar permisos del usuario seleccionado
  useEffect(() => {
    const loadUserPermissions = async () => {
      if (selectedUser) {
        try {
          const userPerms = await permissionService.getUserPermissionsByUsername(selectedUser);
          setPermissions(userPerms);
        } catch (error) {
          setPermissions({});
        }
      }
    };

    loadUserPermissions();
  }, [selectedUser]);

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

  const handleSavePermissions = async () => {
    if (selectedUser && canEdit) {
      try {
        setIsSaving(true);
        await permissionService.updateUserPermissionsByUsername(selectedUser, permissions);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error) {
        setLoadError('Error al guardar los permisos. Por favor, intenta de nuevo.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const selectedUserData = usersList.find((u) => u.username === selectedUser);

  // Usar módulos desde la base de datos
  const availableModules = modulesList;

  return (
    <div className="h-full overflow-y-auto p-3 md:p-4 lg:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-2 md:p-3 bg-purple-100 rounded-lg">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
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
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-gray-600">Cargando usuarios...</span>
              </div>
            ) : loadError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{loadError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Reintentar
                </Button>
              </div>
            ) : usersList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay usuarios disponibles</p>
              </div>
            ) : (
              <div className="space-y-2">
                {usersList.map((user) => (
                  <button
                    key={user.id}
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
                    {user.fullName && (
                      <div
                        className={`text-xs ${
                          selectedUser === user.username
                            ? 'text-white/70'
                            : 'text-gray-400'
                        }`}
                      >
                        {user.fullName}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
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
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
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
                  {isLoadingModules ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-gray-600">Cargando módulos...</span>
                    </div>
                  ) : availableModules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No hay módulos disponibles</p>
                    </div>
                  ) : (
                    availableModules.map((module) => (
                      <div
                        key={module.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {module.name}
                            </p>
                            {module.description && (
                              <p className="text-sm text-gray-500">
                                {module.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">
                              {permissions[module.key] ? 'Permitido' : 'Denegado'}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={permissions[module.key] || false}
                                onChange={(e) =>
                                  handlePermissionChange(module.key, e.target.checked)
                                }
                                disabled={!canEdit}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {canEdit && (
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const userPerms = await permissionService.getUserPermissionsByUsername(selectedUser);
                          setPermissions(userPerms);
                          setSaveSuccess(false);
                        } catch (error) {
                          // Error recargando permisos
                        }
                      }}
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSavePermissions}
                      className="flex items-center gap-2"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Guardar Cambios
                        </>
                      )}
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
