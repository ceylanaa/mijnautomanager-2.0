import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { novi } from '../api/client';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Notice from '../components/Notice';
import './AuthPage.css';

// S01 Inloggen en S02 Registreren delen één pagina; register bepaalt welke variant zichtbaar is.
export default function AuthPage({ register = false }) {
  const { session, notice, login, startDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState(false);
  const [success, setSuccess] = useState(false);

  // NOVI staat alleen de origin localhost toe, niet 127.0.0.1.
  const wrongLocalOrigin = window.location.hostname === '127.0.0.1';

  if (session) return <Navigate to="/voertuigen" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setDuplicate(false);

    if (wrongLocalOrigin) {
      setError('NOVI staat dit lokale adres niet toe. Open de app via http://localhost:5173 en probeer daar opnieuw.');
      return;
    }
    if (register && password !== repeat) {
      setError('De wachtwoorden zijn niet gelijk.');
      document.getElementById('repeat').focus();
      return;
    }

    setBusy(true);
    try {
      if (register) {
        await novi.register(email, password);
        setSuccess(true);
        setPassword('');
        setRepeat('');
      } else if (await login(email, password)) {
        const from = location.state?.from;
        navigate(from && from !== '/inloggen' ? from : '/voertuigen', { replace: true });
      }
    } catch (requestError) {
      if (register && (requestError.status === 400 || requestError.status === 409)) {
        setError('Registratie is niet gelukt. Controleer je invoer. Bestaat dit e-mailadres al?');
        setDuplicate(true);
      } else {
        setError(requestError.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-intro">
        <p className="eyebrow">{register ? 'MAAK EEN ACCOUNT' : 'WELKOM TERUG'}</p>
        <h1>
          {register ? 'Een goed begin' : 'Alles voor je auto,'}<br />
          <span>{register ? 'voor jouw auto.' : 'op één plek.'}</span>
        </h1>
        <div className="benefits">
          <h2>Meer overzicht. Minder zoeken.</h2>
          <p><span>01</span> Je voertuigen bij elkaar</p>
          <p><span>02</span> APK-inzicht uit RDW-data</p>
          <p><span>03</span> Je eigen onderhoudshistorie</p>
          <small>Onderwijsdemo • gebruik fictieve gegevens</small>
        </div>
      </section>

      <section className="card auth-card">
        <h2>{register ? 'Maak je account aan' : 'Fijn dat je er bent.'}</h2>
        <p className="muted">
          {register ? 'Vul je gegevens in om een account aan te maken.' : 'Log in met je bestaande NOVI-account.'}
        </p>
        <Notice>{notice}</Notice>
        {wrongLocalOrigin && (
          <Notice error>
            NOVI staat dit lokale adres niet toe. <a href="http://localhost:5173/inloggen">Open de app via localhost</a>.
          </Notice>
        )}

        {success ? (
          <Notice>Je account is aangemaakt. <Link to="/inloggen">Ga naar Inloggen</Link>.</Notice>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormField
              id="email"
              label="E-mailadres"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              disabled={busy}
              placeholder="naam@voorbeeld.nl"
            />
            <FormField
              id="password"
              label="Wachtwoord"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              minLength={register ? 8 : undefined}
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
              disabled={busy}
              hint={register ? 'Minimaal 8 tekens.' : undefined}
            />
            {register && (
              <FormField
                id="repeat"
                label="Herhaal wachtwoord"
                type="password"
                autoComplete="new-password"
                required
                value={repeat}
                onChange={event => setRepeat(event.target.value)}
                disabled={busy}
              />
            )}
            <Notice error>
              {error}
              {duplicate && <> <Link to="/inloggen">Inloggen</Link></>}
            </Notice>
            <Button type="submit" busy={busy}>
              {busy ? 'Even geduld...' : register ? 'Account aanmaken' : 'Inloggen'} <span aria-hidden="true">→</span>
            </Button>
          </form>
        )}

        <p className="auth-switch">
          {register
            ? <>Al een account? <Link to="/inloggen">Inloggen</Link></>
            : <>Nog geen account? <Link to="/registreren">Registreren</Link></>}
        </p>
        <small>
          {register
            ? 'Na registratie kun je inloggen met je nieuwe account.'
            : 'Je gegevens blijven in dit tabblad beschikbaar totdat je uitlogt.'}
        </small>

        {!register && (
          <div className="demo-entry">
            <p>Eerst even rondkijken?</p>
            <Button variant="secondary" onClick={startDemo} disabled={busy}>Bekijk de lokale demo</Button>
            <small>Geen account nodig. Met fictieve voorbeeldauto's.</small>
          </div>
        )}
      </section>
    </div>
  );
}
