import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import POSPage from './pages/POSPage';
import CustomerDisplayPage from './pages/CustomerDisplayPage';
import LoginPage from './pages/LoginPage';
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
            <Route path="/pos" element={<POSPage />} />
            <Route path="/customer-display" element={<CustomerDisplayPage />} />
            <Route path="/login" element={<Navigate to="/pos" replace />} />
          </>
        )}
      </Routes>
    </HashRouter>
  );
}

export default App;
