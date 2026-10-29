import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import VehicleList from './pages/VehicleList';
import VehicleDetail from './pages/VehicleDetail';
import { OwnVehicleApk, PlateApk } from './pages/ApkPage';
import MaintenanceForm from './pages/MaintenanceForm';
import SearchVehicle from './pages/SearchVehicle';
import NotFound from './pages/NotFound';

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
          <Route path="voertuigen/:id/onderhoud/nieuw" element={<MaintenanceForm />} />
          <Route path="voertuigen/:id/onderhoud/:maintenanceId/bewerken" element={<MaintenanceForm />} />
          <Route path="voertuigen/:id/apk" element={<OwnVehicleApk />} />
          <Route path="apk/:kenteken" element={<PlateApk />} />
          <Route path="kenteken" element={<SearchVehicle />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
