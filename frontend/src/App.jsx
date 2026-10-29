import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router';
import { Layout, ProtectedRoute } from './components/UI';
import AuthPage from './pages/AuthPage';
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { document.title = 'MijnAutoManager'; window.scrollTo(0, 0); }, [pathname]);
  return <Routes><Route element={<Layout/>}><Route index element={<Navigate to="/voertuigen" replace/>}/><Route path="inloggen" element={<AuthPage key="login"/>}/><Route path="registreren" element={<AuthPage register key="register"/>}/><Route element={<ProtectedRoute/>}><Route path="voertuigen" element={<section className="card"><h1>Mijn auto's</h1><p>Je bent ingelogd. Het voertuigoverzicht komt hier.</p></section>}/></Route><Route path="*" element={<section className="card"><h1>Deze pagina bestaat niet.</h1><Link to="/voertuigen">Terug naar overzicht</Link></section>}/></Route></Routes>;
}
