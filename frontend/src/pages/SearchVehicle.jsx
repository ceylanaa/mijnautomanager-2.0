import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { searchRdw } from '../api/client';
import { demoVehicle, normalizePlate, validPlate } from '../api/data';
import { saveVehicle } from '../api/vehicles';
import { formatRdwDate } from '../helpers/format';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import './SearchVehicle.css';

const DEMO_PLATES = ['TESTA1', 'TESTA2', 'TESTB1'];

// S04 Voertuig toevoegen: eerst zoeken, daarna controleren en opslaan.
export default function SearchVehicle() {
  const { session, handleError } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('demo');
  const [plate, setPlate] = useState('');
  const [nickname, setNickname] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [existingId, setExistingId] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Met een volgnummer en AbortController overschrijft een oud zoekresultaat nooit een nieuwere zoekopdracht.
  const request = useRef(null);
  const sequence = useRef(0);

  function resetResult() {
    sequence.current++;
    request.current?.abort();
    setResult(null);
    setError('');
    setExistingId(null);
    setNotFound(false);
    setSearching(false);
  }

  useEffect(() => () => {
    sequence.current++;
    request.current?.abort();
  }, []);

  function changeMode(nextMode) {
    resetResult();
    setMode(nextMode);
    setPlate('');
  }

  async function handleSearch(event) {
    event.preventDefault();
    if (saving) return;
    resetResult();
    if (!validPlate(plate)) {
      setError('Vul een kenteken met alleen letters en cijfers in.');
      return;
    }

    const current = sequence.current;
    const controller = new AbortController();
    request.current = controller;
    setSearching(true);
    try {
      const found = mode === 'demo' ? demoVehicle(plate) : await searchRdw(plate, controller.signal);
      if (current === sequence.current) {
        setResult(found || null);
        setNotFound(!found);
      }
    } catch (searchError) {
      if (current === sequence.current && !controller.signal.aborted) setError(searchError.message);
    } finally {
      if (current === sequence.current) setSearching(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    if (saving || result?.source !== 'demo') return;
    setSaving(true);
    setError('');
    setExistingId(null);
    try {
      const created = await saveVehicle(session, result.licensePlate, nickname);
      if (created?.id !== undefined) {
        navigate(`/voertuigen/${created.id}`, { replace: true, state: { message: 'Het voertuig is toegevoegd aan je overzicht.' } });
      } else {
        navigate('/voertuigen', { replace: true });
      }
    } catch (saveError) {
      setError(handleError(saveError));
      setExistingId(saveError.existingId ?? null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Link className="back-link" to="/voertuigen">← Mijn auto's</Link>
      <PageHeading
        eyebrow="AUTO TOEVOEGEN"
        title="Begin met een kenteken."
        description="Zoek een voertuig, controleer de gegevens en voeg het toe."
      />

      <div className="search-layout">
        <section className="card search-card">
          <h2><span className="step">1</span> Zoek op kenteken</h2>
          <fieldset disabled={saving} className="search-mode">
            <legend>Gegevensbron</legend>
            <label>
              <input type="radio" name="source" checked={mode === 'demo'} onChange={() => changeMode('demo')} />
              Fictieve demovoertuigen
            </label>
            <label>
              <input type="radio" name="source" checked={mode === 'rdw'} onChange={() => changeMode('rdw')} />
              RDW bekijken (alleen lezen)
            </label>
          </fieldset>

          <form onSubmit={handleSearch}>
            <FormField
              id="plate"
              label="Kenteken"
              autoComplete="off"
              maxLength={24}
              value={plate}
              onChange={event => { resetResult(); setPlate(event.target.value); }}
              disabled={saving}
              required
              placeholder={mode === 'demo' ? 'Bijvoorbeeld TESTA2' : 'Vul een kenteken in'}
              hint="Spaties en koppeltekens worden automatisch verwijderd."
            />
            <Button type="submit" busy={searching} disabled={saving}>
              {searching ? 'RDW-gegevens ophalen...' : 'Zoeken'} <span aria-hidden="true">→</span>
            </Button>
          </form>

          {mode === 'demo' ? (
            <div className="demo-plates">
              <p>Beschikbare fictieve kentekens</p>
              {DEMO_PLATES.map(value => (
                <button key={value} type="button" disabled={saving} onClick={() => { resetResult(); setPlate(value); }}>
                  {value}
                </button>
              ))}
            </div>
          ) : (
            <p className="small-muted">Deze zoekactie vraagt openbare RDW-gegevens op. Het resultaat wordt niet opgeslagen in NOVI.</p>
          )}
        </section>

        <section className={`card result-card${!result ? ' waiting' : ''}`} aria-live="polite">
          <h2><span className="step">2</span> Controleer en bewaar</h2>
          {!result ? (
            <div className="result-placeholder">
              <span aria-hidden="true">⌕</span>
              <h3>{notFound ? 'Geen voertuig gevonden' : 'Hier verschijnt je voertuig.'}</h3>
              <p>
                {notFound
                  ? mode === 'demo' ? 'Kies één van de fictieve kentekens links.' : 'Geen voertuig gevonden. Controleer het kenteken.'
                  : 'Vul links een kenteken in en kies Zoeken.'}
              </p>
            </div>
          ) : (
            <>
              <span className="badge">{result.source === 'demo' ? 'Fictieve voorbeeldgegevens' : 'Bron: RDW · alleen lezen'}</span>
              <h3>{result.brand} {result.model}</h3>
              <span className="plate">{normalizePlate(result.licensePlate)}</span>
              <dl className="data-list">
                <div><dt>Bouwjaar</dt><dd>{result.year}</dd></div>
                <div><dt>Brandstof</dt><dd>{result.fuel}</dd></div>
                <div><dt>APK-datum</dt><dd>{formatRdwDate(result.apk)}</dd></div>
              </dl>
              {result.source === 'demo' ? (
                <form onSubmit={handleSave}>
                  <FormField
                    id="nickname"
                    label="Bijnaam (optioneel)"
                    maxLength={100}
                    value={nickname}
                    onChange={event => setNickname(event.target.value)}
                    disabled={saving}
                    placeholder="Bijvoorbeeld Weekendauto"
                  />
                  <Button type="submit" busy={saving}>{saving ? 'Opslaan...' : 'Auto toevoegen'}</Button>
                </form>
              ) : (
                <>
                  <p className="muted">Toevoegen is alleen beschikbaar voor de fictieve demovoertuigen.</p>
                  <Link to={`/apk/${normalizePlate(result.licensePlate)}`}>APK en gebreken van dit kenteken bekijken</Link>
                </>
              )}
            </>
          )}
        </section>
      </div>
      <Notice error>
        {error}
        {existingId !== null && <> <Link to={`/voertuigen/${existingId}`}>Bekijk dit voertuig</Link></>}
      </Notice>
    </>
  );
}
