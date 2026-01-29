import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import POSPage from './pages/POSPage';
import CustomerDisplayPage from './pages/CustomerDisplayPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/pos" replace />} />
        <Route path="/pos" element={<POSPage />} />
        <Route path="/customer-display" element={<CustomerDisplayPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
