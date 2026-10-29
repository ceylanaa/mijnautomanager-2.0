import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { RECOGNITIONS, searchCompanies } from '../api/garages';
import Button from '../components/Button';
import CompanyCard from '../components/CompanyCard';
import FormField from '../components/FormField';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import './GarageSearch.css';

const PAGE_SIZE = 20;

// S07 Garages zoeken op plaats en RDW-erkenning. Geen GPS, geen afstand en geen afspraken.
export default function GarageSearch() {
  const [params] = useSearchParams();
  const preset = RECOGNITIONS.includes(params.get('erkenning')) ? params.get('erkenning') : '';
  const [place, setPlace] = useState('');
  const [recognition, setRecognition] = useState(preset);
  const [errors, setErrors] = useState({});
  const [results, setResults] = useState(null);
  const [searched, setSearched] = useState(null);
  const [shown, setShown] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef(null);
  const placeRef = useRef(null);

  // Lopend verzoek afbreken als de pagina wordt verlaten.
  useEffect(() => () => controller.current?.abort(), []);

  async function search(event) {
    event?.preventDefault();
    const nextErrors = {};
    if (!place.trim()) nextErrors.place = 'Vul een plaats in.';
    if (!recognition) nextErrors.recognition = 'Kies een erkenning.';
    setErrors(nextErrors);
    if (nextErrors.place) { placeRef.current?.focus(); return; }
    if (nextErrors.recognition) { document.getElementById('garage-recognition')?.focus(); return; }

    controller.current?.abort();
    controller.current = new AbortController();
    const signal = controller.current.signal;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const found = await searchCompanies(place, recognition, signal);
      if (signal.aborted) return;
      setResults(found);
      setSearched({ place: place.trim(), recognition });
      setShown(PAGE_SIZE);
    } catch (searchError) {
      if (!signal.aborted) setError(searchError.message);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="GARAGES ZOEKEN"
        title="Vind een erkend bedrijf."
        description="Zoek op plaats en RDW-erkenning. Er is geen afstandsberekening of afspraakreservering; de lijst is geen aanbeveling."
      />
      <section className="card garage-form">
        <form onSubmit={search} noValidate>
          <div className="garage-fields">
            <FormField
              ref={placeRef}
              id="garage-place"
              label="Plaats"
              value={place}
              onChange={event => setPlace(event.target.value)}
              error={errors.place}
              autoComplete="address-level2"
              hint="Bijvoorbeeld Utrecht. Hoofdletters maken niet uit."
            />
            <FormField
              as="select"
              id="garage-recognition"
              label="Erkenning"
              value={recognition}
              onChange={event => setRecognition(event.target.value)}
              error={errors.recognition}
            >
              <option value="">Kies een erkenning</option>
              {RECOGNITIONS.map(item => <option key={item} value={item}>{item}</option>)}
            </FormField>
          </div>
          <Button type="submit" busy={loading}>{loading ? 'Zoeken...' : 'Zoek bedrijven'}</Button>
        </form>
      </section>

      {loading && <Notice>Bedrijven en erkenningen ophalen bij de RDW...</Notice>}
      <Notice error onRetry={error ? search : undefined}>{error}</Notice>

      {results && results.length === 0 && (
        <section className="card">
          <h2>Geen bedrijven gevonden</h2>
          <p>Er zijn geen bedrijven in {searched.place} met de erkenning {searched.recognition}. Pas de plaats of erkenning hierboven aan.</p>
        </section>
      )}
      {results && results.length > 0 && (
        <section aria-labelledby="garage-results-title">
          <h2 id="garage-results-title" className="garage-results-title">
            {results.length} {results.length === 1 ? 'bedrijf' : 'bedrijven'} in {searched.place} met {searched.recognition}
          </h2>
          <ul className="company-list">
            {results.slice(0, shown).map(company => <CompanyCard key={company.volgnummer} company={company} />)}
          </ul>
          <p className="muted">{Math.min(shown, results.length)} van {results.length} getoond.</p>
          {shown < results.length && (
            <Button variant="secondary" onClick={() => setShown(value => value + PAGE_SIZE)}>Meer laden</Button>
          )}
        </section>
      )}
    </>
  );
}
