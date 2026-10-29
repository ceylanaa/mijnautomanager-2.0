import { useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router';
import { Layout } from './components/UI';
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { document.title = 'MijnAutoManager'; window.scrollTo(0, 0); }, [pathname]);
  return <Routes><Route element={<Layout/>}><Route index element={<section className="card"><h1>MijnAutoManager</h1><p>Hier komt het overzicht van je auto's.</p></section>}/><Route path="*" element={<section className="card"><h1>Deze pagina bestaat niet.</h1><Link to="/">Terug naar de startpagina</Link></section>}/></Route></Routes>;
}
