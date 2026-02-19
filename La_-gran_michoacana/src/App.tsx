import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import POSPage from './pages/POSPage';
import CustomerDisplayPage from './pages/CustomerDisplayPage';
import InventoryPage from './pages/InventoryPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import PermissionsPage from './pages/PermissionsPage';
import ReportsPage from './pages/ReportsPage';
import BranchesPage from './pages/BranchesPage';
import LoginPage from './pages/LoginPage';
import { MainLayout } from './components/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './stores/authStore';
import { usePermissionsStore } from './stores/permissionsStore';
import UpdateNotification from './components/UpdateNotification';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const initializeUserPermissions = usePermissionsStore((state) => state.initializeUserPermissions);

  // Cargar datos persistidos al iniciar
  useEffect(() => {
    // Esto dispara la carga del localStorage
    useAuthStore.getState();
    
    // Si hay un usuario autenticado, asegurarse de que tenga permisos inicializados
    if (user) {
      initializeUserPermissions(user.username, user.role.toLowerCase() as 'admin' | 'cajero' | 'gerente');
    }
  }, [user, initializeUserPermissions]);

  return (
    <HashRouter>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/pos" replace />} />
            <Route
              path="/pos"
              element={
                <ProtectedRoute module="pos">
                  <MainLayout>
                    <POSPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer-display"
              element={<CustomerDisplayPage />}
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute module="inventory">
                  <MainLayout>
                    <InventoryPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute module="settings">
                  <MainLayout>
                    <SettingsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute module="users">
                  <MainLayout>
                    <UsersPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/permissions"
              element={
                <ProtectedRoute module="permissions">
                  <MainLayout>
                    <PermissionsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute module="reports">
                  <MainLayout>
                    <ReportsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/branches"
              element={
                <ProtectedRoute module="branches">
                  <MainLayout>
                    <BranchesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Navigate to="/pos" replace />} />
          </>
        )}
      </Routes>
      <Toaster 
        position="top-right" 
        richColors 
        expand={false}
        duration={4000}
      />
      <UpdateNotification />
    </HashRouter>
  );
}

export default App;
