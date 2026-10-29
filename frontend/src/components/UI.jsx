import { Link, Outlet } from 'react-router';

export function Layout() {
  return <><a className="skip-link" href="#inhoud">Naar inhoud</a><header className="header"><div className="header-inner"><Link className="brand" to="/"><span className="brand-icon" aria-hidden="true">M</span>MijnAutoManager</Link><span className="header-tagline">Jouw auto. Alles bij elkaar.</span></div></header><main id="inhoud" className="main"><Outlet /></main><footer className="footer"><span>MijnAutoManager</span><span>Voertuigen, overzicht en een goed begin.</span></footer></>;
}
