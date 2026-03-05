import { useState, useEffect } from 'react';
import { FileText, Search, Filter, Calendar, User, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface AuditLog {
  id: number;
  userId: number | null;
  user: {
    id: number;
    username: string;
    fullName: string | null;
    email: string;
  } | null;
  branchId: number | null;
  branch: {
    id: number;
    name: string;
  } | null;
  action: string;
  entity: string;
  entityId: number | null;
  description: string;
  oldValues: any;
  newValues: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchAuditLogs();
    }
  }, [page, filterEntity, filterAction, isAuthenticated, accessToken]);

  const fetchAuditLogs = async () => {
    if (!accessToken || !isAuthenticated) return;

    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      
      let url = `/audit/logs?limit=${limit}&offset=${offset}`;
      if (filterEntity) url += `&entity=${filterEntity}`;
      if (filterAction) url += `&action=${filterAction}`;
      
      const response = await apiClient.get<{ 
        status: string;
        data: {
          logs: AuditLog[];
          total: number;
          limit: number;
          offset: number;
        };
      }>(url);

      setLogs(response.data?.logs || []);
      setTotal(response.data?.total || 0);
    } catch (error: any) {
      console.error('Error al obtener logs de auditoría:', error);
      toast.error(error.response?.data?.error || 'Error al cargar los logs de auditoría');
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'text-green-600 bg-green-50';
      case 'UPDATE':
        return 'text-blue-600 bg-blue-50';
      case 'DELETE':
        return 'text-red-600 bg-red-50';
      case 'LOGIN':
        return 'text-purple-600 bg-purple-50';
      case 'LOGOUT':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredLogs = (logs || []).filter(log =>
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Auditoría del Sistema
        </h1>
        <p className="text-gray-500 mt-1">
          Historial completo de cambios y acciones en el sistema
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar en descripciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por Entidad */}
            <select
              value={filterEntity}
              onChange={(e) => {
                setFilterEntity(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todas las entidades</option>
              <option value="Branch">Sucursales</option>
              <option value="Product">Productos</option>
              <option value="Sale">Ventas</option>
              <option value="User">Usuarios</option>
              <option value="Inventory">Inventario</option>
            </select>

            {/* Filtro por Acción */}
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todas las acciones</option>
              <option value="CREATE">Crear</option>
              <option value="UPDATE">Actualizar</option>
              <option value="DELETE">Eliminar</option>
              <option value="LOGIN">Inicio de sesión</option>
              <option value="LOGOUT">Cierre de sesión</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{total}</p>
              <p className="text-sm text-gray-500">Total de registros</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{filteredLogs.length}</p>
              <p className="text-sm text-gray-500">Registros mostrados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{totalPages}</p>
              <p className="text-sm text-gray-500">Páginas totales</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-500">Cargando logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No se encontraron registros de auditoría</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Header del log */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {log.entity}
                        </span>
                        {log.entityId && (
                          <span className="text-xs text-gray-500">
                            ID: {log.entityId}
                          </span>
                        )}
                      </div>

                      {/* Descripción */}
                      <p className="text-sm text-gray-900">{log.description}</p>

                      {/* Metadatos */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        {log.user && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.user.username} ({log.user.fullName || log.user.email})
                          </span>
                        )}
                        {log.branch && (
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {log.branch.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(log.createdAt)}
                        </span>
                        {log.ipAddress && (
                          <span>IP: {log.ipAddress}</span>
                        )}
                      </div>

                      {/* Valores anteriores y nuevos */}
                      {(log.oldValues || log.newValues) && (
                        <details className="mt-2">
                          <summary className="text-xs text-primary cursor-pointer hover:underline">
                            Ver detalles de cambios
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded text-xs space-y-2">
                            {log.oldValues && (
                              <div>
                                <p className="font-medium text-gray-700">Valores anteriores:</p>
                                <pre className="mt-1 text-gray-600 overflow-x-auto">
                                  {JSON.stringify(log.oldValues, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newValues && (
                              <div>
                                <p className="font-medium text-gray-700">Valores nuevos:</p>
                                <pre className="mt-1 text-gray-600 overflow-x-auto">
                                  {JSON.stringify(log.newValues, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {!loading && filteredLogs.length > 0 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <p className="text-sm text-gray-500">
                Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total} registros
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="px-4 py-2 text-sm">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
