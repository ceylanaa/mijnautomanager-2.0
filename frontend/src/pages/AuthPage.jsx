import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { novi } from '../api/client';
import { Button, Field, Notice } from '../components/UI';

export default function AuthPage({ register = false }) {
  const { session, notice, login, startDemo } = useAuth();
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState(false);
  const navigate = useNavigate(), location = useLocation();
  const wrongLocalOrigin = window.location.hostname === '127.0.0.1';
  if (session) return <Navigate to="/voertuigen" replace />;
  async function submit(event) {
    event.preventDefault(); if (busy) return; setError('');
    if (wrongLocalOrigin) { setError('NOVI staat dit lokale adres niet toe. Open de app via http://localhost:5173 en probeer daar opnieuw.'); return; }
    if (register && password !== repeat) { setError('De wachtwoorden zijn niet gelijk.'); document.getElementById('repeat').focus(); return; }
    setBusy(true);
    try {
      if (register) { await novi.register(email, password); setSuccess(true); setPassword(''); setRepeat(''); }
      else if (await login(email, password)) { navigate(location.state?.from?.startsWith('/voertuigen') ? location.state.from : '/voertuigen', { replace: true }); }
    } catch (error) { setError(error.status === 400 && register ? 'Registratie is niet gelukt. Controleer je invoer, of log in als je al een account hebt.' : error.message); }
    finally { setBusy(false); }
  }
  return <div className="auth-layout"><section className="auth-intro"><p className="eyebrow">{register ? 'MAAK EEN ACCOUNT' : 'WELKOM TERUG'}</p><h1>Alles voor je auto,<br/><span>op één plek.</span></h1><p className="intro-copy">Een helder overzicht van je voertuigen. Zo vind je gemakkelijk wat je nodig hebt.</p><div className="benefits"><p><span>01</span> Je voertuigen bij elkaar</p><p><span>02</span> Zoeken op kenteken</p><p><span>03</span> Rust en overzicht</p></div></section><section className="card auth-card"><div className="auth-tabs"><Link to="/inloggen" aria-current={!register ? 'page' : undefined}>Inloggen</Link><Link to="/registreren" aria-current={register ? 'page' : undefined}>Registreren</Link></div><h2>{register ? 'Maak je account aan' : 'Fijn dat je er bent.'}</h2><p className="muted">{register ? 'Vul je gegevens in om een account aan te maken.' : 'Log in met je bestaande NOVI-account.'}</p><Notice>{notice}</Notice>{wrongLocalOrigin && <Notice error>NOVI staat dit lokale adres niet toe. <a href="http://localhost:5173/inloggen">Open de app via localhost</a> om in te loggen of te registreren.</Notice>}{success ? <Notice>Je account is aangemaakt. <Link to="/inloggen">Ga naar Inloggen</Link>.</Notice> : <form onSubmit={submit}><Field id="email" label="E-mailadres" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy} placeholder="naam@voorbeeld.nl"/><Field id="password" label="Wachtwoord" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined} required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} hint={register ? 'Minimaal 8 tekens.' : undefined}/>{register && <Field id="repeat" label="Herhaal wachtwoord" type="password" autoComplete="new-password" required value={repeat} onChange={e => setRepeat(e.target.value)} disabled={busy}/>}<Notice error>{error}</Notice><Button type="submit" busy={busy}>{busy ? 'Even geduld...' : register ? 'Account aanmaken' : 'Inloggen'} <span aria-hidden="true">→</span></Button></form>}{!register && <div className="demo-entry"><p>Eerst even rondkijken?</p><Button secondary onClick={startDemo} disabled={busy}>Bekijk de lokale demo</Button><small>Geen account nodig. Met fictieve voorbeeldauto's.</small></div>}</section></div>;
}
