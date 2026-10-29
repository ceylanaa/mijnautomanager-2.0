import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { searchRdw } from '../api/client';
import { demoVehicle, formatRdwDate, normalizePlate, validPlate } from '../api/data';
import { saveVehicle } from '../api/vehicles';
import { Button, Field, Notice, PageHeading } from '../components/UI';

export default function SearchVehicle() {
  const { session, handleError } = useAuth(); const navigate = useNavigate();
  const [mode, setMode] = useState('demo'), [plate, setPlate] = useState(''), [nickname, setNickname] = useState('');
  const [result, setResult] = useState(null), [error, setError] = useState(''), [empty, setEmpty] = useState(false), [searching, setSearching] = useState(false), [saving, setSaving] = useState(false);
  const request = useRef(null), sequence = useRef(0);
  function invalidate() { sequence.current++; request.current?.abort(); setResult(null); setError(''); setEmpty(false); setSearching(false); }
  useEffect(() => () => { sequence.current++; request.current?.abort(); }, []);
  async function search(event) {
    event.preventDefault(); if (saving) return; invalidate();
    if (!validPlate(plate)) { setError('Vul een kenteken met alleen letters en cijfers in.'); return; }
    const current = sequence.current; const controller = new AbortController(); request.current = controller; setSearching(true);
    try {
      const found = mode === 'demo' ? demoVehicle(plate) : await searchRdw(plate, controller.signal);
      if (current === sequence.current) { setResult(found || null); setEmpty(!found); }
    } catch (error) { if (current === sequence.current && !controller.signal.aborted) setError(error.message); }
    finally { if (current === sequence.current) setSearching(false); }
  }
  async function save(event) {
    event.preventDefault(); if (saving || result?.source !== 'demo') return;
    setSaving(true); setError('');
    try { await saveVehicle(session, result.licensePlate, nickname); navigate('/voertuigen', { replace: true }); }
    catch (error) { setError(handleError(error)); }
    finally { setSaving(false); }
  }
  return <><Link className="back-link" to="/voertuigen">← Mijn auto's</Link><PageHeading eyebrow="AUTO TOEVOEGEN" title="Begin met een kenteken." description="Zoek een voertuig, controleer de gegevens en voeg het toe."/><div className="search-layout"><section className="card search-card"><h2><span className="step">1</span> Zoek op kenteken</h2><fieldset disabled={saving} className="search-mode"><legend>Gegevensbron</legend><label><input type="radio" name="source" checked={mode === 'demo'} onChange={() => { invalidate(); setMode('demo'); setPlate(''); }}/> Fictieve demovoertuigen</label><label><input type="radio" name="source" checked={mode === 'rdw'} onChange={() => { invalidate(); setMode('rdw'); setPlate(''); }}/> RDW bekijken (alleen lezen)</label></fieldset><form onSubmit={search}><Field id="plate" label="Kenteken" autoComplete="off" maxLength={24} value={plate} onChange={e => { invalidate(); setPlate(e.target.value); }} disabled={saving} required placeholder={mode === 'demo' ? 'Bijvoorbeeld TESTA2' : 'Vul een kenteken in'} hint="Spaties en koppeltekens worden automatisch verwijderd."/><Button type="submit" busy={searching} disabled={saving}>{searching ? 'Voertuig zoeken...' : 'Zoeken'} <span aria-hidden="true">→</span></Button></form>{mode === 'demo' ? <div className="demo-plates"><p>Beschikbare fictieve kentekens</p>{['TESTA1', 'TESTA2', 'TESTB1'].map(value => <button key={value} disabled={saving} onClick={() => { invalidate(); setPlate(value); }}>{value}</button>)}</div> : <p className="small-muted">Deze zoekactie vraagt openbare RDW-gegevens op. Het resultaat wordt niet opgeslagen in NOVI.</p>}</section><section className={`card result-card${!result ? ' waiting' : ''}`} aria-live="polite"><h2><span className="step">2</span> Controleer en bewaar</h2>{!result ? <div className="result-placeholder"><span aria-hidden="true">⌕</span><h3>{empty ? 'Geen voertuig gevonden' : 'Hier verschijnt je voertuig.'}</h3><p>{empty ? mode === 'demo' ? 'Kies één van de fictieve kentekens links.' : 'Controleer het kenteken en probeer opnieuw.' : 'Vul links een kenteken in en kies Zoeken.'}</p></div> : <><span className="badge">{result.source === 'demo' ? 'Fictieve voorbeeldgegevens' : 'Bron: RDW · alleen lezen'}</span><h3>{result.brand} {result.model}</h3><span className="plate">{normalizePlate(result.licensePlate)}</span><dl className="data-list"><div><dt>Bouwjaar</dt><dd>{result.year}</dd></div><div><dt>Brandstof</dt><dd>{result.fuel}</dd></div><div><dt>APK-datum</dt><dd>{formatRdwDate(result.apk)}</dd></div></dl>{result.source === 'demo' ? <form onSubmit={save}><Field id="nickname" label="Bijnaam (optioneel)" maxLength={100} value={nickname} onChange={e => setNickname(e.target.value)} disabled={saving} placeholder="Bijvoorbeeld Weekendauto"/><Button type="submit" busy={saving}>{saving ? 'Auto opslaan...' : 'Auto toevoegen'}</Button></form> : <p className="muted">Toevoegen is alleen beschikbaar voor de fictieve demovoertuigen.</p>}</>}</section></div><Notice error>{error}</Notice></>;
}
