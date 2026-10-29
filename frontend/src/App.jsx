import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import VehicleList from './pages/VehicleList';
import VehicleDetail from './pages/VehicleDetail';
import SearchVehicle from './pages/SearchVehicle';

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = 'MijnAutoManager';
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/voertuigen" replace />} />
        <Route path="inloggen" element={<AuthPage key="login" />} />
        <Route path="registreren" element={<AuthPage register key="register" />} />
        <Route element={<ProtectedRoute />}>
          <Route path="voertuigen" element={<VehicleList />} />
          <Route path="voertuigen/:id" element={<VehicleDetail />} />
          <Route path="kenteken" element={<SearchVehicle />} />
        </Route>
        <Route
          path="*"
          element={<section className="card"><h1>Deze pagina bestaat niet.</h1><Link to="/voertuigen">Terug naar overzicht</Link></section>}
        />
      </Route>
    </Routes>
  );
}
