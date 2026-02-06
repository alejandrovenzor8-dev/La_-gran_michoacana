import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import POSPage from './pages/POSPage';
import CustomerDisplayPage from './pages/CustomerDisplayPage';
import InventoryPage from './pages/InventoryPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import PermissionsPage from './pages/PermissionsPage';
import LoginPage from './pages/LoginPage';
import { MainLayout } from './components/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Cargar datos persistidos al iniciar
  useEffect(() => {
    // Esto dispara la carga del localStorage
    useAuthStore.getState();
  }, []);

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
            <Route path="/login" element={<Navigate to="/pos" replace />} />
          </>
        )}
      </Routes>
    </HashRouter>
  );
}

export default App;
